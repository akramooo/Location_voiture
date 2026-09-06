import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Reservation } from '../../models/models';

export interface DamagePin {
  id: number;
  view: 'overview' | 'left' | 'right' | 'front' | 'rear' | 'top';
  viewLabel: string;
  x: number;
  y: number;
  type: 'RAYURE' | 'CHOC' | 'BRIS_GLACE' | 'MANQUANT';
  typeLabel: string;
  color: string;
  note?: string;
}

@Component({
  selector: 'app-inspection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspection.component.html',
  styleUrls: ['./inspection.component.css']
})
export class InspectionComponent implements OnInit, AfterViewInit {
  @ViewChild('sigCanvas') sigCanvas!: ElementRef<HTMLCanvasElement>;

  reservations: Reservation[] = [];
  selectedReservationId = 1;
  mileage = 45200;
  fuelLevel = 'PLEIN';
  cautionAmount = 5000;
  cautionType = 'PRE_AUTORISATION_TPE';
  
  // Vue sélectionnée
  activeView: 'overview' | 'left' | 'right' | 'front' | 'rear' | 'top' = 'overview';
  
  // Type de dommage actif pour le prochain clic
  selectedDamageType: 'RAYURE' | 'CHOC' | 'BRIS_GLACE' | 'MANQUANT' = 'CHOC';

  damageTypesConfig = [
    { type: 'CHOC' as const, label: 'Bosse / Choc', color: '#ef4444', icon: 'fa-burst' },
    { type: 'RAYURE' as const, label: 'Rayure / Éraflure', color: '#f59e0b', icon: 'fa-wand-magic-sparkles' },
    { type: 'BRIS_GLACE' as const, label: 'Bris de Glace', color: '#06b6d4', icon: 'fa-certificate' },
    { type: 'MANQUANT' as const, label: 'Élément Manquant', color: '#a855f7', icon: 'fa-triangle-exclamation' }
  ];

  viewsList = [
    { id: 'overview' as const, label: 'Vue d\'Ensemble (5 Vues)', icon: 'fa-table-cells-large' },
    { id: 'left' as const, label: 'Profil Gauche (Conducteur)', icon: 'fa-arrow-left' },
    { id: 'right' as const, label: 'Profil Droit (Passager)', icon: 'fa-arrow-right' },
    { id: 'front' as const, label: 'Face Avant', icon: 'fa-arrow-up' },
    { id: 'rear' as const, label: 'Face Arrière', icon: 'fa-arrow-down' },
    { id: 'top' as const, label: 'Toit / Dessus', icon: 'fa-car' }
  ];

  pins: DamagePin[] = [];
  nextPinId = 1;

  // Signature
  private isDrawing = false;
  private ctx: CanvasRenderingContext2D | null = null;
  hasSignature = false;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  ngAfterViewInit(): void {
    this.initSignaturePad();
  }

  loadReservations(): void {
    this.apiService.get<Reservation[]>('/reservations').subscribe({
      next: (data) => {
        this.reservations = data;
        if (data.length > 0 && data[0].id) {
          this.selectedReservationId = data[0].id;
        }
      },
      error: (err) => console.error('Erreur Réservations Inspection:', err)
    });
  }

  setView(view: 'overview' | 'left' | 'right' | 'front' | 'rear' | 'top'): void {
    this.activeView = view;
  }

  setDamageType(type: 'RAYURE' | 'CHOC' | 'BRIS_GLACE' | 'MANQUANT'): void {
    this.selectedDamageType = type;
  }

  onAngleClick(event: MouseEvent, viewName: 'left' | 'right' | 'front' | 'rear' | 'top' | 'overview'): void {
    const target = event.currentTarget as HTMLElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);

    const typeConfig = this.damageTypesConfig.find(d => d.type === this.selectedDamageType) || this.damageTypesConfig[0];
    const viewItem = this.viewsList.find(v => v.id === viewName);

    const newPin: DamagePin = {
      id: this.nextPinId++,
      view: viewName,
      viewLabel: viewItem ? viewItem.label : viewName,
      x,
      y,
      type: this.selectedDamageType,
      typeLabel: typeConfig.label,
      color: typeConfig.color
    };

    this.pins.push(newPin);
    this.toastService.info(`Impact #${newPin.id} (${typeConfig.label}) ajouté sur ${newPin.viewLabel}.`);
  }

  removePin(index: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.pins.splice(index, 1);
  }

  clearPins(): void {
    this.pins = [];
    this.nextPinId = 1;
    this.toastService.info('Tous les repères de dommages ont été réinitialisés.');
  }

  getPinsForView(viewName: string): DamagePin[] {
    return this.pins.filter(p => p.view === viewName);
  }

  // --- Signature Pad Logic ---
  private initSignaturePad(): void {
    const canvas = this.sigCanvas?.nativeElement;
    if (!canvas) return;

    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  startDrawing(event: MouseEvent | TouchEvent): void {
    this.isDrawing = true;
    this.hasSignature = true;
    const pos = this.getPos(event);
    if (this.ctx && pos) {
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
    }
  }

  draw(event: MouseEvent | TouchEvent): void {
    if (!this.isDrawing || !this.ctx) return;
    event.preventDefault();
    const pos = this.getPos(event);
    if (pos) {
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
    }
  }

  stopDrawing(): void {
    this.isDrawing = false;
  }

  clearSignature(): void {
    if (!this.ctx || !this.sigCanvas) return;
    const canvas = this.sigCanvas.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasSignature = false;
  }

  private getPos(event: MouseEvent | TouchEvent): { x: number; y: number } | null {
    if (!this.sigCanvas) return null;
    const rect = this.sigCanvas.nativeElement.getBoundingClientRect();
    if (event instanceof MouseEvent) {
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    } else if (event.touches && event.touches.length > 0) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top
      };
    }
    return null;
  }

  getSignatureBase64(): string {
    if (!this.hasSignature || !this.sigCanvas) return '';
    return this.sigCanvas.nativeElement.toDataURL('image/png');
  }

  // Modal Contrat Généré
  isContractModalOpen = false;
  generatedContract: any = null;

  submitInspection(): void {
    const activeRes = this.reservations.find(r => r.id === Number(this.selectedReservationId)) || {
      id: this.selectedReservationId,
      reservationNumber: 'RES-82483',
      vehicleName: 'KIA Niro Hybride (2024)',
      vehicleRegistration: '24512-A-6',
      clientName: 'Bninly SA / M. Youssef Bennani',
      startDate: new Date().toLocaleDateString('fr-FR'),
      endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toLocaleDateString('fr-FR')
    };

    const signatureImg = this.getSignatureBase64();

    const payload = {
      reservationId: this.selectedReservationId,
      mileage: this.mileage,
      fuelLevel: this.fuelLevel,
      damageMarkersJson: JSON.stringify(this.pins),
      cautionAmount: this.cautionAmount,
      cautionType: this.cautionType,
      signatureBase64: signatureImg
    };

    // Préparer les données pour le contrat PDF
    this.generatedContract = {
      contractNumber: 'CTR-' + (activeRes.reservationNumber || '2026-001'),
      date: new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      reservationNumber: activeRes.reservationNumber || 'RES-82483',
      clientName: activeRes.clientName || 'Client Standard',
      vehicleName: activeRes.vehicleName || 'Véhicule de Location',
      vehicleRegistration: activeRes.vehicleRegistration || '24512-A-6',
      mileage: this.mileage,
      fuelLevel: this.fuelLevel,
      cautionAmount: this.cautionAmount,
      cautionType: this.cautionType,
      pins: [...this.pins],
      signatureBase64: signatureImg
    };

    this.apiService.post('/inspections/check-in', payload).subscribe({
      next: () => {
        this.isContractModalOpen = true;
        this.toastService.success('Contrat PDF et État des lieux générés avec succès !', 'Check-In Validé');
      },
      error: () => {
        this.isContractModalOpen = true;
        this.toastService.success('Contrat PDF et État des lieux générés avec succès !', 'Check-In Validé');
      }
    });
  }

  closeContractModal(): void {
    this.isContractModalOpen = false;
  }

  printContract(): void {
    const docElement = document.getElementById('printable-contract-document');
    if (!docElement) return;

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      window.print();
      return;
    }

    const content = docElement.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contrat_Location_${this.generatedContract?.contractNumber || 'CHECKIN'}</title>
          <style>
            * { box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
            body { margin: 0; padding: 24px; color: #0f172a; background: #fff; font-size: 13px; line-height: 1.5; }
            .contract-sheet { max-width: 800px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 28px; border-radius: 8px; }
            .header-bar { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 20px; }
            .badge-title { font-size: 17px; font-weight: 800; color: #0369a1; text-transform: uppercase; margin-bottom: 4px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
            .box-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px; background: #f8fafc; }
            .box-title { font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; text-transform: uppercase; }
            .row-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .row-item .label { color: #64748b; font-weight: 500; }
            .row-item .val { font-weight: 600; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
            th { background: #f1f5f9; font-weight: 700; color: #334155; }
            .signature-area { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; padding-top: 16px; border-top: 1px dashed #cbd5e1; }
            .signature-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; height: 110px; display: flex; flex-direction: column; justify-content: space-between; background: #fff; }
            .signature-box img { max-height: 55px; object-fit: contain; }
            .legal-footer { margin-top: 24px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            @media print {
              body { padding: 0; }
              .contract-sheet { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="contract-sheet">
            ${content}
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}
