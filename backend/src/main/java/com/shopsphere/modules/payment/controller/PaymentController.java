package com.shopsphere.modules.payment.controller;

import com.shopsphere.common.response.ApiResponse;
import com.shopsphere.modules.payment.dto.ConfirmPaymentRequest;
import com.shopsphere.modules.payment.dto.PaymentIntentRequest;
import com.shopsphere.modules.payment.dto.PaymentIntentResponse;
import com.shopsphere.modules.payment.dto.PaymentResponse;
import com.shopsphere.modules.payment.service.PaymentService;
import com.shopsphere.security.services.UserDetailsImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Tag(name = "Payment Sandbox", description = "Endpoints for payment intent creation, sandbox card test confirmation, and webhooks")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-intent")
    @Operation(summary = "Initialize a payment intent for an unpaid order")
    public ResponseEntity<ApiResponse<PaymentIntentResponse>> createPaymentIntent(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody PaymentIntentRequest request) {
        PaymentIntentResponse intent = paymentService.createPaymentIntent(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Payment intent initialized", intent));
    }

    @PostMapping("/confirm")
    @Operation(summary = "Confirm test sandbox payment (simulates SUCCESS or DECLINE)")
    public ResponseEntity<ApiResponse<PaymentResponse>> confirmPayment(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody ConfirmPaymentRequest request) {
        PaymentResponse response = paymentService.confirmPayment(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Payment processed successfully", response));
    }

    @GetMapping("/order/{orderNumber}")
    @Operation(summary = "Get payment receipt and gateway response for an order")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentForOrder(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable String orderNumber) {
        PaymentResponse response = paymentService.getPaymentForOrder(userDetails.getId(), orderNumber);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/webhook")
    @Operation(summary = "Public webhook listener for asynchronous payment gateway events")
    public ResponseEntity<ApiResponse<Void>> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature) {
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok(ApiResponse.success("Webhook processed", null));
    }
}
