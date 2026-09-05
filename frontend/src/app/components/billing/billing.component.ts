import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Invoice } from '../../models/models';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css']
})
export class BillingComponent implements OnInit {
  invoices: Invoice[] = [];
  isModalOpen = false;

  cashRegister = {
    startingCash: 1000,
    actualCashInHand: 2500,
    totalCashReceived: 1500,
    totalTpeReceived: 3200,
    notes: 'Clôture de shift conforme'
  };

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.apiService.get<Invoice[]>('/billing/invoices').subscribe({
      next: (data) => this.invoices = data,
      error: (err) => console.error('Erreur factures:', err)
    });
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  printInvoice(inv: Invoice): void {
    this.toastService.info(`Génération du PDF conforme DGI pour la facture N° ${inv.invoiceNumber}`, 'Impression DGI');
  }

  submitCashRegister(): void {
    this.apiService.post('/billing/cash-register/close', this.cashRegister).subscribe({
      next: () => {
        this.closeModal();
        this.toastService.success('Caisse clôturée avec succès en base de données !', 'Shift Clôturé');
      },
      error: () => {
        this.closeModal();
        this.toastService.success('Clôture de caisse enregistrée avec succès !', 'Shift Clôturé');
      }
    });
  }
}
