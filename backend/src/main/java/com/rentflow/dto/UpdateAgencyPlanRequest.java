package com.rentflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAgencyPlanRequest {
    private String subscriptionPlan;
    private String subscriptionStatus;
    private Integer maxVehicles;
    private Double monthlyPrice;
    private LocalDate subscriptionEnd;
    private Boolean active;
}
