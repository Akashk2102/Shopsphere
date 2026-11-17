package com.shopsphere.modules.cart.service;

import com.shopsphere.common.exception.BadRequestException;
import com.shopsphere.common.exception.InsufficientStockException;
import com.shopsphere.common.exception.ResourceNotFoundException;
import com.shopsphere.modules.cart.dto.AddToCartRequest;
import com.shopsphere.modules.cart.dto.CartItemResponse;
import com.shopsphere.modules.cart.dto.CartResponse;
import com.shopsphere.modules.cart.dto.UpdateCartItemRequest;
import com.shopsphere.modules.cart.entity.Cart;
import com.shopsphere.modules.cart.entity.CartItem;
import com.shopsphere.modules.cart.repository.CartItemRepository;
import com.shopsphere.modules.cart.repository.CartRepository;
import com.shopsphere.modules.product.entity.Product;
import com.shopsphere.modules.product.repository.ProductRepository;
import com.shopsphere.modules.user.entity.User;
import com.shopsphere.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CartResponse getCartForUser(Long userId) {
        Cart cart = getOrCreateCart(userId);
        return mapToCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse addItemToCart(Long userId, AddToCartRequest request) {
        Cart cart = getOrCreateCart(userId);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        if (!product.isActive()) {
            throw new BadRequestException("Product is currently inactive and cannot be purchased");
        }

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        int targetQuantity = request.getQuantity();
        if (existingItemOpt.isPresent()) {
            targetQuantity += existingItemOpt.get().getQuantity();
        }

        if (targetQuantity > product.getStockQuantity()) {
            throw new InsufficientStockException(product.getName(), targetQuantity, product.getStockQuantity());
        }

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            existingItem.setQuantity(targetQuantity);
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        return mapToCartResponse(cartRepository.findById(cart.getId()).orElse(cart));
    }

    @Override
    @Transactional
    public CartResponse updateItemQuantity(Long userId, Long cartItemId, UpdateCartItemRequest request) {
        Cart cart = getOrCreateCart(userId);

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", cartItemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Item does not belong to the user's active shopping cart");
        }

        if (request.getQuantity() > item.getProduct().getStockQuantity()) {
            throw new InsufficientStockException(
                    item.getProduct().getName(), request.getQuantity(), item.getProduct().getStockQuantity()
            );
        }

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        return mapToCartResponse(cartRepository.findById(cart.getId()).orElse(cart));
    }

    @Override
    @Transactional
    public CartResponse removeItemFromCart(Long userId, Long cartItemId) {
        Cart cart = getOrCreateCart(userId);

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", cartItemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Item does not belong to the user's active shopping cart");
        }

        cart.getItems().remove(item);
        cartItemRepository.delete(item);

        return mapToCartResponse(cartRepository.findById(cart.getId()).orElse(cart));
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        cartItemRepository.deleteByCartId(cart.getId());
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    private Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            Cart newCart = Cart.builder().user(user).build();
            return cartRepository.save(newCart);
        });
    }

    private CartResponse mapToCartResponse(Cart cart) {
        List<CartItemResponse> itemResponses = cart.getItems().stream()
                .sorted(Comparator.comparing(CartItem::getId))
                .map(item -> {
                    BigDecimal unitPrice = item.getProduct().getPrice();
                    BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
                    boolean inStock = item.getProduct().getStockQuantity() >= item.getQuantity();

                    return CartItemResponse.builder()
                            .id(item.getId())
                            .productId(item.getProduct().getId())
                            .productName(item.getProduct().getName())
                            .productSlug(item.getProduct().getSlug())
                            .productSku(item.getProduct().getSku())
                            .productImageUrl(item.getProduct().getImageUrl())
                            .unitPrice(unitPrice)
                            .quantity(item.getQuantity())
                            .subtotal(subtotal)
                            .inStock(inStock)
                            .availableStock(item.getProduct().getStockQuantity())
                            .build();
                })
                .collect(Collectors.toList());

        int totalCount = itemResponses.stream().mapToInt(CartItemResponse::getQuantity).sum();
        BigDecimal totalAmount = itemResponses.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .id(cart.getId())
                .items(itemResponses)
                .totalItemsCount(totalCount)
                .totalAmount(totalAmount)
                .build();
    }
}
