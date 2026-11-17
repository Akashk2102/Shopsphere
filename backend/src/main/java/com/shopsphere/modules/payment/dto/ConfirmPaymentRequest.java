package com.shopsphere.modules.payment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmPaymentRequest {

    @NotBlank(message = "Payment reference is required")
    private String paymentReference;

    @Builder.Default
    private String simulatedOutcome = "SUCCESS"; // SUCCESS or DECLINE

    @Builder.Default
    private String testPaymentToken = "tok_test_card_visa_4242";
}
