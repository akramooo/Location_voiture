package com.rentflow.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(nullable = false)
    private String registrationNumber; // Format Maroc (ex: 12345-A-6 ou WW-98765)

    private String registrationType; // NORMAL ou WW

    @Column(nullable = false)
    private String brand; // Brand (e.g. Dacia, Renault, Peugeot, Volkswagen, BMW)

    @Column(nullable = false)
    private String model; // Model (e.g. Logan, Clio, 208, Golf)

    private String finish; // Finition (e.g. Stepway, Intens, GT-Line)

    @Column(name = "vehicle_year")
    private Integer year;

    private String fuelType; // DIESEL, ESSENCE, HYBRIDE, ELECTRIQUE

    private String gearbox; // MANUELLE, AUTOMATIQUE

    private Double currentMileage;

    private Double dailyRate; // Tarif journalier de base (MAD / DH)

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private VehicleStatus status = VehicleStatus.DISPONIBLE;

    private String photoUrl;
    private String greyCardUrl; // Document Carte Grise sur MinIO

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
