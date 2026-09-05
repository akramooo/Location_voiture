package com.rentflow.service.impl;

import com.rentflow.domain.Inspection;
import com.rentflow.domain.Reservation;
import com.rentflow.domain.Tenant;
import com.rentflow.domain.User;
import com.rentflow.domain.Vehicle;
import com.rentflow.domain.VehicleStatus;
import com.rentflow.dto.InspectionDto;
import com.rentflow.mapper.InspectionMapper;
import com.rentflow.repository.InspectionRepository;
import com.rentflow.repository.ReservationRepository;
import com.rentflow.repository.UserRepository;
import com.rentflow.repository.VehicleRepository;
import com.rentflow.repository.TenantRepository;
import com.rentflow.security.TenantContext;
import com.rentflow.service.InspectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class InspectionServiceImpl implements InspectionService {

    private final InspectionRepository inspectionRepository;
    private final ReservationRepository reservationRepository;
    private final VehicleRepository vehicleRepository;
    private final TenantRepository tenantRepository;
    private final InspectionMapper inspectionMapper;

    @Override
    @Transactional(readOnly = true)
    public List<InspectionDto> getInspectionsByReservation(Long reservationId) {
        List<Inspection> list = inspectionRepository.findByReservationId(reservationId);
        return inspectionMapper.toDtoList(list);
    }

    @Override
    public InspectionDto performCheckIn(Map<String, Object> payload) {
        Long tenantId = TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow();

        Long reservationId = Long.parseLong(payload.get("reservationId").toString());
        Reservation reservation = reservationRepository.findById(reservationId).orElseThrow();
        Vehicle vehicle = reservation.getVehicle();

        Double mileage = Double.parseDouble(payload.get("mileage").toString());
        String fuelLevel = payload.getOrDefault("fuelLevel", "PLEIN").toString();
        String damageMarkersJson = payload.getOrDefault("damageMarkersJson", "[]").toString();
        String photoUrlsJson = payload.getOrDefault("photoUrlsJson", "[]").toString();
        Double cautionAmount = Double.parseDouble(payload.getOrDefault("cautionAmount", "5000.0").toString());
        String cautionType = payload.getOrDefault("cautionType", "PRE_AUTORISATION_TPE").toString();
        String signatureBase64 = payload.getOrDefault("signatureBase64", "").toString();

        Inspection inspection = Inspection.builder()
                .tenant(tenant)
                .reservation(reservation)
                .vehicle(vehicle)
                .type("CHECK_IN")
                .mileage(mileage)
                .fuelLevel(fuelLevel)
                .damageMarkersJson(damageMarkersJson)
                .photoUrlsJson(photoUrlsJson)
                .cautionAmount(cautionAmount)
                .cautionType(cautionType)
                .cautionStatus("ACTIVE")
                .signatureBase64(signatureBase64)
                .pdfContractUrl("/contracts/contract-" + reservation.getReservationNumber() + ".pdf")
                .build();

        Inspection saved = inspectionRepository.save(inspection);

        vehicle.setStatus(VehicleStatus.LOUE);
        vehicle.setCurrentMileage(mileage);
        vehicleRepository.save(vehicle);

        reservation.setStatus("EN_COURS");
        reservationRepository.save(reservation);

        return inspectionMapper.toDto(saved);
    }

    @Override
    public InspectionDto performCheckOut(Map<String, Object> payload) {
        Long tenantId = TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow();

        Long reservationId = Long.parseLong(payload.get("reservationId").toString());
        Reservation reservation = reservationRepository.findById(reservationId).orElseThrow();
        Vehicle vehicle = reservation.getVehicle();

        Double returnMileage = Double.parseDouble(payload.get("mileage").toString());
        String fuelLevel = payload.getOrDefault("fuelLevel", "PLEIN").toString();
        String damageMarkersJson = payload.getOrDefault("damageMarkersJson", "[]").toString();
        String photoUrlsJson = payload.getOrDefault("photoUrlsJson", "[]").toString();
        Double extraFeesAmount = Double.parseDouble(payload.getOrDefault("extraFeesAmount", "0.0").toString());
        String extraFeesNotes = payload.getOrDefault("extraFeesNotes", "").toString();
        String cautionStatus = payload.getOrDefault("cautionStatus", "RESTITUEE").toString();
        String signatureBase64 = payload.getOrDefault("signatureBase64", "").toString();

        Inspection checkOut = Inspection.builder()
                .tenant(tenant)
                .reservation(reservation)
                .vehicle(vehicle)
                .type("CHECK_OUT")
                .mileage(returnMileage)
                .fuelLevel(fuelLevel)
                .damageMarkersJson(damageMarkersJson)
                .photoUrlsJson(photoUrlsJson)
                .extraFeesAmount(extraFeesAmount)
                .extraFeesNotes(extraFeesNotes)
                .cautionStatus(cautionStatus)
                .signatureBase64(signatureBase64)
                .build();

        Inspection saved = inspectionRepository.save(checkOut);

        vehicle.setStatus(VehicleStatus.DISPONIBLE);
        vehicle.setCurrentMileage(returnMileage);
        vehicleRepository.save(vehicle);

        reservation.setStatus("TERMINEE");
        reservationRepository.save(reservation);

        return inspectionMapper.toDto(saved);
    }
}
