import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { Vehicle, Client } from '../../../models/models';

@Component({
  selector: 'app-reservation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservation-modal.component.html'
})
export class ReservationModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() initialVehicleId: number | null = null;
  @Input() initialStartDate: string = '';
  @Input() existingReservations: any[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<any>();

  vehicles: Vehicle[] = [];
  clients: Client[] = [];
  isSubmitting = false;

  conflictError: string | null = null;

  newReservation = {
    vehicleId: null as number | null,
    clientId: null as number | null,
    startDate: '',
    endDate: '',
    pickupLocation: 'Agence',
    returnLocation: 'Agence',
    depositAmount: 500,
    paidAmount: 0,
    paymentMethod: 'ESPECES',
    dailyRate: 350,
    discountValue: 0,
    discountType: 'MAD' as 'MAD' | 'PERCENT',
    subTotal: 0,
    discountAmountCalculated: 0,
    estimatedTotal: 0,
    totalDays: 0
  };

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initDefaultDates();
    this.loadVehicles();
    this.loadClients();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.conflictError = null;
      this.initDefaultDates();
      this.loadVehicles();
      this.loadClients();
    }
  }

  private initDefaultDates(): void {
    if (this.initialStartDate) {
      this.newReservation.startDate = this.initialStartDate.includes('T') ? this.initialStartDate : `${this.initialStartDate}T09:00`;
      const endD = new Date(this.initialStartDate);
      endD.setDate(endD.getDate() + 3);
      const pad = (n: number) => n < 10 ? '0' + n : '' + n;
      this.newReservation.endDate = `${endD.getFullYear()}-${pad(endD.getMonth() + 1)}-${pad(endD.getDate())}T18:00`;
    } else {
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + 3);

      const pad = (n: number) => n < 10 ? '0' + n : '' + n;
      this.newReservation.startDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T09:00`;
      this.newReservation.endDate = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T18:00`;
    }

    if (this.initialVehicleId) {
      this.newReservation.vehicleId = this.initialVehicleId;
    }

    this.calculatePrice();
    this.checkConflict();
  }

  loadVehicles(): void {
    this.apiService.get<Vehicle[]>('/vehicles').subscribe({
      next: (data) => {
        this.vehicles = data || [];
        if (this.vehicles.length > 0) {
          if (!this.newReservation.vehicleId) {
            this.newReservation.vehicleId = this.initialVehicleId || this.vehicles[0].id!;
          }
          this.onVehicleSelectChange();
        }
      },
      error: (err) => console.error('Erreur Véhicules:', err)
    });
  }

  loadClients(): void {
    this.apiService.get<Client[]>('/clients').subscribe({
      next: (data) => {
        // Exclure automatiquement les clients blacklistés
        this.clients = (data || []).filter(c => !c.blacklisted);
        if (this.clients.length > 0 && !this.newReservation.clientId) {
          this.newReservation.clientId = this.clients[0].id!;
        }
      },
      error: (err) => console.error('Erreur Clients:', err)
    });
  }

  onVehicleSelectChange(): void {
    const v = this.vehicles.find(veh => veh.id === this.newReservation.vehicleId);
    if (v && v.dailyRate) {
      this.newReservation.dailyRate = v.dailyRate;
    }
    this.calculatePrice();
    this.checkConflict();
  }

  checkConflict(): void {
    this.conflictError = null;

    if (!this.newReservation.vehicleId) return;

    const vehicle = this.vehicles.find(v => v.id === this.newReservation.vehicleId);
    if (vehicle) {
      if (vehicle.status === 'EN_MAINTENANCE') {
        this.conflictError = `⚠️ Véhicule Indisponible : Ce véhicule (${vehicle.brand} ${vehicle.model}) est actuellement en maintenance.`;
        return;
      }
      if (vehicle.status === 'BLOQUE_LITIGE') {
        this.conflictError = `⚠️ Véhicule Bloqué : Ce véhicule (${vehicle.brand} ${vehicle.model}) est actuellement bloqué pour litige.`;
        return;
      }
    }

    if (!this.newReservation.startDate || !this.newReservation.endDate) return;

    const reqStart = new Date(this.newReservation.startDate).getTime();
    const reqEnd = new Date(this.newReservation.endDate).getTime();

    if (reqEnd <= reqStart) {
      this.conflictError = `⚠️ Date Invalide : La date de retour doit être postérieure à la date de départ.`;
      return;
    }

    // Vérification locale immédiate si les réservations existent déjà
    if (this.existingReservations && this.existingReservations.length > 0) {
      const conflict = this.existingReservations.find(r => {
        if (r.vehicleId !== this.newReservation.vehicleId) return false;
        if (r.status === 'ANNULEE' || r.status === 'TERMINEE') return false;

        const resStart = new Date(r.startDate).getTime();
        const resEnd = new Date(r.endDate).getTime();

        // Chevauchement strict
        return (resStart < reqEnd && resEnd > reqStart);
      });

      if (conflict) {
        const startStr = conflict.startDate ? conflict.startDate.substring(0, 10) : '';
        const endStr = conflict.endDate ? conflict.endDate.substring(0, 10) : '';
        this.conflictError = `⚠️ Conflit de Réservation : Ce véhicule est déjà réservé du ${startStr} au ${endStr} par ${conflict.clientName || 'un client'} (N° ${conflict.reservationNumber || 'RES'}).`;
        return;
      }
    }

    // Double vérification API Backend
    const startIso = this.newReservation.startDate.length === 16 ? this.newReservation.startDate + ':00' : this.newReservation.startDate;
    const endIso = this.newReservation.endDate.length === 16 ? this.newReservation.endDate + ':00' : this.newReservation.endDate;

    this.apiService.get<any>(`/reservations/check-availability?vehicleId=${this.newReservation.vehicleId}&startDate=${startIso}&endDate=${endIso}`).subscribe({
      next: (res) => {
        if (res && !res.available) {
          this.conflictError = `⚠️ ${res.reason}`;
        }
      },
      error: () => {
        // Silencieux si erreur réseau
      }
    });
  }

  calculatePrice(): void {
    if (!this.newReservation.startDate || !this.newReservation.endDate) return;

    const start = new Date(this.newReservation.startDate);
    const end = new Date(this.newReservation.endDate);
    const diffTime = end.getTime() - start.getTime();
    let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (days <= 0) days = 1;

    this.newReservation.totalDays = days;
    const dailyRate = Number(this.newReservation.dailyRate) || 0;
    const subTotal = days * dailyRate;
    this.newReservation.subTotal = subTotal;

    // Remise manuelle (% ou MAD)
    let discountAmt = 0;
    const discountVal = Number(this.newReservation.discountValue) || 0;
    if (discountVal > 0) {
      if (this.newReservation.discountType === 'PERCENT') {
        discountAmt = (subTotal * discountVal) / 100;
      } else {
        discountAmt = discountVal;
      }
    }

    discountAmt = Math.min(discountAmt, subTotal);
    this.newReservation.discountAmountCalculated = Math.round(discountAmt);
    this.newReservation.estimatedTotal = Math.max(0, Math.round(subTotal - discountAmt));
  }

  onDatesChange(): void {
    this.calculatePrice();
    this.checkConflict();
  }

  closeModal(): void {
    this.close.emit();
  }

  submitReservation(): void {
    if (this.conflictError) {
      this.toastService.error(this.conflictError, 'Réservation Impossible');
      return;
    }
    if (!this.newReservation.vehicleId) {
      this.toastService.error('Veuillez sélectionner un véhicule dans votre parc.', 'Véhicule requis');
      return;
    }
    if (!this.newReservation.clientId) {
      this.toastService.error('Veuillez sélectionner un client dans votre CRM.', 'Client requis');
      return;
    }

    this.isSubmitting = true;

    const payload = {
      vehicleId: this.newReservation.vehicleId,
      clientId: this.newReservation.clientId,
      startDate: this.newReservation.startDate.length === 16 ? this.newReservation.startDate + ':00' : this.newReservation.startDate,
      endDate: this.newReservation.endDate.length === 16 ? this.newReservation.endDate + ':00' : this.newReservation.endDate,
      pickupLocation: this.newReservation.pickupLocation || 'Agence',
      returnLocation: this.newReservation.returnLocation || 'Agence',
      dailyRate: this.newReservation.dailyRate,
      discountValue: this.newReservation.discountValue || 0,
      discountType: this.newReservation.discountType || 'MAD',
      depositAmount: this.newReservation.depositAmount || 0,
      paidAmount: this.newReservation.paidAmount || 0,
      paymentMethod: this.newReservation.paymentMethod || 'ESPECES'
    };

    this.apiService.post('/reservations', payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.toastService.success('Réservation enregistrée avec succès !', 'Réservation Confirmée');
        this.created.emit(res);
        this.closeModal();
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err?.error?.message || 'Erreur lors de l\'enregistrement de la réservation.';
        this.toastService.error(msg, 'Erreur Réservation');
      }
    });
  }
}
