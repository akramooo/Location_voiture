package com.rentflow.mapper;

import com.rentflow.domain.Vehicle;
import com.rentflow.dto.VehicleDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface VehicleMapper {

    @Mapping(target = "tenantId", source = "tenant.id")
    VehicleDto toDto(Vehicle vehicle);

    @Mapping(target = "tenant", ignore = true)
    Vehicle toEntity(VehicleDto vehicleDto);

    List<VehicleDto> toDtoList(List<Vehicle> vehicles);
}
