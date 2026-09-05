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
    public ResponseEntity<ClientDto> createClient(@RequestBody ClientDto clientDto) {
        ClientDto saved = clientService.createClient(clientDto);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateClient(@PathVariable Long id, @RequestBody ClientDto updatedDto) {
        try {
            ClientDto saved = clientService.updateClient(id, updatedDto);
            return ResponseEntity.ok(saved);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
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
