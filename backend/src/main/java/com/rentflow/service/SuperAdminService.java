package com.rentflow.service;

import com.rentflow.dto.*;
import java.util.List;
import java.util.Map;

public interface SuperAdminService {
    SuperAdminKpiDto getPlatformKpis();
    List<TenantDetailDto> getAllTenants();
    TenantDetailDto getTenantById(Long id);
    TenantDetailDto createAgency(CreateAgencyRequest request);
    TenantDetailDto updateAgencyPlan(Long id, UpdateAgencyPlanRequest request);
    TenantDetailDto updateAgencyStatus(Long id, String status);
    void deleteAgency(Long id);
    Map<String, Object> impersonateAgency(Long id);
    List<UserDto> getAllUsers();
    UserDto updateUser(Long id, Map<String, String> request);
    UserDto updateUserStatus(Long id, boolean active);
    void deleteUser(Long id);
}
