package com.rentflow.service.impl;

import com.rentflow.domain.CashRegisterShift;
import com.rentflow.domain.Client;
import com.rentflow.domain.Invoice;
import com.rentflow.domain.RadarFine;
import com.rentflow.domain.Reservation;
import com.rentflow.domain.Tenant;
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
    private final InvoiceMapper invoiceMapper;
    private final CashRegisterShiftMapper cashRegisterShiftMapper;
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

        Double startingCash = Double.parseDouble(payload.getOrDefault("startingCash", "1000.0").toString());
        Double actualCashInHand = Double.parseDouble(payload.getOrDefault("actualCashInHand", "2500.0").toString());
        Double totalCashReceived = Double.parseDouble(payload.getOrDefault("totalCashReceived", "1500.0").toString());
        Double totalTpeReceived = Double.parseDouble(payload.getOrDefault("totalTpeReceived", "3200.0").toString());
        Double totalCheckReceived = Double.parseDouble(payload.getOrDefault("totalCheckReceived", "0.0").toString());
        Double totalTransferReceived = Double.parseDouble(payload.getOrDefault("totalTransferReceived", "0.0").toString());

        double expectedCashInHand = startingCash + totalCashReceived;
        double cashDiff = actualCashInHand - expectedCashInHand;

        CashRegisterShift shift = CashRegisterShift.builder().tenant(tenant).shiftStart(LocalDateTime.now().minusHours(8)).shiftEnd(LocalDateTime.now()).startingCash(startingCash).totalCashReceived(totalCashReceived).totalTpeReceived(totalTpeReceived).totalCheckReceived(totalCheckReceived).totalTransferReceived(totalTransferReceived).expectedCashInHand(expectedCashInHand).actualCashInHand(actualCashInHand).cashDifference(cashDiff).status("CLOTURE").notes(payload.getOrDefault("notes", "Clôture de fin de shift agent").toString()).build();

        CashRegisterShift saved = cashRegisterShiftRepository.save(shift);
        return cashRegisterShiftMapper.toDto(saved);
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
