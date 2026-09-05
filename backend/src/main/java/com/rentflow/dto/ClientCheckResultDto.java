package com.rentflow.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientCheckResultDto {
    private String cin;
    private boolean existsInCurrentTenant;
    private String existingClientName;
    private Long existingClientId;
    
    // Global Shared Anti-Fraud Network
    private int globalBlacklistCount;
    private boolean isMultiBlacklisted;
    private List<String> blacklistReasons;
    private Integer suggestedRiskScore;
    private String warningMessage;
}
