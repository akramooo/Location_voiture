package com.rentflow.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cheques")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cheque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = true)
    private Reservation reservation;

    @Column(nullable = false)
    private String chequeNumber;

    @Column(nullable = false)
    private String bankName;

    @Column(nullable = false)
    private String issuerName;

    @Column(nullable = false)
    private Double amount;

    private LocalDate dueDate;

    @Column(nullable = false)
    private String chequeType; // CAUTION, PAIEMENT

    @Column(nullable = false)
    private String status; // EN_CAISSE, DEPOSE_BANQUE, ENCAISSE, RESTITUE, IMPAYE_REJET

    private String reservationNumber;

    private String chequeScanUrl; // URL de la photo / scan du chèque sur MinIO

    private String notes;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
