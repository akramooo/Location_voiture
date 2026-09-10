package com.rentflow.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String subdomain; // ex: agence.rentapp.ma

    // Mentions légales Maroc DGI
    private String iceNumber;      // Identifiant Commun de l'Entreprise
    private String ifNumber;       // Identifiant Fiscal
    private String rcNumber;       // Registre de Commerce
    private String patenteNumber;  // Patente
    @Builder.Default
    private Double tvaRate = 20.0; // TVA 20% par défaut au Maroc

    private String address;
    private String city;
    private String phone;
    private String email;
    private String logoUrl;
    private String whatsappNumber;

    // Règles Contrats & Exploitation
    @Builder.Default
    private Double depositDefault = 5000.0;
    @Builder.Default
    private Integer dailyKmIncluded = 0; // 0 = illimité
    @Builder.Default
    private Double extraKmRate = 2.0;
    @Builder.Default
    private Integer toleranceHours = 2;
    @Builder.Default
    private Integer minDriverAge = 21;
    @Builder.Default
    private Integer minLicenseYears = 2;
    @Column(columnDefinition = "TEXT")
    private String termsAndConditions;

    // Facturation & Banque
    private String bankRib;
    private String invoiceFooter;
    @Builder.Default
    private String contractPrefix = "LOC-";
    @Builder.Default
    private String invoicePrefix = "FAC-";

    // Alertes Flotte
    @Builder.Default
    private Integer alertAssuranceDays = 30;
    @Builder.Default
    private Integer alertVisiteTechDays = 15;
    @Builder.Default
    private Integer alertVignetteDays = 30;

    // Modèles WhatsApp (Option 1 Gratuite Direct Deeplink)
    @Column(columnDefinition = "TEXT")
    private String whatsappTemplateReservation;
    @Column(columnDefinition = "TEXT")
    private String whatsappTemplateReturn;
    @Column(columnDefinition = "TEXT")
    private String whatsappTemplateFine;

    // SaaS Subscription & Quotas
    @Builder.Default
    private String subscriptionPlan = "PRO"; // STARTER, PRO, ENTERPRISE

    @Builder.Default
    private String subscriptionStatus = "ACTIVE"; // TRIAL, ACTIVE, SUSPENDED, EXPIRED

    private LocalDate subscriptionEnd;

    @Builder.Default
    private Integer maxVehicles = 50; // Quota de véhicules max

    @Builder.Default
    private Double monthlyPrice = 450.0; // Prix de l'abonnement en DH

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
