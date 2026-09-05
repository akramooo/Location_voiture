import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { ToastService } from './services/toast.service';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: string;
  iconClass: 'icon-danger' | 'icon-warning' | 'icon-info';
  route: string;
  queryParams?: { [key: string]: string };
  read: boolean;
  forRole: 'ALL' | 'SUPER_ADMIN' | 'AGENCY';
}

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
  isNotificationsOpen = false;

  notifications: AppNotification[] = [
    {
      id: 'notif-1',
      title: 'Assurance à renouveler (J-5)',
      message: 'Assurance tout risque expirant le 10/09 pour Renault Clio 5 (12345-A-26).',
      time: 'Il y a 10 min',
      icon: 'fa-solid fa-shield-halved',
      iconClass: 'icon-danger',
      route: '/fleet',
      read: false,
      forRole: 'AGENCY'
    },
    {
      id: 'notif-2',
      title: 'Contrôle Technique proche',
      message: 'Visite technique requise sous 14 jours pour Golf 8 (98765-B-33).',
      time: 'Il y a 45 min',
      icon: 'fa-solid fa-wrench',
      iconClass: 'icon-warning',
      route: '/fleet',
      read: false,
      forRole: 'AGENCY'
    },
    {
      id: 'notif-3',
      title: 'Retour de location aujourd\'hui',
      message: 'Dacia Duster attendue au retour à 18:00 (Contrat #CTR-2024-89).',
      time: 'Il y a 2h',
      icon: 'fa-solid fa-calendar-check',
      iconClass: 'icon-info',
      route: '/booking',
      read: false,
      forRole: 'AGENCY'
    },
    {
      id: 'notif-4',
      title: 'Nouvelle infraction radar ANTAI',
      message: 'Excès de vitesse signalé sur l\'autoroute A7 pendant la location #CTR-2024-74.',
      time: 'Hier',
      icon: 'fa-solid fa-triangle-exclamation',
      iconClass: 'icon-danger',
      route: '/radars',
      read: true,
      forRole: 'AGENCY'
    },
    {
      id: 'notif-5',
      title: 'Nouvelle Agence Inscrite',
      message: 'L\'agence "Casablanca Drive SARL" a finalisé son inscription sur la plateforme.',
      time: 'Il y a 20 min',
      icon: 'fa-solid fa-building-circle-check',
      iconClass: 'icon-info',
      route: '/super-admin',
      queryParams: { tab: 'onboard' },
      read: false,
      forRole: 'SUPER_ADMIN'
    },
    {
      id: 'notif-6',
      title: 'Abonnement SaaS en expiration',
      message: 'La licence Pro de "Atlas Mobility Agadir" expire dans 3 jours.',
      time: 'Il y a 1h',
      icon: 'fa-solid fa-triangle-exclamation',
      iconClass: 'icon-warning',
      route: '/super-admin',
      queryParams: { tab: 'dashboard' },
      read: false,
      forRole: 'SUPER_ADMIN'
    },
    {
      id: 'notif-7',
      title: 'Sauvegarde Multi-Tenant',
      message: 'Sauvegarde automatique des bases isolées réalisée avec succès (0 anomalie).',
      time: 'Aujourd\'hui 04:00',
      icon: 'fa-solid fa-database',
      iconClass: 'icon-info',
      route: '/super-admin',
      queryParams: { tab: 'dashboard' },
      read: true,
      forRole: 'SUPER_ADMIN'
    }
  ];

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

  getNotifications(): AppNotification[] {
    const isSuper = this.isSuperAdmin() && !this.isImpersonated();
    return this.notifications.filter(n => {
      if (n.forRole === 'ALL') return true;
      if (isSuper) return n.forRole === 'SUPER_ADMIN';
      return n.forRole === 'AGENCY';
    });
  }

  get unreadNotificationsCount(): number {
    return this.getNotifications().filter(n => !n.read).length;
  }

  toggleNotifications(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isNotificationsOpen = !this.isNotificationsOpen;
  }

  closeNotifications(): void {
    this.isNotificationsOpen = false;
  }

  markAllAsRead(): void {
    const activeNotifs = this.getNotifications();
    activeNotifs.forEach(n => n.read = true);
    this.toastService.info('Toutes les notifications ont été marquées comme lues', 'Notifications');
  }

  handleNotificationClick(notif: AppNotification): void {
    notif.read = true;
    this.isNotificationsOpen = false;
    if (notif.route) {
      if (notif.queryParams) {
        this.router.navigate([notif.route], { queryParams: notif.queryParams });
      } else {
        this.router.navigateByUrl(notif.route);
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-dropdown') && !target.closest('.notif-btn-trigger')) {
      this.isNotificationsOpen = false;
    }
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
