import React, { useState } from 'react';
import { CreditCard, ShieldCheck, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { paymentApi } from '../services/api';
import { PaymentReceipt } from '../types';

interface PaymentModalProps {
  orderNumber: string;
  totalAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (receipt: PaymentReceipt) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  orderNumber,
  totalAmount,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcessPayment = async (outcome: 'SUCCESS' | 'DECLINE') => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Initialize Payment Intent with backend
      const intentRes = await paymentApi.createIntent(orderNumber);
      if (!intentRes.success || !intentRes.data) {
        throw new Error('Failed to create payment intent');
      }

      // Step 2: Confirm Sandbox Payment
      const confirmRes = await paymentApi.confirmPayment(intentRes.data.paymentReference, outcome);
      if (confirmRes.success && confirmRes.data) {
        onPaymentSuccess(confirmRes.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Payment simulation failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Sandbox Payment Gateway</h3>
            <p className="text-xs text-slate-500">Secure PCI-DSS Simulated Terminal</p>
          </div>
        </div>

        {/* Order Amount Banner */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
            <span>Order Reference</span>
            <span className="font-mono font-semibold text-slate-700">{orderNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-700">Amount Due</span>
            <span className="text-2xl font-extrabold text-slate-900">${Number(totalAmount).toFixed(2)}</span>
          </div>
        </div>

        {/* Simulated Credit Card Preview */}
        <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-brand-900 text-white p-5 rounded-2xl shadow-lg mb-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs uppercase tracking-widest font-mono text-slate-400">Sandbox Test Card</span>
            <span className="font-bold text-sm tracking-wider">VISA</span>
          </div>
          <div className="font-mono text-lg tracking-widest mb-4">
            4242 •••• •••• 4242
          </div>
          <div className="flex justify-between text-[11px] text-slate-300">
            <div>
              <span className="block text-[9px] text-slate-400 uppercase">Card Holder</span>
              <span>TEST CUSTOMER</span>
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 uppercase">Expires</span>
              <span>12/28</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="space-y-3">
          <button
            onClick={() => handleProcessPayment('SUCCESS')}
            disabled={loading}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center space-x-2 transition-all active:scale-98 disabled:opacity-60"
          >
            {loading ? (
              <span>Capturing Payment...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Pay & Approve (Happy Path)</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleProcessPayment('DECLINE')}
            disabled={loading}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition-colors disabled:opacity-60"
          >
            Simulate Card Decline (Test Error Handling)
          </button>
        </div>

        <div className="mt-5 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Encrypted End-to-End. No actual money is debited.</span>
        </div>
      </div>
    </div>
  );
};
