package com.rentflow.service.impl;

import com.rentflow.domain.CashRegisterShift;
import com.rentflow.domain.Client;
import com.rentflow.domain.Invoice;
import com.rentflow.domain.RadarFine;
import com.rentflow.domain.Reservation;
import com.rentflow.domain.Tenant;
import com.rentflow.domain.User;
import com.rentflow.dto.CashRegisterShiftDto;
import com.rentflow.dto.InvoiceDto;
import com.rentflow.dto.RadarFineDto;
import com.rentflow.mapper.CashRegisterShiftMapper;
import com.rentflow.mapper.InvoiceMapper;
import com.rentflow.mapper.RadarFineMapper;
import com.rentflow.repository.InvoiceRepository;
import com.rentflow.repository.CashRegisterShiftRepository;
import com.rentflow.repository.RadarFineRepository;
import com.rentflow.repository.ReservationRepository;
import com.rentflow.repository.ClientRepository;
import com.rentflow.repository.TenantRepository;
import com.rentflow.repository.UserRepository;
import com.rentflow.security.TenantContext;
import com.rentflow.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class BillingServiceImpl implements BillingService {

    private final InvoiceRepository invoiceRepository;
    private final CashRegisterShiftRepository cashRegisterShiftRepository;
    private final RadarFineRepository radarFineRepository;
    private final ReservationRepository reservationRepository;
    private final ClientRepository clientRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final com.rentflow.repository.ChequeRepository chequeRepository;
    private final InvoiceMapper invoiceMapper;
    private final CashRegisterShiftMapper cashRegisterShiftMapper;
    private final com.rentflow.mapper.ChequeMapper chequeMapper;
    private final RadarFineMapper radarFineMapper;

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDto> getInvoices() {
        Long tenantId = TenantContext.getCurrentTenant();
        List<Invoice> list = invoiceRepository.findByTenantId(tenantId);
        return invoiceMapper.toDtoList(list);
    }

    @Override
    public InvoiceDto generateInvoice(Map<String, Object> payload) {
        Long tenantId = TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow();

        Long reservationId = Long.parseLong(payload.get("reservationId").toString());
        Reservation reservation = reservationRepository.findById(reservationId).orElseThrow();

        long count = invoiceRepository.countByTenantId(tenantId) + 1;
        String invoiceNumber = String.format("FAC-%d-%05d", LocalDateTime.now().getYear(), count);

        double totalTTC = reservation.getTotalAmount();
        double totalHT = totalTTC / 1.20;
        double totalTVA = totalTTC - totalHT;

        Invoice invoice = Invoice.builder().tenant(tenant).reservation(reservation).client(reservation.getClient()).invoiceNumber(invoiceNumber).iceAgency(tenant.getIceNumber() != null ? tenant.getIceNumber() : "001234567000089").ifAgency(tenant.getIfNumber() != null ? tenant.getIfNumber() : "40123456").rcAgency(tenant.getRcNumber() != null ? tenant.getRcNumber() : "123456").iceClient(reservation.getClient().getIceNumber()).totalHT(Math.round(totalHT * 100.0) / 100.0).tvaRate(20.0).totalTVA(Math.round(totalTVA * 100.0) / 100.0).totalTTC(totalTTC).paymentStatus("PAYEE").pdfInvoiceUrl("/invoices/" + invoiceNumber + ".pdf").build();

        Invoice saved = invoiceRepository.save(invoice);
        return invoiceMapper.toDto(saved);
    }

    @Override
    public CashRegisterShiftDto closeShiftCashRegister(Map<String, Object> payload) {
        Long tenantId = TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow();

        User agent = null;
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !auth.getName().equals("anonymousUser")) {
                agent = userRepository.findByUsername(auth.getName()).orElse(null);
            }
        } catch (Exception ignored) {}

        if (agent == null) {
            agent = userRepository.findByTenantId(tenantId).stream().findFirst().orElse(null);
        }

        Double startingCash = parseDoubleSafe(payload.get("startingCash"), 0.0);
        Double actualCashInHand = parseDoubleSafe(payload.get("actualCashInHand"), 0.0);
        Double totalCashReceived = parseDoubleSafe(payload.get("totalCashReceived"), 0.0);
        Double totalTpeReceived = parseDoubleSafe(payload.get("totalTpeReceived"), 0.0);
        Double totalCheckReceived = parseDoubleSafe(payload.get("totalCheckReceived"), 0.0);
        Double totalTransferReceived = parseDoubleSafe(payload.get("totalTransferReceived"), 0.0);

        double expectedCashInHand = startingCash + totalCashReceived;
        double cashDiff = actualCashInHand - expectedCashInHand;

        CashRegisterShift shift = CashRegisterShift.builder()
                .tenant(tenant)
                .agent(agent)
                .shiftStart(LocalDateTime.now().minusHours(8))
                .shiftEnd(LocalDateTime.now())
                .startingCash(startingCash)
                .totalCashReceived(totalCashReceived)
                .totalTpeReceived(totalTpeReceived)
                .totalCheckReceived(totalCheckReceived)
                .totalTransferReceived(totalTransferReceived)
                .expectedCashInHand(expectedCashInHand)
                .actualCashInHand(actualCashInHand)
                .cashDifference(cashDiff)
                .status("CLOTURE")
                .notes(payload.getOrDefault("notes", "Clôture de shift conforme").toString())
                .build();

        CashRegisterShift saved = cashRegisterShiftRepository.save(shift);
        return cashRegisterShiftMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CashRegisterShiftDto> getCashRegisterShifts() {
        Long tenantId = TenantContext.getCurrentTenant();
        List<CashRegisterShift> list = cashRegisterShiftRepository.findByTenantId(tenantId);
        list.sort((a, b) -> {
            if (a.getShiftEnd() == null || b.getShiftEnd() == null) return 0;
            return b.getShiftEnd().compareTo(a.getShiftEnd());
        });
        return cashRegisterShiftMapper.toDtoList(list);
    }

    private Double parseDoubleSafe(Object val, Double defaultVal) {
        if (val == null) return defaultVal;
        try {
            return Double.parseDouble(val.toString());
        } catch (Exception e) {
            return defaultVal;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.rentflow.dto.ChequeDto> getCheques() {
        Long tenantId = TenantContext.getCurrentTenant();
        List<com.rentflow.domain.Cheque> list = chequeRepository.findByTenantId(tenantId);
        list.sort((a, b) -> {
            if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });
        return chequeMapper.toDtoList(list);
    }

    @Override
    public com.rentflow.dto.ChequeDto createCheque(com.rentflow.dto.ChequeDto dto) {
        Long tenantId = TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow();

        Reservation reservation = null;
        if (dto.getReservationId() != null) {
            reservation = reservationRepository.findById(dto.getReservationId()).orElse(null);
        }

        com.rentflow.domain.Cheque cheque = com.rentflow.domain.Cheque.builder()
                .tenant(tenant)
                .reservation(reservation)
                .chequeNumber(dto.getChequeNumber() != null ? dto.getChequeNumber().trim() : "CH-" + System.currentTimeMillis() % 1000000)
                .bankName(dto.getBankName() != null ? dto.getBankName().trim() : "Attijariwafa Bank")
                .issuerName(dto.getIssuerName() != null ? dto.getIssuerName().trim() : "Client")
                .amount(dto.getAmount() != null ? dto.getAmount() : 1500.0)
                .dueDate(dto.getDueDate() != null ? dto.getDueDate() : java.time.LocalDate.now())
                .chequeType(dto.getChequeType() != null ? dto.getChequeType() : "CAUTION")
                .status(dto.getStatus() != null ? dto.getStatus() : "EN_CAISSE")
                .reservationNumber(dto.getReservationNumber())
                .chequeScanUrl(dto.getChequeScanUrl())
                .notes(dto.getNotes())
                .createdAt(LocalDateTime.now())
                .build();

        com.rentflow.domain.Cheque saved = chequeRepository.save(cheque);
        return chequeMapper.toDto(saved);
    }

    @Override
    public com.rentflow.dto.ChequeDto updateChequeStatus(Long id, String status) {
        Long tenantId = TenantContext.getCurrentTenant();
        com.rentflow.domain.Cheque cheque = chequeRepository.findById(id).orElseThrow();

        if (!cheque.getTenant().getId().equals(tenantId)) {
            throw new NoSuchElementException("Chèque non trouvé pour ce tenant");
        }

        cheque.setStatus(status);
        com.rentflow.domain.Cheque saved = chequeRepository.save(cheque);
        return chequeMapper.toDto(saved);
    }

    @Override
    public void deleteCheque(Long id) {
        Long tenantId = TenantContext.getCurrentTenant();
        com.rentflow.domain.Cheque cheque = chequeRepository.findById(id).orElseThrow();

        if (cheque.getTenant().getId().equals(tenantId)) {
            chequeRepository.delete(cheque);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<RadarFineDto> getRadarFines() {
        Long tenantId = TenantContext.getCurrentTenant();
        List<RadarFine> list = radarFineRepository.findByTenantId(tenantId);
        return radarFineMapper.toDtoList(list);
    }

    @Override
    public RadarFineDto reallocateFine(Long id, Map<String, Object> payload) {
        Long tenantId = TenantContext.getCurrentTenant();
        Optional<RadarFine> fineOpt = radarFineRepository.findById(id);

        if (fineOpt.isEmpty() || !fineOpt.get().getTenant().getId().equals(tenantId)) {
            throw new NoSuchElementException("Infraction non trouvée");
        }

        RadarFine fine = fineOpt.get();
        Long clientId = Long.parseLong(payload.get("clientId").toString());
        Client client = clientRepository.findById(clientId).orElseThrow();

        fine.setReallocated(true);
        fine.setReallocatedClient(client);
        fine.setReallocationDate(LocalDateTime.now());
        fine.setStatus("REASSIGNE");

        RadarFine saved = radarFineRepository.save(fine);
        return radarFineMapper.toDto(saved);
    }
}
