package com.rentflow.service.impl;

import com.rentflow.domain.Client;
import com.rentflow.domain.Tenant;
import com.rentflow.dto.ClientDto;
import com.rentflow.mapper.ClientMapper;
import com.rentflow.repository.ClientRepository;
import com.rentflow.repository.InvoiceRepository;
import com.rentflow.repository.ReservationRepository;
import com.rentflow.repository.TenantRepository;
import com.rentflow.security.TenantContext;
import com.rentflow.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final TenantRepository tenantRepository;
    private final ReservationRepository reservationRepository;
    private final InvoiceRepository invoiceRepository;
    private final ClientMapper clientMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ClientDto> getClients() {
        Long tenantId = TenantContext.getCurrentTenant();
        List<Client> clients = clientRepository.findByTenantId(tenantId);
        return clientMapper.toDtoList(clients);
    }

    @Override
    @Transactional(readOnly = true)
    public ClientDto getClientById(Long id) {
        Long tenantId = TenantContext.getCurrentTenant();
        Optional<Client> clientOpt = clientRepository.findById(id);

        if (clientOpt.isEmpty() || !clientOpt.get().getTenant().getId().equals(tenantId)) {
            throw new NoSuchElementException("Client non trouvé");
        }

        return clientMapper.toDto(clientOpt.get());
    }

    @Override
    public ClientDto createClient(ClientDto clientDto) {
        Long tenantId = TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow();

        // 1. Unicité du CIN / Passeport pour les particuliers
        if (clientDto.getCinPassport() != null && !clientDto.getCinPassport().trim().isEmpty()) {
            String normalizedCin = clientDto.getCinPassport().trim().toUpperCase();
            clientDto.setCinPassport(normalizedCin);
            if (clientRepository.findByTenantIdAndCinPassport(tenantId, normalizedCin).isPresent()) {
                throw new IllegalArgumentException("Un client avec le CIN / Passeport '" + normalizedCin + "' existe déjà dans votre base.");
            }
        }

        // 2. Unicité de l'ICE pour les entreprises
        if (clientDto.getIceNumber() != null && !clientDto.getIceNumber().trim().isEmpty()) {
            String normalizedIce = clientDto.getIceNumber().trim();
            clientDto.setIceNumber(normalizedIce);
            if (clientRepository.findByTenantIdAndIceNumber(tenantId, normalizedIce).isPresent()) {
                throw new IllegalArgumentException("Une entreprise avec l'ICE '" + normalizedIce + "' existe déjà dans votre base.");
            }
        }

        Client client = clientMapper.toEntity(clientDto);
        client.setTenant(tenant);

        if (client.getRiskScore() == null) {
            client.setRiskScore(90);
        }

        Client saved = clientRepository.save(client);
        return clientMapper.toDto(saved);
    }

    @Override
    public void deleteClient(Long id) {
        Long tenantId = TenantContext.getCurrentTenant();
        Optional<Client> clientOpt = clientRepository.findById(id);

        if (clientOpt.isEmpty() || !clientOpt.get().getTenant().getId().equals(tenantId)) {
            throw new NoSuchElementException("Client non trouvé");
        }

        long reservationCount = reservationRepository.countByTenantIdAndClientId(tenantId, id);
        if (reservationCount > 0) {
            throw new IllegalStateException("Impossible de supprimer ce client : " + reservationCount + " contrat(s) ou réservation(s) lui sont associés. Vous pouvez le blacklister à la place.");
        }

        long invoiceCount = invoiceRepository.countByTenantIdAndClientId(tenantId, id);
        if (invoiceCount > 0) {
            throw new IllegalStateException("Impossible de supprimer ce client : des factures lui sont rattachées.");
        }

        clientRepository.delete(clientOpt.get());
    }

    @Override
    public ClientDto updateClient(Long id, ClientDto updatedDto) {
        Long tenantId = TenantContext.getCurrentTenant();
        Optional<Client> clientOpt = clientRepository.findById(id);

        if (clientOpt.isEmpty() || !clientOpt.get().getTenant().getId().equals(tenantId)) {
            throw new NoSuchElementException("Client non trouvé");
        }

        Client existing = clientOpt.get();
        existing.setFirstName(updatedDto.getFirstName());
        existing.setLastName(updatedDto.getLastName());
        existing.setCinPassport(updatedDto.getCinPassport());
        existing.setDriverLicenseNumber(updatedDto.getDriverLicenseNumber());
        existing.setPhoneWhatsApp(updatedDto.getPhoneWhatsApp());
        existing.setEmail(updatedDto.getEmail());
        existing.setNationality(updatedDto.getNationality());
        existing.setCompanyName(updatedDto.getCompanyName());
        existing.setIceNumber(updatedDto.getIceNumber());
        existing.setIfNumber(updatedDto.getIfNumber());
        existing.setRcNumber(updatedDto.getRcNumber());

        Client saved = clientRepository.save(existing);
        return clientMapper.toDto(saved);
    }

    @Override
    public ClientDto toggleBlacklist(Long id, Map<String, String> body) {
        Long tenantId = TenantContext.getCurrentTenant();
        Optional<Client> clientOpt = clientRepository.findById(id);

        if (clientOpt.isEmpty() || !clientOpt.get().getTenant().getId().equals(tenantId)) {
            throw new NoSuchElementException("Client non trouvé");
        }

        Client client = clientOpt.get();
        boolean newStatus = !client.isBlacklisted();
        client.setBlacklisted(newStatus);
        if (newStatus) {
            client.setBlacklistReason(body.getOrDefault("reason", "Incident grave ou impayé"));
            client.setRiskScore(0);
        } else {
            client.setBlacklistReason(null);
            client.setRiskScore(75);
        }

        Client saved = clientRepository.save(client);
        return clientMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClientDto> getBlacklistedClients() {
        Long tenantId = TenantContext.getCurrentTenant();
        List<Client> list = clientRepository.findByTenantIdAndBlacklistedTrue(tenantId);
        return clientMapper.toDtoList(list);
    }
}
