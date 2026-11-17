package com.shopsphere.modules.order.controller;

import com.shopsphere.common.response.ApiResponse;
import com.shopsphere.common.response.PagedResponse;
import com.shopsphere.modules.order.dto.CheckoutRequest;
import com.shopsphere.modules.order.dto.OrderResponse;
import com.shopsphere.modules.order.service.OrderService;
import com.shopsphere.security.services.UserDetailsImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@Tag(name = "Order Processing", description = "Endpoints for customer checkout, order history, and tracking")
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    @Operation(summary = "Perform atomic checkout from active shopping cart")
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Idempotency-Key", required = false) String headerIdempotencyKey,
            @Valid @RequestBody CheckoutRequest request) {

        if (request.getIdempotencyKey() == null && headerIdempotencyKey != null) {
            request.setIdempotencyKey(headerIdempotencyKey);
        }

        OrderResponse order = orderService.checkout(userDetails.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order placed successfully", order));
    }

    @GetMapping
    @Operation(summary = "Get paginated order history for current user")
    public ResponseEntity<ApiResponse<PagedResponse<OrderResponse>>> getMyOrders(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<OrderResponse> orders = orderService.getUserOrders(userDetails.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{orderNumber}")
    @Operation(summary = "Get detailed order tracking information by order number")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderDetails(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable String orderNumber) {
        OrderResponse order = orderService.getOrderDetails(userDetails.getId(), orderNumber);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PostMapping("/{orderNumber}/cancel")
    @Operation(summary = "Cancel an order and restore reserved product inventory")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable String orderNumber) {
        OrderResponse cancelledOrder = orderService.cancelOrder(userDetails.getId(), orderNumber);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled and inventory restored", cancelledOrder));
    }
}
