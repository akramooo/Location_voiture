import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AgencySettings } from '../../models/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  activeTab: 'agency' | 'rental' | 'billing' | 'whatsapp' | 'alerts' = 'agency';
  isLoading = false;
  isSaving = false;

  settings: AgencySettings = {
    name: 'Atlas Rent-a-Car Casablanca',
    subdomain: 'atlas-rent',
    iceNumber: '80234567800012',
    ifNumber: '45678901',
    rcNumber: 'RCS Casa B 802345',
    patenteNumber: '7711A',
    tvaRate: 20.0,
    address: "Angle Bd Zerktouni & Bd d'Anfa",
    city: 'Casablanca',
    phone: '+212 5 22 00 11 22',
    email: 'contact@atlasrent.ma',
    logoUrl: '',
    whatsappNumber: '+212 6 12 34 56 78',

    // Règles Contrat
    depositDefault: 5000,
    dailyKmIncluded: 0,
    extraKmRate: 2.0,
    toleranceHours: 2,
    minDriverAge: 21,
    minLicenseYears: 2,
    termsAndConditions: "Le locataire s'engage à restituer le véhicule avec le même niveau de carburant et dans un état propre. Tout retard non convenu de plus de 2 heures entraînera la facturation d'une journée supplémentaire.",

    // Facturation & Banque
    bankRib: 'Attijariwafa Bank - 007 780 0001234567890123 45',
    invoiceFooter: 'SARL au capital de 100 000 DH - En cas de litige, le tribunal de commerce de Casablanca est seul compétent.',
    contractPrefix: 'LOC-',
    invoicePrefix: 'FAC-',

    // Alertes Flotte
    alertAssuranceDays: 30,
    alertVisiteTechDays: 15,
    alertVignetteDays: 30,

    // Modèles WhatsApp Direct (Option 1 Gratuite)
    whatsappTemplateReservation: "Bonjour {clientName}, votre réservation N° {reservationNumber} pour le véhicule {vehicleName} du {startDate} au {endDate} est confirmée par l'agence {agencyName}. Montant total: {totalAmount} MAD. Merci de votre confiance !",
    whatsappTemplateReturn: "Bonjour {clientName}, nous vous rappelons que la restitution de votre véhicule {vehicleName} (Contrat {reservationNumber}) est prévue le {endDate} à {agencyCity}. Bonne route !",
    whatsappTemplateFine: "Bonjour {clientName}, nous vous informons d'un avis d'infraction N° {ticketNumber} pour le véhicule {vehicleName} le {violationDate} d'un montant de {fineAmount} MAD. Merci de prendre contact avec l'agence {agencyName}."
  };

  // WhatsApp Simulator State
  simulatedTemplateType: 'RESERVATION' | 'RETURN' | 'FINE' = 'RESERVATION';
  testClientName = 'Youssef Benani';
  testPhone = '0661234567';
  testVehicle = 'Dacia Logan (12345-A-6)';
  testReservationNumber = 'LOC-2026-0042';
  testTotalAmount = 1800;

  // Logo upload
  selectedLogoFile: File | null = null;
  previewLogoUrl: string | null = null;
  isUploadingLogo = false;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    this.apiService.get<AgencySettings>('/settings/agency').subscribe({
      next: (data) => {
        if (data) {
          this.settings = { ...this.settings, ...data };
          if (this.settings.logoUrl) {
            this.previewLogoUrl = this.settings.logoUrl;
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.warn('Paramètres par défaut appliqués:', err);
        this.isLoading = false;
      }
    });
  }

  onLogoFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedLogoFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewLogoUrl = e.target.result;
      };
      reader.readAsDataURL(file);

      // Upload direct to MinIO
      this.isUploadingLogo = true;
      this.apiService.uploadFile(file, 'agency_logos').subscribe({
        next: (res) => {
          this.isUploadingLogo = false;
          this.settings.logoUrl = res.url;
          this.previewLogoUrl = res.url;
          this.toastService.success('Logo uploadé avec succès sur le stockage MinIO !', 'Logo Actualisé');
        },
        error: (err) => {
          this.isUploadingLogo = false;
          console.warn('Upload MinIO échoué, utilisation locale:', err);
        }
      });
    }
  }

  removeLogo(): void {
    this.selectedLogoFile = null;
    this.previewLogoUrl = null;
    this.settings.logoUrl = '';
  }

  saveSettings(): void {
    if (this.isSaving) return;
    this.isSaving = true;

    this.apiService.put<AgencySettings>('/settings/agency', this.settings).subscribe({
      next: (updated) => {
        this.isSaving = false;
        this.settings = updated;
        this.toastService.success('Paramètres de l\'agence enregistrés avec succès !', 'Configuration Sauvegardée');
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err?.error?.message || 'Erreur lors de l\'enregistrement des paramètres';
        this.toastService.error(msg, 'Erreur');
      }
    });
  }

  // ==========================================
  // WHATSAPP DIRECT (OPTION 1 GRATUITE) METHODS
  // ==========================================
  getPreviewWhatsAppMessage(): string {
    let raw = '';
    if (this.simulatedTemplateType === 'RESERVATION') {
      raw = this.settings.whatsappTemplateReservation || '';
    } else if (this.simulatedTemplateType === 'RETURN') {
      raw = this.settings.whatsappTemplateReturn || '';
    } else if (this.simulatedTemplateType === 'FINE') {
      raw = this.settings.whatsappTemplateFine || '';
    }

    const agencyName = this.settings.name || 'Atlas Rent-a-Car';
    const agencyCity = this.settings.city || 'Casablanca';

    return raw
      .replace(/\{agencyName\}/g, agencyName)
      .replace(/\{agencyCity\}/g, agencyCity)
      .replace(/\{clientName\}/g, this.testClientName || 'Client')
      .replace(/\{reservationNumber\}/g, this.testReservationNumber || 'LOC-2026-0042')
      .replace(/\{vehicleName\}/g, this.testVehicle || 'Dacia Logan')
      .replace(/\{startDate\}/g, '12/09/2026 10:00')
      .replace(/\{endDate\}/g, '16/09/2026 18:00')
      .replace(/\{totalAmount\}/g, this.testTotalAmount ? `${this.testTotalAmount} MAD` : '1 800 MAD')
      .replace(/\{ticketNumber\}/g, 'PV-2026-88901')
      .replace(/\{violationDate\}/g, '10/09/2026')
      .replace(/\{fineAmount\}/g, '300 MAD');
  }

  getDirectWhatsAppLink(): string {
    let cleanPhone = (this.testPhone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '212' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('212') && cleanPhone.length === 9) {
      cleanPhone = '212' + cleanPhone;
    }

    const message = this.getPreviewWhatsAppMessage();
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }

  testSendWhatsApp(): void {
    const link = this.getDirectWhatsAppLink();
    window.open(link, '_blank');
    this.toastService.info('Lien WhatsApp officiel ouvert avec le message pré-rempli !', 'WhatsApp Direct 100% Gratuit');
  }
}
