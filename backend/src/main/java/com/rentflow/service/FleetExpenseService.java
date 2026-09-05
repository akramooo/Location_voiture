package com.rentflow.service;

import java.util.List;
import java.util.Map;

public interface FleetExpenseService {
    List<Map<String, Object>> getFleetExpenses();
    Map<String, Object> createFleetExpense(Map<String, Object> payload);
    void deleteFleetExpense(Long id);
}
