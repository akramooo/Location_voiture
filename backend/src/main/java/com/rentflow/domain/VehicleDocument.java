package com.rentflow.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "vehicle_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    private String docType; // ASSURANCE, VIGNETTE, VISITE_TECHNIQUE, AUTORISATION_CIRCULATION

    private LocalDate expirationDate;

    private String documentUrl; // Fichier MinIO

    private String providerName; // Nom assurance ou centre visite

    private Double cost;

    @Builder.Default
    private boolean alertSent = false;
}
