package com.rentflow.service.impl;

import com.rentflow.domain.MaintenanceLog;
import com.rentflow.domain.Vehicle;
import com.rentflow.domain.VehicleDocument;
import com.rentflow.repository.MaintenanceLogRepository;
import com.rentflow.repository.VehicleDocumentRepository;
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
    private final VehicleDocumentRepository vehicleDocumentRepository;

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
            map.put("vehicleStatus", log.getVehicle() != null && log.getVehicle().getStatus() != null ? log.getVehicle().getStatus().name() : "DISPONIBLE");
            map.put("category", log.getServiceType() != null ? log.getServiceType() : "VIDANGE");
            map.put("amount", log.getCost() != null ? log.getCost() : 0.0);
            map.put("expenseDate", log.getServiceDate() != null ? log.getServiceDate().toString() : LocalDate.now().toString());
            map.put("providerName", log.getGarageName() != null ? log.getGarageName() : "Prestataire");
            map.put("notes", log.getNotes());
            map.put("status", log.getStatus() != null ? log.getStatus() : "VALIDE");
            map.put("mileageAtService", log.getMileageAtService());
            map.put("nextServiceMileage", log.getNextServiceMileage());
            map.put("nextServiceDate", log.getNextServiceDate() != null ? log.getNextServiceDate().toString() : null);
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
        String category = payload.get("category") != null ? String.valueOf(payload.get("category")).toUpperCase() : "VIDANGE";
        Double amount = payload.get("amount") != null ? Double.valueOf(String.valueOf(payload.get("amount"))) : 0.0;
        String expenseDateStr = payload.get("expenseDate") != null ? String.valueOf(payload.get("expenseDate")) : null;
        LocalDate expenseDate = expenseDateStr != null ? LocalDate.parse(expenseDateStr) : LocalDate.now();
        String providerName = payload.get("providerName") != null ? String.valueOf(payload.get("providerName")) : "";
        String notes = payload.get("notes") != null ? String.valueOf(payload.get("notes")) : "";
        String status = payload.get("status") != null ? String.valueOf(payload.get("status")) : "VALIDE";

        Double currentKm = vehicle.getCurrentMileage() != null ? vehicle.getCurrentMileage() : 0.0;
        Double mileageAtService = payload.get("mileageAtService") != null
                ? Double.valueOf(String.valueOf(payload.get("mileageAtService")))
                : currentKm;

        Double nextServiceMileage = payload.get("nextServiceMileage") != null
                ? Double.valueOf(String.valueOf(payload.get("nextServiceMileage")))
                : ("VIDANGE".equalsIgnoreCase(category) ? mileageAtService + 10000.0 : null);

        LocalDate nextServiceDate = payload.get("nextServiceDate") != null
                ? LocalDate.parse(String.valueOf(payload.get("nextServiceDate")))
                : ("VIDANGE".equalsIgnoreCase(category) ? expenseDate.plusYears(1) : null);

        Boolean setMaintenance = payload.get("setVehicleInMaintenance") != null && Boolean.parseBoolean(String.valueOf(payload.get("setVehicleInMaintenance")));
        if (setMaintenance) {
            vehicle.setStatus(com.rentflow.domain.VehicleStatus.EN_MAINTENANCE);
            vehicleRepository.save(vehicle);
        }

        MaintenanceLog log = MaintenanceLog.builder()
                .vehicle(vehicle)
                .serviceType(category)
                .cost(amount)
                .serviceDate(expenseDate)
                .mileageAtService(mileageAtService)
                .nextServiceMileage(nextServiceMileage)
                .nextServiceDate(nextServiceDate)
                .garageName(providerName)
                .notes(notes)
                .status(status)
                .build();

        log = maintenanceLogRepository.save(log);

        // Synchronisation automatique avec vehicle_documents pour Assurance / Visite Technique / Vignette
        if ("ASSURANCE".equalsIgnoreCase(category) || "VISITE_TECHNIQUE".equalsIgnoreCase(category) || "VIGNETTE".equalsIgnoreCase(category)) {
            LocalDate expDate = payload.get("expirationDate") != null
                    ? LocalDate.parse(String.valueOf(payload.get("expirationDate")))
                    : expenseDate.plusYears(1);

            VehicleDocument doc = VehicleDocument.builder()
                    .vehicle(vehicle)
                    .docType(category)
                    .expirationDate(expDate)
                    .providerName(providerName)
                    .cost(amount)
                    .build();

            vehicleDocumentRepository.save(doc);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("id", log.getId());
        res.put("vehicleId", vehicle.getId());
        res.put("vehicleName", vehicle.getBrand() + " " + vehicle.getModel() + " (" + vehicle.getRegistrationNumber() + ")");
        res.put("vehicleStatus", vehicle.getStatus() != null ? vehicle.getStatus().name() : "DISPONIBLE");
        res.put("category", log.getServiceType());
        res.put("amount", log.getCost());
        res.put("expenseDate", log.getServiceDate().toString());
        res.put("providerName", log.getGarageName());
        res.put("notes", log.getNotes());
        res.put("status", log.getStatus());
        res.put("nextServiceMileage", log.getNextServiceMileage());
        res.put("nextServiceDate", log.getNextServiceDate() != null ? log.getNextServiceDate().toString() : null);

        return res;
    }

    @Override
    public Map<String, Object> validateExpense(Long id) {
        MaintenanceLog log = maintenanceLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dépense introuvable"));
        log.setStatus("VALIDE");
        maintenanceLogRepository.save(log);

        Map<String, Object> res = new HashMap<>();
        res.put("id", log.getId());
        res.put("status", log.getStatus());
        if (log.getVehicle() != null) {
            res.put("vehicleId", log.getVehicle().getId());
            res.put("vehicleStatus", log.getVehicle().getStatus() != null ? log.getVehicle().getStatus().name() : "DISPONIBLE");
        }
        return res;
    }

    @Override
    public Map<String, Object> updateExpenseStatus(Long id, String status) {
        MaintenanceLog log = maintenanceLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dépense introuvable"));
        log.setStatus(status);
        maintenanceLogRepository.save(log);

        Map<String, Object> res = new HashMap<>();
        res.put("id", log.getId());
        res.put("status", log.getStatus());
        return res;
    }

    @Override
    public Map<String, Object> updateVehicleStatus(Long vehicleId, String status) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Véhicule introuvable"));
        try {
            vehicle.setStatus(com.rentflow.domain.VehicleStatus.valueOf(status.toUpperCase()));
            vehicleRepository.save(vehicle);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Statut de véhicule invalide: " + status);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("vehicleId", vehicle.getId());
        res.put("vehicleStatus", vehicle.getStatus().name());
        return res;
    }

    @Override
    public void deleteFleetExpense(Long id) {
        maintenanceLogRepository.deleteById(id);
    }
}
