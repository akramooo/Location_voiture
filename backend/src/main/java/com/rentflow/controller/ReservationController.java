package com.rentflow.controller;

import com.rentflow.dto.ReservationDto;
import com.rentflow.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @GetMapping
    public ResponseEntity<List<ReservationDto>> getReservations() {
        return ResponseEntity.ok(reservationService.getReservations());
    }

    @GetMapping("/gantt")
    public ResponseEntity<List<Map<String, Object>>> getGanttData() {
        return ResponseEntity.ok(reservationService.getGanttData());
    }

    @PostMapping
    public ResponseEntity<?> createReservation(@RequestBody Map<String, Object> payload) {
        try {
            ReservationDto saved = reservationService.createReservation(payload);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException | NoSuchElementException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage() != null ? e.getMessage() : "Véhicule ou Client introuvable pour cette agence.");
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Erreur lors de la création : " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            ReservationDto saved = reservationService.updateStatus(id, body.get("status"));
            return ResponseEntity.ok(saved);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
