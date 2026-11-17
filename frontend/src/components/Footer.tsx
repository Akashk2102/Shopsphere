import React from 'react';
import { ShoppingBag, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      {/* Value Proposition Highlights */}
      <div className="border-b border-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Instant Automated Dispatch</h4>
                <p className="text-xs text-slate-500">Atomic inventory reservations & tracking</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start space-x-3">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">PCI-DSS Compliant</h4>
                <p className="text-xs text-slate-500">Zero raw card storage & secure tokenization</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start space-x-3">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">ACID Transactions</h4>
                <p className="text-xs text-slate-500">PostgreSQL row locking prevents overselling</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand & Attribution */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="w-4 h-4 text-brand-600" />
          <span className="font-semibold text-slate-700">ShopSphere Platform</span>
          <span>— Full-Stack Java & React Architecture</span>
        </div>
        <p>© 2026 ShopSphere Enterprise. All rights reserved.</p>
      </div>
    </footer>
  );
};
