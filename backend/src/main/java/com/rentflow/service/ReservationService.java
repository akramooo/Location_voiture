package com.rentflow.service;

import com.rentflow.dto.ReservationDto;

import java.util.List;
import java.util.Map;

public interface ReservationService {
    List<ReservationDto> getReservations();
    List<Map<String, Object>> getGanttData();
    ReservationDto createReservation(Map<String, Object> payload);
    ReservationDto updateStatus(Long id, String status);
}
