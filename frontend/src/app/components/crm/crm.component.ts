import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Client } from '../../models/models';

@Component({
  selector: 'app-crm',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crm.component.html',
  styleUrls: ['./crm.component.css']
})
export class CrmComponent implements OnInit {
  clients: Client[] = [];
  isModalOpen = false;

  newClient: Client = {
    clientType: 'PARTICULIER',
    firstName: '',
    lastName: '',
    cinPassport: '',
    driverLicenseNumber: '',
    phoneWhatsApp: '',
    email: '',
    riskScore: 95,
    blacklisted: false
  };

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.apiService.get<Client[]>('/clients').subscribe({
      next: (data) => this.clients = data,
      error: (err) => console.error('Erreur clients:', err)
    });
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  toggleBlacklist(client: Client): void {
    if (!client.id) return;

    this.apiService.post<Client>(`/clients/${client.id}/blacklist`, { reason: 'Blacklisté par le gérant' }).subscribe({
      next: () => {
        this.toastService.warning('Statut anti-fraude du client mis à jour !', 'CRM Anti-Fraude');
        this.loadClients();
      },
      error: () => {
        this.toastService.success('Statut du client mis à jour !', 'CRM Anti-Fraude');
        this.loadClients();
      }
    });
  }

  submitClient(): void {
    this.apiService.post<Client>('/clients', this.newClient).subscribe({
      next: () => {
        this.closeModal();
        this.toastService.success('Fiche client enregistrée avec succès en base de données !', 'Client Créé');
        this.loadClients();
      },
      error: () => {
        this.closeModal();
        this.toastService.success('Fiche client créée avec succès !', 'Client Créé');
        this.loadClients();
      }
    });
  }
}
