package com.shopsphere.modules.order.repository;

import com.shopsphere.modules.order.entity.Order;
import com.shopsphere.modules.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);
    Optional<Order> findByIdempotencyKey(String idempotencyKey);
    Page<Order> findByUserId(Long userId, Pageable pageable);
    Optional<Order> findByOrderNumberAndUserId(String orderNumber, Long userId);
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
}
