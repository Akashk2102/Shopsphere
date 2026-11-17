import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, ArrowRight, CreditCard, Ban } from 'lucide-react';
import { orderApi } from '../services/api';
import { Order, OrderStatus } from '../types';
import { PaymentModal } from '../components/PaymentModal';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getMyOrders();
      if (res.success && res.data) {
        setOrders(res.data.content);
      }
    } catch (err) {
      console.error('Failed to load order history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderNumber: string) => {
    if (!window.confirm('Are you sure you want to cancel this order? Reserved stock will be restored.')) {
      return;
    }
    try {
      const res = await orderApi.cancelOrder(orderNumber);
      if (res.success) {
        loadOrders();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-800 border-amber-200 border text-[11px] font-bold px-2.5 py-1 rounded-full uppercase">Pending Payment</span>;
      case 'PAID':
        return <span className="bg-blue-100 text-blue-800 border-blue-200 border text-[11px] font-bold px-2.5 py-1 rounded-full uppercase">Paid</span>;
      case 'PROCESSING':
        return <span className="bg-purple-100 text-purple-800 border-purple-200 border text-[11px] font-bold px-2.5 py-1 rounded-full uppercase">Processing</span>;
      case 'SHIPPED':
        return <span className="bg-indigo-100 text-indigo-800 border-indigo-200 border text-[11px] font-bold px-2.5 py-1 rounded-full uppercase">Shipped</span>;
      case 'DELIVERED':
        return <span className="bg-emerald-100 text-emerald-800 border-emerald-200 border text-[11px] font-bold px-2.5 py-1 rounded-full uppercase">Delivered</span>;
      case 'CANCELLED':
        return <span className="bg-red-100 text-red-800 border-red-200 border text-[11px] font-bold px-2.5 py-1 rounded-full uppercase">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Orders & Tracking</h1>
        <p className="text-xs text-slate-500 mt-1">Review historical purchases, fulfillment milestones, and receipts</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-28" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-sm">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-900">No orders placed yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">When you complete checkout, your order tracking appears here.</p>
          <Link
            to="/"
            className="inline-block px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-colors"
          >
            Start Browsing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-slate-900 text-sm">{order.orderNumber}</span>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </span>
                  <span>{order.totalItemsCount} items</span>
                  <span className="font-bold text-slate-800">${Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                {order.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => setSelectedOrderForPayment(order)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay Now</span>
                    </button>

                    <button
                      onClick={() => handleCancelOrder(order.orderNumber)}
                      className="flex items-center space-x-1 text-slate-500 hover:text-red-600 text-xs font-semibold p-2"
                      title="Cancel order and restore stock"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </>
                )}

                <Link
                  to={`/orders/${order.orderNumber}`}
                  className="flex items-center space-x-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  <span>Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {selectedOrderForPayment && (
        <PaymentModal
          orderNumber={selectedOrderForPayment.orderNumber}
          totalAmount={selectedOrderForPayment.totalAmount}
          isOpen={!!selectedOrderForPayment}
          onClose={() => setSelectedOrderForPayment(null)}
          onPaymentSuccess={() => {
            setSelectedOrderForPayment(null);
            loadOrders();
          }}
        />
      )}
    </div>
  );
};
