package com.rentflow.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionDto {
    private Long id;
    private Long tenantId;
    private Long reservationId;
    private Long vehicleId;
    private String type;
    private Double mileage;
    private String fuelLevel;
    private String damageMarkersJson;
    private String photoUrlsJson;
    private Double cautionAmount;
    private String cautionType;
    private String cautionStatus;
    private String signatureBase64;
    private Double extraFeesAmount;
    private String extraFeesNotes;
    private String pdfContractUrl;
}
