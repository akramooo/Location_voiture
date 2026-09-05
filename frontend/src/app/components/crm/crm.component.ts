import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Client, ClientCheckResult } from '../../models/models';

@Component({
  selector: 'app-crm',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crm.component.html',
  styleUrls: ['./crm.component.css']
})
export class CrmComponent implements OnInit, OnDestroy {
  clients: Client[] = [];
  searchTerm = '';
  isModalOpen = false;
  isSubmitting = false;
  isEditMode = false;
  editingClientId: number | null = null;

  // Dynamic CIN Anti-Fraud Verification
  cinCheckResult: ClientCheckResult | null = null;
  isCheckingCin = false;
  acceptHighRiskConsent = false;
  private checkCinSubject = new Subject<{ cin?: string, ice?: string }>();
  private checkCinSub?: Subscription;

  isDeleteModalOpen = false;
  isDeleting = false;
  clientToDelete: Client | null = null;

  newClient: Client = {
    clientType: 'PARTICULIER',
    firstName: '',
    lastName: '',
    cinPassport: '',
    driverLicenseNumber: '',
    phoneWhatsApp: '',
    email: '',
    companyName: '',
    iceNumber: '',
    designatedDriverName: '',
    riskScore: 95,
    blacklisted: false
  };

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadClients();
    this.setupDynamicCinCheck();
  }

  ngOnDestroy(): void {
    if (this.checkCinSub) {
      this.checkCinSub.unsubscribe();
    }
  }

  private setupDynamicCinCheck(): void {
    this.checkCinSub = this.checkCinSubject.pipe(
      debounceTime(300),
      switchMap(query => {
        const qCin = (query.cin || '').trim();
        const qIce = (query.ice || '').trim();

        if ((!qCin || qCin.length < 3) && (!qIce || qIce.length < 3)) {
          this.cinCheckResult = null;
          this.isCheckingCin = false;
          return of(null);
        }

        this.isCheckingCin = true;
        let params = '';
        if (qCin) params += `cin=${encodeURIComponent(qCin)}`;
        if (qIce) params += `${params ? '&' : ''}ice=${encodeURIComponent(qIce)}`;

        return this.apiService.get<ClientCheckResult>(`/clients/check-cin?${params}`).pipe(
          catchError(() => {
            this.isCheckingCin = false;
            return of(null);
          })
        );
      })
    ).subscribe(result => {
      this.isCheckingCin = false;
      this.cinCheckResult = result;
      if (result && result.suggestedRiskScore !== undefined) {
        this.newClient.riskScore = result.suggestedRiskScore;
      }
    });
  }

  onCinInput(): void {
    if (this.isEditMode) return;
    this.acceptHighRiskConsent = false;
    this.checkCinSubject.next({
      cin: this.newClient.cinPassport,
      ice: this.newClient.iceNumber
    });
  }

  loadClients(): void {
    this.apiService.get<Client[]>('/clients').subscribe({
      next: (data) => this.clients = data,
      error: (err) => console.error('Erreur clients:', err)
    });
  }

  get filteredClients(): Client[] {
    if (!this.searchTerm || !this.searchTerm.trim()) {
      return this.clients;
    }
    const q = this.searchTerm.trim().toLowerCase();
    return this.clients.filter(c => {
      const name = `${c.firstName || ''} ${c.lastName || ''} ${c.companyName || ''}`.toLowerCase();
      const cin = (c.cinPassport || '').toLowerCase();
      const ice = (c.iceNumber || '').toLowerCase();
      const phone = (c.phoneWhatsApp || '').toLowerCase();
      const permis = (c.driverLicenseNumber || '').toLowerCase();
      return name.includes(q) || cin.includes(q) || ice.includes(q) || phone.includes(q) || permis.includes(q);
    });
  }

  openModal(): void {
    this.isEditMode = false;
    this.editingClientId = null;
    this.cinCheckResult = null;
    this.isCheckingCin = false;
    this.acceptHighRiskConsent = false;
    this.newClient = {
      clientType: 'PARTICULIER',
      firstName: '',
      lastName: '',
      cinPassport: '',
      driverLicenseNumber: '',
      phoneWhatsApp: '',
      email: '',
      companyName: '',
      iceNumber: '',
      designatedDriverName: '',
      riskScore: 95,
      blacklisted: false
    };
    this.isSubmitting = false;
    this.isModalOpen = true;
  }

  openEditModal(client: Client): void {
    this.isEditMode = true;
    this.editingClientId = client.id || null;
    this.cinCheckResult = null;
    this.isCheckingCin = false;
    this.acceptHighRiskConsent = true;
    this.newClient = {
      ...client,
      clientType: client.clientType || 'PARTICULIER',
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      cinPassport: client.cinPassport || '',
      driverLicenseNumber: client.driverLicenseNumber || '',
      phoneWhatsApp: client.phoneWhatsApp || '',
      email: client.email || '',
      companyName: client.companyName || '',
      iceNumber: client.iceNumber || '',
      designatedDriverName: client.designatedDriverName || '',
      riskScore: client.riskScore || 95,
      blacklisted: client.blacklisted || false
    };
    this.isSubmitting = false;
    this.isModalOpen = true;
  }

  editExistingClientFromCheck(clientId: number): void {
    const existing = this.clients.find(c => c.id === clientId);
    if (existing) {
      this.openEditModal(existing);
    }
  }

  closeModal(): void {
    if (this.isSubmitting) return;
    this.isModalOpen = false;
  }

  submitClient(): void {
    if (this.isSubmitting) {
      return; // Empêche les clics multiples simultanés
    }

    // Validation préalable
    if (this.newClient.clientType === 'PARTICULIER') {
      if (!this.newClient.firstName?.trim()) {
        this.toastService.warning('Le prénom ou nom complet est obligatoire', 'Validation');
        return;
      }
      if (!this.newClient.cinPassport?.trim()) {
        this.toastService.warning('Le numéro de CIN ou Passeport est obligatoire', 'Validation');
        return;
      }
      if (!this.newClient.phoneWhatsApp?.trim()) {
        this.toastService.warning('Le numéro de téléphone / WhatsApp est obligatoire', 'Validation');
        return;
      }
    } else {
      if (!this.newClient.companyName?.trim() && !this.newClient.firstName?.trim()) {
        this.toastService.warning('La raison sociale de l\'entreprise est obligatoire', 'Validation');
        return;
      }
      if (!this.newClient.iceNumber?.trim() && !this.newClient.cinPassport?.trim()) {
        this.toastService.warning('Le numéro ICE de l\'entreprise est obligatoire', 'Validation');
        return;
      }
    }

    if (!this.isEditMode) {
      if (this.cinCheckResult?.existsInCurrentTenant) {
        this.toastService.warning('Ce client figure déjà dans votre agence. Impossible de créer un doublon.', 'Doublon');
        return;
      }
      if (this.cinCheckResult?.isMultiBlacklisted && !this.acceptHighRiskConsent) {
        this.toastService.warning('Veuillez confirmer votre acceptation pour enregistrer ce client multi-bloqué.', 'Validation Requise');
        return;
      }
    }

    this.isSubmitting = true;

    // Normalisation
    const payload: Client = {
      ...this.newClient,
      cinPassport: this.newClient.cinPassport ? this.newClient.cinPassport.trim().toUpperCase() : undefined,
      iceNumber: this.newClient.iceNumber ? this.newClient.iceNumber.trim() : undefined,
      companyName: this.newClient.companyName ? this.newClient.companyName.trim() : undefined,
      firstName: this.newClient.firstName ? this.newClient.firstName.trim() : undefined,
      lastName: this.newClient.lastName ? this.newClient.lastName.trim() : undefined
    };

    if (this.isEditMode && this.editingClientId) {
      this.apiService.put<Client>(`/clients/${this.editingClientId}`, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.closeModal();
          this.toastService.success('Fiche client mise à jour avec succès !', 'Modification Enregistrée');
          this.loadClients();
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err.error?.message || 'Erreur lors de la modification du client';
          this.toastService.error(msg, 'Modification Impossible');
        }
      });
    } else {
      this.apiService.post<Client>('/clients', payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.closeModal();
          this.toastService.success('Fiche client enregistrée avec succès !', 'Client Créé');
          this.loadClients();
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err.error?.message || 'Erreur lors de la création du client (Vérifiez si le CIN est unique)';
          this.toastService.error(msg, 'Création Impossible');
        }
      });
    }
  }

  toggleBlacklist(client: Client): void {
    if (!client.id) return;

    const action = client.blacklisted ? 'Déblocage' : 'Blacklist';
    this.apiService.post<Client>(`/clients/${client.id}/blacklist`, { 
      reason: client.blacklisted ? 'Réactivé par le gérant' : 'Blacklisté par le gérant (Impayé / Incident)' 
    }).subscribe({
      next: () => {
        this.toastService.info(`Statut anti-fraude du client mis à jour (${action})`, 'CRM Anti-Fraude');
        this.loadClients();
      },
      error: (err) => {
        const msg = err.error?.message || 'Erreur lors de la modification du statut';
        this.toastService.error(msg, 'Erreur');
      }
    });
  }

  openDeleteModal(client: Client): void {
    this.clientToDelete = client;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) return;
    this.clientToDelete = null;
    this.isDeleteModalOpen = false;
  }

  confirmDeleteClient(): void {
    if (!this.clientToDelete?.id || this.isDeleting) return;

    this.isDeleting = true;
    this.apiService.delete(`/clients/${this.clientToDelete.id}`).subscribe({
      next: () => {
        this.isDeleting = false;
        this.closeDeleteModal();
        this.toastService.success('La fiche client a été définitivement supprimée.', 'Client Supprimé');
        this.loadClients();
      },
      error: (err) => {
        this.isDeleting = false;
        const msg = err.error?.message || 'Impossible de supprimer ce client (des contrats ou factures y sont rattachés)';
        this.toastService.error(msg, 'Suppression Impossible');
      }
    });
  }
}
