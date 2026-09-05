package com.rentflow.repository;

import com.rentflow.domain.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByTenantId(Long tenantId);
    List<Reservation> findByTenantIdAndVehicleId(Long tenantId, Long vehicleId);

    @Query("SELECT r FROM Reservation r WHERE r.tenant.id = :tenantId AND r.vehicle.id = :vehicleId AND r.status <> 'ANNULEE' AND " +
           "((r.startDate <= :endDate AND r.endDate >= :startDate))")
    List<Reservation> findConflictingReservations(Long tenantId, Long vehicleId, LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT COALESCE(SUM(r.totalAmount), 0.0) FROM Reservation r WHERE r.tenant.id = :tenantId AND r.status <> 'ANNULEE'")
    Double calculateTotalRevenue(Long tenantId);

    long countByTenantIdAndClientId(Long tenantId, Long clientId);
}
