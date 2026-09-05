package com.rentflow.repository;

import com.rentflow.domain.Client;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long> {
    List<Client> findByTenantId(Long tenantId);
    Optional<Client> findByTenantIdAndCinPassport(Long tenantId, String cinPassport);
    Optional<Client> findByTenantIdAndIceNumber(Long tenantId, String iceNumber);
    List<Client> findByTenantIdAndBlacklistedTrue(Long tenantId);
}
