package com.rentflow.repository;

import com.rentflow.domain.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByTenantId(Long tenantId);
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    long countByTenantId(Long tenantId);
    long countByTenantIdAndClientId(Long tenantId, Long clientId);
}
