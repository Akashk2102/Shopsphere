package com.shopsphere.modules.order;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopsphere.common.exception.BadRequestException;
import com.shopsphere.common.exception.InsufficientStockException;
import com.shopsphere.modules.cart.entity.Cart;
import com.shopsphere.modules.cart.entity.CartItem;
import com.shopsphere.modules.cart.repository.CartItemRepository;
import com.shopsphere.modules.cart.repository.CartRepository;
import com.shopsphere.modules.inventory.entity.InventoryLog;
import com.shopsphere.modules.inventory.repository.InventoryLogRepository;
import com.shopsphere.modules.order.dto.CheckoutRequest;
import com.shopsphere.modules.order.dto.OrderResponse;
import com.shopsphere.modules.order.entity.Order;
import com.shopsphere.modules.order.entity.OrderItem;
import com.shopsphere.modules.order.entity.OrderStatus;
import com.shopsphere.modules.order.repository.OrderItemRepository;
import com.shopsphere.modules.order.repository.OrderRepository;
import com.shopsphere.modules.order.service.OrderServiceImpl;
import com.shopsphere.modules.product.entity.Category;
import com.shopsphere.modules.product.entity.Product;
import com.shopsphere.modules.product.repository.ProductRepository;
import com.shopsphere.modules.user.entity.Address;
import com.shopsphere.modules.user.entity.User;
import com.shopsphere.modules.user.repository.AddressRepository;
import com.shopsphere.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private InventoryLogRepository inventoryLogRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private OrderServiceImpl orderService;

    private User user;
    private Address address;
    private Product product;
    private Cart cart;
    private CartItem cartItem;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .email("buyer@shopsphere.com")
                .firstName("Alice")
                .lastName("Smith")
                .phoneNumber("+1234567890")
                .build();

        address = Address.builder()
                .id(100L)
                .user(user)
                .addressLine1("123 Tech Park")
                .city("San Jose")
                .state("CA")
                .postalCode("95110")
                .country("USA")
                .build();

        Category category = Category.builder().id(1L).name("Laptops").build();

        product = Product.builder()
                .id(50L)
                .category(category)
                .name("Pro Ultra Laptop")
                .sku("SKU-LAPTOP-50")
                .price(BigDecimal.valueOf(1200.00))
                .stockQuantity(10)
                .active(true)
                .build();

        cart = Cart.builder()
                .id(20L)
                .user(user)
                .items(new HashSet<>())
                .build();

        cartItem = CartItem.builder()
                .id(200L)
                .cart(cart)
                .product(product)
                .quantity(2)
                .build();

        cart.getItems().add(cartItem);
    }

    @Test
    @DisplayName("Should successfully process checkout with pessimistic row lock and stock deduction")
    void testCheckout_Success() {
        CheckoutRequest request = CheckoutRequest.builder()
                .addressId(100L)
                .idempotencyKey("idemp_unique_key_123")
                .paymentMethod("SANDBOX_CARD")
                .build();

        when(orderRepository.findByIdempotencyKey("idemp_unique_key_123")).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(addressRepository.findById(100L)).thenReturn(Optional.of(address));
        when(productRepository.findByIdWithPessimisticLock(50L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(999L);
            return o;
        });

        OrderResponse response = orderService.checkout(1L, request);

        assertNotNull(response);
        assertEquals(OrderStatus.PENDING, response.getStatus());
        assertEquals(BigDecimal.valueOf(2400.00), response.getTotalAmount());
        assertEquals("buyer@shopsphere.com", response.getUserEmail());

        // Verify stock was deducted: 10 - 2 = 8
        assertEquals(8, product.getStockQuantity());
        verify(productRepository, times(1)).save(product);

        // Verify inventory audit log was recorded
        verify(inventoryLogRepository, times(1)).save(any(InventoryLog.class));

        // Verify cart items were cleared
        verify(cartItemRepository, times(1)).deleteByCartId(20L);
    }

    @Test
    @DisplayName("Should throw InsufficientStockException and abort checkout if stock < requested quantity")
    void testCheckout_InsufficientStock() {
        product.setStockQuantity(1); // Only 1 available, but cart requests 2

        CheckoutRequest request = CheckoutRequest.builder()
                .addressId(100L)
                .idempotencyKey("idemp_test_exhaustion")
                .build();

        when(orderRepository.findByIdempotencyKey(any())).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(addressRepository.findById(100L)).thenReturn(Optional.of(address));
        when(productRepository.findByIdWithPessimisticLock(50L)).thenReturn(Optional.of(product));

        assertThrows(InsufficientStockException.class, () -> orderService.checkout(1L, request));

        // Verify stock was NOT deducted
        assertEquals(1, product.getStockQuantity());
        verify(orderRepository, never()).save(any(Order.class));
        verify(cartItemRepository, never()).deleteByCartId(any());
    }

    @Test
    @DisplayName("Should throw BadRequestException when checkout attempted with empty cart")
    void testCheckout_EmptyCart() {
        cart.getItems().clear();

        CheckoutRequest request = CheckoutRequest.builder()
                .addressId(100L)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));

        assertThrows(BadRequestException.class, () -> orderService.checkout(1L, request));
    }

    @Test
    @DisplayName("Should cancel order and restore product stock with CANCELLATION_RESTORE log")
    void testCancelOrder_RestoresStock() {
        Order order = Order.builder()
                .id(777L)
                .orderNumber("ORD-20261116-TEST99")
                .user(user)
                .status(OrderStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(2400.00))
                .shippingAddressSnapshot("{}")
                .items(new ArrayList<>())
                .build();

        OrderItem item = OrderItem.builder()
                .order(order)
                .product(product)
                .productName(product.getName())
                .productSku(product.getSku())
                .unitPrice(product.getPrice())
                .quantity(2)
                .subtotal(BigDecimal.valueOf(2400.00))
                .build();

        order.getItems().add(item);

        product.setStockQuantity(8); // Current stock before cancellation

        when(orderRepository.findByOrderNumberAndUserId("ORD-20261116-TEST99", 1L)).thenReturn(Optional.of(order));
        when(productRepository.findByIdWithPessimisticLock(50L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        OrderResponse response = orderService.cancelOrder(1L, "ORD-20261116-TEST99");

        assertNotNull(response);
        assertEquals(OrderStatus.CANCELLED, response.getStatus());

        // Stock restored: 8 + 2 = 10
        assertEquals(10, product.getStockQuantity());
        verify(productRepository, times(1)).save(product);
        verify(inventoryLogRepository, times(1)).save(any(InventoryLog.class));
    }
}
