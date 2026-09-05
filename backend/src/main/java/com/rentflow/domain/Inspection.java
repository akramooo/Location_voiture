package com.rentflow.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inspections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    private String type; // CHECK_IN (Départ) ou CHECK_OUT (Retour)

    private Double mileage;

    private String fuelLevel; // 1/4, 1/2, 3/4, PLEIN

    @Column(columnDefinition = "TEXT")
    private String damageMarkersJson; // Coordonnées 2D des rayures, bosses, fissures

    @Column(columnDefinition = "TEXT")
    private String photoUrlsJson; // Liste des URLs des 4-8 photos horodatées sur MinIO

    private Double cautionAmount;
    private String cautionType; // PRE_AUTORISATION_TPE, CHEQUE, ESPECES
    private String cautionStatus; // ACTIVE, RESTITUEE, RETENUE_PARTIELLE, RETENUE_TOTALE

    @Builder.Default
    private Double extraFeesAmount = 0.0; // Frais km sup, carburant manquant, retard, nettoyage
    private String extraFeesNotes;

    @Column(columnDefinition = "TEXT")
    private String signatureBase64; // Image de la signature tactile du client

    private String pdfContractUrl; // URL du contrat PDF signé généré

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
