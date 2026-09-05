package com.rentflow.mapper;

import com.rentflow.domain.Client;
import com.rentflow.dto.ClientDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ClientMapper {

    @Mapping(target = "tenantId", source = "tenant.id")
    ClientDto toDto(Client client);

    @Mapping(target = "tenant", ignore = true)
    Client toEntity(ClientDto clientDto);

    List<ClientDto> toDtoList(List<Client> clients);
}
