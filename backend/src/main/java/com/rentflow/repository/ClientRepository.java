package com.rentflow.repository;

import com.rentflow.domain.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long> {
    List<Client> findByTenantId(Long tenantId);

    @Query("SELECT c FROM Client c WHERE c.tenant.id = :tenantId AND LOWER(TRIM(c.cinPassport)) = LOWER(TRIM(:cin))")
    Optional<Client> findByTenantIdAndCinPassport(@Param("tenantId") Long tenantId, @Param("cin") String cin);

    @Query("SELECT c FROM Client c WHERE c.tenant.id = :tenantId AND LOWER(TRIM(c.iceNumber)) = LOWER(TRIM(:ice))")
    Optional<Client> findByTenantIdAndIceNumber(@Param("tenantId") Long tenantId, @Param("ice") String ice);

    List<Client> findByTenantIdAndBlacklistedTrue(Long tenantId);

    // Global Anti-Fraud Network Queries (Across all tenants)
    @Query("SELECT c FROM Client c WHERE LOWER(TRIM(c.cinPassport)) = LOWER(TRIM(:cin)) AND c.blacklisted = true")
    List<Client> findBlacklistedByCin(@Param("cin") String cin);

    @Query("SELECT c FROM Client c WHERE LOWER(TRIM(c.iceNumber)) = LOWER(TRIM(:ice)) AND c.blacklisted = true")
    List<Client> findBlacklistedByIce(@Param("ice") String ice);
}
