import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Cheque, Reservation } from '../../models/models';

@Component({
  selector: 'app-cheque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cheque.component.html',
  styleUrls: ['./cheque.component.css']
})
export class ChequeComponent implements OnInit {
  cheques: Cheque[] = [];
  reservations: Reservation[] = [];
  isLoading = false;

  isModalOpen = false;
  selectedReservationId: number | null = null;

  newCheque: Cheque = {
    chequeNumber: '',
    bankName: 'BNP Paribas',
    issuerName: '',
    amount: 1500,
    dueDate: new Date().toISOString().substring(0, 10),
    chequeType: 'CAUTION',
    status: 'EN_CAISSE',
    reservationId: null,
    reservationNumber: '',
    notes: ''
  };

  banks = [
    'BNP Paribas',
    'Société Générale',
    'Crédit Agricole',
    'Banque Populaire',
    'LCL (Le Crédit Lyonnais)',
    'Caisse d\'Épargne',
    'CIC',
    'Crédit Mutuel',
    'La Banque Postale',
    'Attijariwafa Bank',
    'Banque Populaire (Maroc)',
    'BMCE Bank of Africa',
    'CIH Bank',
    'Crédit du Maroc',
    'Société Générale Maroc'
  ];

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCheques();
    this.loadReservations();
  }

  loadCheques(): void {
    this.isLoading = true;
    this.apiService.get<Cheque[]>('/billing/cheques').subscribe({
      next: (data) => {
        this.cheques = data || [];
        this.isLoading = false;
      },
      error: () => {
        this.cheques = [];
        this.isLoading = false;
      }
    });
  }

  loadReservations(): void {
    this.apiService.get<Reservation[]>('/reservations').subscribe({
      next: (data) => {
        // Filtrer STRICTEMENT les réservations dont le mode de paiement est CHEQUE
        this.reservations = (data || []).filter(r => 
          r.paymentMethod && r.paymentMethod.toString().toUpperCase() === 'CHEQUE'
        );
      },
      error: () => {
        this.reservations = [];
      }
    });
  }

  openModal(): void {
    this.selectedReservationId = null;
    this.newCheque = {
      chequeNumber: '',
      bankName: 'BNP Paribas',
      issuerName: '',
      amount: 1500,
      dueDate: new Date().toISOString().substring(0, 10),
      chequeType: 'CAUTION',
      status: 'EN_CAISSE',
      reservationId: null,
      reservationNumber: '',
      notes: ''
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onReservationChange(): void {
    if (this.selectedReservationId) {
      const selected = this.reservations.find(r => r.id === Number(this.selectedReservationId));
      if (selected) {
        this.newCheque.reservationId = selected.id || null;
        this.newCheque.reservationNumber = selected.reservationNumber || '';
        
        // Auto-remplir l'émetteur avec le nom du client de la réservation
        if (selected.clientName) {
          this.newCheque.issuerName = selected.clientName;
        }

        // Auto-remplir le montant selon le type de chèque
        if (this.newCheque.chequeType === 'CAUTION') {
          this.newCheque.amount = selected.depositAmount || 1500;
        } else {
          this.newCheque.amount = selected.totalAmount || selected.paidAmount || 1500;
        }
      }
    } else {
      this.newCheque.reservationId = null;
      this.newCheque.reservationNumber = '';
    }
  }

  onChequeTypeChange(): void {
    if (this.selectedReservationId) {
      const selected = this.reservations.find(r => r.id === Number(this.selectedReservationId));
      if (selected) {
        if (this.newCheque.chequeType === 'CAUTION') {
          this.newCheque.amount = selected.depositAmount || 1500;
        } else {
          this.newCheque.amount = selected.totalAmount || selected.paidAmount || 1500;
        }
      }
    }
  }

  updateStatus(cheque: Cheque, newStatus: any): void {
    cheque.status = newStatus;
    if (newStatus === 'ENCAISSE') {
      this.toastService.success(`Chèque N° ${cheque.chequeNumber} encaissé avec succès !`, 'Chèque Encaissé');
    } else if (newStatus === 'RESTITUE') {
      this.toastService.info(`Chèque N° ${cheque.chequeNumber} restitué au client`, 'Restitution Caution');
    } else if (newStatus === 'IMPAYE_REJET') {
      this.toastService.error(`Alerte : Chèque N° ${cheque.chequeNumber} rejeté / impayé !`, 'Rejet Bancaire');
    } else {
      this.toastService.info(`Statut du chèque N° ${cheque.chequeNumber} mis à jour`, 'Chèque Mis à Jour');
    }
  }

  submitCheque(): void {
    const chequeToAdd = { ...this.newCheque, id: Date.now() };
    this.cheques.unshift(chequeToAdd);
    this.closeModal();
    this.toastService.success(`Chèque de ${chequeToAdd.amount} MAD enregistré en caisse !`, 'Chèque Enregistré');
  }

  getTotalEnCaisse(): number {
    return this.cheques
      .filter(c => c.status === 'EN_CAISSE')
      .reduce((sum, c) => sum + c.amount, 0);
  }
}
