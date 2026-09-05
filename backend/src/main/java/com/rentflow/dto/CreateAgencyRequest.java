package com.rentflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAgencyRequest {
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

    // SaaS Plan & Quotas
    private String subscriptionPlan; // STARTER, PRO, ENTERPRISE
    private Integer maxVehicles;
    private Double monthlyPrice;

    // Admin Credentials
    private String adminUsername;
    private String adminPassword;
    private String adminFullName;
}
