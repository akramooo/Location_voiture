package com.rentflow.service.impl;

import com.rentflow.domain.VehicleStatus;
import com.rentflow.dto.ExecutiveKpisDto;
import com.rentflow.repository.ReservationRepository;
import com.rentflow.repository.VehicleRepository;
import com.rentflow.security.TenantContext;
import com.rentflow.service.DashboardService;
import com.rentflow.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final VehicleRepository vehicleRepository;
    private final ReservationRepository reservationRepository;
    private final VehicleService vehicleService;

    @Override
    public ExecutiveKpisDto getExecutiveKpis() {
        Long tenantId = TenantContext.getCurrentTenant();

        long totalVehicles = vehicleRepository.countByTenantId(tenantId);
        long rentedVehicles = vehicleRepository.countByTenantIdAndStatus(tenantId, VehicleStatus.LOUE);
        long reservedVehicles = vehicleRepository.countByTenantIdAndStatus(tenantId, VehicleStatus.RESERVE);
        long maintenanceVehicles = vehicleRepository.countByTenantIdAndStatus(tenantId, VehicleStatus.EN_MAINTENANCE);
        long availableVehicles = vehicleRepository.countByTenantIdAndStatus(tenantId, VehicleStatus.DISPONIBLE);

        double occupancyRate = totalVehicles > 0 ? ((double) (rentedVehicles + reservedVehicles) / totalVehicles) * 100.0 : 0.0;

        Double totalRevenue = reservationRepository.calculateTotalRevenue(tenantId);
        if (totalRevenue == null) totalRevenue = 0.0;

        double revPac = totalVehicles > 0 ? totalRevenue / totalVehicles : 0.0;
        List<Map<String, Object>> alerts = vehicleService.getFleetAlerts();
        long alertCount = alerts.size();

        return ExecutiveKpisDto.builder()
                .totalVehicles(totalVehicles)
                .rentedVehicles(rentedVehicles)
                .reservedVehicles(reservedVehicles)
                .maintenanceVehicles(maintenanceVehicles)
                .availableVehicles(availableVehicles)
                .occupancyRate(Math.round(occupancyRate * 10.0) / 10.0)
                .totalRevenue(totalRevenue)
                .revPac(Math.round(revPac * 100.0) / 100.0)
                .activeDepositsTotal(rentedVehicles * 5000.0)
                .imminentAlertsCount(alertCount)
                .build();
    }
}
