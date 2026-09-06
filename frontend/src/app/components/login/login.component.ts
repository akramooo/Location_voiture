import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = 'superadmin';
  password = 'superadmin123';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  setRoleDemo(role: 'SUPER_ADMIN' | 'ADMIN_AGENCE'): void {
    if (role === 'SUPER_ADMIN') {
      this.username = 'superadmin';
      this.password = 'superadmin123';
    } else {
      this.username = 'admin';
      this.password = 'admin123';
    }
  }

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.toastService.error('Veuillez saisir votre identifiant et mot de passe', 'Champ requis');
      return;
    }

    this.isLoading = true;

    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        const user = this.authService.getUser();
        if (user && user.role === 'SUPER_ADMIN') {
          this.toastService.success('Connexion Super Admin établie (Contrôle Plateforme Master)', 'Espace Super Admin');
          this.router.navigate(['/super-admin']);
        } else {
          this.toastService.success('Connexion réussie ! Bienvenue sur RentFlow.', 'Bienvenue');
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        const errMsg = err?.error?.message || 'Identifiant ou mot de passe incorrect (ou serveur indisponible)';
        this.toastService.error(errMsg, 'Échec de connexion');
      }
    });
  }
}
