package com.rentflow.service;

import com.rentflow.dto.CashRegisterShiftDto;
import com.rentflow.dto.InvoiceDto;
import com.rentflow.dto.RadarFineDto;

import java.util.List;
import java.util.Map;

public interface BillingService {
    List<InvoiceDto> getInvoices();
    InvoiceDto generateInvoice(Map<String, Object> payload);
    CashRegisterShiftDto closeShiftCashRegister(Map<String, Object> payload);
    List<CashRegisterShiftDto> getCashRegisterShifts();
    List<com.rentflow.dto.ChequeDto> getCheques();
    com.rentflow.dto.ChequeDto createCheque(com.rentflow.dto.ChequeDto dto);
    com.rentflow.dto.ChequeDto updateChequeStatus(Long id, String status);
    void deleteCheque(Long id);
    List<RadarFineDto> getRadarFines();
    RadarFineDto createRadarFine(RadarFineDto dto);
    RadarFineDto updateRadarFine(Long id, RadarFineDto dto);
    void deleteRadarFine(Long id);
    RadarFineDto reallocateFine(Long id, Map<String, Object> payload);
}
