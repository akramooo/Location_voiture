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

    @GetMapping("/radar-fines")
    public ResponseEntity<List<RadarFineDto>> getRadarFines() {
        return ResponseEntity.ok(billingService.getRadarFines());
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
