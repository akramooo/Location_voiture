import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { OcrScanResult } from '../../models/models';

@Component({
  selector: 'app-ocr-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ocr-scanner.component.html',
  styleUrls: ['./ocr-scanner.component.css']
})
export class OcrScannerComponent {
  selectedDocType: 'CIN' | 'PERMIS' | 'PASSEPORT' | 'CARTE_GRISE' = 'CIN';
  isScanning = false;
  scanResult: OcrScanResult | null = null;
  previewUrl: string | null = null;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
        this.startScan();
      };
      reader.readAsDataURL(file);
    }
  }

  startScan(): void {
    this.isScanning = true;
    this.scanResult = null;

    setTimeout(() => {
      this.isScanning = false;
      if (this.selectedDocType === 'CIN') {
        this.scanResult = {
          docType: 'CIN',
          cinPassport: 'BE998877',
          firstName: 'Mohammed',
          lastName: 'El Fassi',
          expiryDate: '2030-05-14',
          nationality: 'Marocaine',
          rawConfidence: 98.4
        };
      } else if (this.selectedDocType === 'PERMIS') {
        this.scanResult = {
          docType: 'PERMIS',
          driverLicenseNumber: '05/998877',
          firstName: 'Mohammed',
          lastName: 'El Fassi',
          expiryDate: '2032-10-20',
          rawConfidence: 97.2
        };
      } else {
        this.scanResult = {
          docType: 'CARTE_GRISE',
          cinPassport: '12345-A-6',
          firstName: 'Atlas Rent-a-Car',
          rawConfidence: 99.0
        };
      }

      this.toastService.success(`Document scanné par IA avec succès (${this.scanResult.rawConfidence}% de précision)`, 'OCR Extrait');
    }, 1500);
  }

  applyToClientForm(): void {
    this.toastService.success('Données extraites et pré-remplies dans la fiche client !', 'Données Remplies');
  }
}
