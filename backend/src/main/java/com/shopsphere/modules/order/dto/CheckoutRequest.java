package com.shopsphere.modules.order.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {

    @NotNull(message = "Shipping address ID is required")
    private Long addressId;

    private String idempotencyKey;

    @Builder.Default
    private String paymentMethod = "SANDBOX_CARD"; // SANDBOX_CARD, UPI, TEST_WALLET
}
