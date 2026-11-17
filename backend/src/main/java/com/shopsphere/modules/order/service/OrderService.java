package com.shopsphere.modules.order.service;

import com.shopsphere.common.response.PagedResponse;
import com.shopsphere.modules.order.dto.CheckoutRequest;
import com.shopsphere.modules.order.dto.OrderResponse;
import com.shopsphere.modules.order.dto.OrderStatusUpdateRequest;
import com.shopsphere.modules.order.entity.OrderStatus;

public interface OrderService {
    OrderResponse checkout(Long userId, CheckoutRequest request);
    PagedResponse<OrderResponse> getUserOrders(Long userId, int page, int size);
    OrderResponse getOrderDetails(Long userId, String orderNumber);
    OrderResponse cancelOrder(Long userId, String orderNumber);

    // Admin Operations
    PagedResponse<OrderResponse> getAllOrders(OrderStatus status, int page, int size);
    OrderResponse updateOrderStatus(String orderNumber, OrderStatusUpdateRequest request);
}
