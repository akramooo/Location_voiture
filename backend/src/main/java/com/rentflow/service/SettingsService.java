package com.rentflow.service;

import com.rentflow.dto.AgencySettingsDto;

import java.util.Map;

public interface SettingsService {
    AgencySettingsDto getAgencySettings();
    AgencySettingsDto updateAgencySettings(AgencySettingsDto dto);
    Map<String, String> generateWhatsAppLink(String templateType, Map<String, Object> context);
}
