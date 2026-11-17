package com.shopsphere.modules.inventory.service;

import com.shopsphere.common.response.PagedResponse;
import com.shopsphere.modules.inventory.dto.InventoryAdjustmentRequest;
import com.shopsphere.modules.inventory.dto.InventoryLogResponse;
import com.shopsphere.modules.inventory.dto.LowStockProductResponse;
import com.shopsphere.modules.inventory.dto.RestockRequest;

import java.util.List;

public interface InventoryService {
    InventoryLogResponse restockProduct(RestockRequest request);
    InventoryLogResponse adjustStock(InventoryAdjustmentRequest request);
    PagedResponse<InventoryLogResponse> getProductInventoryLogs(Long productId, int page, int size);
    List<LowStockProductResponse> getLowStockProducts(int threshold);
}
