package com.rentflow.mapper;

import com.rentflow.domain.Cheque;
import com.rentflow.dto.ChequeDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ChequeMapper {

    @Mapping(target = "tenantId", source = "tenant.id")
    @Mapping(target = "reservationId", source = "reservation.id")
    ChequeDto toDto(Cheque cheque);

    @Mapping(target = "tenant", ignore = true)
    @Mapping(target = "reservation", ignore = true)
    Cheque toEntity(ChequeDto chequeDto);

    List<ChequeDto> toDtoList(List<Cheque> cheques);
}
