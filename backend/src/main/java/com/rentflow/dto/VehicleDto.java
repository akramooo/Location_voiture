package com.rentflow.dto;

import com.rentflow.domain.VehicleStatus;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDto {
    private Long id;
    private Long tenantId;
    private String registrationNumber;
    private String registrationType;
    private String brand;
    private String model;
    private String finish;
    private Integer year;
    private String fuelType;
    private String gearbox;
    private Double currentMileage;
    private Double dailyRate;
    private VehicleStatus status;
    private String photoUrl;
}
