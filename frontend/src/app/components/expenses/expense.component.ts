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
  expenses: VehicleExpense[] = [];
  vehicles: Vehicle[] = [];
  isLoading = false;
  isModalOpen = false;
  isStatusModalOpen = false;
  selectedExpenseForStatus: VehicleExpense | null = null;
  selectedNewVehicleStatus = 'DISPONIBLE';

  newExpense: VehicleExpense & { 
    setVehicleInMaintenance?: boolean;
    mileageAtService?: number;
    nextServiceMileage?: number;
    expirationDate?: string;
  } = {
    vehicleId: 1,
    category: 'VIDANGE',
    amount: 150,
    expenseDate: new Date().toISOString().split('T')[0],
    providerName: '',
    notes: '',
    status: 'VALIDE',
    setVehicleInMaintenance: false,
    mileageAtService: 15000,
    nextServiceMileage: 25000,
    expirationDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0]
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

  vehicleStatuses = [
    { value: 'DISPONIBLE', label: 'Disponible', icon: 'fa-circle-check', color: '#34d399', badgeClass: 'badge-DISPONIBLE' },
    { value: 'EN_MAINTENANCE', label: 'En Maintenance', icon: 'fa-screwdriver-wrench', color: '#fbbf24', badgeClass: 'badge-EN_MAINTENANCE' },
    { value: 'LOUE', label: 'Loué', icon: 'fa-key', color: '#60a5fa', badgeClass: 'badge-LOUE' },
    { value: 'EN_NETTOYAGE', label: 'En Nettoyage', icon: 'fa-soap', color: '#a78bfa', badgeClass: 'badge-EN_NETTOYAGE' },
    { value: 'BLOQUE_LITIGE', label: 'Bloqué / Litige', icon: 'fa-triangle-exclamation', color: '#f87171', badgeClass: 'badge-BLOQUE_LITIGE' }
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
      next: (data) => {
        this.vehicles = data;
        if (this.vehicles.length > 0) {
          this.newExpense.vehicleId = this.vehicles[0].id!;
          this.onVehicleSelectChange();
        }
      },
      error: () => {}
    });
  }

  onVehicleSelectChange(): void {
    const v = this.vehicles.find(veh => veh.id == this.newExpense.vehicleId);
    if (v) {
      this.newExpense.mileageAtService = v.currentMileage || 15000;
      this.newExpense.nextServiceMileage = (v.currentMileage || 15000) + 10000;
    }
  }

  onMileageChange(): void {
    if (this.newExpense.mileageAtService) {
      this.newExpense.nextServiceMileage = Number(this.newExpense.mileageAtService) + 10000;
    }
  }

  loadExpenses(): void {
    this.isLoading = true;
    this.apiService.get<VehicleExpense[]>('/fleet/expenses').subscribe({
      next: (data) => {
        this.expenses = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur chargement dépenses:', err);
      }
    });
  }

  openModal(): void {
    this.newExpense.expenseDate = new Date().toISOString().split('T')[0];
    this.newExpense.expirationDate = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0];
    this.onVehicleSelectChange();
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  openVehicleStatusModal(expense: VehicleExpense): void {
    this.selectedExpenseForStatus = expense;
    this.selectedNewVehicleStatus = expense.vehicleStatus || 'DISPONIBLE';
    this.isStatusModalOpen = true;
  }

  closeVehicleStatusModal(): void {
    this.isStatusModalOpen = false;
    this.selectedExpenseForStatus = null;
  }

  submitExpense(): void {
    const payload = { ...this.newExpense };
    this.apiService.post<VehicleExpense>('/fleet/expenses', payload).subscribe({
      next: (created) => {
        this.expenses.unshift(created);
        if (payload.setVehicleInMaintenance) {
          const veh = this.vehicles.find(v => v.id == payload.vehicleId);
          if (veh) veh.status = 'EN_MAINTENANCE';
        }
        this.closeModal();
        this.toastService.success(`Dépense de ${created.amount} MAD enregistrée avec succès !`, 'Dépense Enregistrée');
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Erreur lors de l\'enregistrement de la dépense.', 'Erreur');
      }
    });
  }

  validateExpense(expense: VehicleExpense): void {
    if (!expense.id) return;
    this.apiService.put<any>(`/fleet/expenses/${expense.id}/validate`, {}).subscribe({
      next: (res) => {
        expense.status = 'VALIDE';
        this.toastService.success(`Dépense #${expense.id} validée et enregistrée !`, 'Statut Validé');
      },
      error: () => {
        this.toastService.error('Erreur lors de la validation.', 'Erreur');
      }
    });
  }

  saveVehicleStatus(): void {
    if (!this.selectedExpenseForStatus || !this.selectedExpenseForStatus.vehicleId) return;
    const vehicleId = this.selectedExpenseForStatus.vehicleId;
    const newStatus = this.selectedNewVehicleStatus;

    this.apiService.put<any>(`/fleet/expenses/vehicles/${vehicleId}/status`, { status: newStatus }).subscribe({
      next: () => {
        this.updateLocalVehicleStatus(vehicleId, newStatus);
        this.closeVehicleStatusModal();
        this.toastService.success(`Statut du véhicule mis à jour : ${newStatus}`, 'Véhicule Actualisé');
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Erreur lors de la mise à jour du statut', 'Erreur');
      }
    });
  }

  private updateLocalVehicleStatus(vehicleId: number, newStatus: string): void {
    // Met à jour toutes les lignes de dépenses concernant ce véhicule
    this.expenses.forEach(e => {
      if (e.vehicleId == vehicleId) {
        e.vehicleStatus = newStatus;
      }
    });
    // Met à jour la liste des véhicules
    const v = this.vehicles.find(veh => veh.id == vehicleId);
    if (v) v.status = newStatus;
  }

  deleteExpense(expense: VehicleExpense): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette dépense de ${expense.amount} MAD ?`)) return;

    if (expense.id) {
      this.apiService.delete(`/fleet/expenses/${expense.id}`).subscribe({
        next: () => {
          this.expenses = this.expenses.filter(e => e.id !== expense.id);
          this.toastService.info('Dépense supprimée de la flotte.', 'Dépense Supprimée');
        },
        error: () => {
          this.expenses = this.expenses.filter(e => e.id !== expense.id);
          this.toastService.info('Dépense supprimée.', 'Dépense Supprimée');
        }
      });
    } else {
      this.expenses = this.expenses.filter(e => e !== expense);
    }
  }

  selectedCategoryFilter: string = 'ALL';

  filterByCat(cat: string): void {
    this.selectedCategoryFilter = cat;
  }

  isValidated(e: VehicleExpense): boolean {
    return e.status === 'VALIDE' || e.status === 'PAYE' || e.status === 'TERMINE';
  }

  get validatedExpenses(): VehicleExpense[] {
    return this.expenses.filter(e => this.isValidated(e));
  }

  get filteredExpenses(): VehicleExpense[] {
    if (this.selectedCategoryFilter === 'ALL') {
      return this.expenses;
    }
    if (this.selectedCategoryFilter === 'PNEUS_REPARATIONS') {
      return this.expenses.filter(e => e.category === 'PNEUMATIQUES' || e.category === 'REPARATION' || e.category === 'CARROSSERIE');
    }
    return this.expenses.filter(e => e.category === this.selectedCategoryFilter);
  }

  getCategorySum(cat: string, onlyValidated: boolean = false): number {
    if (cat === 'ALL') {
      return this.getTotalExpenses(onlyValidated);
    }
    const list = (onlyValidated || cat === 'ASSURANCE') ? this.validatedExpenses : this.expenses;
    if (cat === 'PNEUS_REPARATIONS') {
      return list
        .filter(e => e.category === 'PNEUMATIQUES' || e.category === 'REPARATION' || e.category === 'CARROSSERIE')
        .reduce((sum, e) => sum + (e.amount || 0), 0);
    }
    return list
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  getCategoryCount(cat: string, onlyValidated: boolean = false): number {
    if (cat === 'ALL') return this.expenses.length;
    const list = (onlyValidated || cat === 'ASSURANCE') ? this.validatedExpenses : this.expenses;
    if (cat === 'PNEUS_REPARATIONS') {
      return list.filter(e => e.category === 'PNEUMATIQUES' || e.category === 'REPARATION' || e.category === 'CARROSSERIE').length;
    }
    return list.filter(e => e.category === cat).length;
  }

  getCategoryPercentage(cat: string, onlyValidated: boolean = false): number {
    const total = this.getTotalExpenses();
    if (total === 0) return 0;
    const sum = this.getCategorySum(cat, onlyValidated);
    return Math.round((sum / total) * 1000) / 10;
  }

  getAverageCostPerVehicle(): number {
    const vehCount = this.vehicles.length > 0 ? this.vehicles.length : 1;
    return this.getTotalExpenses() / vehCount;
  }

  getTotalExpenses(onlyValidated: boolean = false): number {
    const list = onlyValidated ? this.validatedExpenses : this.expenses;
    return list.reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  getPendingExpensesCount(): number {
    return this.expenses.filter(e => !this.isValidated(e)).length;
  }

  getPendingExpensesSum(): number {
    return this.expenses.filter(e => !this.isValidated(e)).reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  getVehicleStatusBadge(status?: string): { label: string, icon: string, bg: string, color: string, border: string } {
    switch (status) {
      case 'EN_MAINTENANCE':
        return { label: 'EN MAINTENANCE', icon: 'fa-screwdriver-wrench', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.35)' };
      case 'LOUE':
        return { label: 'LOUÉ', icon: 'fa-key', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.35)' };
      case 'EN_NETTOYAGE':
        return { label: 'NETTOYAGE', icon: 'fa-soap', bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.35)' };
      case 'BLOQUE_LITIGE':
        return { label: 'BLOQUÉ LITIGE', icon: 'fa-triangle-exclamation', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.35)' };
      case 'DISPONIBLE':
      default:
        return { label: 'DISPONIBLE', icon: 'fa-circle-check', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.35)' };
    }
  }
}
