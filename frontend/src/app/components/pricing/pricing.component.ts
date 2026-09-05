import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.css']
})
export class PricingComponent {
  vehicleCount = 5;
  selectedPlan: 'MONTHLY' | 'ANNUAL' = 'ANNUAL';

  constructor(private toastService: ToastService) {}

  getPerVehicleMonthlyRate(): number {
    if (this.vehicleCount <= 10) return 40;
    if (this.vehicleCount <= 20) return 35;
    if (this.vehicleCount <= 35) return 30;
    return 25;
  }

  getTotalPrice(): number {
    const monthlyRate = this.vehicleCount * this.getPerVehicleMonthlyRate();
    if (this.selectedPlan === 'MONTHLY') {
      return monthlyRate;
    } else {
      // Annuel : 11 mois facturés (1 mois offert comme Loc.ma)
      return monthlyRate * 11;
    }
  }

  subscribeNow(): void {
    this.toastService.success(`Demande de souscription enregistrée pour ${this.vehicleCount} véhicules !`, 'Souscription SaaS');
  }
}
