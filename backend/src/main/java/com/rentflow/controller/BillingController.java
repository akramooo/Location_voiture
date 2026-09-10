package com.rentflow.controller;

import com.rentflow.dto.CashRegisterShiftDto;
import com.rentflow.dto.InvoiceDto;
import com.rentflow.dto.RadarFineDto;
import com.rentflow.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @GetMapping("/invoices")
    public ResponseEntity<List<InvoiceDto>> getInvoices() {
        return ResponseEntity.ok(billingService.getInvoices());
    }

    @PostMapping("/invoices")
    public ResponseEntity<InvoiceDto> generateInvoice(@RequestBody Map<String, Object> payload) {
        InvoiceDto saved = billingService.generateInvoice(payload);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/cash-register/close")
    public ResponseEntity<CashRegisterShiftDto> closeShiftCashRegister(@RequestBody Map<String, Object> payload) {
        CashRegisterShiftDto saved = billingService.closeShiftCashRegister(payload);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/cash-register/shifts")
    public ResponseEntity<List<CashRegisterShiftDto>> getCashRegisterShifts() {
        return ResponseEntity.ok(billingService.getCashRegisterShifts());
    }

    @GetMapping("/cheques")
    public ResponseEntity<List<com.rentflow.dto.ChequeDto>> getCheques() {
        return ResponseEntity.ok(billingService.getCheques());
    }

    @PostMapping("/cheques")
    public ResponseEntity<com.rentflow.dto.ChequeDto> createCheque(@RequestBody com.rentflow.dto.ChequeDto dto) {
        return ResponseEntity.ok(billingService.createCheque(dto));
    }

    @PatchMapping("/cheques/{id}/status")
    public ResponseEntity<com.rentflow.dto.ChequeDto> updateChequeStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String status = payload.getOrDefault("status", "EN_CAISSE");
        return ResponseEntity.ok(billingService.updateChequeStatus(id, status));
    }

    @DeleteMapping("/cheques/{id}")
    public ResponseEntity<Void> deleteCheque(@PathVariable Long id) {
        billingService.deleteCheque(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/radar-fines")
    public ResponseEntity<List<RadarFineDto>> getRadarFines() {
        return ResponseEntity.ok(billingService.getRadarFines());
    }

    @PostMapping("/radar-fines")
    public ResponseEntity<?> createRadarFine(@RequestBody RadarFineDto dto) {
        try {
            RadarFineDto saved = billingService.createRadarFine(dto);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/radar-fines/{id}")
    public ResponseEntity<?> updateRadarFine(@PathVariable Long id, @RequestBody RadarFineDto dto) {
        try {
            RadarFineDto updated = billingService.updateRadarFine(id, dto);
            return ResponseEntity.ok(updated);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/radar-fines/{id}")
    public ResponseEntity<Void> deleteRadarFine(@PathVariable Long id) {
        billingService.deleteRadarFine(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/radar-fines/{id}/reallocate")
    public ResponseEntity<?> reallocateFine(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            RadarFineDto saved = billingService.reallocateFine(id, payload);
            return ResponseEntity.ok(saved);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
