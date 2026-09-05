package com.rentflow.controller;

import com.rentflow.dto.InspectionDto;
import com.rentflow.service.InspectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inspections")
@RequiredArgsConstructor
public class InspectionController {

    private final InspectionService inspectionService;

    @GetMapping("/reservation/{reservationId}")
    public ResponseEntity<List<InspectionDto>> getInspectionsByReservation(@PathVariable Long reservationId) {
        return ResponseEntity.ok(inspectionService.getInspectionsByReservation(reservationId));
    }

    @PostMapping("/check-in")
    public ResponseEntity<InspectionDto> performCheckIn(@RequestBody Map<String, Object> payload) {
        InspectionDto saved = inspectionService.performCheckIn(payload);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/check-out")
    public ResponseEntity<InspectionDto> performCheckOut(@RequestBody Map<String, Object> payload) {
        InspectionDto saved = inspectionService.performCheckOut(payload);
        return ResponseEntity.ok(saved);
    }
}
