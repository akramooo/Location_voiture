package com.rentflow.service.impl;

import com.rentflow.domain.MaintenanceLog;
import com.rentflow.domain.Tenant;
import com.rentflow.domain.Vehicle;
import com.rentflow.domain.VehicleDocument;
import com.rentflow.domain.VehicleStatus;
import com.rentflow.dto.MaintenanceLogDto;
import com.rentflow.dto.VehicleDto;
import com.rentflow.mapper.VehicleMapper;
import com.rentflow.repository.MaintenanceLogRepository;
import com.rentflow.repository.TenantRepository;
import com.rentflow.repository.VehicleDocumentRepository;
import com.rentflow.repository.VehicleRepository;
import com.rentflow.security.TenantContext;
import com.rentflow.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehicleDocumentRepository vehicleDocumentRepository;
    private final MaintenanceLogRepository maintenanceLogRepository;
    private final TenantRepository tenantRepository;
    private final VehicleMapper vehicleMapper;

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDto> getVehicles(VehicleStatus status) {
        Long tenantId = TenantContext.getCurrentTenant();
        List<Vehicle> list = (status != null) ?
                vehicleRepository.findByTenantIdAndStatus(tenantId, status) :
                vehicleRepository.findByTenantId(tenantId);
        return vehicleMapper.toDtoList(list);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getVehicleDetails(Long id) {
        Long tenantId = TenantContext.getCurrentTenant();
        Optional<Vehicle> vehicleOpt = vehicleRepository.findById(id);

        if (vehicleOpt.isEmpty() || !vehicleOpt.get().getTenant().getId().equals(tenantId)) {
            throw new NoSuchElementException("Véhicule non trouvé");
        }

        Vehicle vehicle = vehicleOpt.get();
        VehicleDto vehicleDto = vehicleMapper.toDto(vehicle);
        List<VehicleDocument> documents = vehicleDocumentRepository.findByVehicleId(id);
        List<MaintenanceLog> maintenanceLogs = maintenanceLogRepository.findByVehicleIdOrderByServiceDateDesc(id);

        Map<String, Object> response = new HashMap<>();
        response.put("vehicle", vehicleDto);
        response.put("documents", documents);
        response.put("maintenanceLogs", maintenanceLogs);

        return response;
    }

    @Override
    public VehicleDto createVehicle(VehicleDto vehicleDto) {
        Long tenantId = TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow();

        Vehicle vehicle = vehicleMapper.toEntity(vehicleDto);
        vehicle.setTenant(tenant);

        if (vehicle.getStatus() == null) {
            vehicle.setStatus(VehicleStatus.DISPONIBLE);
        }

        Vehicle saved = vehicleRepository.save(vehicle);
        return vehicleMapper.toDto(saved);
    }

    @Override
    public VehicleDto updateVehicle(Long id, VehicleDto updatedDto) {
        Long tenantId = TenantContext.getCurrentTenant();
        Optional<Vehicle> vehicleOpt = vehicleRepository.findById(id);

        if (vehicleOpt.isEmpty() || !vehicleOpt.get().getTenant().getId().equals(tenantId)) {
            throw new NoSuchElementException("Véhicule non trouvé");
        }

        Vehicle existing = vehicleOpt.get();
        existing.setBrand(updatedDto.getBrand());
        existing.setModel(updatedDto.getModel());
        existing.setFinish(updatedDto.getFinish());
        existing.setYear(updatedDto.getYear());
        existing.setFuelType(updatedDto.getFuelType());
        existing.setGearbox(updatedDto.getGearbox());
        existing.setRegistrationNumber(updatedDto.getRegistrationNumber());
        existing.setRegistrationType(updatedDto.getRegistrationType());
        existing.setCurrentMileage(updatedDto.getCurrentMileage());
        existing.setDailyRate(updatedDto.getDailyRate());
        existing.setStatus(updatedDto.getStatus());
        existing.setPhotoUrl(updatedDto.getPhotoUrl());

        Vehicle saved = vehicleRepository.save(existing);
        return vehicleMapper.toDto(saved);
    }

    @Override
    public void deleteVehicle(Long id) {
        Long tenantId = TenantContext.getCurrentTenant();
        Optional<Vehicle> vehicleOpt = vehicleRepository.findById(id);

        if (vehicleOpt.isEmpty() || !vehicleOpt.get().getTenant().getId().equals(tenantId)) {
            throw new NoSuchElementException("Véhicule non trouvé");
        }

        vehicleRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFleetAlerts() {
        Long tenantId = TenantContext.getCurrentTenant();
        LocalDate targetDate = LocalDate.now().plusDays(30);

        List<Map<String, Object>> alerts = new ArrayList<>();

        // 1. Documents administratifs (Assurance, Visite Technique, Vignette)
        List<VehicleDocument> expiringDocs = vehicleDocumentRepository.findExpiringDocuments(tenantId, targetDate);
        for (VehicleDocument doc : expiringDocs) {
            long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), doc.getExpirationDate());
            Map<String, Object> alert = new HashMap<>();
            alert.put("docId", doc.getId());
            alert.put("docType", doc.getDocType());
            alert.put("categoryType", "DOCUMENT");
            alert.put("expirationDate", doc.getExpirationDate());
            alert.put("daysRemaining", daysRemaining);
            alert.put("providerName", doc.getProviderName() != null ? doc.getProviderName() : "");
            alert.put("vehicleId", doc.getVehicle().getId());
            alert.put("registrationNumber", doc.getVehicle().getRegistrationNumber());
            alert.put("vehicleName", doc.getVehicle().getBrand() + " " + doc.getVehicle().getModel());
            alerts.add(alert);
        }

        // 2. Vidanges & Entretiens Mécaniques Périodiques
        List<Vehicle> vehicles = vehicleRepository.findByTenantId(tenantId);
        for (Vehicle v : vehicles) {
            List<MaintenanceLog> logs = maintenanceLogRepository.findByVehicleIdOrderByServiceDateDesc(v.getId());
            double currentKm = (v.getCurrentMileage() != null) ? v.getCurrentMileage() : 0.0;

            Optional<MaintenanceLog> vidangeOpt = logs.stream()
                    .filter(l -> "VIDANGE".equalsIgnoreCase(l.getServiceType()))
                    .findFirst();

            if (vidangeOpt.isPresent()) {
                MaintenanceLog lastVidange = vidangeOpt.get();
                double targetMileage = lastVidange.getNextServiceMileage() != null
                        ? lastVidange.getNextServiceMileage()
                        : ((lastVidange.getMileageAtService() != null ? lastVidange.getMileageAtService() : currentKm) + 10000.0);

                double kmRemaining = targetMileage - currentKm;
                LocalDate nextDate = lastVidange.getNextServiceDate() != null
                        ? lastVidange.getNextServiceDate()
                        : (lastVidange.getServiceDate() != null ? lastVidange.getServiceDate().plusYears(1) : LocalDate.now().plusYears(1));
                long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), nextDate);

                // Remonter l'alerte si : vidange en cours/planifiée, ou reste <= 2000 KM, ou date <= 30 jours, ou vidange effectuée récemment pour suivi
                boolean isUrgent = kmRemaining <= 1500 || daysRemaining <= 30 || "EN_COURS".equals(lastVidange.getStatus()) || "PLANIFIE".equals(lastVidange.getStatus());

                Map<String, Object> alert = new HashMap<>();
                alert.put("docId", lastVidange.getId());
                alert.put("docType", "VIDANGE");
                alert.put("categoryType", "MAINTENANCE");
                alert.put("expirationDate", nextDate);
                alert.put("daysRemaining", daysRemaining);
                alert.put("currentMileage", currentKm);
                alert.put("nextServiceMileage", targetMileage);
                alert.put("kmRemaining", Math.round(kmRemaining));
                alert.put("isUrgent", isUrgent);
                alert.put("serviceStatus", lastVidange.getStatus() != null ? lastVidange.getStatus() : "VALIDE");
                alert.put("providerName", lastVidange.getGarageName() != null ? lastVidange.getGarageName() : "Atelier Vidange");
                alert.put("vehicleId", v.getId());
                alert.put("registrationNumber", v.getRegistrationNumber());
                alert.put("vehicleName", v.getBrand() + " " + v.getModel());
                alerts.add(alert);
            } else if (currentKm >= 10000.0) {
                // Aucun historique de vidange enregistré pour un véhicule avec kilométrage conséquent
                Map<String, Object> alert = new HashMap<>();
                alert.put("docId", v.getId());
                alert.put("docType", "VIDANGE");
                alert.put("categoryType", "MAINTENANCE");
                alert.put("expirationDate", LocalDate.now());
                alert.put("daysRemaining", 0L);
                alert.put("currentMileage", currentKm);
                alert.put("nextServiceMileage", currentKm);
                alert.put("kmRemaining", 0.0);
                alert.put("isUrgent", true);
                alert.put("serviceStatus", "NON_RENSEIGNE");
                alert.put("providerName", "À planifier");
                alert.put("vehicleId", v.getId());
                alert.put("registrationNumber", v.getRegistrationNumber());
                alert.put("vehicleName", v.getBrand() + " " + v.getModel());
                alerts.add(alert);
            }
        }

        alerts.sort((a, b) -> {
            Long d1 = a.get("daysRemaining") != null ? (Long) a.get("daysRemaining") : 999L;
            Long d2 = b.get("daysRemaining") != null ? (Long) b.get("daysRemaining") : 999L;
            return d1.compareTo(d2);
        });
        return alerts;
    }

    @Override
    public MaintenanceLogDto addMaintenanceLog(Long id, MaintenanceLogDto logDto) {
        Long tenantId = TenantContext.getCurrentTenant();
        Optional<Vehicle> vehicleOpt = vehicleRepository.findById(id);

        if (vehicleOpt.isEmpty() || !vehicleOpt.get().getTenant().getId().equals(tenantId)) {
            throw new NoSuchElementException("Véhicule non trouvé");
        }

        Vehicle vehicle = vehicleOpt.get();

        MaintenanceLog log = MaintenanceLog.builder()
                .vehicle(vehicle)
                .serviceType(logDto.getServiceType())
                .serviceDate(logDto.getServiceDate())
                .mileageAtService(logDto.getMileageAtService())
                .nextServiceMileage(logDto.getNextServiceMileage())
                .cost(logDto.getCost())
                .garageName(logDto.getGarageName())
                .notes(logDto.getNotes())
                .status("EN_COURS")
                .build();

        MaintenanceLog savedLog = maintenanceLogRepository.save(log);

        vehicle.setStatus(VehicleStatus.EN_MAINTENANCE);
        vehicleRepository.save(vehicle);

        return MaintenanceLogDto.builder()
                .id(savedLog.getId())
                .vehicleId(vehicle.getId())
                .serviceType(savedLog.getServiceType())
                .serviceDate(savedLog.getServiceDate())
                .mileageAtService(savedLog.getMileageAtService())
                .nextServiceMileage(savedLog.getNextServiceMileage())
                .cost(savedLog.getCost())
                .garageName(savedLog.getGarageName())
                .notes(savedLog.getNotes())
                .status(savedLog.getStatus())
                .build();
    }
}
