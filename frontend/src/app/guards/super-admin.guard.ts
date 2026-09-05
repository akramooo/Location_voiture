import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const superAdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const user = authService.getUser();
  if (user && user.role === 'SUPER_ADMIN') {
    return true;
  }

  // Si pas super admin, rediriger vers dashboard agence
  router.navigate(['/dashboard']);
  return false;
};
