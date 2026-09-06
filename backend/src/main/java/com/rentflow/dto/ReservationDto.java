package com.rentflow.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationDto {
    private Long id;
    private Long tenantId;
    private Long vehicleId;
    private String vehicleName;
    private String vehicleRegistration;
    private Long clientId;
    private String clientName;
    private String reservationNumber;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String pickupLocation;
    private String returnLocation;
    private String rateSeason;
    private Double dailyRate;
    private Long totalDays;
    private Double discountAmount;
    private String discountType;
    private Double totalAmount;
    private Double depositAmount;
    private Double paidAmount;
    private String paymentMethod;
    private String status;
}
