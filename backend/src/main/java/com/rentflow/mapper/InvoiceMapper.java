package com.rentflow.mapper;

import com.rentflow.domain.Invoice;
import com.rentflow.dto.InvoiceDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface InvoiceMapper {

    @Mapping(target = "tenantId", source = "tenant.id")
    @Mapping(target = "reservationId", source = "reservation.id")
    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "clientName", expression = "java(invoice.getClient() != null ? (\"ENTREPRISE\".equals(invoice.getClient().getClientType()) ? invoice.getClient().getCompanyName() : invoice.getClient().getFirstName() + \" \" + invoice.getClient().getLastName()) : null)")
    InvoiceDto toDto(Invoice invoice);

    @Mapping(target = "tenant", ignore = true)
    @Mapping(target = "reservation", ignore = true)
    @Mapping(target = "client", ignore = true)
    Invoice toEntity(InvoiceDto invoiceDto);

    List<InvoiceDto> toDtoList(List<Invoice> invoices);
}
