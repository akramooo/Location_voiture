package com.rentflow.dto;

import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDocumentDto {
    private Long id;
    private Long vehicleId;
    private String docType;
    private LocalDate expirationDate;
    private String providerName;
    private Double cost;
    private String documentScanUrl;
}
