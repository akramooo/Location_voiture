import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Invoice, CashRegisterShift } from '../../models/models';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css']
})
export class BillingComponent implements OnInit {
  invoices: Invoice[] = [];
  cashShifts: CashRegisterShift[] = [];
  activeTab: 'cash-shifts' | 'invoices' = 'cash-shifts';
  isModalOpen = false;
  isSubmitting = false;

  cashRegister: CashRegisterShift = {
    startingCash: 1000,
    actualCashInHand: 1000,
    totalCashReceived: 0,
    totalTpeReceived: 0,
    totalCheckReceived: 0,
    totalTransferReceived: 0,
    notes: 'Clôture de shift journalier'
  };

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
    this.loadCashShifts();
  }

  loadInvoices(): void {
    this.apiService.get<Invoice[]>('/billing/invoices').subscribe({
      next: (data) => this.invoices = data || [],
      error: (err) => console.error('Erreur factures:', err)
    });
  }

  loadCashShifts(): void {
    this.apiService.get<CashRegisterShift[]>('/billing/cash-register/shifts').subscribe({
      next: (data) => this.cashShifts = data || [],
      error: (err) => console.error('Erreur shifts de caisse:', err)
    });
  }

  get expectedCashInHand(): number {
    const start = Number(this.cashRegister.startingCash) || 0;
    const received = Number(this.cashRegister.totalCashReceived) || 0;
    return Math.round((start + received) * 100) / 100;
  }

  get cashDifference(): number {
    const actual = Number(this.cashRegister.actualCashInHand) || 0;
    return Math.round((actual - this.expectedCashInHand) * 100) / 100;
  }

  get totalInvoicedTtc(): number {
    return this.invoices.reduce((acc, inv) => acc + (inv.totalTTC || 0), 0);
  }

  get totalCashCollected(): number {
    return this.cashShifts.reduce((acc, s) => acc + (s.totalCashReceived || 0), 0);
  }

  get totalTpeCollected(): number {
    return this.cashShifts.reduce((acc, s) => acc + (s.totalTpeReceived || 0), 0);
  }

  get latestShiftDifference(): number {
    if (this.cashShifts.length === 0) return 0;
    return this.cashShifts[0].cashDifference || 0;
  }

  openModal(): void {
    this.cashRegister = {
      startingCash: 1000,
      actualCashInHand: 1000,
      totalCashReceived: 0,
      totalTpeReceived: 0,
      totalCheckReceived: 0,
      totalTransferReceived: 0,
      notes: 'Clôture de shift journalier'
    };
    this.isSubmitting = false;
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (this.isSubmitting) return;
    this.isModalOpen = false;
  }

  printInvoice(inv: Invoice): void {
    this.toastService.info(`Génération du PDF conforme DGI / TVA pour la facture N° ${inv.invoiceNumber}`, 'Impression DGI');
  }

  printTicketZ(shift: CashRegisterShift): void {
    this.toastService.info(
      `Impression du Ticket Z de Caisse #${shift.id || ''} (Espèces: ${shift.totalCashReceived} MAD, TPE: ${shift.totalTpeReceived} MAD, Écart: ${shift.cashDifference} MAD)`,
      'Ticket Z de Caisse'
    );
  }

  submitCashRegister(): void {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const payload = {
      ...this.cashRegister,
      startingCash: Number(this.cashRegister.startingCash) || 0,
      actualCashInHand: Number(this.cashRegister.actualCashInHand) || 0,
      totalCashReceived: Number(this.cashRegister.totalCashReceived) || 0,
      totalTpeReceived: Number(this.cashRegister.totalTpeReceived) || 0,
      totalCheckReceived: Number(this.cashRegister.totalCheckReceived) || 0,
      totalTransferReceived: Number(this.cashRegister.totalTransferReceived) || 0
    };

    this.apiService.post<CashRegisterShift>('/billing/cash-register/close', payload).subscribe({
      next: (newShift) => {
        this.isSubmitting = false;
        this.closeModal();
        this.toastService.success('Caisse clôturée avec succès et enregistrée au journal !', 'Shift Clôturé');
        this.loadCashShifts();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Erreur clôture caisse:', err);
        const msg = err.error?.message || 'Erreur lors de l\'enregistrement de la clôture de caisse';
        this.toastService.error(msg, 'Erreur');
      }
    });
  }
}
