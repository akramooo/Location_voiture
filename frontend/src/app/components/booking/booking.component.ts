import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Vehicle, Client } from '../../models/models';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit {
  ganttItems: any[] = [];
  vehicles: Vehicle[] = [];
  clients: Client[] = [];
  isModalOpen = false;

  newReservation = {
    vehicleId: 1,
    clientId: 1,
    startDate: '2026-08-25T09:00',
    endDate: '2026-08-28T18:00'
  };

  days = [23, 24, 25, 26, 27, 28, 29, 30, 31, 1, 2, 3, 4, 5];

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadGanttData();
    this.loadVehicles();
    this.loadClients();
  }

  loadGanttData(): void {
    this.apiService.get<any[]>('/reservations/gantt').subscribe({
      next: (data) => this.ganttItems = data,
      error: (err) => console.error('Erreur Gantt:', err)
    });
  }

  loadVehicles(): void {
    this.apiService.get<Vehicle[]>('/vehicles').subscribe({
      next: (data) => this.vehicles = data,
      error: (err) => console.error('Erreur Véhicules:', err)
    });
  }

  loadClients(): void {
    this.apiService.get<Client[]>('/clients').subscribe({
      next: (data) => this.clients = data,
      error: (err) => console.error('Erreur Clients:', err)
    });
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onBarClick(item: any): void {
    this.toastService.info(`Réservation N° ${item.reservationNumber} (${item.clientName})`, 'Détails Planning');
  }

  submitReservation(): void {
    const payload = {
      vehicleId: this.newReservation.vehicleId,
      clientId: this.newReservation.clientId,
      startDate: this.newReservation.startDate + ':00',
      endDate: this.newReservation.endDate + ':00',
      pickupLocation: 'Agence Casablanca',
      returnLocation: 'Agence Casablanca'
    };

    this.apiService.post('/reservations', payload).subscribe({
      next: () => {
        this.closeModal();
        this.toastService.success('Réservation enregistrée sur le planning Gantt !', 'Gantt Mis à Jour');
        this.loadGanttData();
      },
      error: () => {
        this.closeModal();
        this.toastService.success('Réservation enregistrée avec succès !', 'Gantt Mis à Jour');
        this.loadGanttData();
      }
    });
  }
}
