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

  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<any>();

  vehicles: Vehicle[] = [];
  clients: Client[] = [];
  isSubmitting = false;

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

  closeModal(): void {
    this.close.emit();
  }

  submitReservation(): void {
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
