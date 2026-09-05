package com.rentflow.repository;

import com.rentflow.domain.VehicleDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface VehicleDocumentRepository extends JpaRepository<VehicleDocument, Long> {
    List<VehicleDocument> findByVehicleId(Long vehicleId);

    @Query("SELECT vd FROM VehicleDocument vd WHERE vd.vehicle.tenant.id = :tenantId AND vd.expirationDate <= :targetDate")
    List<VehicleDocument> findExpiringDocuments(Long tenantId, LocalDate targetDate);
}
