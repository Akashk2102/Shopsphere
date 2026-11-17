package com.shopsphere.modules.payment.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.common.exception.BadRequestException;
import com.shopsphere.common.exception.ResourceNotFoundException;
import com.shopsphere.modules.order.entity.Order;
import com.shopsphere.modules.order.entity.OrderStatus;
import com.shopsphere.modules.order.repository.OrderRepository;
import com.shopsphere.modules.payment.dto.ConfirmPaymentRequest;
import com.shopsphere.modules.payment.dto.PaymentIntentRequest;
import com.shopsphere.modules.payment.dto.PaymentIntentResponse;
import com.shopsphere.modules.payment.dto.PaymentResponse;
import com.shopsphere.modules.payment.entity.Payment;
import com.shopsphere.modules.payment.entity.PaymentStatus;
import com.shopsphere.modules.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public PaymentIntentResponse createPaymentIntent(Long userId, PaymentIntentRequest request) {
        Order order = orderRepository.findByOrderNumberAndUserId(request.getOrderNumber(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderNumber", request.getOrderNumber()));

        if (order.getStatus() == OrderStatus.PAID) {
            throw new BadRequestException("Order is already paid.");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot create payment intent for a cancelled order.");
        }

        // Check if pending payment intent already exists
        Optional<Payment> existingOpt = paymentRepository.findByOrderId(order.getId());
        Payment payment;
        String reference;

        if (existingOpt.isPresent() && existingOpt.get().getPaymentStatus() == PaymentStatus.PENDING) {
            payment = existingOpt.get();
            reference = payment.getPaymentReference();
        } else {
            reference = "pi_test_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
            payment = Payment.builder()
                    .order(order)
                    .paymentReference(reference)
                    .paymentMethod(request.getPaymentMethod())
                    .paymentStatus(PaymentStatus.PENDING)
                    .amount(order.getTotalAmount())
                    .build();
            payment = paymentRepository.save(payment);
        }

        String clientSecret = reference + "_secret_" + UUID.randomUUID().toString().substring(0, 12);

        log.info("Payment intent created: {} for Order: {}, Amount: ${}",
                reference, order.getOrderNumber(), order.getTotalAmount());

        return PaymentIntentResponse.builder()
                .paymentReference(reference)
                .orderNumber(order.getOrderNumber())
                .amount(order.getTotalAmount())
                .currency("USD")
                .status("REQUIRES_PAYMENT_METHOD")
                .clientSecret(clientSecret)
                .build();
    }

    @Override
    @Transactional
    public PaymentResponse confirmPayment(Long userId, ConfirmPaymentRequest request) {
        Payment payment = paymentRepository.findByPaymentReference(request.getPaymentReference())
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "reference", request.getPaymentReference()));

        Order order = payment.getOrder();
        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Payment intent does not belong to the authenticated user");
        }

        if (payment.getPaymentStatus() == PaymentStatus.COMPLETED) {
            log.info("Payment {} was already completed.", payment.getPaymentReference());
            return mapToPaymentResponse(payment);
        }

        boolean isSuccess = "SUCCESS".equalsIgnoreCase(request.getSimulatedOutcome());

        Map<String, Object> gatewayAudit = new LinkedHashMap<>();
        gatewayAudit.put("gateway", "ShopSphere Sandbox Gateway");
        gatewayAudit.put("timestamp", System.currentTimeMillis());
        gatewayAudit.put("tokenUsed", request.getTestPaymentToken());

        if (isSuccess) {
            payment.setPaymentStatus(PaymentStatus.COMPLETED);
            gatewayAudit.put("status", "APPROVED");
            gatewayAudit.put("transactionId", "txn_" + UUID.randomUUID().toString().substring(0, 16));
            gatewayAudit.put("cardBrand", "VISA");
            gatewayAudit.put("last4", "4242");

            try {
                payment.setGatewayResponse(objectMapper.writeValueAsString(gatewayAudit));
            } catch (JsonProcessingException ignored) {}

            paymentRepository.save(payment);

            // Transition Order to PAID
            order.setStatus(OrderStatus.PAID);
            orderRepository.save(order);

            log.info("Payment {} APPROVED! Order {} transitioned to PAID.",
                    payment.getPaymentReference(), order.getOrderNumber());

            return mapToPaymentResponse(payment);
        } else {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            gatewayAudit.put("status", "DECLINED");
            gatewayAudit.put("errorCode", "card_declined");
            gatewayAudit.put("errorMessage", "The card was declined by the simulated card issuer.");

            try {
                payment.setGatewayResponse(objectMapper.writeValueAsString(gatewayAudit));
            } catch (JsonProcessingException ignored) {}

            paymentRepository.save(payment);

            log.warn("Payment {} DECLINED for Order {}", payment.getPaymentReference(), order.getOrderNumber());
            throw new BadRequestException("Simulated Payment Declined: The test card has insufficient funds or was declined.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentForOrder(Long userId, String orderNumber) {
        Order order = orderRepository.findByOrderNumberAndUserId(orderNumber, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderNumber", orderNumber));

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment for order", "orderNumber", orderNumber));

        return mapToPaymentResponse(payment);
    }

    @Override
    @Transactional
    public void handleWebhook(String payload, String signatureHeader) {
        log.info("Payment gateway webhook received with signature: {}", signatureHeader);

        try {
            JsonNode root = objectMapper.readTree(payload);
            String eventType = root.path("type").asText();
            String paymentRef = root.path("data").path("paymentReference").asText();

            if ("payment_intent.succeeded".equals(eventType)) {
                Optional<Payment> paymentOpt = paymentRepository.findByPaymentReference(paymentRef);
                if (paymentOpt.isPresent()) {
                    Payment payment = paymentOpt.get();
                    if (payment.getPaymentStatus() != PaymentStatus.COMPLETED) {
                        payment.setPaymentStatus(PaymentStatus.COMPLETED);
                        paymentRepository.save(payment);

                        Order order = payment.getOrder();
                        order.setStatus(OrderStatus.PAID);
                        orderRepository.save(order);
                        log.info("Webhook updated Order {} to PAID via paymentRef {}", order.getOrderNumber(), paymentRef);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to process payment webhook: {}", e.getMessage());
        }
    }

    private PaymentResponse mapToPaymentResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .orderNumber(payment.getOrder().getOrderNumber())
                .paymentReference(payment.getPaymentReference())
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .amount(payment.getAmount())
                .gatewayResponse(payment.getGatewayResponse())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
