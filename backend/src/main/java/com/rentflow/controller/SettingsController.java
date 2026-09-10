package com.rentflow.controller;

import com.rentflow.dto.AgencySettingsDto;
import com.rentflow.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping("/agency")
    public ResponseEntity<?> getAgencySettings() {
        try {
            AgencySettingsDto settings = settingsService.getAgencySettings();
            return ResponseEntity.ok(settings);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/agency")
    public ResponseEntity<?> updateAgencySettings(@RequestBody AgencySettingsDto dto) {
        try {
            AgencySettingsDto updated = settingsService.updateAgencySettings(dto);
            return ResponseEntity.ok(updated);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/whatsapp/generate-link")
    public ResponseEntity<?> generateWhatsAppLink(
            @RequestParam(defaultValue = "RESERVATION") String templateType,
            @RequestBody Map<String, Object> context) {
        Map<String, String> result = settingsService.generateWhatsAppLink(templateType, context);
        return ResponseEntity.ok(result);
    }
}
