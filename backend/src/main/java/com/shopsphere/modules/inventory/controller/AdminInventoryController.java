package com.shopsphere.modules.inventory.controller;

import com.shopsphere.common.response.ApiResponse;
import com.shopsphere.common.response.PagedResponse;
import com.shopsphere.modules.inventory.dto.InventoryAdjustmentRequest;
import com.shopsphere.modules.inventory.dto.InventoryLogResponse;
import com.shopsphere.modules.inventory.dto.LowStockProductResponse;
import com.shopsphere.modules.inventory.dto.RestockRequest;
import com.shopsphere.modules.inventory.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/inventory")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin Inventory Management", description = "Endpoints for stock restocking, cycle audits, and low-stock alarms")
public class AdminInventoryController {

    private final InventoryService inventoryService;

    @PostMapping("/restock")
    @Operation(summary = "Restock inventory for a product with audit logging (Admin only)")
    public ResponseEntity<ApiResponse<InventoryLogResponse>> restockProduct(
            @Valid @RequestBody RestockRequest request) {
        InventoryLogResponse response = inventoryService.restockProduct(request);
        return ResponseEntity.ok(ApiResponse.success("Product restocked successfully", response));
    }

    @PostMapping("/adjust")
    @Operation(summary = "Manually adjust inventory count with audit justification (Admin only)")
    public ResponseEntity<ApiResponse<InventoryLogResponse>> adjustStock(
            @Valid @RequestBody InventoryAdjustmentRequest request) {
        InventoryLogResponse response = inventoryService.adjustStock(request);
        return ResponseEntity.ok(ApiResponse.success("Inventory adjusted successfully", response));
    }

    @GetMapping("/logs/{productId}")
    @Operation(summary = "Get historical audit logs for a product's inventory deltas (Admin only)")
    public ResponseEntity<ApiResponse<PagedResponse<InventoryLogResponse>>> getProductInventoryLogs(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        PagedResponse<InventoryLogResponse> logs = inventoryService.getProductInventoryLogs(productId, page, size);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "List all active products at or below safety stock threshold (Admin only)")
    public ResponseEntity<ApiResponse<List<LowStockProductResponse>>> getLowStockProducts(
            @RequestParam(defaultValue = "5") int threshold) {
        List<LowStockProductResponse> products = inventoryService.getLowStockProducts(threshold);
        return ResponseEntity.ok(ApiResponse.success(products));
    }
}
