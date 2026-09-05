import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(
    public authService: AuthService,
    private toastService: ToastService,
    public router: Router
  ) {}

  ngOnInit(): void {}

  get user() {
    return this.authService.getUser();
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
