package com.rentflow.service.impl;

import com.rentflow.domain.MaintenanceLog;
import com.rentflow.domain.Vehicle;
import com.rentflow.repository.MaintenanceLogRepository;
import com.rentflow.repository.VehicleRepository;
import com.rentflow.security.TenantContext;
import com.rentflow.service.FleetExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FleetExpenseServiceImpl implements FleetExpenseService {

    private final MaintenanceLogRepository maintenanceLogRepository;
    private final VehicleRepository vehicleRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFleetExpenses() {
        Long tenantId = TenantContext.getCurrentTenant();
        List<MaintenanceLog> logs = maintenanceLogRepository.findAll();
        if (tenantId != null) {
            logs = logs.stream()
                    .filter(l -> l.getVehicle() != null && l.getVehicle().getTenant() != null && tenantId.equals(l.getVehicle().getTenant().getId()))
                    .collect(Collectors.toList());
        }

        return logs.stream().map(log -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", log.getId());
            map.put("vehicleId", log.getVehicle() != null ? log.getVehicle().getId() : null);
            map.put("vehicleName", log.getVehicle() != null ? log.getVehicle().getBrand() + " " + log.getVehicle().getModel() + " (" + log.getVehicle().getRegistrationNumber() + ")" : "Véhicule");
            map.put("category", log.getServiceType() != null ? log.getServiceType() : "VIDANGE");
            map.put("amount", log.getCost() != null ? log.getCost() : 0.0);
            map.put("expenseDate", log.getServiceDate() != null ? log.getServiceDate().toString() : LocalDate.now().toString());
            map.put("providerName", log.getGarageName() != null ? log.getGarageName() : "Prestataire");
            map.put("notes", log.getNotes());
            return map;
        }).collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> createFleetExpense(Map<String, Object> payload) {
        Long vehicleId = payload.get("vehicleId") != null ? Long.valueOf(String.valueOf(payload.get("vehicleId"))) : null;
        if (vehicleId == null) {
            throw new IllegalArgumentException("L'identifiant du véhicule est requis");
        }

        Optional<Vehicle> vehicleOpt = vehicleRepository.findById(vehicleId);
        if (vehicleOpt.isEmpty()) {
            throw new IllegalArgumentException("Véhicule introuvable avec l'identifiant " + vehicleId);
        }

        Vehicle vehicle = vehicleOpt.get();
        String category = payload.get("category") != null ? String.valueOf(payload.get("category")) : "VIDANGE";
        Double amount = payload.get("amount") != null ? Double.valueOf(String.valueOf(payload.get("amount"))) : 0.0;
        String expenseDateStr = payload.get("expenseDate") != null ? String.valueOf(payload.get("expenseDate")) : null;
        LocalDate expenseDate = expenseDateStr != null ? LocalDate.parse(expenseDateStr) : LocalDate.now();
        String providerName = payload.get("providerName") != null ? String.valueOf(payload.get("providerName")) : "";
        String notes = payload.get("notes") != null ? String.valueOf(payload.get("notes")) : "";

        MaintenanceLog log = MaintenanceLog.builder()
                .vehicle(vehicle)
                .serviceType(category)
                .cost(amount)
                .serviceDate(expenseDate)
                .garageName(providerName)
                .notes(notes)
                .status("TERMINE")
                .build();

        log = maintenanceLogRepository.save(log);

        Map<String, Object> res = new HashMap<>();
        res.put("id", log.getId());
        res.put("vehicleId", vehicle.getId());
        res.put("vehicleName", vehicle.getBrand() + " " + vehicle.getModel() + " (" + vehicle.getRegistrationNumber() + ")");
        res.put("category", log.getServiceType());
        res.put("amount", log.getCost());
        res.put("expenseDate", log.getServiceDate().toString());
        res.put("providerName", log.getGarageName());
        res.put("notes", log.getNotes());

        return res;
    }

    @Override
    public void deleteFleetExpense(Long id) {
        maintenanceLogRepository.deleteById(id);
    }
}
