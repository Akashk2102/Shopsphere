import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { orderApi, paymentApi } from '../services/api';
import { Order, PaymentReceipt } from '../types';
import { PaymentModal } from '../components/PaymentModal';

export const OrderDetailPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (orderNumber) {
      loadOrderData();
    }
  }, [orderNumber]);

  const loadOrderData = async () => {
    if (!orderNumber) return;
    try {
      setLoading(true);
      const res = await orderApi.getOrderDetails(orderNumber);
      if (res.success && res.data) {
        setOrder(res.data);
      }

      // Try fetching payment receipt
      paymentApi.getPaymentReceipt(orderNumber)
        .then((pRes) => {
          if (pRes.success && pRes.data) {
            setReceipt(pRes.data);
          }
        })
        .catch(() => {});
    } catch (err) {
      console.error('Failed to load order', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
        <Link to="/orders" className="text-brand-600 font-semibold text-xs mt-3 inline-block">
          Return to My Orders
        </Link>
      </div>
    );
  }

  let parsedAddress: any = null;
  try {
    parsedAddress = JSON.parse(order.shippingAddress);
  } catch (e) {
    parsedAddress = { raw: order.shippingAddress };
  }

  const steps = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const currentStepIndex = steps.indexOf(order.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Back Link */}
      <Link to="/orders" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Order History</span>
      </Link>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Order Details</span>
            <h1 className="text-2xl font-black text-slate-900 font-mono mt-0.5">{order.orderNumber}</h1>
            <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-700">{order.userEmail}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {order.status === 'PENDING' && (
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center space-x-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>Complete Payment</span>
              </button>
            )}
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Grand Total</span>
              <span className="text-2xl font-extrabold text-slate-900">${Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Milestone Tracker (if not cancelled) */}
        {order.status !== 'CANCELLED' ? (
          <div className="pt-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Fulfillment Timeline</h4>
            <div className="grid grid-cols-5 gap-2 text-center">
              {steps.map((st, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={st} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPassed
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                          : 'bg-slate-100 text-slate-400'
                      } ${isCurrent ? 'ring-4 ring-brand-100' : ''}`}
                    >
                      {idx + 1}
                    </div>
                    <span className={`text-[10px] mt-2 font-semibold ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                      {st}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pt-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold">
              This order has been cancelled and any reserved product inventory was automatically restored.
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Line Items List */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Purchased Items (Frozen Price Snapshot)</h3>
          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-slate-900 text-sm block">{item.productName}</span>
                  <span className="font-mono text-slate-400 text-[11px]">{item.productSku}</span>
                  <div className="text-slate-500 mt-0.5">
                    ${Number(item.unitPrice).toFixed(2)} × {item.quantity} units
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  ${Number(item.subtotal).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Payment Meta */}
        <div className="space-y-6">
          
          {/* Shipping Address Snapshot Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center space-x-2 text-brand-600 mb-3">
              <MapPin className="w-4 h-4" />
              <h4 className="text-xs uppercase font-bold tracking-wider text-slate-900">Shipping Snapshot</h4>
            </div>

            {parsedAddress.raw ? (
              <p className="text-xs text-slate-600">{parsedAddress.raw}</p>
            ) : (
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">{parsedAddress.recipientName}</p>
                <p>{parsedAddress.phoneNumber}</p>
                <p>{parsedAddress.addressLine1}</p>
                {parsedAddress.addressLine2 && <p>{parsedAddress.addressLine2}</p>}
                <p>{parsedAddress.city}, {parsedAddress.state} - {parsedAddress.postalCode}</p>
                <p className="font-semibold text-slate-700">{parsedAddress.country}</p>
              </div>
            )}
          </div>

          {/* Payment Gateway Receipt Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center space-x-2 text-brand-600 mb-3">
              <CreditCard className="w-4 h-4" />
              <h4 className="text-xs uppercase font-bold tracking-wider text-slate-900">Payment Status</h4>
            </div>

            {receipt ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Ref</span>
                  <span className="font-mono text-[11px] font-semibold text-slate-700">{receipt.paymentReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Method</span>
                  <span className="font-semibold text-slate-700">{receipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="font-bold text-emerald-600 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{receipt.paymentStatus}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                {order.status === 'PENDING' ? (
                  <p className="text-amber-600 font-semibold">Payment Pending. Please complete transaction to initiate dispatch.</p>
                ) : (
                  <p>Payment recorded with order status {order.status}</p>
                )}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-1.5 text-[10px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>PCI-DSS Tokenized Transaction</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        orderNumber={order.orderNumber}
        totalAmount={order.totalAmount}
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onPaymentSuccess={() => {
          setPaymentModalOpen(false);
          loadOrderData();
        }}
      />
    </div>
  );
};
