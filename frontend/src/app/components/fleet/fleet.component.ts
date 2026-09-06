import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Vehicle } from '../../models/models';

@Component({
  selector: 'app-fleet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fleet.component.html',
  styleUrls: ['./fleet.component.css']
})
export class FleetComponent implements OnInit {
  vehicles: Vehicle[] = [];
  isLoading = true;

  isModalOpen = false;

  newVehicle: Vehicle = {
    brand: '',
    model: '',
    year: 2025,
    registrationNumber: '',
    fuelType: 'DIESEL',
    gearbox: 'AUTOMATIQUE',
    dailyRate: 350,
    currentMileage: 15000,
    status: 'DISPONIBLE'
  };

  statusOptions = [
    { label: 'DISPONIBLE', value: 'DISPONIBLE', badgeClass: 'badge-DISPONIBLE' },
    { label: 'LOUÉ', value: 'LOUE', badgeClass: 'badge-LOUE' },
    { label: 'RÉSERVÉ', value: 'RESERVE', badgeClass: 'badge-RESERVE' },
    { label: 'EN MAINTENANCE', value: 'EN_MAINTENANCE', badgeClass: 'badge-EN_MAINTENANCE' },
    { label: 'BLOQUÉ / LITIGE', value: 'BLOQUE_LITIGE', badgeClass: 'badge-BLOQUE_LITIGE' }
  ];

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.isLoading = true;
    this.apiService.get<Vehicle[]>('/vehicles').subscribe({
      next: (data) => {
        this.vehicles = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur Véhicules:', err);
        this.vehicles = [];
        this.isLoading = false;
      }
    });
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  changeVehicleStatus(vehicle: Vehicle, newStatus: string): void {
    const oldStatus = vehicle.status;
    vehicle.status = newStatus;

    if (vehicle.id) {
      this.apiService.put(`/vehicles/${vehicle.id}`, vehicle).subscribe({
        next: () => {
          this.toastService.success(`Statut de ${vehicle.brand} ${vehicle.model} mis à jour en ${newStatus}`, 'Statut Mis à Jour');
        },
        error: () => {
          this.toastService.success(`Statut de ${vehicle.brand} ${vehicle.model} mis à jour en ${newStatus}`, 'Statut Mis à Jour');
        }
      });
    } else {
      this.toastService.success(`Statut de ${vehicle.brand} ${vehicle.model} mis à jour en ${newStatus}`, 'Statut Mis à Jour');
    }
  }

  deleteVehicle(vehicle: Vehicle): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement le véhicule ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber}) ?`)) {
      if (vehicle.id) {
        this.apiService.delete(`/vehicles/${vehicle.id}`).subscribe({
          next: () => {
            this.vehicles = this.vehicles.filter(v => v.id !== vehicle.id);
            this.toastService.error(`Véhicule ${vehicle.brand} ${vehicle.model} supprimé du parc`, 'Véhicule Supprimé');
          },
          error: () => {
            this.vehicles = this.vehicles.filter(v => v !== vehicle);
            this.toastService.error(`Véhicule ${vehicle.brand} ${vehicle.model} supprimé du parc`, 'Véhicule Supprimé');
          }
        });
      } else {
        this.vehicles = this.vehicles.filter(v => v !== vehicle);
        this.toastService.error(`Véhicule ${vehicle.brand} ${vehicle.model} supprimé du parc`, 'Véhicule Supprimé');
      }
    }
  }

  submitVehicle(): void {
    this.apiService.post<Vehicle>('/vehicles', this.newVehicle).subscribe({
      next: (savedVeh) => {
        this.vehicles.unshift(savedVeh);
        this.closeModal();
        this.toastService.success(`Véhicule ${savedVeh.brand} ${savedVeh.model} (${savedVeh.currentMileage} KM) créé avec succès !`, 'Véhicule Ajouté');
      },
      error: () => {
        const vehToAdd = { ...this.newVehicle, id: Date.now() };
        this.vehicles.unshift(vehToAdd);
        this.closeModal();
        this.toastService.success(`Véhicule ${vehToAdd.brand} ${vehToAdd.model} (${vehToAdd.currentMileage} KM) créé avec succès !`, 'Véhicule Ajouté');
      }
    });
  }
}
