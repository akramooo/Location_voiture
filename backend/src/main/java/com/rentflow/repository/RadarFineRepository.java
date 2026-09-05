package com.rentflow.repository;

import com.rentflow.domain.RadarFine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RadarFineRepository extends JpaRepository<RadarFine, Long> {
    List<RadarFine> findByTenantId(Long tenantId);
    List<RadarFine> findByVehicleId(Long vehicleId);
}
