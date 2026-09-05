package com.rentflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterTenantRequest {
    private String agencyName;
    private String subdomain;
    private String iceNumber;
    private String ifNumber;
    private String rcNumber;
    private String patenteNumber;
    private String address;
    private String city;
    private String phone;
    private String email;

    // Compte Admin Agence
    private String adminUsername;
    private String adminPassword;
    private String adminFullName;
}
