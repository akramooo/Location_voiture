package com.rentflow.mapper;

import com.rentflow.domain.RadarFine;
import com.rentflow.dto.RadarFineDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface RadarFineMapper {

    @Mapping(target = "tenantId", source = "tenant.id")
    @Mapping(target = "vehicleId", source = "vehicle.id")
    @Mapping(target = "vehicleName", expression = "java(fine.getVehicle() != null ? fine.getVehicle().getBrand() + \" \" + fine.getVehicle().getModel() : null)")
    @Mapping(target = "vehicleRegistration", source = "vehicle.registrationNumber")
    @Mapping(target = "reallocatedClientId", source = "reallocatedClient.id")
    @Mapping(target = "clientName", expression = "java(fine.getReallocatedClient() != null ? (\"ENTREPRISE\".equals(fine.getReallocatedClient().getClientType()) ? fine.getReallocatedClient().getCompanyName() : fine.getReallocatedClient().getFirstName() + \" \" + fine.getReallocatedClient().getLastName()) : null)")
    RadarFineDto toDto(RadarFine fine);

    @Mapping(target = "tenant", ignore = true)
    @Mapping(target = "vehicle", ignore = true)
    @Mapping(target = "reallocatedClient", ignore = true)
    RadarFine toEntity(RadarFineDto fineDto);

    List<RadarFineDto> toDtoList(List<RadarFine> fines);
}
