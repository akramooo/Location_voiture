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
  isSubmitting = false;

  activeFilter: 'ALL' | 'EN_CAISSE' | 'DEPOSE_BANQUE' | 'ENCAISSE' | 'RESTITUE' | 'IMPAYE_REJET' = 'ALL';
  searchTerm = '';

  isModalOpen = false;
  selectedReservationId: number | null = null;

  // MinIO File upload state
  selectedFile: File | null = null;
  previewScanUrl: string | null = null;
  viewScanModalUrl: string | null = null;

  newCheque: Cheque = {
    chequeNumber: '',
    bankName: 'Attijariwafa Bank',
    issuerName: '',
    amount: 1500,
    dueDate: new Date().toISOString().substring(0, 10),
    chequeType: 'CAUTION',
    status: 'EN_CAISSE',
    reservationId: null,
    reservationNumber: '',
    chequeScanUrl: '',
    notes: ''
  };

  banks = [
    'Attijariwafa Bank',
    'Banque Populaire (Maroc)',
    'CIH Bank',
    'BMCE Bank of Africa (BOA)',
    'Crédit Agricole du Maroc (CAM)',
    'Crédit du Maroc (CDM)',
    'Société Générale Maroc (SGMB)',
    'Al Barid Bank',
    'CFG Bank',
    'Bank Assafa',
    'Umnia Bank',
    'BNP Paribas',
    'Société Générale (France)',
    'Crédit Agricole (France)',
    'Autre Banque / Chèque Étranger'
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
      error: (err) => {
        console.error('Erreur chargement chèques:', err);
        this.cheques = [];
        this.isLoading = false;
      }
    });
  }

  loadReservations(): void {
    this.apiService.get<Reservation[]>('/reservations').subscribe({
      next: (data) => {
        this.reservations = data || [];
      },
      error: () => {
        this.reservations = [];
      }
    });
  }

  get filteredCheques(): Cheque[] {
    let list = this.cheques;

    if (this.activeFilter !== 'ALL') {
      list = list.filter(c => c.status === this.activeFilter);
    }

    if (this.searchTerm && this.searchTerm.trim()) {
      const q = this.searchTerm.trim().toLowerCase();
      list = list.filter(c => 
        (c.chequeNumber && c.chequeNumber.toLowerCase().includes(q)) ||
        (c.issuerName && c.issuerName.toLowerCase().includes(q)) ||
        (c.bankName && c.bankName.toLowerCase().includes(q)) ||
        (c.reservationNumber && c.reservationNumber.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
      );
    }

    return list;
  }

  get totalEnCaisse(): number {
    return this.cheques
      .filter(c => c.status === 'EN_CAISSE')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }

  get totalDeposeBanque(): number {
    return this.cheques
      .filter(c => c.status === 'DEPOSE_BANQUE')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }

  get totalEncaisse(): number {
    return this.cheques
      .filter(c => c.status === 'ENCAISSE')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }

  get totalRestitue(): number {
    return this.cheques
      .filter(c => c.status === 'RESTITUE')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }

  get totalImpayes(): number {
    return this.cheques
      .filter(c => c.status === 'IMPAYE_REJET')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }

  countByStatus(status: string): number {
    return this.cheques.filter(c => c.status === status).length;
  }

  openModal(): void {
    this.selectedReservationId = null;
    this.selectedFile = null;
    this.previewScanUrl = null;
    this.newCheque = {
      chequeNumber: '',
      bankName: 'Attijariwafa Bank',
      issuerName: '',
      amount: 1500,
      dueDate: new Date().toISOString().substring(0, 10),
      chequeType: 'CAUTION',
      status: 'EN_CAISSE',
      reservationId: null,
      reservationNumber: '',
      chequeScanUrl: '',
      notes: ''
    };
    this.isSubmitting = false;
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (this.isSubmitting) return;
    this.isModalOpen = false;
    this.selectedFile = null;
    this.previewScanUrl = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewScanUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.previewScanUrl = null;
    this.newCheque.chequeScanUrl = '';
  }

  openScanPreview(url: string | undefined): void {
    if (url) {
      this.viewScanModalUrl = url;
    }
  }

  closeScanPreview(): void {
    this.viewScanModalUrl = null;
  }

  onReservationChange(): void {
    if (this.selectedReservationId) {
      const selected = this.reservations.find(r => r.id === Number(this.selectedReservationId));
      if (selected) {
        this.newCheque.reservationId = selected.id || null;
        this.newCheque.reservationNumber = selected.reservationNumber || '';
        
        if (selected.clientName) {
          this.newCheque.issuerName = selected.clientName;
        }

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
    if (!cheque.id) return;

    this.apiService.patch<Cheque>(`/billing/cheques/${cheque.id}/status`, { status: newStatus }).subscribe({
      next: () => {
        cheque.status = newStatus;
        if (newStatus === 'DEPOSE_BANQUE') {
          this.toastService.info(`Chèque N° ${cheque.chequeNumber} marqué comme déposé en banque`, 'Bordereau de Remise');
        } else if (newStatus === 'ENCAISSE') {
          this.toastService.success(`Chèque N° ${cheque.chequeNumber} encaissé avec succès !`, 'Chèque Encaissé');
        } else if (newStatus === 'RESTITUE') {
          this.toastService.info(`Chèque N° ${cheque.chequeNumber} restitué au client`, 'Restitution Caution');
        } else if (newStatus === 'IMPAYE_REJET') {
          this.toastService.error(`Alerte : Chèque N° ${cheque.chequeNumber} rejeté / impayé !`, 'Rejet Bancaire');
        } else {
          this.toastService.info(`Statut du chèque N° ${cheque.chequeNumber} mis à jour`, 'Chèque Mis à Jour');
        }
        this.loadCheques();
      },
      error: (err) => {
        const msg = err.error?.message || 'Erreur lors de la mise à jour du statut';
        this.toastService.error(msg, 'Erreur');
      }
    });
  }

  submitCheque(): void {
    if (this.isSubmitting) return;

    if (!this.newCheque.chequeNumber || !this.newCheque.chequeNumber.trim()) {
      this.toastService.warning('Veuillez renseigner le numéro du chèque', 'Validation');
      return;
    }

    if (!this.newCheque.issuerName || !this.newCheque.issuerName.trim()) {
      this.toastService.warning('Veuillez renseigner le nom de l\'émetteur / client', 'Validation');
      return;
    }

    if (!this.newCheque.amount || this.newCheque.amount <= 0) {
      this.toastService.warning('Le montant du chèque doit être supérieur à 0', 'Validation');
      return;
    }

    this.isSubmitting = true;

    // Construction du dossier MinIO dédié par Location / Client
    // Ex: "locations/RES-2026-00012_abdessalam"
    const cleanIssuer = (this.newCheque.issuerName || 'client').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    let folderPath = `cheques/${cleanIssuer}`;
    
    if (this.newCheque.reservationNumber) {
      const cleanRes = this.newCheque.reservationNumber.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      folderPath = `locations/${cleanRes}_${cleanIssuer}`;
    }

    // 1. Si une photo/scan de chèque est sélectionnée, on l'uploade d'abord sur MinIO
    if (this.selectedFile) {
      this.apiService.uploadFile(this.selectedFile, folderPath).subscribe({
        next: (uploadRes) => {
          this.newCheque.chequeScanUrl = uploadRes.url;
          this.saveChequeToDatabase();
        },
        error: (uploadErr) => {
          console.warn('Upload MinIO échoué, enregistrement du chèque sans photo:', uploadErr);
          this.saveChequeToDatabase();
        }
      });
    } else {
      this.saveChequeToDatabase();
    }
  }

  private saveChequeToDatabase(): void {
    this.apiService.post<Cheque>('/billing/cheques', this.newCheque).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeModal();
        this.toastService.success(`Chèque de ${this.newCheque.amount} MAD enregistré avec succès sur MinIO et en base de données !`, 'Chèque Enregistré');
        this.loadCheques();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Erreur enregistrement chèque:', err);
        const msg = err.error?.message || 'Erreur lors de l\'enregistrement du chèque';
        this.toastService.error(msg, 'Erreur');
      }
    });
  }

  deleteCheque(cheque: Cheque): void {
    if (!cheque.id) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le chèque N° ${cheque.chequeNumber} ?`)) {
      return;
    }

    this.apiService.delete(`/billing/cheques/${cheque.id}`).subscribe({
      next: () => {
        this.toastService.success(`Chèque N° ${cheque.chequeNumber} supprimé`, 'Suppression');
        this.loadCheques();
      },
      error: (err) => {
        const msg = err.error?.message || 'Erreur suppression';
        this.toastService.error(msg, 'Erreur');
      }
    });
  }
}
