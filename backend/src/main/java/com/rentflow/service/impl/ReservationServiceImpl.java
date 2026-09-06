package com.rentflow.service.impl;

import com.rentflow.domain.Client;
import com.rentflow.domain.Invoice;
import com.rentflow.domain.Reservation;
import com.rentflow.domain.Tenant;
import com.rentflow.domain.Vehicle;
import com.rentflow.domain.VehicleStatus;
import com.rentflow.dto.ReservationDto;
import com.rentflow.mapper.ReservationMapper;
import com.rentflow.repository.ClientRepository;
import com.rentflow.repository.InvoiceRepository;
import com.rentflow.repository.ReservationRepository;
import com.rentflow.repository.TenantRepository;
import com.rentflow.repository.VehicleRepository;
import com.rentflow.security.TenantContext;
import com.rentflow.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final VehicleRepository vehicleRepository;
    private final ClientRepository clientRepository;
    private final TenantRepository tenantRepository;
    private final ReservationMapper reservationMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ReservationDto> getReservations() {
        Long tenantId = TenantContext.getCurrentTenant();
        List<Reservation> reservations = reservationRepository.findByTenantId(tenantId);
        return reservationMapper.toDtoList(reservations);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getGanttData() {
        Long tenantId = TenantContext.getCurrentTenant();
        List<Reservation> reservations = reservationRepository.findByTenantId(tenantId);
        List<Map<String, Object>> items = new ArrayList<>();

        for (Reservation r : reservations) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", r.getId());
            item.put("reservationNumber", r.getReservationNumber());
            item.put("vehicleId", r.getVehicle().getId());
            item.put("vehicleTitle", r.getVehicle().getBrand() + " " + r.getVehicle().getModel() + " (" + r.getVehicle().getRegistrationNumber() + ")");
            item.put("clientName", r.getClient().getClientType().equals("ENTREPRISE") ? r.getClient().getCompanyName() : (r.getClient().getFirstName() + " " + r.getClient().getLastName()));
            item.put("clientPhone", r.getClient().getPhoneWhatsApp());
            item.put("clientCin", r.getClient().getCinPassport() != null ? r.getClient().getCinPassport() : r.getClient().getIceNumber());
            item.put("startDate", r.getStartDate());
            item.put("endDate", r.getEndDate());
            item.put("status", r.getStatus());
            item.put("totalAmount", r.getTotalAmount());
            item.put("depositAmount", r.getDepositAmount());
            item.put("paidAmount", r.getPaidAmount());
            item.put("dailyRate", r.getDailyRate());
            item.put("totalDays", r.getTotalDays());
            item.put("pickupLocation", r.getPickupLocation());
            item.put("returnLocation", r.getReturnLocation());
            items.add(item);
        }

        return items;
    }

    @Override
    public ReservationDto createReservation(Map<String, Object> payload) {
        Long tenantId = TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow();

        Long vehicleId = Long.parseLong(payload.get("vehicleId").toString());
        Long clientId = Long.parseLong(payload.get("clientId").toString());

        Vehicle vehicle = vehicleRepository.findById(vehicleId).orElseThrow();
        Client client = clientRepository.findById(clientId).orElseThrow();

        if (client.isBlacklisted()) {
            throw new IllegalArgumentException("Impossible de créer une réservation : Ce client est inscrit sur liste noire (Blacklisté).");
        }

        LocalDateTime startDate = LocalDateTime.parse(payload.get("startDate").toString());
        LocalDateTime endDate = LocalDateTime.parse(payload.get("endDate").toString());

        // Détection instantanée des conflits de disponibilité
        List<Reservation> conflicts = reservationRepository.findConflictingReservations(tenantId, vehicleId, startDate, endDate);
        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("Conflit de réservation : Le véhicule est déjà réservé sur cette période.");
        }

        long days = ChronoUnit.DAYS.between(startDate.toLocalDate(), endDate.toLocalDate());
        if (days <= 0) days = 1;

        // Tarification standard sans réduction automatique
        double baseRate = payload.containsKey("dailyRate") && payload.get("dailyRate") != null
                ? Double.parseDouble(payload.get("dailyRate").toString())
                : (vehicle.getDailyRate() != null ? vehicle.getDailyRate() : 350.0);

        double subTotal = baseRate * days;

        // Gestion de la remise manuelle (MAD ou %)
        double discountAmount = 0.0;
        String discountType = payload.containsKey("discountType") && payload.get("discountType") != null
                ? payload.get("discountType").toString()
                : "MAD";

        if (payload.containsKey("discountValue") && payload.get("discountValue") != null) {
            double discountVal = Double.parseDouble(payload.get("discountValue").toString());
            if (discountVal > 0) {
                if ("PERCENT".equalsIgnoreCase(discountType) || "%".equals(discountType)) {
                    discountAmount = (subTotal * discountVal) / 100.0;
                } else {
                    discountAmount = discountVal;
                }
            }
        }
        discountAmount = Math.min(discountAmount, subTotal);
        double totalAmount = Math.max(0.0, subTotal - discountAmount);

        Double depositAmount = payload.containsKey("depositAmount") ? Double.parseDouble(payload.get("depositAmount").toString()) : 500.0;
        Double paidAmount = payload.containsKey("paidAmount") ? Double.parseDouble(payload.get("paidAmount").toString()) : 0.0;

        String resNumber = "RES-" + System.currentTimeMillis() % 100000;

        Reservation reservation = Reservation.builder()
                .tenant(tenant)
                .vehicle(vehicle)
                .client(client)
                .reservationNumber(resNumber)
                .startDate(startDate)
                .endDate(endDate)
                .pickupLocation(payload.getOrDefault("pickupLocation", "Agence").toString())
                .returnLocation(payload.getOrDefault("returnLocation", "Agence").toString())
                .rateSeason(payload.getOrDefault("rateSeason", "MOYENNE").toString())
                .dailyRate(baseRate)
                .totalDays(days)
                .discountAmount(discountAmount)
                .discountType(discountType)
                .totalAmount(totalAmount)
                .depositAmount(depositAmount)
                .paidAmount(paidAmount)
                .paymentMethod(payload.getOrDefault("paymentMethod", "ESPECES").toString())
                .status("CONFIRMEE")
                .build();

        Reservation saved = reservationRepository.save(reservation);

        if (startDate.toLocalDate().isEqual(LocalDateTime.now().toLocalDate())) {
            vehicle.setStatus(VehicleStatus.RESERVE);
            vehicleRepository.save(vehicle);
        }

        return reservationMapper.toDto(saved);
    }

    @Override
    public ReservationDto updateStatus(Long id, String status) {
        Long tenantId = TenantContext.getCurrentTenant();
        Optional<Reservation> resOpt = reservationRepository.findById(id);

        if (resOpt.isEmpty() || !resOpt.get().getTenant().getId().equals(tenantId)) {
            throw new NoSuchElementException("Réservation non trouvée");
        }

        Reservation reservation = resOpt.get();
        reservation.setStatus(status);

        Vehicle vehicle = reservation.getVehicle();
        if ("EN_COURS".equals(status)) {
            vehicle.setStatus(VehicleStatus.LOUE);
        } else if ("TERMINEE".equals(status) || "ANNULEE".equals(status)) {
            vehicle.setStatus(VehicleStatus.DISPONIBLE);
        }
        vehicleRepository.save(vehicle);

        Reservation saved = reservationRepository.save(reservation);
        return reservationMapper.toDto(saved);
    }
}
