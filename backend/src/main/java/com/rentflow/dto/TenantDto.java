package com.rentflow.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantDto {
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
    private boolean active;
}
