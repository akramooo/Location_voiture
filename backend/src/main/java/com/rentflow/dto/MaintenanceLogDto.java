package com.rentflow.dto;

import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceLogDto {
    private Long id;
    private Long vehicleId;
    private String serviceType;
    private LocalDate serviceDate;
    private Double mileageAtService;
    private Double nextServiceMileage;
    private Double cost;
    private String garageName;
    private String notes;
    private String invoiceScanUrl;
    private String status;
}
