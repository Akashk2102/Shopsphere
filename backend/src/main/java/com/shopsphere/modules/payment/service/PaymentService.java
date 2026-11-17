package com.shopsphere.modules.payment.service;

import com.shopsphere.modules.payment.dto.ConfirmPaymentRequest;
import com.shopsphere.modules.payment.dto.PaymentIntentRequest;
import com.shopsphere.modules.payment.dto.PaymentIntentResponse;
import com.shopsphere.modules.payment.dto.PaymentResponse;

public interface PaymentService {
    PaymentIntentResponse createPaymentIntent(Long userId, PaymentIntentRequest request);
    PaymentResponse confirmPayment(Long userId, ConfirmPaymentRequest request);
    PaymentResponse getPaymentForOrder(Long userId, String orderNumber);
    void handleWebhook(String payload, String signatureHeader);
}
