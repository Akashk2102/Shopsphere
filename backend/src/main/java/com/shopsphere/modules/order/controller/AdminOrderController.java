package com.shopsphere.modules.order.controller;

import com.shopsphere.common.response.ApiResponse;
import com.shopsphere.common.response.PagedResponse;
import com.shopsphere.modules.order.dto.OrderResponse;
import com.shopsphere.modules.order.dto.OrderStatusUpdateRequest;
import com.shopsphere.modules.order.entity.OrderStatus;
import com.shopsphere.modules.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin Order Management", description = "Endpoints for administrators to inspect orders and update fulfillment status")
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    @Operation(summary = "Get all platform orders with optional status filter (Admin only)")
    public ResponseEntity<ApiResponse<PagedResponse<OrderResponse>>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        PagedResponse<OrderResponse> orders = orderService.getAllOrders(status, page, size);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @PatchMapping("/{orderNumber}/status")
    @Operation(summary = "Update order fulfillment lifecycle status (Admin only)")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable String orderNumber,
            @Valid @RequestBody OrderStatusUpdateRequest request) {
        OrderResponse updated = orderService.updateOrderStatus(orderNumber, request);
        return ResponseEntity.ok(ApiResponse.success("Order status updated to " + request.getStatus(), updated));
    }
}
