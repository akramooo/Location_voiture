package com.rentflow.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "clients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    private String clientType; // PARTICULIER ou ENTREPRISE

    // Particulier
    private String firstName;
    private String lastName;
    private String cinPassport;
    private LocalDate cinExpiryDate;
    private String driverLicenseNumber;
    private LocalDate driverLicenseExpiry;
    private LocalDate driverLicenseObtainedDate;
    private String phoneWhatsApp;
    private String email;
    private String nationality;

    // Entreprise B2B
    private String companyName;
    private String iceNumber;
    private String ifNumber;
    private String rcNumber;
    private String designatedDriverName;
    private String designatedDriverCin;

    // Documents MinIO
    private String cinScanFrontUrl;
    private String cinScanBackUrl;
    private String licenseScanUrl;

    // Scoring & Anti-Fraude
    private Integer riskScore = 90; // Score de 0 (Très Risqué) à 100 (Excellente Confiance)
    private boolean blacklisted = false;
    private String blacklistReason;

    private LocalDateTime createdAt = LocalDateTime.now();
}
