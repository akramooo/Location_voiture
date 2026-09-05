package com.rentflow.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "radar_fines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RadarFine {

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
    @JoinColumn(name = "client_id")
    private Client reallocatedClient;

    private String ticketNumber; // Numéro du PV
    private LocalDateTime violationDate;
    private String violationLocation;
    private Double fineAmount;

    private boolean reallocated = false;
    private LocalDateTime reallocationDate;
    private String status = "RECU"; // RECU, REASSIGNE, PAYE_PAR_AGENCE, PAYE_PAR_CLIENT
}
