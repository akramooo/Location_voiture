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
            id: res.userId,
            username: res.username,
            email: res.email || '',
            fullName: res.fullName || (res.role === 'SUPER_ADMIN' ? 'Super Admin Master' : 'Amine El Amrani (Gérant)'),
            phone: res.phone || '',
            role: res.role || 'ADMIN_AGENCE',
            tenantName: res.tenantName || 'Atlas Rent-a-Car Casablanca'
          };
          localStorage.setItem('user_profile', JSON.stringify(userProfile));
        }
      })
    );
  }

  getMe(): Observable<any> {
    const token = localStorage.getItem('jwt_token') || '';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    return this.http.get<any>(`${this.baseUrl}/auth/me`, { headers }).pipe(
      tap((me) => {
        if (me) {
          const current = this.getUser();
          const profile = {
            ...current,
            id: me.id,
            username: me.username,
            email: me.email,
            fullName: me.fullName,
            phone: me.phone,
            role: me.role,
            tenantName: me.tenantName || current.tenantName
          };
          localStorage.setItem('user_profile', JSON.stringify(profile));
        }
      })
    );
  }

  updateProfile(data: { fullName?: string; phone?: string; currentPassword?: string; newPassword?: string }): Observable<any> {
    const token = localStorage.getItem('jwt_token') || '';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    return this.http.put<any>(`${this.baseUrl}/auth/profile`, data, { headers }).pipe(
      tap((updated) => {
        if (updated) {
          const current = this.getUser();
          const profile = {
            ...current,
            fullName: updated.fullName || current.fullName,
            phone: updated.phone || current.phone,
            username: updated.username || current.username,
            email: updated.email || current.email
          };
          localStorage.setItem('user_profile', JSON.stringify(profile));
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
      username: 'admin',
      email: 'admin@rentflow.ma',
      fullName: 'Amine El Amrani',
      phone: '+212 6 00 00 00 00',
      role: 'ADMIN_AGENCE',
      tenantName: 'Atlas Rent-a-Car Casablanca'
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
