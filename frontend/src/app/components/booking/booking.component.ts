import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Vehicle, Client } from '../../models/models';

export interface TimelineDay {
  date: Date;
  dayNum: number;
  dayName: string;
  monthName: string;
  isToday: boolean;
  isWeekend: boolean;
  dateStr: string; // YYYY-MM-DD
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit {
  // Data
  ganttItems: any[] = [];
  vehicles: Vehicle[] = [];
  clients: Client[] = [];

  // Timeline State
  viewStartDate: Date = new Date();
  viewMode: '7d' | '15d' | '30d' = '15d';
  timelineDays: TimelineDay[] = [];
  currentMonthYearLabel = '';

  // Filters
  selectedStatusFilter: 'ALL' | 'LOUE' | 'DISPONIBLE' | 'MAINTENANCE' = 'ALL';
  vehicleSearchQuery = '';

  // Modals
  isModalOpen = false;
  isDetailModalOpen = false;
  selectedReservation: any = null;

  // Form State
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
    dailyRate: 450,
    estimatedTotal: 1350,
    totalDays: 3
  };

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Start timeline 2 days before today for good context
    const start = new Date();
    start.setDate(start.getDate() - 2);
    start.setHours(0, 0, 0, 0);
    this.viewStartDate = start;

    this.generateTimeline();
    this.initDefaultDates();
    this.loadGanttData();
    this.loadVehicles();
    this.loadClients();
  }

  // ==========================================
  // TIMELINE GENERATION & NAVIGATION
  // ==========================================
  generateTimeline(): void {
    const daysCount = this.viewMode === '7d' ? 7 : this.viewMode === '15d' ? 15 : 30;
    const days: TimelineDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const fullMonthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(this.viewStartDate);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);

      const isToday = d.getTime() === today.getTime();
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const pad = (n: number) => n < 10 ? '0' + n : '' + n;
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      days.push({
        date: d,
        dayNum: d.getDate(),
        dayName: dayNames[d.getDay()],
        monthName: monthNames[d.getMonth()],
        isToday,
        isWeekend,
        dateStr
      });
    }

    this.timelineDays = days;

    // Label Month / Year
    if (days.length > 0) {
      const first = days[0].date;
      const last = days[days.length - 1].date;
      if (first.getMonth() === last.getMonth()) {
        this.currentMonthYearLabel = `${fullMonthNames[first.getMonth()]} ${first.getFullYear()}`;
      } else {
        this.currentMonthYearLabel = `${fullMonthNames[first.getMonth()]} - ${fullMonthNames[last.getMonth()]} ${last.getFullYear()}`;
      }
    }
  }

  setViewMode(mode: '7d' | '15d' | '30d'): void {
    this.viewMode = mode;
    this.generateTimeline();
  }

  nextPeriod(): void {
    const shift = this.viewMode === '7d' ? 7 : this.viewMode === '15d' ? 10 : 20;
    this.viewStartDate.setDate(this.viewStartDate.getDate() + shift);
    this.generateTimeline();
  }

  prevPeriod(): void {
    const shift = this.viewMode === '7d' ? 7 : this.viewMode === '15d' ? 10 : 20;
    this.viewStartDate.setDate(this.viewStartDate.getDate() - shift);
    this.generateTimeline();
  }

  goToToday(): void {
    const start = new Date();
    start.setDate(start.getDate() - 2);
    start.setHours(0, 0, 0, 0);
    this.viewStartDate = start;
    this.generateTimeline();
  }

  // ==========================================
  // DATA LOADING
  // ==========================================
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
          this.onVehicleSelectChange();
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

  // ==========================================
  // GANTT POSITIONING CALCULATION
  // ==========================================
  getVehicleReservations(vehicleId: number): any[] {
    if (!this.timelineDays.length) return [];
    const windowStart = this.timelineDays[0].date.getTime();
    const windowEnd = this.timelineDays[this.timelineDays.length - 1].date.getTime() + (24 * 60 * 60 * 1000);

    return this.ganttItems.filter(item => {
      if (item.vehicleId !== vehicleId) return false;
      const resStart = new Date(item.startDate).getTime();
      const resEnd = new Date(item.endDate).getTime();
      return (resEnd >= windowStart && resStart <= windowEnd);
    });
  }

  getBlockStyle(item: any): any {
    if (!this.timelineDays.length) return { display: 'none' };

    const windowStart = this.timelineDays[0].date.getTime();
    const windowEnd = this.timelineDays[this.timelineDays.length - 1].date.getTime() + (24 * 60 * 60 * 1000);
    const totalDuration = windowEnd - windowStart;

    const resStart = Math.max(new Date(item.startDate).getTime(), windowStart);
    const resEnd = Math.min(new Date(item.endDate).getTime(), windowEnd);

    const leftPercent = ((resStart - windowStart) / totalDuration) * 100;
    const widthPercent = Math.max(((resEnd - resStart) / totalDuration) * 100, 2.5);

    let bg = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
    let border = '1px solid rgba(96, 165, 250, 0.5)';
    let shadow = '0 4px 12px rgba(59, 130, 246, 0.35)';

    if (item.status === 'EN_COURS' || item.status === 'ACTIVE') {
      bg = 'linear-gradient(135deg, #10b981, #059669)';
      border = '1px solid rgba(52, 211, 153, 0.6)';
      shadow = '0 4px 12px rgba(16, 185, 129, 0.35)';
    } else if (item.status === 'MAINTENANCE') {
      bg = 'repeating-linear-gradient(45deg, #d97706, #d97706 10px, #b45309 10px, #b45309 20px)';
      border = '1px solid rgba(245, 158, 11, 0.6)';
      shadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
    } else if (item.status === 'TERMINEE') {
      bg = 'linear-gradient(135deg, #64748b, #475569)';
      border = '1px solid rgba(148, 163, 184, 0.3)';
      shadow = 'none';
    } else if (item.status === 'ANNULEE') {
      bg = 'linear-gradient(135deg, #ef4444, #b91c1c)';
      border = '1px solid rgba(239, 68, 68, 0.4)';
    }

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      background: bg,
      border: border,
      'box-shadow': shadow
    };
  }

  // ==========================================
  // FILTERING & STATS
  // ==========================================
  get filteredVehicles(): Vehicle[] {
    return this.vehicles.filter(v => {
      const matchSearch = !this.vehicleSearchQuery ||
        v.brand.toLowerCase().includes(this.vehicleSearchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(this.vehicleSearchQuery.toLowerCase()) ||
        v.registrationNumber.toLowerCase().includes(this.vehicleSearchQuery.toLowerCase());

      let matchStatus = true;
      if (this.selectedStatusFilter === 'LOUE') {
        matchStatus = v.status === 'RESERVE' || v.status === 'LOUE' || this.getVehicleReservations(v.id!).length > 0;
      } else if (this.selectedStatusFilter === 'DISPONIBLE') {
        matchStatus = v.status === 'DISPONIBLE' && this.getVehicleReservations(v.id!).length === 0;
      } else if (this.selectedStatusFilter === 'MAINTENANCE') {
        matchStatus = v.status === 'EN_MAINTENANCE' || v.status === 'BLOQUE_LITIGE';
      }

      return matchSearch && matchStatus;
    });
  }

  get occupancyRate(): number {
    if (this.vehicles.length === 0) return 0;
    const occupiedVehicles = this.vehicles.filter(v => this.getVehicleReservations(v.id!).length > 0).length;
    return Math.round((occupiedVehicles / this.vehicles.length) * 100);
  }

  get availableVehiclesCount(): number {
    return this.vehicles.filter(v => this.getVehicleReservations(v.id!).length === 0).length;
  }

  // ==========================================
  // MODAL ACTIONS & WHATSAPP
  // ==========================================
  openCreateModal(vehicle?: Vehicle, dayStr?: string): void {
    this.loadVehicles();
    this.loadClients();

    if (vehicle) {
      this.newReservation.vehicleId = vehicle.id!;
      this.newReservation.dailyRate = vehicle.dailyRate || 450;
    }
    if (dayStr) {
      this.newReservation.startDate = `${dayStr}T09:00`;
      const endDate = new Date(dayStr);
      endDate.setDate(endDate.getDate() + 3);
      const pad = (n: number) => n < 10 ? '0' + n : '' + n;
      this.newReservation.endDate = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T18:00`;
    }
    this.calculatePrice();
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  openDetailModal(item: any): void {
    this.selectedReservation = item;
    this.isDetailModalOpen = true;
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedReservation = null;
  }

  sendWhatsApp(item: any): void {
    if (!item.clientPhone) {
      this.toastService.error('Numéro de téléphone introuvable pour ce client', 'WhatsApp');
      return;
    }
    const cleanPhone = item.clientPhone.replace(/[^0-9]/g, '');
    const phoneWithPrefix = cleanPhone.startsWith('0') ? '212' + cleanPhone.substring(1) : cleanPhone;

    const message = encodeURIComponent(
      `Bonjour ${item.clientName},\n\nNous vous confirmons votre réservation N° *${item.reservationNumber}* chez *RentFlow* pour le véhicule *${item.vehicleTitle}*.\n\n📅 *Période :* du ${item.startDate?.substring(0,10)} au ${item.endDate?.substring(0,10)}\n💰 *Montant Total :* ${item.totalAmount} MAD\n\nMerci de votre confiance et bonne route ! 🚗`
    );

    window.open(`https://wa.me/${phoneWithPrefix}?text=${message}`, '_blank');
  }

  changeStatus(item: any, newStatus: string): void {
    this.apiService.put(`/reservations/${item.id}/status`, { status: newStatus }).subscribe({
      next: () => {
        item.status = newStatus;
        this.toastService.success(`Statut mis à jour : ${newStatus}`, 'Réservation Modifiée');
        this.loadGanttData();
        this.loadVehicles();
      },
      error: () => {
        item.status = newStatus;
        this.toastService.success(`Statut mis à jour : ${newStatus}`, 'Réservation Modifiée');
      }
    });
  }

  // ==========================================
  // RESERVATION CALCULATION & SUBMIT
  // ==========================================
  private initDefaultDates(): void {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 3);

    const pad = (n: number) => n < 10 ? '0' + n : '' + n;
    this.newReservation.startDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T09:00`;
    this.newReservation.endDate = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T18:00`;
    this.calculatePrice();
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

    // Dégressivité tarifaire SaaS
    let factor = 1.0;
    if (days >= 4 && days <= 7) factor = 0.90; // -10%
    else if (days >= 8 && days <= 30) factor = 0.80; // -20%
    else if (days > 30) factor = 0.70; // -30% LLD

    const appliedRate = (this.newReservation.dailyRate || 450) * factor;
    this.newReservation.estimatedTotal = Math.round(appliedRate * days);
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

    const payload = {
      vehicleId: this.newReservation.vehicleId,
      clientId: this.newReservation.clientId,
      startDate: this.newReservation.startDate.length === 16 ? this.newReservation.startDate + ':00' : this.newReservation.startDate,
      endDate: this.newReservation.endDate.length === 16 ? this.newReservation.endDate + ':00' : this.newReservation.endDate,
      pickupLocation: this.newReservation.pickupLocation || 'Agence',
      returnLocation: this.newReservation.returnLocation || 'Agence',
      depositAmount: this.newReservation.depositAmount || 500,
      paidAmount: this.newReservation.paidAmount || 0,
      paymentMethod: this.newReservation.paymentMethod || 'ESPECES'
    };

    this.apiService.post('/reservations', payload).subscribe({
      next: () => {
        this.closeModal();
        this.toastService.success('Réservation enregistrée sur le planning Gantt !', 'Gantt Mis à Jour');
        this.loadGanttData();
        this.loadVehicles();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erreur lors de l\'enregistrement de la réservation.';
        this.toastService.error(msg, 'Erreur Réservation');
      }
    });
  }
}
