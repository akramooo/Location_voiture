package com.rentflow.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cash_register_shifts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashRegisterShift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User agent;

    private LocalDateTime shiftStart;
    private LocalDateTime shiftEnd;

    private Double startingCash = 0.0;
    private Double totalCashReceived = 0.0;
    private Double totalTpeReceived = 0.0;
    private Double totalCheckReceived = 0.0;
    private Double totalTransferReceived = 0.0;

    private Double expectedCashInHand = 0.0;
    private Double actualCashInHand = 0.0;
    private Double cashDifference = 0.0;

    private String status = "OUVERT"; // OUVERT, CLOTURE

    private String notes;
}
