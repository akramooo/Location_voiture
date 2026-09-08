package com.rentflow.repository;

import com.rentflow.domain.Cheque;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChequeRepository extends JpaRepository<Cheque, Long> {
    List<Cheque> findByTenantId(Long tenantId);
    List<Cheque> findByTenantIdAndStatus(Long tenantId, String status);
}
