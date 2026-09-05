package com.rentflow.controller;

import com.rentflow.domain.VehicleStatus;
import com.rentflow.dto.MaintenanceLogDto;
import com.rentflow.dto.VehicleDto;
import com.rentflow.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    public ResponseEntity<List<VehicleDto>> getVehicles(@RequestParam(required = false) VehicleStatus status) {
        return ResponseEntity.ok(vehicleService.getVehicles(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getVehicleById(@PathVariable Long id) {
        try {
            Map<String, Object> details = vehicleService.getVehicleDetails(id);
            return ResponseEntity.ok(details);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<VehicleDto> createVehicle(@RequestBody VehicleDto vehicleDto) {
        VehicleDto saved = vehicleService.createVehicle(vehicleDto);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateVehicle(@PathVariable Long id, @RequestBody VehicleDto updatedDto) {
        try {
            VehicleDto saved = vehicleService.updateVehicle(id, updatedDto);
            return ResponseEntity.ok(saved);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVehicle(@PathVariable Long id) {
        try {
            vehicleService.deleteVehicle(id);
            return ResponseEntity.ok().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<Map<String, Object>>> getFleetAlerts() {
        return ResponseEntity.ok(vehicleService.getFleetAlerts());
    }

    @PostMapping("/{id}/maintenance")
    public ResponseEntity<?> addMaintenanceLog(@PathVariable Long id, @RequestBody MaintenanceLogDto logDto) {
        try {
            MaintenanceLogDto saved = vehicleService.addMaintenanceLog(id, logDto);
            return ResponseEntity.ok(saved);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

