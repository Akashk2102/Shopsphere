import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { userApi, orderApi } from '../services/api';
import { Address, PaymentReceipt } from '../types';
import { useCart } from '../context/CartContext';
import { PaymentModal } from '../components/PaymentModal';

export const CheckoutPage: React.FC = () => {
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Address creation form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: true,
  });

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [createdOrderTotal, setCreatedOrderTotal] = useState<number>(0);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const res = await userApi.getAddresses();
      if (res.success && res.data) {
        setAddresses(res.data);
        const def = res.data.find((a) => a.isDefault) || res.data[0];
        if (def) setSelectedAddressId(def.id);
      }
    } catch (err) {
      console.error('Failed to load delivery addresses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await userApi.addAddress(newAddress);
      if (res.success && res.data) {
        setAddresses([...addresses, res.data]);
        setSelectedAddressId(res.data.id);
        setShowAddressForm(false);
        setNewAddress({
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India',
          isDefault: false,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not save delivery address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select or add a delivery address');
      return;
    }
    if (!cart || cart.items.length === 0) {
      setError('Your shopping cart is empty');
      return;
    }

    try {
      setPlacingOrder(true);
      setError(null);

      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const res = await orderApi.checkout({
        addressId: selectedAddressId,
        idempotencyKey,
      });

      if (res.success && res.data) {
        setCreatedOrderNumber(res.data.orderNumber);
        setCreatedOrderTotal(res.data.totalAmount);
        await refreshCart(); // Refresh cart to show empty
        setPaymentModalOpen(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Checkout failed. Please review stock and retry.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handlePaymentSuccess = (receipt: PaymentReceipt) => {
    setPaymentModalOpen(false);
    navigate(`/orders/${receipt.orderNumber}`);
  };

  const items = cart?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">
        Secure Checkout
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3 text-xs text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Delivery Address Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg font-bold text-slate-900">1. Delivery Address</h2>
              </div>

              {!showAddressForm && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Address</span>
                </button>
              )}
            </div>

            {/* Address Selection List */}
            {!showAddressForm ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      selectedAddressId === addr.id
                        ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-800">
                          {addr.addressLine1}
                        </span>
                        {selectedAddressId === addr.id && (
                          <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}
                        {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-600 mt-1">{addr.country}</p>
                    </div>

                    {addr.isDefault && (
                      <span className="mt-3 text-[10px] uppercase tracking-wider font-bold text-brand-600">
                        Default Address
                      </span>
                    )}
                  </div>
                ))}

                {addresses.length === 0 && !loading && (
                  <div className="col-span-2 text-center py-6 text-xs text-slate-500">
                    No delivery address saved. Please add an address below to proceed.
                  </div>
                )}
              </div>
            ) : (
              /* Add Address Form */
              <form onSubmit={handleCreateAddress} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Enter Shipping Information</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 102 Crystal Heights, Sector 18"
                      value={newAddress.addressLine1}
                      onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bangalore"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">State / Province</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Karnataka"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 560001"
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                    <input
                      type="text"
                      required
                      value={newAddress.country}
                      onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Review Items */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">2. Review Ordered Line Items</h2>
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.productImageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                      alt={item.productName}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 block">{item.productName}</span>
                      <span className="text-slate-500">Qty: {item.quantity} × ${Number(item.unitPrice).toFixed(2)}</span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">${Number(item.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Final Summary */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm h-fit">
          <h3 className="text-base font-bold text-slate-900 mb-4">Payment Summary</h3>

          <div className="space-y-3 text-xs text-slate-600 pb-4 border-b border-slate-100">
            <div className="flex justify-between">
              <span>Items Total ({cart?.totalItemsCount || 0})</span>
              <span className="font-semibold text-slate-900">${Number(cart?.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span className="text-emerald-600 font-semibold uppercase">Free</span>
            </div>
            <div className="flex justify-between">
              <span>Sales Tax</span>
              <span className="font-semibold text-slate-900">$0.00</span>
            </div>
          </div>

          <div className="py-4 flex justify-between items-center text-sm">
            <span className="font-bold text-slate-900">Final Order Amount</span>
            <span className="text-2xl font-black text-slate-900">
              ${Number(cart?.totalAmount || 0).toFixed(2)}
            </span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={placingOrder || !selectedAddressId || items.length === 0}
            className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/20 transition-all active:scale-98"
          >
            {placingOrder ? (
              <span>Reserving Inventory...</span>
            ) : (
              <span>Place Order & Pay</span>
            )}
          </button>

          <div className="mt-4 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pessimistic Row Lock & ACID Guarantee</span>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {createdOrderNumber && (
        <PaymentModal
          orderNumber={createdOrderNumber}
          totalAmount={createdOrderTotal}
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
