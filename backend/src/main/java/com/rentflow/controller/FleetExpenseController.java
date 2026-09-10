package com.rentflow.controller;

import com.rentflow.service.FleetExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fleet/expenses")
@RequiredArgsConstructor
public class FleetExpenseController {

    private final FleetExpenseService fleetExpenseService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getFleetExpenses() {
        return ResponseEntity.ok(fleetExpenseService.getFleetExpenses());
    }

    @PostMapping
    public ResponseEntity<?> createExpense(@RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> created = fleetExpenseService.createFleetExpense(payload);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/validate")
    public ResponseEntity<?> validateExpense(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(fleetExpenseService.validateExpense(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateExpenseStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String status = payload.get("status");
            return ResponseEntity.ok(fleetExpenseService.updateExpenseStatus(id, status));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/vehicles/{vehicleId}/status")
    public ResponseEntity<?> updateVehicleStatus(@PathVariable Long vehicleId, @RequestBody Map<String, String> payload) {
        try {
            String status = payload.get("status");
            return ResponseEntity.ok(fleetExpenseService.updateVehicleStatus(vehicleId, status));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id) {
        fleetExpenseService.deleteFleetExpense(id);
        return ResponseEntity.ok(Map.of("message", "Dépense supprimée avec succès"));
    }
}

