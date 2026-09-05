package com.rentflow.controller;

import com.rentflow.dto.*;
import com.rentflow.service.SuperAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/super-admin")
@RequiredArgsConstructor
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    @GetMapping("/kpis")
    public ResponseEntity<SuperAdminKpiDto> getPlatformKpis() {
        return ResponseEntity.ok(superAdminService.getPlatformKpis());
    }

    @GetMapping("/tenants")
    public ResponseEntity<List<TenantDetailDto>> getAllTenants() {
        return ResponseEntity.ok(superAdminService.getAllTenants());
    }

    @GetMapping("/tenants/{id}")
    public ResponseEntity<TenantDetailDto> getTenantById(@PathVariable Long id) {
        return ResponseEntity.ok(superAdminService.getTenantById(id));
    }

    @PostMapping("/tenants")
    public ResponseEntity<?> createAgency(@RequestBody CreateAgencyRequest request) {
        try {
            TenantDetailDto created = superAdminService.createAgency(request);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/tenants/{id}")
    public ResponseEntity<?> updateAgencyPlan(@PathVariable Long id, @RequestBody UpdateAgencyPlanRequest request) {
        try {
            TenantDetailDto updated = superAdminService.updateAgencyPlan(id, request);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/tenants/{id}/status")
    public ResponseEntity<?> updateAgencyStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Le statut est requis"));
        }
        try {
            TenantDetailDto updated = superAdminService.updateAgencyStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/tenants/{id}")
    public ResponseEntity<?> deleteAgency(@PathVariable Long id) {
        try {
            superAdminService.deleteAgency(id);
            return ResponseEntity.ok(Map.of("message", "Agence supprimée avec succès"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/tenants/{id}/impersonate")
    public ResponseEntity<?> impersonateAgency(@PathVariable Long id) {
        try {
            Map<String, Object> result = superAdminService.impersonateAgency(id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(superAdminService.getAllUsers());
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            UserDto updated = superAdminService.updateUser(id, request);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            boolean active = Boolean.parseBoolean(String.valueOf(body.getOrDefault("active", true)));
            UserDto updated = superAdminService.updateUserStatus(id, active);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            superAdminService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "Utilisateur supprimé avec succès"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
