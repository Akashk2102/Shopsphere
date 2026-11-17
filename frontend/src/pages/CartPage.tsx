import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const CartPage: React.FC = () => {
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-sm">
        <ShoppingBag className="w-12 h-12 text-brand-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to view your cart</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">Your shopping cart items are saved securely to your account.</p>
        <Link
          to="/login"
          className="inline-block w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Shopping Cart</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {cart?.totalItemsCount || 0} items currently reserved in your session
          </p>
        </div>

        {!isEmpty && (
          <button
            onClick={() => clearCart()}
            className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
          >
            Clear All Items
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Your shopping bag is empty</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Explore our curated catalog and add high-performance gear to your cart.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-brand-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Start Shopping</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={item.productImageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                    alt={item.productName}
                    className="w-20 h-20 rounded-xl object-cover bg-slate-100 border border-slate-100 shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {item.productSku}
                    </span>
                    <Link
                      to={`/products/${item.productSlug}`}
                      className="block font-semibold text-slate-900 hover:text-brand-600 text-sm line-clamp-1 transition-colors"
                    >
                      {item.productName}
                    </Link>
                    <div className="text-xs text-slate-500 mt-0.5">
                      ${Number(item.unitPrice).toFixed(2)} each
                    </div>
                  </div>
                </div>

                {/* Quantity Stepper & Subtotal */}
                <div className="flex items-center justify-between w-full sm:w-auto space-x-6">
                  <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      disabled={loading || item.quantity <= 1}
                      className="w-7 h-7 rounded bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-9 text-center text-xs font-bold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, Math.min(item.availableStock, item.quantity + 1))}
                      disabled={loading || item.quantity >= item.availableStock}
                      className="w-7 h-7 rounded bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <span className="block text-sm font-bold text-slate-900">
                      ${Number(item.subtotal).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Checkout Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm h-fit">
            <h3 className="text-base font-bold text-slate-900 mb-4">Order Summary</h3>

            <div className="space-y-3 text-xs text-slate-600 pb-4 border-b border-slate-100">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">${Number(cart?.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping & Handling</span>
                <span className="text-emerald-600 font-semibold uppercase">Free</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Estimated</span>
                <span className="font-semibold text-slate-900">$0.00</span>
              </div>
            </div>

            <div className="py-4 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-900">Total Due</span>
              <span className="text-2xl font-black text-slate-900">
                ${Number(cart?.totalAmount || 0).toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/20 transition-all active:scale-98"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-4 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safe & Secure 256-bit Encrypted Checkout</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
