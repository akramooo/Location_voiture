package com.rentflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantDetailDto {
    private Long id;
    private String name;
    private String subdomain;
    private String iceNumber;
    private String ifNumber;
    private String rcNumber;
    private String patenteNumber;
    private String address;
    private String city;
    private String phone;
    private String email;
    private String logoUrl;

    // SaaS Details
    private String subscriptionPlan;
    private String subscriptionStatus;
    private LocalDate subscriptionEnd;
    private Integer maxVehicles;
    private Double monthlyPrice;
    private boolean active;
    private LocalDateTime createdAt;

    // Aggregated Metrics
    private long vehicleCount;
    private long activeReservationsCount;
    private String adminUsername;
    private String adminFullName;
}
