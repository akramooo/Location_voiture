package com.rentflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgencySettingsDto {
    private Long id;
    private String name;
    private String subdomain;
    private String iceNumber;
    private String ifNumber;
    private String rcNumber;
    private String patenteNumber;
    private Double tvaRate;
    private String address;
    private String city;
    private String phone;
    private String email;
    private String logoUrl;
    private String whatsappNumber;

    // Règles Contrat
    private Double depositDefault;
    private Integer dailyKmIncluded;
    private Double extraKmRate;
    private Integer toleranceHours;
    private Integer minDriverAge;
    private Integer minLicenseYears;
    private String termsAndConditions;

    // Facturation & Banque
    private String bankRib;
    private String invoiceFooter;
    private String contractPrefix;
    private String invoicePrefix;

    // Alertes
    private Integer alertAssuranceDays;
    private Integer alertVisiteTechDays;
    private Integer alertVignetteDays;

    // WhatsApp Templates (Option 1 Gratuite)
    private String whatsappTemplateReservation;
    private String whatsappTemplateReturn;
    private String whatsappTemplateFine;
}
