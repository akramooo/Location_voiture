import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { RadarFine, Vehicle, Client } from '../../models/models';

@Component({
  selector: 'app-radars',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './radars.component.html',
  styleUrls: ['./radars.component.css']
})
export class RadarsComponent implements OnInit {
  fines: RadarFine[] = [];
  vehicles: Vehicle[] = [];
  clients: Client[] = [];
  isModalOpen = false;

  newFine = {
    ticketNumber: 'PV-2026-99001',
    vehicleId: 1,
    violationLocation: 'Autoroute A1 KM 24',
    fineAmount: 300,
    clientId: 1
  };

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadFines();
    this.loadVehicles();
    this.loadClients();
  }

  loadFines(): void {
    this.apiService.get<RadarFine[]>('/billing/radar-fines').subscribe({
      next: (data) => this.fines = data,
      error: (err) => console.error('Erreur PV radars:', err)
    });
  }

  loadVehicles(): void {
    this.apiService.get<Vehicle[]>('/vehicles').subscribe({
      next: (data) => this.vehicles = data,
      error: (err) => console.error('Erreur véhicules:', err)
    });
  }

  loadClients(): void {
    this.apiService.get<Client[]>('/clients').subscribe({
      next: (data) => this.clients = data,
      error: (err) => console.error('Erreur clients:', err)
    });
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  reallocateFine(fine: RadarFine): void {
    this.toastService.info(`Réassignation légale du PV N° ${fine.ticketNumber} envoyée aux autorités`, 'Infraction Réassignée');
  }

  submitFine(): void {
    this.closeModal();
    this.toastService.warning('PV Radar enregistré et réassignation au conducteur générée !', 'Infraction Déclarée');
    this.loadFines();
  }
}
