package com.rentflow.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "maintenance_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    private String serviceType; // VIDANGE, PLAQUETTES, PNEUS, REPARATION_MECANIQUE, CARROSSERIE

    private LocalDate serviceDate;

    private Double mileageAtService;

    private Double nextServiceMileage;

    private LocalDate nextServiceDate;

    private Double cost;

    private String garageName;

    private String notes;

    private String status; // EN_COURS, TERMINE, PLANIFIE
}
