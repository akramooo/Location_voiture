package com.rentflow.mapper;

import com.rentflow.domain.Reservation;
import com.rentflow.dto.ReservationDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ReservationMapper {

    @Mapping(target = "tenantId", source = "tenant.id")
    @Mapping(target = "vehicleId", source = "vehicle.id")
    @Mapping(target = "vehicleName", expression = "java(reservation.getVehicle() != null ? reservation.getVehicle().getBrand() + \" \" + reservation.getVehicle().getModel() : null)")
    @Mapping(target = "vehicleRegistration", source = "vehicle.registrationNumber")
    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "clientName", expression = "java(reservation.getClient() != null ? (\"ENTREPRISE\".equals(reservation.getClient().getClientType()) ? reservation.getClient().getCompanyName() : reservation.getClient().getFirstName() + \" \" + reservation.getClient().getLastName()) : null)")
    ReservationDto toDto(Reservation reservation);

    @Mapping(target = "tenant", ignore = true)
    @Mapping(target = "vehicle", ignore = true)
    @Mapping(target = "client", ignore = true)
    Reservation toEntity(ReservationDto reservationDto);

    List<ReservationDto> toDtoList(List<Reservation> reservations);
}
