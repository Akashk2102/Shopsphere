package com.shopsphere.modules.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentIntentResponse {
    private String paymentReference;
    private String orderNumber;
    private BigDecimal amount;
    @Builder.Default
    private String currency = "USD";
    private String status;
    private String clientSecret;
}
