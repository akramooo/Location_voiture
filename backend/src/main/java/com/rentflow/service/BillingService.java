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
    List<RadarFineDto> getRadarFines();
    RadarFineDto reallocateFine(Long id, Map<String, Object> payload);
}
