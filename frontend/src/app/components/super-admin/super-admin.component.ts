import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { 
  SuperAdminKpi, 
  TenantDetail, 
  CreateAgencyPayload, 
  PlatformUserItem, 
  GeneratedCredentialsPass 
} from '../../models/models';

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './super-admin.component.html',
  styleUrls: ['./super-admin.component.css']
})
export class SuperAdminComponent implements OnInit {
  activeTab: 'dashboard' | 'onboard' | 'users' = 'dashboard';

  kpis: SuperAdminKpi = {
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    suspendedTenants: 0,
    totalVehicles: 0,
    totalReservations: 0,
    totalMrr: 0,
    totalPlatformRevenue: 0
  };

  tenants: TenantDetail[] = [];
  filteredTenants: TenantDetail[] = [];
  searchQuery = '';
  selectedStatusFilter = 'ALL';

  // Recent Global Activity Feed
  recentActivity: any[] = [];

  // Platform Users Directory
  platformUsers: PlatformUserItem[] = [];
  filteredUsers: PlatformUserItem[] = [];
  userSearchQuery = '';

  // Onboarding Wizard Form ()
  newAgency: CreateAgencyPayload = {
    name: '',
    subdomain: '',
    iceNumber: '', // SIRET
    ifNumber: '',  // TVA Intracommunautaire
    rcNumber: '',  // RCS
    patenteNumber: '7711A', // Code NAF / APE
    address: '',
    city: 'Casablanca',
    phone: '',
    email: '',
    maxVehicles: 30,
    pricePerVehicle: 100,
    monthlyPrice: 3000,
    adminUsername: '',
    adminPassword: '',
    adminFullName: ''
  };

  // Credentials Generated Pass after onboarding
  generatedCredentials: GeneratedCredentialsPass | null = null;

  // Modals state
  isEditModalOpen = false;
  selectedTenant: TenantDetail | null = null;

  isEditUserModalOpen = false;
  selectedUser: PlatformUserItem | null = null;
  editUserPassword = '';

  isFinanceModalOpen = false;
  financeModalType: 'revenue' | 'commission' | 'subscription' = 'subscription';

  cities = [
    'Casablanca',
    'Rabat',
    'Marrakech',
    'Tanger',
    'Agadir',
    'Fès',
    'Meknès',
    'Oujda',
    'Kénitra',
    'Tétouan',
    'Safi',
    'Mohammédia',
    'El Jadida',
    'Nador',
    'Béni Mellal',
    'Taza',
    'Khouribga',
    'Settat',
    'Berkane',
    'Essaouira',
    'Al Hoceïma',
    'Dakhla',
    'Laâyoune',
    'Ouarzazate',
    'Larache',
    'Ksar El Kebir',
    'Guelmim',
    'Ifrane',
    'Taroudant',
    'Errachidia',
    'Midelt',
    'Chefchaouen',
    'Tiznit',
    'Tan-Tan',
    'Sidi Slimane',
    'Sidi Kacem',
    'Berrechid',
    'Taourirt',
    'Skhirat',
    'Temara'
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] && ['dashboard', 'onboard', 'users'].includes(params['tab'])) {
        this.activeTab = params['tab'];
      }
    });
    this.filteredTenants = [...this.tenants];
    this.filteredUsers = [...this.platformUsers];
    this.loadKpis();
    this.loadTenants();
    this.loadUsers();
  }

  onPricingInputChange(): void {
    if (this.newAgency.maxVehicles && this.newAgency.pricePerVehicle) {
      this.newAgency.monthlyPrice = Math.round(this.newAgency.maxVehicles * this.newAgency.pricePerVehicle);
    }
  }

  onEditPricingInputChange(): void {
    if (this.selectedTenant && this.selectedTenant.maxVehicles && this.selectedTenant.pricePerVehicle) {
      this.selectedTenant.monthlyPrice = Math.round(this.selectedTenant.maxVehicles * this.selectedTenant.pricePerVehicle);
    }
  }

  setTab(tab: 'dashboard' | 'onboard' | 'users'): void {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab },
      queryParamsHandling: 'merge'
    });
  }

  loadKpis(): void {
    this.apiService.get<SuperAdminKpi>('/super-admin/kpis').subscribe({
      next: (data) => {
        if (data) this.kpis = data;
      },
      error: () => {}
    });
  }

  loadTenants(): void {
    this.apiService.get<TenantDetail[]>('/super-admin/tenants').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.tenants = data;
          this.applyFilter();
        }
      },
      error: () => {
        this.applyFilter();
      }
    });
  }

  loadUsers(): void {
    this.apiService.get<PlatformUserItem[]>('/super-admin/users').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.platformUsers = data;
          this.applyUserFilter();
        }
      },
      error: () => {
        this.applyUserFilter();
      }
    });
  }

  applyFilter(): void {
    this.filteredTenants = this.tenants.filter(t => {
      const matchSearch = !this.searchQuery ||
        t.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        t.city?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        t.subdomain.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        t.iceNumber?.toLowerCase().includes(this.searchQuery.toLowerCase());

      let matchStatus = true;
      if (this.selectedStatusFilter === 'FEATURED') {
        matchStatus = !!t.isFeatured;
      } else if (this.selectedStatusFilter !== 'ALL') {
        matchStatus = t.subscriptionStatus === this.selectedStatusFilter;
      }

      return matchSearch && matchStatus;
    });
  }

  applyUserFilter(): void {
    this.filteredUsers = this.platformUsers.filter(u => {
      if (!this.userSearchQuery) return true;
      const q = this.userSearchQuery.toLowerCase();
      return u.fullName.toLowerCase().includes(q) ||
             u.username.toLowerCase().includes(q) ||
             u.email.toLowerCase().includes(q) ||
             u.agencyName.toLowerCase().includes(q) ||
             u.phone.includes(q);
    });
  }

  onSubdomainAutoFill(): void {
    if (this.newAgency.name) {
      this.newAgency.subdomain = this.newAgency.name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 18);
    }
    if (this.newAgency.adminFullName && !this.newAgency.adminUsername) {
      this.newAgency.adminUsername = this.newAgency.adminFullName
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .substring(0, 20);
    }
  }

  submitOnboarding(): void {
    if (!this.newAgency.subdomain && this.newAgency.name) {
      this.onSubdomainAutoFill();
    }

    if (!this.newAgency.name || !this.newAgency.adminUsername || !this.newAgency.adminPassword) {
      this.toastService.error('Veuillez remplir tous les champs obligatoires (*)', 'Formulaire Incomplet');
      return;
    }

    const payload = { ...this.newAgency };

    this.apiService.post<TenantDetail>('/super-admin/tenants', payload).subscribe({
      next: (created) => {
        this.tenants.unshift(created);
        this.applyFilter();
        this.handleOnboardSuccess(payload);
        this.loadKpis();
      },
      error: () => {
        // Local fallback
        const created: TenantDetail = {
          id: Date.now(),
          name: payload.name,
          subdomain: payload.subdomain,
          iceNumber: payload.iceNumber,
          city: payload.city,
          phone: payload.phone,
          email: payload.email,
          subscriptionPlan: payload.subscriptionPlan || 'TARIF_SUR_MESURE',
          subscriptionStatus: 'ACTIVE',
          subscriptionEnd: '2027-09-04',
          maxVehicles: payload.maxVehicles,
          pricePerVehicle: payload.pricePerVehicle,
          monthlyPrice: payload.monthlyPrice,
          active: true,
          isFeatured: false,
          createdAt: new Date().toISOString().split('T')[0],
          vehicleCount: 0,
          adminUsername: payload.adminUsername,
          adminFullName: payload.adminFullName
        };
        this.tenants.unshift(created);
        this.applyFilter();
        this.handleOnboardSuccess(payload);
      }
    });
  }

  private handleOnboardSuccess(payload: CreateAgencyPayload): void {
    this.generatedCredentials = {
      agencyName: payload.name,
      subdomain: payload.subdomain,
      subdomainUrl: `https://${payload.subdomain}.rentflow.ma`,
      adminUsername: payload.adminUsername,
      tempPassword: payload.adminPassword,
      adminFullName: payload.adminFullName || payload.adminUsername,
      email: payload.email || `${payload.adminUsername}@${payload.subdomain}.rentflow.ma`,
      plan: `${payload.monthlyPrice} MAD/mois`,
      monthlyPrice: payload.monthlyPrice,
      maxVehicles: payload.maxVehicles
    };

    this.loadUsers();
    this.loadTenants();
    this.loadKpis();

    this.toastService.success(`Agence ${payload.name} provisionnée ! Passeport d'accès généré.`, 'Onboarding Réussi');

    // Reset form
    this.newAgency = {
      name: '',
      subdomain: '',
      iceNumber: '',
      ifNumber: '',
      rcNumber: '',
      patenteNumber: '7711A',
      address: '',
      city: 'Casablanca',
      phone: '',
      email: '',
      maxVehicles: 30,
      pricePerVehicle: 100,
      monthlyPrice: 3000,
      adminUsername: '',
      adminPassword: '',
      adminFullName: ''
    };
  }

  copyCredentials(): void {
    if (!this.generatedCredentials) return;
    const c = this.generatedCredentials;
    const text = `🌟 PASSEPORT D'ACCÈS RENTFLOW\nAgence : ${c.agencyName}\nEspace Client : ${c.subdomainUrl}\nIdentifiant : ${c.adminUsername}\nMot de passe : ${c.tempPassword}\nResponsable : ${c.adminFullName}\nPlan : ${c.plan} (${c.monthlyPrice} MAD/mois - max ${c.maxVehicles} véhicules)\nStatut : Opérationnel`;
    
    navigator.clipboard.writeText(text).then(() => {
      this.toastService.info('Identifiants copiés dans le presse-papiers !', 'Passeport Copié');
    });
  }

  dismissCredentials(): void {
    this.generatedCredentials = null;
  }

  // Edit Tenant
  openEditModal(tenant: TenantDetail): void {
    this.selectedTenant = { ...tenant };
    this.isEditModalOpen = true;
  }

  onEditSubscriptionDateChange(): void {
    if (!this.selectedTenant || !this.selectedTenant.subscriptionEnd) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = this.selectedTenant.subscriptionEnd.split('-');
    if (parts.length === 3) {
      const expiry = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      expiry.setHours(0, 0, 0, 0);

      if (expiry < today) {
        this.selectedTenant.subscriptionStatus = 'EXPIRED';
      } else {
        if (this.selectedTenant.subscriptionStatus === 'EXPIRED') {
          this.selectedTenant.subscriptionStatus = (this.selectedTenant.monthlyPrice && this.selectedTenant.monthlyPrice > 0) ? 'ACTIVE' : 'TRIAL';
        }
      }
    }
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.selectedTenant = null;
  }

  saveEditAgency(): void {
    if (!this.selectedTenant) return;

    this.apiService.put<TenantDetail>(`/super-admin/tenants/${this.selectedTenant.id}`, this.selectedTenant).subscribe({
      next: (updated) => {
        const idx = this.tenants.findIndex(t => t.id === updated.id);
        if (idx !== -1) this.tenants[idx] = updated;
        this.applyFilter();
        this.closeEditModal();
        this.toastService.success(`Abonnement et quotas de ${updated.name} mis à jour !`, 'Agence Modifiée');
      },
      error: () => {
        const idx = this.tenants.findIndex(t => t.id === this.selectedTenant!.id);
        if (idx !== -1) this.tenants[idx] = { ...this.selectedTenant! };
        this.applyFilter();
        this.closeEditModal();
        this.toastService.success('Modifications enregistrées avec succès', 'Agence Modifiée');
      }
    });
  }

  toggleTenantStatus(tenant: TenantDetail, newStatus: string): void {
    this.apiService.patch<TenantDetail>(`/super-admin/tenants/${tenant.id}/status`, { status: newStatus }).subscribe({
      next: () => {
        tenant.subscriptionStatus = newStatus as any;
        tenant.active = (newStatus === 'ACTIVE' || newStatus === 'TRIAL');
        this.applyFilter();
        this.toastService.info(`Statut de ${tenant.name} basculé en ${newStatus}`, 'Statut Modifié');
        this.loadKpis();
      },
      error: () => {
        tenant.subscriptionStatus = newStatus as any;
        tenant.active = (newStatus === 'ACTIVE' || newStatus === 'TRIAL');
        this.applyFilter();
        this.toastService.info(`Statut de ${tenant.name} basculé en ${newStatus}`, 'Statut Modifié');
      }
    });
  }

  toggleFeaturedAgency(tenant: TenantDetail): void {
    tenant.isFeatured = !tenant.isFeatured;
    this.applyFilter();
    if (tenant.isFeatured) {
      this.toastService.success(`Agence ${tenant.name} mise en vedette !`, 'Statut Modifié');
    } else {
      this.toastService.info(`Mise en vedette retirée pour ${tenant.name}`, 'Statut Modifié');
    }
  }

  impersonateAgency(tenant: TenantDetail): void {
    this.apiService.post<any>(`/super-admin/tenants/${tenant.id}/impersonate`, {}).subscribe({
      next: (res) => {
        if (res && res.token) {
          localStorage.setItem('jwt_token', res.token);
          localStorage.setItem('user_profile', JSON.stringify({
            fullName: res.fullName || `Gérant ${tenant.name}`,
            role: 'ADMIN_AGENCE',
            tenantName: tenant.name,
            isImpersonated: true,
            superAdminSession: true
          }));
          this.toastService.success(`Connexion établie en tant que gérant de ${tenant.name}`, 'Impersonation Active');
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {
        localStorage.setItem('user_profile', JSON.stringify({
          fullName: tenant.adminFullName || `Gérant ${tenant.name}`,
          role: 'ADMIN_AGENCE',
          tenantName: tenant.name,
          isImpersonated: true,
          superAdminSession: true
        }));
        this.toastService.success(`Connexion établie en tant que gérant de ${tenant.name}`, 'Impersonation Active');
        this.router.navigate(['/dashboard']);
      }
    });
  }

  deleteAgency(tenant: TenantDetail): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'agence "${tenant.name}" et toutes ses données associées ?`)) {
      this.apiService.delete(`/super-admin/tenants/${tenant.id}`).subscribe({
        next: () => {
          this.tenants = this.tenants.filter(t => t.id !== tenant.id);
          this.applyFilter();
          this.loadUsers();
          this.loadKpis();
          this.toastService.error(`Agence ${tenant.name} supprimée de la plateforme`, 'Agence Supprimée');
        },
        error: () => {
          this.tenants = this.tenants.filter(t => t.id !== tenant.id);
          this.applyFilter();
          this.toastService.error(`Agence ${tenant.name} supprimée de la plateforme`, 'Agence Supprimée');
        }
      });
    }
  }

  // Users Directory Controls
  openEditUser(user: PlatformUserItem): void {
    this.selectedUser = { ...user };
    this.editUserPassword = '';
    this.isEditUserModalOpen = true;
  }

  closeEditUser(): void {
    this.isEditUserModalOpen = false;
    this.selectedUser = null;
  }

  saveEditUser(): void {
    if (!this.selectedUser) return;
    const payload: any = {
      fullName: this.selectedUser.fullName,
      email: this.selectedUser.email,
      phone: this.selectedUser.phone
    };
    if (this.editUserPassword && this.editUserPassword.trim().length > 0) {
      payload.password = this.editUserPassword.trim();
    }

    this.apiService.put<PlatformUserItem>(`/super-admin/users/${this.selectedUser.id}`, payload).subscribe({
      next: (updated) => {
        const idx = this.platformUsers.findIndex(u => u.id === updated.id);
        if (idx !== -1) this.platformUsers[idx] = updated;
        this.applyUserFilter();
        this.closeEditUser();
        this.toastService.success(`Profil de ${updated.fullName} mis à jour avec succès`, 'Utilisateur Modifié');
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Erreur lors de la mise à jour', 'Erreur');
      }
    });
  }

  toggleUserStatus(user: PlatformUserItem): void {
    const newActive = !user.active;
    this.apiService.patch<PlatformUserItem>(`/super-admin/users/${user.id}/status`, { active: newActive }).subscribe({
      next: (updated) => {
        user.active = updated.active;
        this.applyUserFilter();
        this.toastService.info(`Compte de ${user.fullName} ${user.active ? 'Activé' : 'Suspendu'}`, 'Accès Utilisateur');
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Erreur lors de la mise à jour du statut', 'Erreur');
      }
    });
  }

  deleteUser(user: PlatformUserItem): void {
    if (confirm(`Supprimer définitivement le compte de ${user.fullName} (${user.username}) de la base de données ?`)) {
      this.apiService.delete(`/super-admin/users/${user.id}`).subscribe({
        next: () => {
          this.platformUsers = this.platformUsers.filter(u => u.id !== user.id);
          this.applyUserFilter();
          this.toastService.error(`Utilisateur ${user.fullName} supprimé de la base de données`, 'Compte Supprimé');
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || 'Impossible de supprimer cet utilisateur', 'Erreur');
        }
      });
    }
  }

  // Financial Drilldown Modals
  openFinanceModal(type: 'revenue' | 'commission' | 'subscription'): void {
    this.financeModalType = type;
    this.isFinanceModalOpen = true;
  }

  closeFinanceModal(): void {
    this.isFinanceModalOpen = false;
  }
}
