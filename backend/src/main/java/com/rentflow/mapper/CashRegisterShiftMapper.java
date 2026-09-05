package com.rentflow.mapper;

import com.rentflow.domain.CashRegisterShift;
import com.rentflow.dto.CashRegisterShiftDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CashRegisterShiftMapper {

    @Mapping(target = "tenantId", source = "tenant.id")
    CashRegisterShiftDto toDto(CashRegisterShift shift);

    @Mapping(target = "tenant", ignore = true)
    CashRegisterShift toEntity(CashRegisterShiftDto shiftDto);

    List<CashRegisterShiftDto> toDtoList(List<CashRegisterShift> shifts);
}
