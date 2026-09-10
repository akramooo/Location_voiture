package com.rentflow.service.impl;

import com.rentflow.domain.Tenant;
import com.rentflow.dto.AgencySettingsDto;
import com.rentflow.repository.TenantRepository;
import com.rentflow.security.TenantContext;
import com.rentflow.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional
public class SettingsServiceImpl implements SettingsService {

    private final TenantRepository tenantRepository;

    @Override
    @Transactional(readOnly = true)
    public AgencySettingsDto getAgencySettings() {
        Long tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) tenantId = 1L;

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new NoSuchElementException("Agence non trouvée pour le tenant ID: " + TenantContext.getCurrentTenant()));

        return mapToDto(tenant);
    }

    @Override
    public AgencySettingsDto updateAgencySettings(AgencySettingsDto dto) {
        Long tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) tenantId = 1L;

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new NoSuchElementException("Agence non trouvée"));

        if (dto.getName() != null && !dto.getName().isBlank()) tenant.setName(dto.getName().trim());
        if (dto.getIceNumber() != null) tenant.setIceNumber(dto.getIceNumber().trim());
        if (dto.getIfNumber() != null) tenant.setIfNumber(dto.getIfNumber().trim());
        if (dto.getRcNumber() != null) tenant.setRcNumber(dto.getRcNumber().trim());
        if (dto.getPatenteNumber() != null) tenant.setPatenteNumber(dto.getPatenteNumber().trim());
        if (dto.getTvaRate() != null) tenant.setTvaRate(dto.getTvaRate());
        if (dto.getAddress() != null) tenant.setAddress(dto.getAddress().trim());
        if (dto.getCity() != null) tenant.setCity(dto.getCity().trim());
        if (dto.getPhone() != null) tenant.setPhone(dto.getPhone().trim());
        if (dto.getEmail() != null) tenant.setEmail(dto.getEmail().trim());
        if (dto.getLogoUrl() != null) tenant.setLogoUrl(dto.getLogoUrl().trim());
        if (dto.getWhatsappNumber() != null) tenant.setWhatsappNumber(dto.getWhatsappNumber().trim());

        // Règles Contrat
        if (dto.getDepositDefault() != null) tenant.setDepositDefault(dto.getDepositDefault());
        if (dto.getDailyKmIncluded() != null) tenant.setDailyKmIncluded(dto.getDailyKmIncluded());
        if (dto.getExtraKmRate() != null) tenant.setExtraKmRate(dto.getExtraKmRate());
        if (dto.getToleranceHours() != null) tenant.setToleranceHours(dto.getToleranceHours());
        if (dto.getMinDriverAge() != null) tenant.setMinDriverAge(dto.getMinDriverAge());
        if (dto.getMinLicenseYears() != null) tenant.setMinLicenseYears(dto.getMinLicenseYears());
        if (dto.getTermsAndConditions() != null) tenant.setTermsAndConditions(dto.getTermsAndConditions());

        // Facturation
        if (dto.getBankRib() != null) tenant.setBankRib(dto.getBankRib().trim());
        if (dto.getInvoiceFooter() != null) tenant.setInvoiceFooter(dto.getInvoiceFooter().trim());
        if (dto.getContractPrefix() != null) tenant.setContractPrefix(dto.getContractPrefix().trim());
        if (dto.getInvoicePrefix() != null) tenant.setInvoicePrefix(dto.getInvoicePrefix().trim());

        // Alertes
        if (dto.getAlertAssuranceDays() != null) tenant.setAlertAssuranceDays(dto.getAlertAssuranceDays());
        if (dto.getAlertVisiteTechDays() != null) tenant.setAlertVisiteTechDays(dto.getAlertVisiteTechDays());
        if (dto.getAlertVignetteDays() != null) tenant.setAlertVignetteDays(dto.getAlertVignetteDays());

        // WhatsApp Templates
        if (dto.getWhatsappTemplateReservation() != null) tenant.setWhatsappTemplateReservation(dto.getWhatsappTemplateReservation());
        if (dto.getWhatsappTemplateReturn() != null) tenant.setWhatsappTemplateReturn(dto.getWhatsappTemplateReturn());
        if (dto.getWhatsappTemplateFine() != null) tenant.setWhatsappTemplateFine(dto.getWhatsappTemplateFine());

        Tenant saved = tenantRepository.save(tenant);
        return mapToDto(saved);
    }

    @Override
    public Map<String, String> generateWhatsAppLink(String templateType, Map<String, Object> context) {
        Long tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) tenantId = 1L;

        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);

        String rawTemplate = "";
        if ("RESERVATION".equalsIgnoreCase(templateType)) {
            rawTemplate = (tenant != null && tenant.getWhatsappTemplateReservation() != null)
                    ? tenant.getWhatsappTemplateReservation()
                    : "Bonjour {clientName}, votre réservation N° {reservationNumber} pour le véhicule {vehicleName} du {startDate} au {endDate} est confirmée par l'agence {agencyName}. Montant total: {totalAmount} MAD. Merci de votre confiance !";
        } else if ("RETURN".equalsIgnoreCase(templateType)) {
            rawTemplate = (tenant != null && tenant.getWhatsappTemplateReturn() != null)
                    ? tenant.getWhatsappTemplateReturn()
                    : "Bonjour {clientName}, nous vous rappelons que la restitution de votre véhicule {vehicleName} (Contrat {reservationNumber}) est prévue le {endDate} à {agencyCity}. Bonne route !";
        } else if ("FINE".equalsIgnoreCase(templateType)) {
            rawTemplate = (tenant != null && tenant.getWhatsappTemplateFine() != null)
                    ? tenant.getWhatsappTemplateFine()
                    : "Bonjour {clientName}, nous vous informons d'un avis d'infraction N° {ticketNumber} pour le véhicule {vehicleName} le {violationDate} d'un montant de {fineAmount} MAD. Merci de prendre contact avec l'agence {agencyName}.";
        } else {
            rawTemplate = "Bonjour {clientName}, message de votre agence de location {agencyName}.";
        }

        String agencyName = tenant != null ? tenant.getName() : "RentFlow Location";
        String agencyCity = tenant != null ? (tenant.getCity() != null ? tenant.getCity() : "Casablanca") : "Casablanca";

        String message = rawTemplate
                .replace("{agencyName}", agencyName)
                .replace("{agencyCity}", agencyCity)
                .replace("{clientName}", String.valueOf(context.getOrDefault("clientName", "Client")))
                .replace("{reservationNumber}", String.valueOf(context.getOrDefault("reservationNumber", "RES-2026-0001")))
                .replace("{vehicleName}", String.valueOf(context.getOrDefault("vehicleName", "Véhicule")))
                .replace("{startDate}", String.valueOf(context.getOrDefault("startDate", "10/09/2026")))
                .replace("{endDate}", String.valueOf(context.getOrDefault("endDate", "15/09/2026")))
                .replace("{totalAmount}", String.valueOf(context.getOrDefault("totalAmount", "1500.00")))
                .replace("{ticketNumber}", String.valueOf(context.getOrDefault("ticketNumber", "PV-2026-9901")))
                .replace("{violationDate}", String.valueOf(context.getOrDefault("violationDate", "10/09/2026")))
                .replace("{fineAmount}", String.valueOf(context.getOrDefault("fineAmount", "300.00")));

        String phone = String.valueOf(context.getOrDefault("phone", "")).replaceAll("[^0-9]", "");
        if (phone.startsWith("0")) {
            phone = "212" + phone.substring(1);
        }

        String encodedMessage = URLEncoder.encode(message, StandardCharsets.UTF_8);
        String deepLink = "https://wa.me/" + phone + "?text=" + encodedMessage;

        Map<String, String> res = new HashMap<>();
        res.put("phone", phone);
        res.put("message", message);
        res.put("deepLink", deepLink);

        return res;
    }

    private AgencySettingsDto mapToDto(Tenant tenant) {
        return AgencySettingsDto.builder()
                .id(tenant.getId())
                .name(tenant.getName())
                .subdomain(tenant.getSubdomain())
                .iceNumber(tenant.getIceNumber() != null ? tenant.getIceNumber() : "80234567800012")
                .ifNumber(tenant.getIfNumber() != null ? tenant.getIfNumber() : "45678901")
                .rcNumber(tenant.getRcNumber() != null ? tenant.getRcNumber() : "RCS Casa B 802345")
                .patenteNumber(tenant.getPatenteNumber() != null ? tenant.getPatenteNumber() : "7711A")
                .tvaRate(tenant.getTvaRate() != null ? tenant.getTvaRate() : 20.0)
                .address(tenant.getAddress() != null ? tenant.getAddress() : "Angle Bd Zerktouni & Bd d'Anfa")
                .city(tenant.getCity() != null ? tenant.getCity() : "Casablanca")
                .phone(tenant.getPhone() != null ? tenant.getPhone() : "+212 5 22 00 11 22")
                .email(tenant.getEmail() != null ? tenant.getEmail() : "contact@rentflow.ma")
                .logoUrl(tenant.getLogoUrl())
                .whatsappNumber(tenant.getWhatsappNumber() != null ? tenant.getWhatsappNumber() : "+212 6 12 34 56 78")
                .depositDefault(tenant.getDepositDefault() != null ? tenant.getDepositDefault() : 5000.0)
                .dailyKmIncluded(tenant.getDailyKmIncluded() != null ? tenant.getDailyKmIncluded() : 0)
                .extraKmRate(tenant.getExtraKmRate() != null ? tenant.getExtraKmRate() : 2.0)
                .toleranceHours(tenant.getToleranceHours() != null ? tenant.getToleranceHours() : 2)
                .minDriverAge(tenant.getMinDriverAge() != null ? tenant.getMinDriverAge() : 21)
                .minLicenseYears(tenant.getMinLicenseYears() != null ? tenant.getMinLicenseYears() : 2)
                .termsAndConditions(tenant.getTermsAndConditions() != null ? tenant.getTermsAndConditions() : "Le locataire s'engage à restituer le véhicule avec le même niveau de carburant et dans un état propre.")
                .bankRib(tenant.getBankRib() != null ? tenant.getBankRib() : "Attijariwafa Bank - 007 780 0001234567890123 45")
                .invoiceFooter(tenant.getInvoiceFooter() != null ? tenant.getInvoiceFooter() : "Société à Responsabilité Limitée au capital de 100 000 DH - En cas de litige, le tribunal de commerce de Casablanca est seul compétent.")
                .contractPrefix(tenant.getContractPrefix() != null ? tenant.getContractPrefix() : "LOC-")
                .invoicePrefix(tenant.getInvoicePrefix() != null ? tenant.getInvoicePrefix() : "FAC-")
                .alertAssuranceDays(tenant.getAlertAssuranceDays() != null ? tenant.getAlertAssuranceDays() : 30)
                .alertVisiteTechDays(tenant.getAlertVisiteTechDays() != null ? tenant.getAlertVisiteTechDays() : 15)
                .alertVignetteDays(tenant.getAlertVignetteDays() != null ? tenant.getAlertVignetteDays() : 30)
                .whatsappTemplateReservation(tenant.getWhatsappTemplateReservation() != null ? tenant.getWhatsappTemplateReservation() : "Bonjour {clientName}, votre réservation N° {reservationNumber} pour le véhicule {vehicleName} du {startDate} au {endDate} est confirmée par l'agence {agencyName}. Montant total: {totalAmount} MAD. Merci de votre confiance !")
                .whatsappTemplateReturn(tenant.getWhatsappTemplateReturn() != null ? tenant.getWhatsappTemplateReturn() : "Bonjour {clientName}, nous vous rappelons que la restitution de votre véhicule {vehicleName} (Contrat {reservationNumber}) est prévue le {endDate} à {agencyCity}. Bonne route !")
                .whatsappTemplateFine(tenant.getWhatsappTemplateFine() != null ? tenant.getWhatsappTemplateFine() : "Bonjour {clientName}, nous vous informons d'un avis d'infraction N° {ticketNumber} pour le véhicule {vehicleName} le {violationDate} d'un montant de {fineAmount} MAD. Merci de prendre contact avec l'agence {agencyName}.")
                .build();
    }
}
