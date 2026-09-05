import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Cheque } from '../../models/models';

@Component({
  selector: 'app-cheque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cheque.component.html',
  styleUrls: ['./cheque.component.css']
})
export class ChequeComponent implements OnInit {
  cheques: Cheque[] = [
    {
      id: 1,
      chequeNumber: 'CH-889901',
      bankName: 'BNP Paribas',
      issuerName: 'Guillaume Moreau',
      amount: 1500,
      dueDate: '2026-08-30',
      chequeType: 'CAUTION',
      status: 'EN_CAISSE',
      notes: 'Chèque de caution réservation RES-2026-001'
    },
    {
      id: 2,
      chequeNumber: 'CH-443312',
      bankName: 'Société Générale',
      issuerName: 'Hexagone Transport SAS',
      amount: 3200,
      dueDate: '2026-09-15',
      chequeType: 'PAIEMENT',
      status: 'DEPOSE_BANQUE',
      notes: 'Règlement facture loc mensuelle Peugeot 3008'
    },
    {
      id: 3,
      chequeNumber: 'CH-112299',
      bankName: 'Crédit Agricole',
      issuerName: 'Antoine Delmas',
      amount: 1200,
      dueDate: '2026-08-20',
      chequeType: 'CAUTION',
      status: 'IMPAYE_REJET',
      notes: 'Chèque sans provision - Client Signalé'
    }
  ];

  isModalOpen = false;

  newCheque: Cheque = {
    chequeNumber: '',
    bankName: 'BNP Paribas',
    issuerName: '',
    amount: 1500,
    dueDate: '2026-09-01',
    chequeType: 'CAUTION',
    status: 'EN_CAISSE',
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
    'La Banque Postale'
  ];

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCheques();
  }

  loadCheques(): void {
    this.apiService.get<Cheque[]>('/billing/cheques').subscribe({
      next: (data) => {
        if (data && data.length > 0) this.cheques = data;
      },
      error: () => {}
    });
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
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
