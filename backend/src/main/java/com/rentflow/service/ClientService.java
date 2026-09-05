package com.rentflow.service;

import com.rentflow.dto.ClientDto;

import java.util.List;
import java.util.Map;

public interface ClientService {
    List<ClientDto> getClients();
    ClientDto getClientById(Long id);
    ClientDto createClient(ClientDto clientDto);
    ClientDto updateClient(Long id, ClientDto updatedDto);
    void deleteClient(Long id);
    ClientDto toggleBlacklist(Long id, Map<String, String> body);
    List<ClientDto> getBlacklistedClients();
}
