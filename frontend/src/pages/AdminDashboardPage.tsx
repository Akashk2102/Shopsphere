import React, { useEffect, useState } from 'react';
import { ShieldCheck, Package, DollarSign, AlertTriangle, RefreshCw } from 'lucide-react';
import { adminApi } from '../services/api';
import { LowStockProduct, Order, OrderStatus } from '../types';
import { useAuth } from '../context/AuthContext';

export const AdminDashboardPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');

  const [orders, setOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [, setLoading] = useState(true);

  // Restock modal state
  const [restockProduct, setRestockProduct] = useState<LowStockProduct | null>(null);
  const [restockQty, setRestockQty] = useState(20);
  const [restockReason, setRestockReason] = useState('WAREHOUSE_INTAKE_LOT_42');

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersRes, lowStockRes] = await Promise.all([
        adminApi.getAllOrders(undefined, 0, 50),
        adminApi.getLowStockProducts(15),
      ]);

      if (ordersRes.success && ordersRes.data) {
        setOrders(ordersRes.data.content);
      }
      if (lowStockRes.success && lowStockRes.data) {
        setLowStockProducts(lowStockRes.data);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderNumber: string, newStatus: OrderStatus) => {
    try {
      const res = await adminApi.updateOrderStatus(orderNumber, newStatus);
      if (res.success) {
        setOrders(orders.map((o) => (o.orderNumber === orderNumber ? { ...o, status: newStatus } : o)));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleExecuteRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;

    try {
      const res = await adminApi.restockProduct(restockProduct.id, restockQty, restockReason);
      if (res.success) {
        alert(`Successfully restocked ${restockProduct.name} (+${restockQty} units). Audit log created.`);
        setRestockProduct(null);
        loadDashboardData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to restock product');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-red-200 text-center">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-xs text-slate-500 mt-1">
          This dashboard requires Administrator credentials (ROLE_ADMIN).
        </p>
      </div>
    );
  }

  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED' && o.status !== 'PENDING')
    .reduce((acc, curr) => acc + Number(curr.totalAmount), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold border border-purple-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Store Administrator Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Operations & Sales Dashboard</h1>
        </div>

        <button
          onClick={loadDashboardData}
          className="flex items-center space-x-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Net Realized Revenue</span>
            <p className="text-2xl font-black text-slate-900">${totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Customer Orders</span>
            <p className="text-2xl font-black text-slate-900">{orders.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Low Stock SKU Alarms</span>
            <p className="text-2xl font-black text-slate-900">{lowStockProducts.length}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'orders'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Customer Orders Fulfillment ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'inventory'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Inventory Replenishment & Safety Stock ({lowStockProducts.length})
        </button>
      </div>

      {/* Tab 1: Orders Fulfillment Table */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Order Number</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                    <td className="px-6 py-4">{o.userEmail}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">${Number(o.totalAmount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateStatus(o.orderNumber, e.target.value as OrderStatus)}
                        className={`text-xs font-bold py-1.5 px-3 rounded-xl border focus:outline-none ${
                          o.status === 'PAID'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : o.status === 'PROCESSING'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : o.status === 'SHIPPED'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : o.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : o.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Inventory & Low Stock Alarms */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Available Stock</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {lowStockProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{p.sku}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="px-6 py-4 text-slate-500">{p.categoryName}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">${Number(p.price).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{p.currentStock} units</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setRestockProduct(p)}
                        className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        Restock SKU
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Restock Inventory</h3>
            <p className="text-xs text-slate-500 mb-4">{restockProduct.name} ({restockProduct.sku})</p>

            <form onSubmit={handleExecuteRestock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Units to Add</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Ledger Justification</label>
                <input
                  type="text"
                  required
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                  placeholder="e.g. PO-8941_SUPPLIER_DELIVERY"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700"
                >
                  Commit Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
