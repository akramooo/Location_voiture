package com.rentflow.service;

import com.rentflow.domain.VehicleStatus;
import com.rentflow.dto.MaintenanceLogDto;
import com.rentflow.dto.VehicleDto;

import java.util.List;
import java.util.Map;

public interface VehicleService {
    List<VehicleDto> getVehicles(VehicleStatus status);
    Map<String, Object> getVehicleDetails(Long id);
    VehicleDto createVehicle(VehicleDto vehicleDto);
    VehicleDto updateVehicle(Long id, VehicleDto updatedDto);
    void deleteVehicle(Long id);
    List<Map<String, Object>> getFleetAlerts();
    MaintenanceLogDto addMaintenanceLog(Long id, MaintenanceLogDto logDto);
}
