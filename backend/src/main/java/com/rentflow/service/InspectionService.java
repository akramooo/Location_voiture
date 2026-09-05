package com.rentflow.service;

import com.rentflow.dto.InspectionDto;

import java.util.List;
import java.util.Map;

public interface InspectionService {
    List<InspectionDto> getInspectionsByReservation(Long reservationId);
    InspectionDto performCheckIn(Map<String, Object> payload);
    InspectionDto performCheckOut(Map<String, Object> payload);
}
