package com.rentflow.repository;

import com.rentflow.domain.Vehicle;
import com.rentflow.domain.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByTenantId(Long tenantId);
    List<Vehicle> findByTenantIdAndStatus(Long tenantId, VehicleStatus status);
    Optional<Vehicle> findByTenantIdAndRegistrationNumber(Long tenantId, String registrationNumber);
    long countByTenantId(Long tenantId);
    long countByTenantIdAndStatus(Long tenantId, VehicleStatus status);
}
