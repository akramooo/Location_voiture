package com.rentflow.dto;

import com.rentflow.domain.Role;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private Role role;
    private Long tenantId;
    private String tenantName;
    private String agencyName;
    private boolean active;
    private String createdAt;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class UpdateUserRequestHolder {
    private String fullName;
    private String email;
    private String phone;
    private String password;
}

