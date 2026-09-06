package com.rentflow.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(nullable = false, unique = true)
    private String reservationNumber; // ex: RES-2026-001

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private String pickupLocation;
    private String returnLocation;

    private String rateSeason; // BASSE, MOYENNE, HAUTE
    private Double dailyRate;
    private Long totalDays;

    @Builder.Default
    private Double discountAmount = 0.0;
    private String discountType; // MAD, PERCENT

    @Builder.Default
    private Double optionsAmount = 0.0;
    @Builder.Default
    private Double totalAmount = 0.0;
    @Builder.Default
    private Double depositAmount = 0.0;
    @Builder.Default
    private Double paidAmount = 0.0;

    private String paymentMethod; // ESPECES, VIREMENT, TPE, CHEQUE

    @Column(length = 2000)
    private String optionsJson; // JSON des options choisies (Siège bébé, GPS, etc.)

    @Builder.Default
    private String status = "CONFIRMEE"; // EN_ATTENTE, CONFIRMEE, EN_COURS, TERMINEE, ANNULEE

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
