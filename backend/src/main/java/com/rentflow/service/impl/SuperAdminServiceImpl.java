package com.rentflow.service.impl;

import com.rentflow.domain.Role;
import com.rentflow.domain.Tenant;
import com.rentflow.domain.User;
import com.rentflow.dto.*;
import com.rentflow.repository.ReservationRepository;
import com.rentflow.repository.TenantRepository;
import com.rentflow.repository.UserRepository;
import com.rentflow.repository.VehicleRepository;
import com.rentflow.security.JwtTokenProvider;
import com.rentflow.service.SuperAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SuperAdminServiceImpl implements SuperAdminService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final ReservationRepository reservationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Override
    @Transactional(readOnly = true)
    public SuperAdminKpiDto getPlatformKpis() {
        List<Tenant> tenants = tenantRepository.findAll();
        long totalTenants = tenants.size();
        long activeTenants = tenants.stream().filter(t -> "ACTIVE".equalsIgnoreCase(t.getSubscriptionStatus()) && t.isActive()).count();
        long trialTenants = tenants.stream().filter(t -> "TRIAL".equalsIgnoreCase(t.getSubscriptionStatus())).count();
        long suspendedTenants = tenants.stream().filter(t -> "SUSPENDED".equalsIgnoreCase(t.getSubscriptionStatus()) || !t.isActive()).count();

        double totalMrr = tenants.stream()
                .filter(t -> "ACTIVE".equalsIgnoreCase(t.getSubscriptionStatus()) && t.isActive())
                .mapToDouble(t -> t.getMonthlyPrice() != null ? t.getMonthlyPrice() : 0.0)
                .sum();

        long totalVehicles = vehicleRepository.count();
        long totalReservations = reservationRepository.count();

        return SuperAdminKpiDto.builder()
                .totalTenants(totalTenants)
                .activeTenants(activeTenants)
                .trialTenants(trialTenants)
                .suspendedTenants(suspendedTenants)
                .totalVehicles(totalVehicles)
                .totalReservations(totalReservations)
                .totalMrr(totalMrr)
                .totalPlatformRevenue(totalMrr * 12)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TenantDetailDto> getAllTenants() {
        return tenantRepository.findAll().stream()
                .map(this::mapToTenantDetailDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TenantDetailDto getTenantById(Long id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agence introuvable avec l'identifiant " + id));
        return mapToTenantDetailDto(tenant);
    }

    @Override
    public TenantDetailDto createAgency(CreateAgencyRequest request) {
        if (tenantRepository.findBySubdomain(request.getSubdomain()).isPresent()) {
            throw new IllegalArgumentException("Le sous-domaine '" + request.getSubdomain() + "' est déjà utilisé");
        }

        if (userRepository.findByUsername(request.getAdminUsername()).isPresent()) {
            throw new IllegalArgumentException("Le nom d'utilisateur '" + request.getAdminUsername() + "' existe déjà");
        }

        Tenant tenant = Tenant.builder()
                .name(request.getName())
                .subdomain(request.getSubdomain())
                .iceNumber(request.getIceNumber())
                .ifNumber(request.getIfNumber())
                .rcNumber(request.getRcNumber())
                .patenteNumber(request.getPatenteNumber())
                .address(request.getAddress())
                .city(request.getCity())
                .phone(request.getPhone())
                .email(request.getEmail())
                .subscriptionPlan(request.getSubscriptionPlan() != null ? request.getSubscriptionPlan() : "PRO")
                .subscriptionStatus("ACTIVE")
                .subscriptionEnd(LocalDate.now().plusMonths(12))
                .maxVehicles(request.getMaxVehicles() != null ? request.getMaxVehicles() : 50)
                .monthlyPrice(request.getMonthlyPrice() != null ? request.getMonthlyPrice() : 450.0)
                .active(true)
                .build();

        tenant = tenantRepository.save(tenant);

        User adminUser = User.builder()
                .username(request.getAdminUsername())
                .email(request.getEmail() != null ? request.getEmail() : request.getAdminUsername() + "@agency.ma")
                .password(passwordEncoder.encode(request.getAdminPassword()))
                .fullName(request.getAdminFullName() != null ? request.getAdminFullName() : "Gérant " + tenant.getName())
                .phone(request.getPhone())
                .role(Role.ADMIN_AGENCE)
                .tenant(tenant)
                .active(true)
                .build();

        userRepository.save(adminUser);

        return mapToTenantDetailDto(tenant);
    }

    @Override
    public TenantDetailDto updateAgencyPlan(Long id, UpdateAgencyPlanRequest request) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agence introuvable"));

        if (request.getSubscriptionPlan() != null) tenant.setSubscriptionPlan(request.getSubscriptionPlan());
        if (request.getSubscriptionStatus() != null) {
            tenant.setSubscriptionStatus(request.getSubscriptionStatus());
            tenant.setActive(!"SUSPENDED".equalsIgnoreCase(request.getSubscriptionStatus()) && !"EXPIRED".equalsIgnoreCase(request.getSubscriptionStatus()));
        }
        if (request.getMaxVehicles() != null) tenant.setMaxVehicles(request.getMaxVehicles());
        if (request.getMonthlyPrice() != null) tenant.setMonthlyPrice(request.getMonthlyPrice());
        if (request.getSubscriptionEnd() != null) tenant.setSubscriptionEnd(request.getSubscriptionEnd());
        if (request.getActive() != null) tenant.setActive(request.getActive());

        tenant = tenantRepository.save(tenant);
        return mapToTenantDetailDto(tenant);
    }

    @Override
    public TenantDetailDto updateAgencyStatus(Long id, String status) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agence introuvable"));

        tenant.setSubscriptionStatus(status);
        tenant.setActive(!"SUSPENDED".equalsIgnoreCase(status) && !"EXPIRED".equalsIgnoreCase(status));

        tenant = tenantRepository.save(tenant);
        return mapToTenantDetailDto(tenant);
    }

    @Override
    public void deleteAgency(Long id) {
        if (!tenantRepository.existsById(id)) {
            throw new IllegalArgumentException("Agence introuvable");
        }
        tenantRepository.deleteById(id);
    }

    @Override
    public Map<String, Object> impersonateAgency(Long id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agence introuvable"));

        List<User> users = userRepository.findByTenantId(id);
        User targetUser = users.stream()
                .filter(u -> u.getRole() == Role.ADMIN_AGENCE)
                .findFirst()
                .orElse(users.isEmpty() ? null : users.getFirst());

        if (targetUser == null) {
            throw new IllegalStateException("Aucun compte utilisateur gérant trouvé pour cette agence");
        }

        String token = tokenProvider.generateToken(targetUser);

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("tokenType", "Bearer");
        result.put("tenantId", tenant.getId());
        result.put("tenantName", tenant.getName());
        result.put("subdomain", tenant.getSubdomain());
        result.put("username", targetUser.getUsername());
        result.put("fullName", targetUser.getFullName());
        result.put("role", targetUser.getRole().name());
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> UserDto.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .fullName(u.getFullName())
                        .phone(u.getPhone())
                        .role(u.getRole())
                        .tenantId(u.getTenant() != null ? u.getTenant().getId() : null)
                        .tenantName(u.getTenant() != null ? u.getTenant().getName() : "RentFlow HQ Maroc (Central)")
                        .agencyName(u.getTenant() != null ? u.getTenant().getName() : "RentFlow HQ Maroc (Central)")
                        .active(u.isActive())
                        .createdAt(u.getCreatedAt() != null ? u.getCreatedAt().toString() : null)
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public UserDto updateUser(Long id, Map<String, String> request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable avec l'identifiant " + id));

        if (request.containsKey("fullName") && request.get("fullName") != null) {
            user.setFullName(request.get("fullName"));
        }
        if (request.containsKey("email") && request.get("email") != null) {
            user.setEmail(request.get("email"));
        }
        if (request.containsKey("phone") && request.get("phone") != null) {
            user.setPhone(request.get("phone"));
        }
        if (request.containsKey("password") && request.get("password") != null && !request.get("password").trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.get("password").trim()));
        }

        user = userRepository.save(user);

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .tenantId(user.getTenant() != null ? user.getTenant().getId() : null)
                .tenantName(user.getTenant() != null ? user.getTenant().getName() : "RentFlow HQ Maroc (Central)")
                .agencyName(user.getTenant() != null ? user.getTenant().getName() : "RentFlow HQ Maroc (Central)")
                .active(user.isActive())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }

    @Override
    public UserDto updateUserStatus(Long id, boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable avec l'identifiant " + id));
        user.setActive(active);
        user = userRepository.save(user);

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .tenantId(user.getTenant() != null ? user.getTenant().getId() : null)
                .tenantName(user.getTenant() != null ? user.getTenant().getName() : "RentFlow HQ Maroc (Central)")
                .agencyName(user.getTenant() != null ? user.getTenant().getName() : "RentFlow HQ Maroc (Central)")
                .active(user.isActive())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }

    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable avec l'identifiant " + id));
        if (user.getRole() == Role.SUPER_ADMIN) {
            throw new IllegalArgumentException("Impossible de supprimer le compte Super Admin principal.");
        }
        userRepository.delete(user);
    }

    private TenantDetailDto mapToTenantDetailDto(Tenant tenant) {
        long vehicleCount = vehicleRepository.countByTenantId(tenant.getId());
        List<User> users = userRepository.findByTenantId(tenant.getId());
        User adminUser = users.stream()
                .filter(u -> u.getRole() == Role.ADMIN_AGENCE)
                .findFirst()
                .orElse(null);

        return TenantDetailDto.builder()
                .id(tenant.getId())
                .name(tenant.getName())
                .subdomain(tenant.getSubdomain())
                .iceNumber(tenant.getIceNumber())
                .ifNumber(tenant.getIfNumber())
                .rcNumber(tenant.getRcNumber())
                .patenteNumber(tenant.getPatenteNumber())
                .address(tenant.getAddress())
                .city(tenant.getCity())
                .phone(tenant.getPhone())
                .email(tenant.getEmail())
                .logoUrl(tenant.getLogoUrl())
                .subscriptionPlan(tenant.getSubscriptionPlan())
                .subscriptionStatus(tenant.getSubscriptionStatus())
                .subscriptionEnd(tenant.getSubscriptionEnd())
                .maxVehicles(tenant.getMaxVehicles())
                .monthlyPrice(tenant.getMonthlyPrice())
                .active(tenant.isActive())
                .createdAt(tenant.getCreatedAt())
                .vehicleCount(vehicleCount)
                .adminUsername(adminUser != null ? adminUser.getUsername() : null)
                .adminFullName(adminUser != null ? adminUser.getFullName() : null)
                .build();
    }
}
