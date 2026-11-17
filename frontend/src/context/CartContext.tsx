import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cart } from '../types';
import { cartApi } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  totalCount: number;
  refreshCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const refreshCart = async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const res = await cartApi.getCart();
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (err) {
      console.error('Failed to load cart', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated]);

  const addToCart = async (productId: number, quantity = 1) => {
    const res = await cartApi.addItem(productId, quantity);
    if (res.success && res.data) {
      setCart(res.data);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    const res = await cartApi.updateQuantity(itemId, quantity);
    if (res.success && res.data) {
      setCart(res.data);
    }
  };

  const removeFromCart = async (itemId: number) => {
    const res = await cartApi.removeItem(itemId);
    if (res.success && res.data) {
      setCart(res.data);
    }
  };

  const clearCart = async () => {
    await cartApi.clearCart();
    setCart(null);
  };

  const totalCount = cart?.totalItemsCount || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        totalCount,
        refreshCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
