export interface Vehicle {
  id?: number;
  tenantId?: number;
  registrationNumber: string;
  registrationType?: string;
  brand: string;
  model: string;
  finish?: string;
  year: number;
  fuelType: string;
  gearbox: string;
  currentMileage: number;
  dailyRate: number;
  status: string;
  photoUrl?: string;
}

export interface Client {
  id?: number;
  tenantId?: number;
  clientType: string;
  firstName?: string;
  lastName?: string;
  cinPassport?: string;
  driverLicenseNumber?: string;
  phoneWhatsApp?: string;
  email?: string;
  nationality?: string;
  companyName?: string;
  iceNumber?: string;
  ifNumber?: string;
  rcNumber?: string;
  designatedDriverName?: string;
  designatedDriverCin?: string;
  riskScore: number;
  blacklisted: boolean;
  blacklistReason?: string;
}

export interface Reservation {
  id?: number;
  tenantId?: number;
  vehicleId: number;
  vehicleName?: string;
  vehicleRegistration?: string;
  clientId: number;
  clientName?: string;
  reservationNumber?: string;
  startDate: string;
  endDate: string;
  pickupLocation?: string;
  returnLocation?: string;
  rateSeason?: string;
  dailyRate?: number;
  totalDays?: number;
  totalAmount?: number;
  depositAmount?: number;
  paidAmount?: number;
  paymentMethod?: string;
  status?: string;
}

export interface Inspection {
  id?: number;
  tenantId?: number;
  reservationId: number;
  vehicleId: number;
  type: string;
  mileage: number;
  fuelLevel: string;
  damageMarkersJson?: string;
  photoUrlsJson?: string;
  cautionAmount?: number;
  cautionType?: string;
  cautionStatus?: string;
  signatureBase64?: string;
  agencyStampUrl?: string;
  extraFeesAmount?: number;
  extraFeesNotes?: string;
  pdfContractUrl?: string;
}

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  clientName?: string;
  iceClient?: string;
  totalHT: number;
  tvaRate: number;
  totalTVA: number;
  totalTTC: number;
  paymentStatus: string;
  pdfInvoiceUrl?: string;
}

export interface CashRegisterShift {
  id?: number;
  startingCash: number;
  totalCashReceived: number;
  totalTpeReceived: number;
  totalCheckReceived?: number;
  totalTransferReceived?: number;
  actualCashInHand: number;
  notes?: string;
}

export interface RadarFine {
  id?: number;
  ticketNumber: string;
  vehicleName?: string;
  violationLocation?: string;
  fineAmount: number;
  clientName?: string;
  reallocated: boolean;
  status?: string;
}

export interface ExecutiveKpis {
  totalVehicles: number;
  rentedVehicles: number;
  reservedVehicles: number;
  maintenanceVehicles: number;
  availableVehicles: number;
  occupancyRate: number;
  totalRevenue: number;
  revPac: number;
  activeDepositsTotal: number;
  imminentAlertsCount: number;
  totalExpenses?: number;
  totalRadarFines?: number;
}

export interface Cheque {
  id?: number;
  chequeNumber: string;
  bankName: string;
  issuerName: string;
  amount: number;
  dueDate: string;
  chequeType: 'CAUTION' | 'PAIEMENT';
  status: 'EN_CAISSE' | 'DEPOSE_BANQUE' | 'ENCAISSE' | 'RESTITUE' | 'IMPAYE_REJET';
  notes?: string;
}

export interface VehicleExpense {
  id?: number;
  vehicleId: number;
  vehicleName?: string;
  category: 'VIDANGE' | 'PNEUMATIQUES' | 'ASSURANCE' | 'VISITE_TECHNIQUE' | 'VIGNETTE' | 'CARROSSERIE' | 'CARBURANT' | 'REPARATION';
  amount: number;
  expenseDate: string;
  providerName?: string;
  notes?: string;
}

export interface AuditLog {
  id?: number;
  agentName: string;
  action: string;
  entityName: string;
  timestamp: string;
  details?: string;
}

export interface OcrScanResult {
  docType: 'CIN' | 'PERMIS' | 'PASSEPORT' | 'CARTE_GRISE';
  cinPassport?: string;
  firstName?: string;
  lastName?: string;
  driverLicenseNumber?: string;
  expiryDate?: string;
  nationality?: string;
  rawConfidence: number;
}

/* Super Admin Platform Models */

export interface SuperAdminKpi {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalVehicles: number;
  totalReservations: number;
  totalMrr: number;
  totalPlatformRevenue: number;
}

export interface TenantDetail {
  id: number;
  name: string;
  subdomain: string;
  iceNumber?: string;
  ifNumber?: string;
  rcNumber?: string;
  patenteNumber?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  subscriptionPlan?: 'STARTER' | 'PRO' | 'ENTERPRISE' | string;
  subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  subscriptionEnd?: string;
  maxVehicles: number;
  pricePerVehicle?: number;
  monthlyPrice: number;
  active: boolean;
  isFeatured?: boolean;
  createdAt: string;
  vehicleCount: number;
  activeReservationsCount?: number;
  adminUsername?: string;
  adminFullName?: string;
}

export interface CreateAgencyPayload {
  name: string;
  subdomain: string;
  iceNumber?: string;
  ifNumber?: string;
  rcNumber?: string;
  patenteNumber?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  subscriptionPlan?: string;
  maxVehicles: number;
  pricePerVehicle?: number;
  monthlyPrice: number;
  adminUsername: string;
  adminPassword: string;
  adminFullName: string;
}

export interface UpdateAgencyPlanPayload {
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  maxVehicles?: number;
  monthlyPrice?: number;
  subscriptionEnd?: string;
  active?: boolean;
}

export interface PlatformUserItem {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  agencyName: string;
  tenantId?: number;
  active: boolean;
  createdAt: string;
}

export interface GeneratedCredentialsPass {
  agencyName: string;
  subdomain: string;
  subdomainUrl: string;
  adminUsername: string;
  tempPassword: string;
  adminFullName: string;
  email: string;
  plan: string;
  monthlyPrice: number;
  maxVehicles: number;
}
