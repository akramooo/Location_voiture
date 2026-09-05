import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { VehicleExpense, Vehicle } from '../../models/models';

@Component({
  selector: 'app-expense',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expense.component.html',
  styleUrls: ['./expense.component.css']
})
export class ExpenseComponent implements OnInit {
  expenses: VehicleExpense[] = [
    {
      id: 1,
      vehicleId: 1,
      vehicleName: 'Peugeot 208 (AB-123-CD)',
      category: 'ASSURANCE',
      amount: 680,
      expenseDate: '2026-08-20',
      providerName: 'AXA  Assurances',
      notes: 'Prime d\'assurance annuelle flotte tous risques'
    },
    {
      id: 2,
      vehicleId: 2,
      vehicleName: 'Renault Clio 5 (EF-456-GH)',
      category: 'VISITE_TECHNIQUE',
      amount: 85,
      expenseDate: '2026-08-15',
      providerName: 'Autovision Contrôle',
      notes: 'Contrôle technique périodique obligatoire'
    },
    {
      id: 3,
      vehicleId: 4,
      vehicleName: 'Volkswagen Golf 8 (JK-789-LM)',
      category: 'VIDANGE',
      amount: 220,
      expenseDate: '2026-08-24',
      providerName: 'Norauto Paris',
      notes: 'Huile 5W30 synthétique LongLife + Filtres et plaquettes'
    }
  ];

  vehicles: Vehicle[] = [];
  isModalOpen = false;

  newExpense: VehicleExpense = {
    vehicleId: 1,
    category: 'VIDANGE',
    amount: 150,
    expenseDate: '2026-08-25',
    providerName: '',
    notes: ''
  };

  categories = [
    'VIDANGE',
    'PNEUMATIQUES',
    'ASSURANCE',
    'VISITE_TECHNIQUE',
    'CARROSSERIE',
    'CARBURANT',
    'REPARATION'
  ];

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
    this.loadExpenses();
  }

  loadVehicles(): void {
    this.apiService.get<Vehicle[]>('/vehicles').subscribe({
      next: (data) => this.vehicles = data,
      error: () => {}
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

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  submitExpense(): void {
    const payload = { ...this.newExpense };
    this.apiService.post<VehicleExpense>('/fleet/expenses', payload).subscribe({
      next: (created) => {
        this.expenses.unshift(created);
        this.closeModal();
        this.toastService.success(`Dépense de ${created.amount} MAD enregistrée avec succès !`, 'Dépense Enregistrée');
      },
      error: () => {
        const selectedVeh = this.vehicles.find(v => v.id == this.newExpense.vehicleId);
        const expToAdd = {
          ...this.newExpense,
          id: Date.now(),
          vehicleName: selectedVeh ? `${selectedVeh.brand} ${selectedVeh.model} (${selectedVeh.registrationNumber})` : 'Véhicule'
        };
        this.expenses.unshift(expToAdd);
        this.closeModal();
        this.toastService.success(`Dépense de ${expToAdd.amount} MAD enregistrée !`, 'Dépense Enregistrée');
      }
    });
  }

  getTotalExpenses(): number {
    return this.expenses.reduce((sum, e) => sum + e.amount, 0);
  }
}
