package com.rentflow.service;

import com.rentflow.dto.AuthResponse;
import com.rentflow.dto.LoginRequest;
import com.rentflow.dto.RegisterTenantRequest;
import com.rentflow.dto.UserDto;

import java.util.Map;

public interface AuthService {
    AuthResponse login(LoginRequest loginRequest);
    Map<String, Object> registerTenant(RegisterTenantRequest request);
    UserDto getCurrentUserDto();
}
