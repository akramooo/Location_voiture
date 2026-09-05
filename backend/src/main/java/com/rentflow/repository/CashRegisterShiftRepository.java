package com.rentflow.repository;

import com.rentflow.domain.CashRegisterShift;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CashRegisterShiftRepository extends JpaRepository<CashRegisterShift, Long> {
    List<CashRegisterShift> findByTenantId(Long tenantId);
    Optional<CashRegisterShift> findByTenantIdAndAgentIdAndStatus(Long tenantId, Long agentId, String status);
}
