package com.rentflow.repository;

import com.rentflow.domain.MaintenanceLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceLogRepository extends JpaRepository<MaintenanceLog, Long> {
    List<MaintenanceLog> findByVehicleIdOrderByServiceDateDesc(Long vehicleId);
}
