import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  isProfileModalOpen = false;
  isSavingProfile = false;

  profileForm = {
    username: '',
    email: '',
    fullName: '',
    phone: '',
    currentPassword: '',
    newPassword: ''
  };

  constructor(
    public authService: AuthService,
    private toastService: ToastService,
    public router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.authService.getMe().subscribe({
        next: () => {},
        error: () => {}
      });
    }
  }

  get user() {
    return this.authService.getUser();
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  openProfileModal(): void {
    const u = this.user;
    this.profileForm = {
      username: u?.username || '',
      email: u?.email || '',
      fullName: u?.fullName || '',
      phone: u?.phone || '',
      currentPassword: '',
      newPassword: ''
    };
    this.isProfileModalOpen = true;
  }

  closeProfileModal(): void {
    this.isProfileModalOpen = false;
  }

  saveProfile(): void {
    if (!this.profileForm.fullName || !this.profileForm.fullName.trim()) {
      this.toastService.warning('Le nom complet est obligatoire', 'Validation');
      return;
    }

    if (this.profileForm.newPassword) {
      if (!this.profileForm.currentPassword) {
        this.toastService.warning('Veuillez saisir votre mot de passe actuel pour définir un nouveau mot de passe', 'Sécurité');
        return;
      }
      if (this.profileForm.newPassword.length < 6) {
        this.toastService.warning('Le nouveau mot de passe doit contenir au moins 6 caractères', 'Sécurité');
        return;
      }
    }

    this.isSavingProfile = true;
    this.authService.updateProfile({
      fullName: this.profileForm.fullName,
      phone: this.profileForm.phone,
      currentPassword: this.profileForm.currentPassword || undefined,
      newPassword: this.profileForm.newPassword || undefined
    }).subscribe({
      next: (res) => {
        this.isSavingProfile = false;
        this.toastService.success('Votre profil a été mis à jour avec succès !', 'Profil Enregistré');
        this.closeProfileModal();
      },
      error: (err) => {
        this.isSavingProfile = false;
        const msg = err.error?.message || 'Erreur lors de la mise à jour du profil';
        this.toastService.error(msg, 'Erreur');
      }
    });
  }

  isInternalRoute(): boolean {
    const url = this.router.url;
    return url !== '/' && url !== '/home' && url !== '/login';
  }

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  isImpersonated(): boolean {
    return this.authService.isImpersonated();
  }

  canViewAgencyMenu(): boolean {
    // Agency menus are ONLY visible for normal agency users OR when Super Admin has impersonated an agency
    return !this.isSuperAdmin() || this.isImpersonated();
  }

  exitImpersonation(): void {
    this.authService.exitImpersonation();
    this.toastService.info('Sortie du mode impersonation. Retour au Super Admin.', 'Session Restaurée');
  }

  logout(): void {
    this.authService.logout();
    this.toastService.success('Vous avez été déconnecté avec succès', 'Session Clôturée');
  }
}
