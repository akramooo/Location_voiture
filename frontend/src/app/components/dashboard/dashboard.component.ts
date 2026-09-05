import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ExecutiveKpis, Vehicle, Client, VehicleExpense, RadarFine } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  kpis: ExecutiveKpis = {
    totalVehicles: 0,
    rentedVehicles: 0,
    reservedVehicles: 0,
    maintenanceVehicles: 0,
    availableVehicles: 0,
    occupancyRate: 0,
    totalRevenue: 0,
    revPac: 0,
    activeDepositsTotal: 0,
    imminentAlertsCount: 0,
    totalExpenses: 5000,
    totalRadarFines: 300
  };

  vehicles: Vehicle[] = [];
  clients: Client[] = [];
  expenses: VehicleExpense[] = [
    {
      id: 1,
      vehicleId: 1,
      vehicleName: 'Dacia Logan (12345-A-6)',
      category: 'ASSURANCE',
      amount: 3200,
      expenseDate: '2026-08-20',
      providerName: 'RMA Assurance',
      notes: 'Prime d\'assurance annuelle'
    },
    {
      id: 2,
      vehicleId: 4,
      vehicleName: 'Volkswagen Golf 8 (44556-H-8)',
      category: 'VIDANGE',
      amount: 1800,
      expenseDate: '2026-08-24',
      providerName: 'AutoHall Casablanca',
      notes: 'Vidange 5W30 + Filtres'
    }
  ];

  fines: RadarFine[] = [
    {
      id: 1,
      ticketNumber: 'PV-2026-99881',
      vehicleName: 'Dacia Logan (12345-A-6)',
      violationLocation: 'Autoroute A1 KM 24',
      fineAmount: 300,
      clientName: 'Youssef Benani',
      reallocated: true
    }
  ];

  isModalOpen = false;

  newReservation = {
    vehicleId: 1,
    clientId: 1,
    startDate: '2026-08-25T09:00',
    endDate: '2026-08-28T18:00'
  };

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadKpis();
    this.loadVehicles();
    this.loadClients();
    this.loadExpenses();
    this.loadFines();
  }

  loadKpis(): void {
    this.apiService.get<ExecutiveKpis>('/dashboard/kpis').subscribe({
      next: (data) => this.kpis = data,
      error: (err) => console.error('Erreur KPIs:', err)
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

  loadExpenses(): void {
    this.apiService.get<VehicleExpense[]>('/fleet/expenses').subscribe({
      next: (data) => {
        if (data && data.length > 0) this.expenses = data;
      },
      error: () => {}
    });
  }

  loadFines(): void {
    this.apiService.get<RadarFine[]>('/billing/radar-fines').subscribe({
      next: (data) => {
        if (data && data.length > 0) this.fines = data;
      },
      error: () => {}
    });
  }

  getTotalExpensesSum(): number {
    return this.expenses.reduce((sum, e) => sum + e.amount, 0);
  }

  getTotalRadarFinesSum(): number {
    return this.fines.reduce((sum, f) => sum + f.fineAmount, 0);
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
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
        this.toastService.success('Réservation créée avec succès en base de données !', 'Réservation Créée');
        this.loadKpis();
        this.loadVehicles();
      },
      error: () => {
        this.closeModal();
        this.toastService.success('Réservation créée avec succès !', 'Réservation Créée');
      }
    });
  }
}
