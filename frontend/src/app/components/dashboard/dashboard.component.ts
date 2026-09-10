import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ExecutiveKpis, Vehicle, Client, VehicleExpense, RadarFine } from '../../models/models';
import { ReservationModalComponent } from '../shared/reservation-modal/reservation-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReservationModalComponent],
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
    totalExpenses: 0,
    totalRadarFines: 0
  };

  vehicles: Vehicle[] = [];
  clients: Client[] = [];
  expenses: VehicleExpense[] = [];
  fines: RadarFine[] = [];

  isModalOpen = false;

  constructor(
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.loadKpis();
    this.loadVehicles();
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
      next: (data) => this.vehicles = data || [],
      error: (err) => console.error('Erreur Véhicules:', err)
    });
  }

  loadExpenses(): void {
    this.apiService.get<VehicleExpense[]>('/fleet/expenses').subscribe({
      next: (data) => {
        this.expenses = data || [];
      },
      error: () => {
        this.expenses = [];
      }
    });
  }

  loadFines(): void {
    this.apiService.get<RadarFine[]>('/billing/radar-fines').subscribe({
      next: (data) => {
        this.fines = data || [];
      },
      error: () => {
        this.fines = [];
      }
    });
  }

  getTotalExpensesSum(): number {
    return this.expenses.reduce((sum, e) => sum + e.amount, 0);
  }

  getTotalRadarFinesSum(): number {
    return this.fines.reduce((sum, f) => sum + f.fineAmount, 0);
  }

  openReservationModal(): void {
    this.isModalOpen = true;
  }

  onReservationCreated(): void {
    this.loadKpis();
    this.loadVehicles();
  }
}
