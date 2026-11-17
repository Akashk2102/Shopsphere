package com.shopsphere.modules.payment.dto;

import com.shopsphere.modules.payment.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private Long id;
    private String orderNumber;
    private String paymentReference;
    private String paymentMethod;
    private PaymentStatus paymentStatus;
    private BigDecimal amount;
    private String gatewayResponse;
    private Instant createdAt;
}
