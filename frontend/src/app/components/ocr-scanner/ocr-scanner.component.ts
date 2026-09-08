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
  selectedFile: File | null = null;
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
      this.startScan();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
        this.startScan();
      };
      reader.readAsDataURL(file);
    }
  }

  async startScan(): Promise<void> {
    if (!this.previewUrl && !this.selectedFile) return;

    this.isScanning = true;
    this.scanProgress = 5;
    this.statusMessage = 'Initialisation du moteur OCR local...';
    this.scanResult = null;

    try {
      await this.terminateActiveWorker();

      this.statusMessage = 'Chargement des dictionnaires linguistiques...';
      this.scanProgress = 15;

      // Création du worker Tesseract multilingue (français + anglais / chiffres)
      const worker = await createWorker('fra+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pct = Math.round(m.progress * 100);
            this.scanProgress = Math.min(20 + Math.round(pct * 0.75), 95);
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

      const imageSource = this.selectedFile || this.previewUrl;
      const ret = await worker.recognize(imageSource as any);
      
      this.scanProgress = 98;
      this.statusMessage = 'Extraction et structuration des données marocaines...';

      const rawText = ret.data.text || '';
      const confidence = ret.data.confidence || 0;

      // Parsing intelligent selon le type de document marocain
      const parsed = this.ocrParser.parseDocument(rawText, this.selectedDocType, confidence);

      this.scanResult = parsed;
      this.scanProgress = 100;
      this.isScanning = false;

      const confDisplay = parsed.rawConfidence > 0 ? `${parsed.rawConfidence}%` : 'Terminé';
      this.toastService.success(
        `Document scanné avec succès (${confDisplay} de précision optique)`,
        'OCR Exécuté'
      );

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
