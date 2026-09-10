package com.rentflow.service;

import java.util.List;
import java.util.Map;

public interface FleetExpenseService {
    List<Map<String, Object>> getFleetExpenses();
    Map<String, Object> createFleetExpense(Map<String, Object> payload);
    Map<String, Object> validateExpense(Long id);
    Map<String, Object> updateExpenseStatus(Long id, String status);
    Map<String, Object> updateVehicleStatus(Long vehicleId, String status);
    void deleteFleetExpense(Long id);
}

