import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createWorker, Worker } from 'tesseract.js';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { OcrParserService } from '../../services/ocr-parser.service';
import { OcrScanResult } from '../../models/models';

@Component({
  selector: 'app-ocr-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ocr-scanner.component.html',
  styleUrls: ['./ocr-scanner.component.css']
})
export class OcrScannerComponent implements OnDestroy {
  selectedDocType: 'CIN' | 'PERMIS' | 'PASSEPORT' | 'CARTE_GRISE' = 'CIN';
  isScanning = false;
  scanProgress = 0;
  statusMessage = '';
  scanResult: OcrScanResult | null = null;
  previewUrl: string | null = null;
  rawImageBase64: string | null = null;
  selectedFile: File | null = null;
  currentRotation = 0; // 0, 90, 180, 270
  showRawOutput = false;

  private activeWorker: Worker | null = null;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    private ocrParser: OcrParserService,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    this.terminateActiveWorker();
  }

  onDocTypeChange(): void {
    if (this.previewUrl && !this.isScanning) {
      this.startScan(false);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.currentRotation = 0;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.rawImageBase64 = e.target.result;
        this.previewUrl = e.target.result;
        this.startScan(true);
      };
      reader.readAsDataURL(file);
    }
  }

  async rotateImage(deltaAngle: number): Promise<void> {
    if (!this.rawImageBase64) return;
    this.currentRotation = (this.currentRotation + deltaAngle + 360) % 360;
    this.previewUrl = await this.renderRotatedImage(this.rawImageBase64, this.currentRotation);
    await this.startScan(false);
  }

  private renderRotatedImage(base64: string, angle: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64);
          return;
        }

        const normalizedAngle = (angle % 360 + 360) % 360;
        const isOrthogonal = normalizedAngle === 90 || normalizedAngle === 270;

        canvas.width = isOrthogonal ? img.height : img.width;
        canvas.height = isOrthogonal ? img.width : img.height;

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((normalizedAngle * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = (err) => reject(err);
      img.src = base64;
    });
  }

  async startScan(allowAutoRotate: boolean = true): Promise<void> {
    if (!this.previewUrl) return;

    this.isScanning = true;
    this.scanProgress = 5;
    this.statusMessage = 'Initialisation du moteur OCR local...';
    this.scanResult = null;

    try {
      await this.terminateActiveWorker();

      this.statusMessage = 'Chargement des modèles linguistiques...';
      this.scanProgress = 15;

      const worker = await createWorker('fra+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pct = Math.round(m.progress * 100);
            this.scanProgress = Math.min(20 + Math.round(pct * 0.7), 90);
            this.statusMessage = `Analyse optique des caractères (${this.scanProgress}%)...`;
          } else if (m.status === 'loading tesseract core') {
            this.scanProgress = 10;
            this.statusMessage = 'Chargement du noyau WebAssembly...';
          } else if (m.status === 'loading language traineddata') {
            this.scanProgress = 18;
            this.statusMessage = 'Chargement des modèles de reconnaissance...';
          }
        }
      });

      this.activeWorker = worker;

      // 1. Analyse avec l'orientation actuelle
      let currentImg = this.previewUrl;
      let ret = await worker.recognize(currentImg);
      let rawText = ret.data.text || '';
      let confidence = ret.data.confidence || 0;
      let parsed = this.ocrParser.parseDocument(rawText, this.selectedDocType, confidence);

      // 2. Détection d'orientation intelligente si les données clés sont introuvables
      const missingKeyData = !parsed.cinPassport && !parsed.lastName && !parsed.licensePlate;
      if (allowAutoRotate && (missingKeyData || parsed.rawConfidence < 50) && this.rawImageBase64) {
        const testOffsets = [90, 270, 180];
        for (const offset of testOffsets) {
          const testAngle = (this.currentRotation + offset) % 360;
          this.statusMessage = `Orientation testée (${testAngle}°)...`;
          const rotatedData = await this.renderRotatedImage(this.rawImageBase64, testAngle);
          const testRet = await worker.recognize(rotatedData);
          const testText = testRet.data.text || '';
          const testConf = testRet.data.confidence || 0;
          const testParsed = this.ocrParser.parseDocument(testText, this.selectedDocType, testConf);

          if (testParsed.cinPassport || testParsed.lastName || testParsed.licensePlate || testConf > confidence + 15) {
            parsed = testParsed;
            this.currentRotation = testAngle;
            this.previewUrl = rotatedData;
            break;
          }
        }
      }

      this.scanResult = parsed;
      this.scanProgress = 100;
      this.isScanning = false;

      const confDisplay = parsed.rawConfidence > 0 ? `${parsed.rawConfidence}%` : 'Terminé';
      if (parsed.cinPassport || parsed.firstName || parsed.lastName || parsed.licensePlate) {
        this.toastService.success(
          `Document scanné avec succès (${confDisplay} de précision optique)`,
          'OCR Réussi'
        );
      } else {
        this.toastService.info(
          'Document analysé. Si le document était pivoté, utilisez les boutons ↺ / ↻ pour le remettre à l\'horizontale.',
          'Astuce Document'
        );
      }

      await this.terminateActiveWorker();

    } catch (err: any) {
      console.error('Erreur lors du traitement OCR:', err);
      this.isScanning = false;
      this.scanProgress = 0;
      this.statusMessage = 'Erreur lors du traitement du document.';
      this.toastService.error(
        'Impossible d\'analyser l\'image. Veuillez vérifier la netteté du document.',
        'Erreur OCR'
      );
      await this.terminateActiveWorker();
    }
  }

  private async terminateActiveWorker(): Promise<void> {
    if (this.activeWorker) {
      try {
        await this.activeWorker.terminate();
      } catch (e) {
        // ignore termination errors
      }
      this.activeWorker = null;
    }
  }

  applyToClientForm(): void {
    if (!this.scanResult) return;

    // Transférer les données réelles vers le CRM
    this.router.navigate(['/crm'], {
      state: {
        fromOcr: true,
        clientData: {
          clientType: 'PARTICULIER',
          firstName: this.scanResult.firstName || '',
          lastName: this.scanResult.lastName || '',
          cinPassport: this.scanResult.cinPassport || '',
          driverLicenseNumber: this.scanResult.driverLicenseNumber || '',
          phoneWhatsApp: '',
          riskScore: 95
        }
      }
    });

    this.toastService.success('Données extraites et transférées vers la fiche client !', 'CRM Pré-rempli');
  }

  toggleRawOutput(): void {
    this.showRawOutput = !this.showRawOutput;
  }
}
