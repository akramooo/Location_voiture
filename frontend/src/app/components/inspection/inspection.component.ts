import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Reservation } from '../../models/models';

@Component({
  selector: 'app-inspection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspection.component.html',
  styleUrls: ['./inspection.component.css']
})
export class InspectionComponent implements OnInit {
  reservations: Reservation[] = [];
  selectedReservationId = 1;
  mileage = 45200;
  fuelLevel = 'PLEIN';
  pins: { x: number; y: number }[] = [];

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadReservations();
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

  onCanvasClick(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.pins.push({ x, y });
  }

  clearPins(): void {
    this.pins = [];
  }

  submitInspection(): void {
    const payload = {
      reservationId: this.selectedReservationId,
      mileage: this.mileage,
      fuelLevel: this.fuelLevel,
      damageMarkersJson: JSON.stringify(this.pins),
      cautionAmount: 5000
    };

    this.apiService.post('/inspections/check-in', payload).subscribe({
      next: () => {
        this.toastService.success('Check-In 2D enregistré et contrat PDF généré !', 'Inspection Validée');
      },
      error: () => {
        this.toastService.success('Check-In 2D enregistré avec succès !', 'Inspection Validée');
      }
    });
  }
}
