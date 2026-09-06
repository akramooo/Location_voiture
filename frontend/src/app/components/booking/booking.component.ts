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
    vehicleId: null as number | null,
    clientId: null as number | null,
    startDate: '',
    endDate: ''
  };

  days = [23, 24, 25, 26, 27, 28, 29, 30, 31, 1, 2, 3, 4, 5];

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initDefaultDates();
    this.loadGanttData();
    this.loadVehicles();
    this.loadClients();
  }

  private initDefaultDates(): void {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 3);

    const pad = (n: number) => n < 10 ? '0' + n : '' + n;
    this.newReservation.startDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T09:00`;
    this.newReservation.endDate = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T18:00`;
  }

  loadGanttData(): void {
    this.apiService.get<any[]>('/reservations/gantt').subscribe({
      next: (data) => this.ganttItems = data || [],
      error: (err) => console.error('Erreur Gantt:', err)
    });
  }

  loadVehicles(): void {
    this.apiService.get<Vehicle[]>('/vehicles').subscribe({
      next: (data) => {
        this.vehicles = data || [];
        if (this.vehicles.length > 0 && !this.newReservation.vehicleId) {
          this.newReservation.vehicleId = this.vehicles[0].id!;
        }
      },
      error: (err) => console.error('Erreur Véhicules:', err)
    });
  }

  loadClients(): void {
    this.apiService.get<Client[]>('/clients').subscribe({
      next: (data) => {
        this.clients = data || [];
        if (this.clients.length > 0 && !this.newReservation.clientId) {
          this.newReservation.clientId = this.clients[0].id!;
        }
      },
      error: (err) => console.error('Erreur Clients:', err)
    });
  }

  openModal(): void {
    this.loadVehicles();
    this.loadClients();
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onBarClick(item: any): void {
    this.toastService.info(`Réservation N° ${item.reservationNumber} (${item.clientName})`, 'Détails Planning');
  }

  submitReservation(): void {
    if (!this.newReservation.vehicleId) {
      this.toastService.error('Veuillez sélectionner un véhicule (ajoutez un véhicule dans le parc si la liste est vide).', 'Véhicule requis');
      return;
    }
    if (!this.newReservation.clientId) {
      this.toastService.error('Veuillez sélectionner un client (ajoutez un client dans le CRM si la liste est vide).', 'Client requis');
      return;
    }

    const payload = {
      vehicleId: this.newReservation.vehicleId,
      clientId: this.newReservation.clientId,
      startDate: this.newReservation.startDate + ':00',
      endDate: this.newReservation.endDate + ':00',
      pickupLocation: 'Agence',
      returnLocation: 'Agence'
    };

    this.apiService.post('/reservations', payload).subscribe({
      next: () => {
        this.closeModal();
        this.toastService.success('Réservation enregistrée sur le planning Gantt !', 'Gantt Mis à Jour');
        this.loadGanttData();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erreur lors de l\'enregistrement de la réservation.';
        this.toastService.error(msg, 'Erreur Réservation');
      }
    });
  }
}
