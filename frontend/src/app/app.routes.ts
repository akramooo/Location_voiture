import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { FleetComponent } from './components/fleet/fleet.component';
import { BookingComponent } from './components/booking/booking.component';
import { CrmComponent } from './components/crm/crm.component';
import { InspectionComponent } from './components/inspection/inspection.component';
import { BillingComponent } from './components/billing/billing.component';
import { RadarsComponent } from './components/radars/radars.component';
import { ChequeComponent } from './components/cheques/cheque.component';
import { OcrScannerComponent } from './components/ocr-scanner/ocr-scanner.component';
import { ExpenseComponent } from './components/expenses/expense.component';
import { PricingComponent } from './components/pricing/pricing.component';
import { SuperAdminComponent } from './components/super-admin/super-admin.component';
import { authGuard } from './guards/auth.guard';
import { superAdminGuard } from './guards/super-admin.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'home', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'super-admin', component: SuperAdminComponent, canActivate: [superAdminGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'fleet', component: FleetComponent, canActivate: [authGuard] },
  { path: 'booking', component: BookingComponent, canActivate: [authGuard] },
  { path: 'crm', component: CrmComponent, canActivate: [authGuard] },
  { path: 'inspection', component: InspectionComponent, canActivate: [authGuard] },
  { path: 'billing', component: BillingComponent, canActivate: [authGuard] },
  { path: 'cheques', component: ChequeComponent, canActivate: [authGuard] },
  { path: 'expenses', component: ExpenseComponent, canActivate: [authGuard] },
  { path: 'ocr', component: OcrScannerComponent, canActivate: [authGuard] },
  { path: 'radars', component: RadarsComponent, canActivate: [authGuard] },
  { path: 'pricing', component: PricingComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
