package com.rentflow.dto;

import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientDto {
    private Long id;
    private Long tenantId;
    private String clientType;
    private String firstName;
    private String lastName;
    private String cinPassport;
    private LocalDate cinExpiryDate;
    private String driverLicenseNumber;
    private LocalDate driverLicenseExpiry;
    private String phoneWhatsApp;
    private String email;
    private String nationality;
    private String companyName;
    private String iceNumber;
    private String ifNumber;
    private String rcNumber;
    private String designatedDriverName;
    private String designatedDriverCin;
    private Integer riskScore;
    private boolean blacklisted;
    private String blacklistReason;
}
