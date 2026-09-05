package com.rentflow.mapper;

import com.rentflow.domain.Inspection;
import com.rentflow.dto.InspectionDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface InspectionMapper {

    @Mapping(target = "tenantId", source = "tenant.id")
    @Mapping(target = "reservationId", source = "reservation.id")
    @Mapping(target = "vehicleId", source = "vehicle.id")
    InspectionDto toDto(Inspection inspection);

    @Mapping(target = "tenant", ignore = true)
    @Mapping(target = "reservation", ignore = true)
    @Mapping(target = "vehicle", ignore = true)
    Inspection toEntity(InspectionDto inspectionDto);

    List<InspectionDto> toDtoList(List<Inspection> inspections);
}
