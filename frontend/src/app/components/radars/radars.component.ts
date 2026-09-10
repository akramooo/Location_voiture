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
  isLoading = false;
  isSubmitting = false;

  // Modal State
  isModalOpen = false;
  isReallocateModalOpen = false;
  selectedFineForReallocate: RadarFine | null = null;
  selectedReallocateClientId: number | null = null;

  // Filter State
  activeFilter: 'ALL' | 'REASSIGNE' | 'NON_REASSIGNE' = 'ALL';
  searchTerm = '';

  newFine: {
    ticketNumber: string;
    vehicleId: number | null;
    violationLocation: string;
    fineAmount: number;
    violationDate: string;
    reallocatedClientId: number | null;
  } = {
    ticketNumber: '',
    vehicleId: null,
    violationLocation: '',
    fineAmount: 300,
    violationDate: '',
    reallocatedClientId: null
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
    this.isLoading = true;
    this.apiService.get<RadarFine[]>('/billing/radar-fines').subscribe({
      next: (data) => {
        this.fines = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur PV radars:', err);
        this.fines = [];
        this.isLoading = false;
      }
    });
  }

  loadVehicles(): void {
    this.apiService.get<Vehicle[]>('/vehicles').subscribe({
      next: (data) => {
        this.vehicles = data || [];
        if (this.vehicles.length > 0 && !this.newFine.vehicleId) {
          this.newFine.vehicleId = this.vehicles[0].id || null;
        }
      },
      error: (err) => console.error('Erreur véhicules:', err)
    });
  }

  loadClients(): void {
    this.apiService.get<Client[]>('/clients').subscribe({
      next: (data) => this.clients = data || [],
      error: (err) => console.error('Erreur clients:', err)
    });
  }

  get filteredFines(): RadarFine[] {
    let list = this.fines;

    if (this.activeFilter === 'REASSIGNE') {
      list = list.filter(f => f.reallocated);
    } else if (this.activeFilter === 'NON_REASSIGNE') {
      list = list.filter(f => !f.reallocated);
    }

    if (this.searchTerm && this.searchTerm.trim()) {
      const q = this.searchTerm.trim().toLowerCase();
      list = list.filter(f =>
        (f.ticketNumber && f.ticketNumber.toLowerCase().includes(q)) ||
        (f.vehicleName && f.vehicleName.toLowerCase().includes(q)) ||
        (f.vehicleRegistration && f.vehicleRegistration.toLowerCase().includes(q)) ||
        (f.clientName && f.clientName.toLowerCase().includes(q)) ||
        (f.violationLocation && f.violationLocation.toLowerCase().includes(q))
      );
    }

    return list;
  }

  get totalFinesAmount(): number {
    return this.fines.reduce((sum, f) => sum + (f.fineAmount || 0), 0);
  }

  get totalReallocatedCount(): number {
    return this.fines.filter(f => f.reallocated).length;
  }

  get totalPendingCount(): number {
    return this.fines.filter(f => !f.reallocated).length;
  }

  openModal(): void {
    const nowStr = new Date().toISOString().substring(0, 16);
    this.newFine = {
      ticketNumber: '',
      vehicleId: this.vehicles.length > 0 ? (this.vehicles[0].id || null) : null,
      violationLocation: '',
      fineAmount: 300,
      violationDate: nowStr,
      reallocatedClientId: null
    };
    this.isSubmitting = false;
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (this.isSubmitting) return;
    this.isModalOpen = false;
  }

  submitFine(): void {
    if (this.isSubmitting) return;

    if (!this.newFine.ticketNumber || !this.newFine.ticketNumber.trim()) {
      this.toastService.warning('Veuillez renseigner le N° de PV ou avis d\'infraction.', 'Champ Requis');
      return;
    }

    if (!this.newFine.vehicleId) {
      this.toastService.warning('Veuillez sélectionner le véhicule concerné.', 'Champ Requis');
      return;
    }

    if (!this.newFine.fineAmount || this.newFine.fineAmount <= 0) {
      this.toastService.warning('Le montant de l\'infraction doit être supérieur à 0.', 'Champ Requis');
      return;
    }

    this.isSubmitting = true;

    const payload: Partial<RadarFine> = {
      ticketNumber: this.newFine.ticketNumber.trim(),
      vehicleId: Number(this.newFine.vehicleId),
      violationLocation: this.newFine.violationLocation ? this.newFine.violationLocation.trim() : 'Non spécifié',
      fineAmount: Number(this.newFine.fineAmount),
      violationDate: this.newFine.violationDate ? this.newFine.violationDate : new Date().toISOString(),
      reallocatedClientId: this.newFine.reallocatedClientId ? Number(this.newFine.reallocatedClientId) : null
    };

    this.apiService.post<RadarFine>('/billing/radar-fines', payload).subscribe({
      next: (created) => {
        this.isSubmitting = false;
        this.fines.unshift(created);
        this.closeModal();
        this.toastService.success(
          `PV N° ${created.ticketNumber} de ${created.fineAmount} MAD enregistré avec succès !`,
          'Infraction Déclarée'
        );
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Erreur déclaration infraction:', err);
        const msg = err?.error?.message || 'Erreur lors de l\'enregistrement de l\'infraction';
        this.toastService.error(msg, 'Erreur');
      }
    });
  }

  openReallocateModal(fine: RadarFine): void {
    this.selectedFineForReallocate = fine;
    this.selectedReallocateClientId = fine.reallocatedClientId || (this.clients.length > 0 ? (this.clients[0].id || null) : null);
    this.isReallocateModalOpen = true;
  }

  closeReallocateModal(): void {
    this.isReallocateModalOpen = false;
    this.selectedFineForReallocate = null;
  }

  confirmReallocate(): void {
    if (!this.selectedFineForReallocate || !this.selectedFineForReallocate.id) return;
    if (!this.selectedReallocateClientId) {
      this.toastService.warning('Veuillez sélectionner un client conducteur.', 'Validation');
      return;
    }

    const fineId = this.selectedFineForReallocate.id;
    const clientId = Number(this.selectedReallocateClientId);

    this.apiService.post<RadarFine>(`/billing/radar-fines/${fineId}/reallocate`, { clientId }).subscribe({
      next: (updated) => {
        const idx = this.fines.findIndex(f => f.id === fineId);
        if (idx !== -1) {
          this.fines[idx] = updated;
        }
        this.closeReallocateModal();
        this.toastService.success(
          `Infraction N° ${updated.ticketNumber} réassignée avec succès au client ${updated.clientName} !`,
          'Réassignation Confirmée'
        );
      },
      error: (err) => {
        console.error('Erreur réassignation:', err);
        const msg = err?.error?.message || 'Erreur lors de la réassignation du PV';
        this.toastService.error(msg, 'Erreur');
      }
    });
  }

  deleteFine(fine: RadarFine): void {
    if (!fine.id) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le PV N° ${fine.ticketNumber} ?`)) {
      return;
    }

    this.apiService.delete(`/billing/radar-fines/${fine.id}`).subscribe({
      next: () => {
        this.fines = this.fines.filter(f => f.id !== fine.id);
        this.toastService.info(`PV N° ${fine.ticketNumber} supprimé`, 'Infraction Supprimée');
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erreur lors de la suppression';
        this.toastService.error(msg, 'Erreur');
      }
    });
  }
}
