import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await addToCart(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not add to cart';
      setError(msg);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-brand-500/30 transition-all duration-300 flex flex-col justify-between">
      
      {/* Product Image & Stock Badge */}
      <Link to={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-slate-100">
        <img
          src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Stock Badge */}
        <div className="absolute top-3 left-3">
          {product.stockQuantity > 0 ? (
            product.stockQuantity <= 5 ? (
              <span className="bg-amber-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                Only {product.stockQuantity} Left!
              </span>
            ) : (
              <span className="bg-emerald-600/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                In Stock
              </span>
            )
          ) : (
            <span className="bg-red-600/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          )}
        </div>
      </Link>

      {/* Body Information */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="uppercase tracking-wider font-semibold text-brand-600">{product.categoryName}</span>
            <span className="font-mono text-[11px]">{product.sku}</span>
          </div>

          <Link to={`/products/${product.slug}`}>
            <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1 text-base">
              {product.name}
            </h3>
          </Link>

          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action Button */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Price</span>
            <span className="text-lg font-bold text-slate-900">
              ${Number(product.price).toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stockQuantity === 0 || loading}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              added
                ? 'bg-emerald-600 text-white'
                : product.stockQuantity === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-brand-600 shadow-sm active:scale-95'
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{product.stockQuantity === 0 ? 'Sold Out' : 'Add'}</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-2 flex items-center space-x-1 text-[11px] text-red-600 font-medium">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
