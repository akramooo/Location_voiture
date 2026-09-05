package com.rentflow.controller;

import com.rentflow.dto.ClientDto;
import com.rentflow.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    public ResponseEntity<List<ClientDto>> getClients() {
        return ResponseEntity.ok(clientService.getClients());
    }

    @GetMapping("/check-cin")
    public ResponseEntity<?> checkCin(
            @RequestParam(required = false) String cin,
            @RequestParam(required = false) String ice) {
        return ResponseEntity.ok(clientService.checkCin(cin, ice));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getClientById(@PathVariable Long id) {
        try {
            ClientDto clientDto = clientService.getClientById(id);
            return ResponseEntity.ok(clientDto);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createClient(@RequestBody ClientDto clientDto) {
        try {
            ClientDto saved = clientService.createClient(clientDto);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteClient(@PathVariable Long id) {
        try {
            clientService.deleteClient(id);
            return ResponseEntity.ok(Map.of("message", "Client supprimé avec succès"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateClient(@PathVariable Long id, @RequestBody ClientDto updatedDto) {
        try {
            ClientDto saved = clientService.updateClient(id, updatedDto);
            return ResponseEntity.ok(saved);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/blacklist")
    public ResponseEntity<?> toggleBlacklist(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            ClientDto saved = clientService.toggleBlacklist(id, body);
            return ResponseEntity.ok(saved);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/blacklist")
    public ResponseEntity<List<ClientDto>> getBlacklistedClients() {
        return ResponseEntity.ok(clientService.getBlacklistedClients());
    }
}
