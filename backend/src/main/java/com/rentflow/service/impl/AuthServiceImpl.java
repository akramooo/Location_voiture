package com.rentflow.service.impl;

import com.rentflow.domain.Role;
import com.rentflow.domain.Tenant;
import com.rentflow.domain.User;
import com.rentflow.dto.AuthResponse;
import com.rentflow.dto.LoginRequest;
import com.rentflow.dto.RegisterTenantRequest;
import com.rentflow.dto.UserDto;
import com.rentflow.repository.TenantRepository;
import com.rentflow.repository.UserRepository;
import com.rentflow.security.JwtTokenProvider;
import com.rentflow.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        User user = userRepository.findByUsername(loginRequest.getUsername()).orElse(null);

        if (user == null || !passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Nom d'utilisateur ou mot de passe incorrect");
        }

        if (!user.isActive()) {
            throw new IllegalStateException("Compte désactivé. Veuillez contacter le support.");
        }

        String token = tokenProvider.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .tenantId(user.getTenant() != null ? user.getTenant().getId() : null)
                .tenantName(user.getTenant() != null ? user.getTenant().getName() : "Global")
                .tenantSubdomain(user.getTenant() != null ? user.getTenant().getSubdomain() : "admin")
                .build();
    }

    @Override
    public Map<String, Object> registerTenant(RegisterTenantRequest request) {
        if (tenantRepository.findBySubdomain(request.getSubdomain()).isPresent()) {
            throw new IllegalArgumentException("Le sous-domaine existe déjà");
        }

        if (userRepository.findByUsername(request.getAdminUsername()).isPresent()) {
            throw new IllegalArgumentException("Le nom d'utilisateur existe déjà");
        }

        Tenant tenant = Tenant.builder()
                .name(request.getAgencyName())
                .subdomain(request.getSubdomain())
                .iceNumber(request.getIceNumber())
                .ifNumber(request.getIfNumber())
                .rcNumber(request.getRcNumber())
                .patenteNumber(request.getPatenteNumber())
                .address(request.getAddress())
                .city(request.getCity())
                .phone(request.getPhone())
                .email(request.getEmail())
                .active(true)
                .build();

        tenant = tenantRepository.save(tenant);

        User adminUser = User.builder()
                .username(request.getAdminUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getAdminPassword()))
                .fullName(request.getAdminFullName())
                .phone(request.getPhone())
                .role(Role.ADMIN_AGENCE)
                .tenant(tenant)
                .active(true)
                .build();

        userRepository.save(adminUser);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Agence enregistrée avec succès");
        result.put("tenantId", tenant.getId());
        result.put("subdomain", tenant.getSubdomain());
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getCurrentUserDto() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof User)) {
            throw new IllegalStateException("Utilisateur non authentifié");
        }
        User user = (User) auth.getPrincipal();

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .tenantId(user.getTenant() != null ? user.getTenant().getId() : null)
                .tenantName(user.getTenant() != null ? user.getTenant().getName() : null)
                .active(user.isActive())
                .build();
    }
}
