package com.shopsphere.modules.order.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.common.exception.BadRequestException;
import com.shopsphere.common.exception.InsufficientStockException;
import com.shopsphere.common.exception.ResourceNotFoundException;
import com.shopsphere.common.response.PagedResponse;
import com.shopsphere.modules.cart.entity.Cart;
import com.shopsphere.modules.cart.entity.CartItem;
import com.shopsphere.modules.cart.repository.CartItemRepository;
import com.shopsphere.modules.cart.repository.CartRepository;
import com.shopsphere.modules.inventory.entity.InventoryLog;
import com.shopsphere.modules.inventory.repository.InventoryLogRepository;
import com.shopsphere.modules.order.dto.CheckoutRequest;
import com.shopsphere.modules.order.dto.OrderItemResponse;
import com.shopsphere.modules.order.dto.OrderResponse;
import com.shopsphere.modules.order.dto.OrderStatusUpdateRequest;
import com.shopsphere.modules.order.entity.Order;
import com.shopsphere.modules.order.entity.OrderItem;
import com.shopsphere.modules.order.entity.OrderStatus;
import com.shopsphere.modules.order.repository.OrderItemRepository;
import com.shopsphere.modules.order.repository.OrderRepository;
import com.shopsphere.modules.product.entity.Product;
import com.shopsphere.modules.product.repository.ProductRepository;
import com.shopsphere.modules.user.entity.Address;
import com.shopsphere.modules.user.entity.User;
import com.shopsphere.modules.user.repository.AddressRepository;
import com.shopsphere.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderServiceImpl.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public OrderResponse checkout(Long userId, CheckoutRequest request) {
        // 1. Idempotency Check: Return existing order if key was already processed
        if (StringUtils.hasText(request.getIdempotencyKey())) {
            Optional<Order> existing = orderRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                log.info("Idempotent checkout request detected for key {}. Returning existing order.", request.getIdempotencyKey());
                return mapToOrderResponse(existing.get());
            }
        }

        // 2. Fetch User & Active Cart
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("No active shopping cart found"));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new BadRequestException("Shopping cart is empty. Cannot proceed with checkout.");
        }

        // 3. Fetch & Validate Shipping Address
        Address address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.getAddressId()));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Invalid delivery address selected");
        }

        // 4. Freeze Address Snapshot (JSONB representation)
        String addressSnapshot = createAddressSnapshot(user, address);

        // 5. Generate Human-Friendly Tracking Order Number
        String orderNumber = generateOrderNumber();

        // 6. Atomic Inventory Deduction with Pessimistic Row Locking
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(user)
                .status(OrderStatus.PENDING)
                .shippingAddressSnapshot(addressSnapshot)
                .idempotencyKey(request.getIdempotencyKey())
                .totalAmount(BigDecimal.ZERO)
                .build();

        for (CartItem cartItem : cart.getItems()) {
            Long productId = cartItem.getProduct().getId();

            // PESSIMISTIC LOCK: Issues SELECT ... FOR UPDATE on product row
            Product product = productRepository.findByIdWithPessimisticLock(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

            if (!product.isActive()) {
                throw new BadRequestException("Product '" + product.getName() + "' is inactive and unavailable.");
            }

            int requestedQty = cartItem.getQuantity();
            if (product.getStockQuantity() < requestedQty) {
                log.warn("Checkout stock exhaustion for product {}. Requested: {}, Available: {}",
                        product.getName(), requestedQty, product.getStockQuantity());
                throw new InsufficientStockException(product.getName(), requestedQty, product.getStockQuantity());
            }

            // Deduct Stock
            int newStock = product.getStockQuantity() - requestedQty;
            product.setStockQuantity(newStock);
            productRepository.save(product);

            // Audit Log
            InventoryLog inventoryLog = InventoryLog.builder()
                    .product(product)
                    .changeType("ORDER_DEDUCTION")
                    .quantityChange(-requestedQty)
                    .resultingQuantity(newStock)
                    .referenceId(orderNumber)
                    .build();
            inventoryLogRepository.save(inventoryLog);

            // Create Order Item (historical price snapshot)
            BigDecimal unitPrice = product.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(requestedQty));
            totalAmount = totalAmount.add(subtotal);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .productName(product.getName())
                    .productSku(product.getSku())
                    .unitPrice(unitPrice)
                    .quantity(requestedQty)
                    .subtotal(subtotal)
                    .build();

            orderItems.add(orderItem);
        }

        order.setTotalAmount(totalAmount);
        order.setItems(orderItems);

        Order savedOrder = orderRepository.save(order);
        orderItemRepository.saveAll(orderItems);

        // 7. Clear Shopping Cart
        cartItemRepository.deleteByCartId(cart.getId());
        cart.getItems().clear();
        cartRepository.save(cart);

        log.info("Order successfully created: {} for user: {} with {} items, total: {}",
                orderNumber, user.getEmail(), orderItems.size(), totalAmount);

        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<OrderResponse> getUserOrders(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Order> orderPage = orderRepository.findByUserId(userId, pageable);
        return PagedResponse.of(orderPage.map(this::mapToOrderResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderDetails(Long userId, String orderNumber) {
        Order order = orderRepository.findByOrderNumberAndUserId(orderNumber, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderNumber", orderNumber));
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long userId, String orderNumber) {
        Order order = orderRepository.findByOrderNumberAndUserId(orderNumber, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderNumber", orderNumber));

        if (order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new BadRequestException("Cannot cancel an order that has already shipped or been delivered");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Order is already cancelled");
        }

        // Restore inventory for all items
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                Product product = productRepository.findByIdWithPessimisticLock(item.getProduct().getId())
                        .orElse(null);
                if (product != null) {
                    int restoredQuantity = product.getStockQuantity() + item.getQuantity();
                    product.setStockQuantity(restoredQuantity);
                    productRepository.save(product);

                    InventoryLog logEntry = InventoryLog.builder()
                            .product(product)
                            .changeType("CANCELLATION_RESTORE")
                            .quantityChange(item.getQuantity())
                            .resultingQuantity(restoredQuantity)
                            .referenceId(order.getOrderNumber())
                            .build();
                    inventoryLogRepository.save(logEntry);
                }
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order updated = orderRepository.save(order);
        log.info("Order {} was cancelled and inventory restored.", orderNumber);

        return mapToOrderResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<OrderResponse> getAllOrders(OrderStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Order> orders;
        if (status != null) {
            orders = orderRepository.findByStatus(status, pageable);
        } else {
            orders = orderRepository.findAll(pageable);
        }
        return PagedResponse.of(orders.map(this::mapToOrderResponse));
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(String orderNumber, OrderStatusUpdateRequest request) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderNumber", orderNumber));

        // If transitioning to CANCELLED by Admin, restore inventory
        if (request.getStatus() == OrderStatus.CANCELLED && order.getStatus() != OrderStatus.CANCELLED) {
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() != null) {
                    Product product = productRepository.findByIdWithPessimisticLock(item.getProduct().getId())
                            .orElse(null);
                    if (product != null) {
                        int restoredQuantity = product.getStockQuantity() + item.getQuantity();
                        product.setStockQuantity(restoredQuantity);
                        productRepository.save(product);

                        InventoryLog logEntry = InventoryLog.builder()
                                .product(product)
                                .changeType("CANCELLATION_RESTORE")
                                .quantityChange(item.getQuantity())
                                .resultingQuantity(restoredQuantity)
                                .referenceId(order.getOrderNumber())
                                .build();
                        inventoryLogRepository.save(logEntry);
                    }
                }
            }
        }

        order.setStatus(request.getStatus());
        Order updated = orderRepository.save(order);
        return mapToOrderResponse(updated);
    }

    private String generateOrderNumber() {
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE); // YYYYMMDD
        String randomPart = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return "ORD-" + datePart + "-" + randomPart;
    }

    private String createAddressSnapshot(User user, Address address) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("recipientName", user.getFirstName() + " " + user.getLastName());
        map.put("phoneNumber", user.getPhoneNumber());
        map.put("addressLine1", address.getAddressLine1());
        map.put("addressLine2", address.getAddressLine2());
        map.put("city", address.getCity());
        map.put("state", address.getState());
        map.put("postalCode", address.getPostalCode());
        map.put("country", address.getCountry());

        try {
            return objectMapper.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            return address.getAddressLine1() + ", " + address.getCity() + ", " + address.getState();
        }
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .productSku(item.getProductSku())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        int totalCount = itemResponses.stream().mapToInt(OrderItemResponse::getQuantity).sum();

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUser().getId())
                .userEmail(order.getUser().getEmail())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .shippingAddress(order.getShippingAddressSnapshot())
                .idempotencyKey(order.getIdempotencyKey())
                .items(itemResponses)
                .totalItemsCount(totalCount)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
