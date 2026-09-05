package com.rentflow.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceDto {
    private Long id;
    private Long tenantId;
    private Long reservationId;
    private Long clientId;
    private String clientName;
    private String invoiceNumber;
    private String iceAgency;
    private String ifAgency;
    private String rcAgency;
    private String iceClient;
    private Double totalHT;
    private Double tvaRate;
    private Double totalTVA;
    private Double totalTTC;
    private String paymentStatus;
    private String pdfInvoiceUrl;
    private LocalDateTime createdAt;
}
