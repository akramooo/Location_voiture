package com.rentflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuperAdminKpiDto {
    private long totalTenants;
    private long activeTenants;
    private long trialTenants;
    private long suspendedTenants;
    private long totalVehicles;
    private long totalReservations;
    private double totalMrr; // Monthly Recurring Revenue in DH
    private double totalPlatformRevenue; // Total turnover across all agencies
}
