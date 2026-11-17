import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, PackageX, Sparkles } from 'lucide-react';
import { productApi } from '../services/api';
import { Category, Product } from '../types';
import { ProductCard } from '../components/ProductCard';

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters state
  const keyword = searchParams.get('keyword') || '';
  const categorySlug = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '0', 10);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<number>(2000);

  useEffect(() => {
    productApi.getCategories().then((res) => {
      if (res.success && res.data) {
        setCategories(res.data);
      }
    });
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const res = await productApi.getProducts({
          keyword: keyword || undefined,
          categorySlug: categorySlug || undefined,
          maxPrice: priceRange < 2000 ? priceRange : undefined,
          inStockOnly: inStockOnly || undefined,
          page,
          size: 8,
          sortBy: 'createdAt',
          sortDir: 'desc',
        });

        if (res.success && res.data) {
          setProducts(res.data.content);
          setTotalPages(res.data.totalPages);
          setTotalElements(res.data.totalElements);
        }
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [keyword, categorySlug, page, inStockOnly, priceRange]);

  const handleCategorySelect = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    if (categorySlug === slug) {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    params.set('page', '0');
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 text-white p-8 sm:p-12 mb-10 overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-4 backdrop-blur border border-brand-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Production-Grade Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Next-Gen E-Commerce with ACID Transactions
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            ShopSphere powers instant stock locking, zero overselling, and seamless customer checkout with Spring Boot 3 & PostgreSQL.
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        <button
          onClick={() => handleCategorySelect('')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            !categorySlug
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Categories
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategorySelect(cat.slug)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              categorySlug === cat.slug
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-600">
            <SlidersHorizontal className="w-4 h-4 text-brand-600" />
            <span>Max Price: <strong className="text-slate-900">${priceRange}</strong></span>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="accent-brand-600 w-28 sm:w-40 cursor-pointer"
            />
          </div>

          <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <span>In-Stock Only</span>
          </label>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="text-slate-900 font-bold">{totalElements}</span> products
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse h-80">
              <div className="w-full h-44 bg-slate-200 rounded-xl mb-4" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <PackageX className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No products found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or keyword query.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center items-center space-x-2">
          <button
            onClick={() => {
              const p = new URLSearchParams(searchParams);
              p.set('page', String(Math.max(0, page - 1)));
              setSearchParams(p);
            }}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Previous
          </button>

          <span className="text-xs font-semibold text-slate-600 px-3">
            Page {page + 1} of {totalPages}
          </span>

          <button
            onClick={() => {
              const p = new URLSearchParams(searchParams);
              p.set('page', String(page + 1));
              setSearchParams(p);
            }}
            disabled={page + 1 >= totalPages}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
