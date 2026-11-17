package com.shopsphere.modules.cart.service;

import com.shopsphere.modules.cart.dto.AddToCartRequest;
import com.shopsphere.modules.cart.dto.CartResponse;
import com.shopsphere.modules.cart.dto.UpdateCartItemRequest;

public interface CartService {
    CartResponse getCartForUser(Long userId);
    CartResponse addItemToCart(Long userId, AddToCartRequest request);
    CartResponse updateItemQuantity(Long userId, Long cartItemId, UpdateCartItemRequest request);
    CartResponse removeItemFromCart(Long userId, Long cartItemId);
    void clearCart(Long userId);
}
