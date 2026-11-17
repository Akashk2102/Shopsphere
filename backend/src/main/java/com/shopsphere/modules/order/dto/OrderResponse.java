package com.shopsphere.modules.order.dto;

import com.shopsphere.modules.order.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private Long userId;
    private String userEmail;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private String shippingAddress;
    private String idempotencyKey;
    @Builder.Default
    private List<OrderItemResponse> items = new ArrayList<>();
    private Integer totalItemsCount;
    private Instant createdAt;
    private Instant updatedAt;
}
