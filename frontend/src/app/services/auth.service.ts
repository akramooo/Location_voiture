import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, { username, password }).pipe(
      tap((res) => {
        if (res && res.token) {
          localStorage.setItem('jwt_token', res.token);
          const userProfile = {
            fullName: res.fullName || (res.role === 'SUPER_ADMIN' ? 'Super Admin Master' : 'Amine El Amrani (Gérant)'),
            role: res.role || 'ADMIN_AGENCE',
            tenantName: res.tenantName || 'Atlas Rent-a-Car Casablanca'
          };
          localStorage.setItem('user_profile', JSON.stringify(userProfile));
        }
      })
    );
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('jwt_token');
  }

  getUser() {
    const userStr = localStorage.getItem('user_profile');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {}
    }
    return {
      fullName: 'Jean-Marc Dupont (Gérant)',
      role: 'ADMIN_AGENCE',
      tenantName: 'Paris Étoile Car Prestige'
    };
  }

  isSuperAdmin(): boolean {
    const user = this.getUser();
    return user && user.role === 'SUPER_ADMIN';
  }

  isImpersonated(): boolean {
    const user = this.getUser();
    return !!user && !!user.isImpersonated;
  }

  exitImpersonation(): void {
    // Reset back to Super Admin
    localStorage.setItem('user_profile', JSON.stringify({
      fullName: 'Super Admin (Master HQ )',
      role: 'SUPER_ADMIN',
      tenantName: 'RentFlow  Master SaaS'
    }));
    this.router.navigate(['/super-admin']);
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_profile');
    this.router.navigate(['/login']);
  }
}
