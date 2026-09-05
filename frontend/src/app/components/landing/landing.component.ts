import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LandingHeroComponent } from './hero/landing-hero.component';
import { LandingFeaturesComponent } from './features/landing-features.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, LandingHeroComponent, LandingFeaturesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  vehicleCount = 5;
  selectedPlan: 'MONTHLY' | 'ANNUAL' = 'ANNUAL';
  activeFaqIndex: number | null = 0;

  faqs = [
    {
      question: "Pourquoi choisir RentFlow pour la gestion de votre agence de location ?",
      answer: "RentFlow est spécialement conçu pour automatiser et sécuriser l'ensemble de votre activité au quotidien : scan intelligent des documents (CIN, Permis, Passeport) par IA, états des lieux 2D tactiles sur smartphone, conformité fiscale DGI/ICE, suivi rigoureux des cautions/chèques et réassignation des PV radars. Vous gagnez un temps précieux, éliminez les fraudes et maximisez votre rentabilité."
    },
    {
      question: "Combien de véhicules puis-je gérer sur la plateforme ?",
      answer: "De 1 à plus de 500 véhicules ! Notre plateforme multi-tenant évolue avec la taille de votre agence sans ralentissement."
    },
    {
      question: "Quelles fonctionnalités sont incluses dans les packs ?",
      answer: "Toutes les fonctionnalités sont incluses sans restriction : Gestion des contrats, Scan IA OCR, Inspection 2D, Factures DGI, Portefeuille de chèques, Dépenses TCO, PV Radars et Planning Gantt."
    },
    {
      question: "Comment puis-je contacter le support technique ?",
      answer: "Notre équipe est disponible du Lundi au Vendredi de 8h à 18h par WhatsApp direct, Téléphone ou Email."
    }
  ];

  constructor(private router: Router) {}

  getPerVehicleMonthlyRate(): number {
    if (this.vehicleCount <= 10) return 40;
    if (this.vehicleCount <= 20) return 35;
    if (this.vehicleCount <= 35) return 30;
    return 25;
  }

  getTotalPrice(): number {
    const monthlyRate = this.vehicleCount * this.getPerVehicleMonthlyRate();
    return this.selectedPlan === 'MONTHLY' ? monthlyRate : monthlyRate * 11;
  }

  toggleFaq(index: number): void {
    this.activeFaqIndex = this.activeFaqIndex === index ? null : index;
  }

  trackByQuestion(index: number, item: any): string {
    return item.question;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
