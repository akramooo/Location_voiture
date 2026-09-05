package com.rentflow.repository;

import com.rentflow.domain.Inspection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InspectionRepository extends JpaRepository<Inspection, Long> {
    List<Inspection> findByReservationId(Long reservationId);
    List<Inspection> findByTenantId(Long tenantId);
}
