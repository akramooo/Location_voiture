package com.rentflow.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RadarFineDto {
    private Long id;
    private Long tenantId;
    private Long vehicleId;
    private String vehicleName;
    private String vehicleRegistration;
    private Long reallocatedClientId;
    private String clientName;
    private String ticketNumber;
    private LocalDateTime violationDate;
    private String violationLocation;
    private Double fineAmount;
    private boolean reallocated;
    private LocalDateTime reallocationDate;
    private String status;
}
