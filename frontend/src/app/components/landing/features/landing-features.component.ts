import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing-features',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="fonctionnalites" class="features-section">
      <div class="section-header">
        <div class="section-badge">TOUT-EN-UN EXÉCUTIF</div>
        <h2>Toutes les Fonctionnalités Incluses</h2>
        <p>Une suite complète sans restriction pour piloter votre agence comme une entreprise d'élite.</p>
      </div>

      <div class="features-grid">
        <div *ngFor="let f of features; trackBy: trackByTitle" class="feature-card glass-card">
          <div class="feature-icon-wrapper">
            <i class="fa-solid {{ f.icon }}"></i>
          </div>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .features-section {
      padding: 90px 24px;
      max-width: 1200px;
      margin: 0 auto;
      content-visibility: auto;
    }

    .section-header { text-align: center; margin-bottom: 56px; }

    .section-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      color: #818cf8;
      background: rgba(99, 102, 241, 0.1);
      padding: 6px 16px;
      border-radius: 20px;
      border: 1px solid rgba(99, 102, 241, 0.25);
      margin-bottom: 14px;
    }

    .section-header h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 2.5rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 12px;
      letter-spacing: -0.01em;
    }

    .section-header p { color: #94a3b8; font-size: 1.05rem; max-width: 600px; margin: 0 auto; }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 22px;
    }

    .feature-card {
      padding: 28px;
      text-align: left;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      backdrop-filter: blur(14px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .feature-card:hover {
      transform: translateY(-4px);
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(99, 102, 241, 0.4);
      box-shadow: 0 12px 30px -10px rgba(99, 102, 241, 0.2);
    }

    .feature-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
      color: #818cf8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      margin-bottom: 20px;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }

    .feature-card h3 {
      font-size: 1.08rem;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 10px;
    }

    .feature-card p {
      font-size: 0.88rem;
      color: #94a3b8;
      line-height: 1.6;
    }
  `]
})
export class LandingFeaturesComponent {
  features = [
    { icon: 'fa-file-contract', title: 'Gestion des Contrats', desc: 'Édition et génération immédiate de contrats de location personnalisés.' },
    { icon: 'fa-users', title: 'CRM & Anti-Fraude', desc: 'Centralisation des dossiers clients et détection des profils à risque.' },
    { icon: 'fa-car', title: 'Gestion de Flotte TCO', desc: 'Suivi de l’état, maintenance et rentabilité par véhicule en temps réel.' },
    { icon: 'fa-calendar-days', title: 'Planning Gantt', desc: 'Visualisation fluide des réservations et gestion zéro conflit.' },
    { icon: 'fa-signature', title: 'Signature Numérique', desc: 'Signature tactile directe sur tablette ou smartphone lors de la remise.' },
    { icon: 'fa-stamp', title: 'Cachet Agence & PDF', desc: 'Superposition automatique du cachet officiel et génération PDF.' },
    { icon: 'fa-car-burst', title: 'Inspection 2D Dommages', desc: 'Schéma carrosserie 2D pour documenter les rayures et chocs.' },
    { icon: 'fa-wand-magic-sparkles', title: 'IA - Scan Documents OCR', desc: 'Reconnaissance optique automatique des CIN, Permis et Carte Grise.' },
    { icon: 'fa-chart-line', title: 'Tableau de Bord Exécutif', desc: 'Vision globale des départs, retours et indicateurs d’activité.' },
    { icon: 'fa-chart-pie', title: 'Statistiques & RevPAC', desc: 'Analyse du taux d’occupation, revenu moyen et rentabilité.' },
    { icon: 'fa-clock-rotate-left', title: 'Journal d’Audit Agent', desc: 'Traçabilité complète des actions effectuées par votre personnel.' },
    { icon: 'fa-user-shield', title: 'Droits & Rôles Agence', desc: 'Gestion fine des accès pour Administrateurs, Agents et Convoyeurs.' },
    { icon: 'fa-money-check-dollar', title: 'Portefeuille de Chèques', desc: 'Suivi des chèques en caisse, dépôts bancaires et restitutions.' },
    { icon: 'fa-file-invoice-dollar', title: 'Factures Conformes DGI', desc: 'Émission de factures HT/TTC professionnelles avec ICE agence.' },
    { icon: 'fa-wrench', title: 'Dépenses & Entretien', desc: 'Suivi des frais de vidange, assurance, contrôle technique et réparations.' },
    { icon: 'fa-headset', title: 'Support Dédié 24/7', desc: 'Assistance technique prioritaire par WhatsApp, téléphone et email.' }
  ];

  trackByTitle(index: number, item: any): string {
    return item.title;
  }
}
