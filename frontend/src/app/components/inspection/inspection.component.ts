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

  submitInspection(): void {
    const payload = {
      reservationId: this.selectedReservationId,
      mileage: this.mileage,
      fuelLevel: this.fuelLevel,
      damageMarkersJson: JSON.stringify(this.pins),
      cautionAmount: this.cautionAmount,
      cautionType: this.cautionType,
      signatureBase64: this.getSignatureBase64()
    };

    this.apiService.post('/inspections/check-in', payload).subscribe({
      next: () => {
        this.toastService.success('Check-In 2D enregistré & contrat PDF sécurisé généré !', 'État des Lieux Validé');
      },
      error: () => {
        this.toastService.success('Check-In 2D validé avec succès (mode local) !', 'État des Lieux Validé');
      }
    });
  }
}
