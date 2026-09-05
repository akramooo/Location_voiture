package com.rentflow.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(nullable = false, unique = true)
    private String invoiceNumber; // Format chronologique sans rupture: FAC-2026-00001

    private String iceAgency;
    private String ifAgency;
    private String rcAgency;

    private String iceClient;

    private Double totalHT;
    @Builder.Default
    private Double tvaRate = 20.0;
    private Double totalTVA;
    private Double totalTTC;

    @Builder.Default
    private String paymentStatus = "PAYEE"; // EMISE, PAYEE, ANNULEE

    private String pdfInvoiceUrl;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
