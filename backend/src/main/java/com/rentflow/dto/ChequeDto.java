package com.rentflow.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChequeDto {
    private Long id;
    private Long tenantId;
    private Long reservationId;
    private String chequeNumber;
    private String bankName;
    private String issuerName;
    private Double amount;
    private LocalDate dueDate;
    private String chequeType; // CAUTION, PAIEMENT
    private String status; // EN_CAISSE, DEPOSE_BANQUE, ENCAISSE, RESTITUE, IMPAYE_REJET
    private String reservationNumber;
    private String chequeScanUrl;
    private String notes;
    private LocalDateTime createdAt;
}
