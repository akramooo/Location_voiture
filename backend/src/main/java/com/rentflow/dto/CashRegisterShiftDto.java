package com.rentflow.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CashRegisterShiftDto {
    private Long id;
    private Long tenantId;
    private LocalDateTime shiftStart;
    private LocalDateTime shiftEnd;
    private Double startingCash;
    private Double totalCashReceived;
    private Double totalTpeReceived;
    private Double totalCheckReceived;
    private Double totalTransferReceived;
    private Double expectedCashInHand;
    private Double actualCashInHand;
    private Double cashDifference;
    private String status;
    private String notes;
}
