import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, ShieldCheck, Truck, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { productApi } from '../services/api';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (slug) {
      setLoading(true);
      productApi.getProductBySlug(slug)
        .then((res) => {
          if (res.success && res.data) {
            setProduct(res.data);
          }
        })
        .catch((err) => console.error('Failed to load product details', err))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    if (!product) return;

    try {
      setError(null);
      await addToCart(product.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to add item to cart';
      setError(msg);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <Link to="/" className="mt-4 inline-block text-brand-600 font-semibold text-sm">
          Return to Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Breadcrumb Back Link */}
      <Link to="/" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Products</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
        
        {/* Product Media Column */}
        <div className="rounded-2xl overflow-hidden aspect-square bg-slate-100 border border-slate-100 flex items-center justify-center">
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Details Column */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="uppercase tracking-wider font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
                {product.categoryName}
              </span>
              <span className="font-mono">{product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 leading-snug">
              {product.name}
            </h1>

            {/* Price & Stock Pill */}
            <div className="mt-4 flex items-center space-x-4">
              <span className="text-3xl font-black text-slate-900">
                ${Number(product.price).toFixed(2)}
              </span>

              {product.stockQuantity > 0 ? (
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                  {product.stockQuantity} units available
                </span>
              ) : (
                <span className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                  Out of Stock
                </span>
              )}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">
                Product Overview
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          </div>

          {/* Quantity Stepper & Add Button */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            {product.stockQuantity > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-xs font-semibold text-slate-500">Quantity:</span>
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-slate-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-98 ${
                    added
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                      : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Added to Your Shopping Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span>Add to Shopping Cart — ${(Number(product.price) * quantity).toFixed(2)}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-sm font-semibold text-slate-500">
                This item is currently sold out. Please check back later.
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quality & Security Assurances */}
            <div className="grid grid-cols-3 gap-2 mt-8 pt-6 border-t border-slate-100 text-center text-[11px] text-slate-500 font-medium">
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
                <span>Guaranteed Authentic</span>
              </div>
              <div className="flex flex-col items-center">
                <Truck className="w-4 h-4 text-brand-600 mb-1" />
                <span>Free Express Delivery</span>
              </div>
              <div className="flex flex-col items-center">
                <RefreshCw className="w-4 h-4 text-indigo-600 mb-1" />
                <span>Instant Stock Lock</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
