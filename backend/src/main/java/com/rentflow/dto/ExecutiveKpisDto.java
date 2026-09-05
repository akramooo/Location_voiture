package com.rentflow.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutiveKpisDto {
    private long totalVehicles;
    private long rentedVehicles;
    private long reservedVehicles;
    private long maintenanceVehicles;
    private long availableVehicles;
    private double occupancyRate;
    private double totalRevenue;
    private double revPac;
    private double activeDepositsTotal;
    private long imminentAlertsCount;
}
