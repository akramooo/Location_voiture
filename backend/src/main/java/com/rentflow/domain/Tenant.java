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
