'use client';
import { useEffect, useState, useCallback } from 'react';
import FilterBar from '../../components/products/FilterBar';
import ProductCard from '../../components/products/ProductCard';
import { C, FONT } from '../../components/profile/profileTheme';
import { Tag } from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import API_BASE_URL from '../../config/api';

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState(() => new URLSearchParams(window.location.search).get('category') || 'all');
  const [selectedBrand, setSelectedBrand] = useState(() => new URLSearchParams(window.location.search).get('brand') || 'all');
  const [minimumPrice, setMinimumPrice] = useState('');
  const [maximumPrice, setMaximumPrice] = useState('');
  const [products, setProducts]                 = useState([]);
  const [categories, setCategories]             = useState(CATEGORIES);
  const [smartResults, setSmartResults]         = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);

  const fetchProducts = useCallback(async () => {
    setError(null);
    try {
      const [res, categoryResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/products`),
        fetch(`${API_BASE_URL}/products/categories`),
      ]);
      if (!res.ok) throw new Error(`Catalog request failed (${res.status})`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json();
        if (Array.isArray(categoryData) && categoryData.length) {
          setCategories(categoryData.map((item) => ({ id: item.slug || item.id, name: item.name })));
        }
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const sourceProducts = smartResults !== null ? smartResults : products;
  const brands = [...new Set(products.map((product) => product.brand || product.manufacturer).filter(Boolean))].sort();
  const filteredProducts = sourceProducts.filter((product) => {
    const price = Number(product.price ?? product.retailPrice ?? 0);
    const brand = product.brand || product.manufacturer || '';
    return (selectedCategory === 'all' || String(product.category).toLowerCase().replace(/[^a-z0-9]/g, '') === selectedCategory.toLowerCase().replace(/[^a-z0-9]/g, ''))
      && (selectedBrand === 'all' || brand === selectedBrand)
      && (!minimumPrice || price >= Number(minimumPrice))
      && (!maximumPrice || price <= Number(maximumPrice));
  });

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: FONT.body }}>

      <div
        className="px-6 pt-14 pb-12 text-center"
       style={{ background: "linear-gradient(135deg, #0f172a 0%, #2563eb 100%)" }}
      >
        <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: FONT.body }}>
          Shop the Latest Tech
        </h1>
        <p className="text-[15px] text-white/75 max-w-[620px] mx-auto">
          Explore premium smartphones, laptops, wearables, accessories, and smart-home essentials curated for modern life.
        </p>
      </div>

      <FilterBar
        selectedCategory={selectedCategory}
        onCategory={setSelectedCategory}
        categories={categories}
        smartResults={smartResults}
        onSmartResults={setSmartResults}
      />

      <div className="mx-auto flex max-w-[1200px] flex-wrap items-end gap-3 px-6 pt-5">
        <label className="flex min-w-[180px] flex-col gap-1 text-xs font-semibold text-slate-600">
          Brand
          <select value={selectedBrand} onChange={(event) => setSelectedBrand(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="all">All brands</option>
            {brands.map((brand) => <option value={brand} key={brand}>{brand}</option>)}
          </select>
        </label>
        <label className="flex w-32 flex-col gap-1 text-xs font-semibold text-slate-600">
          Min price
          <input type="number" min="0" value={minimumPrice} onChange={(event) => setMinimumPrice(event.target.value)} placeholder="Any" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
        </label>
        <label className="flex w-32 flex-col gap-1 text-xs font-semibold text-slate-600">
          Max price
          <input type="number" min="0" value={maximumPrice} onChange={(event) => setMaximumPrice(event.target.value)} placeholder="Any" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
        </label>
        {(selectedBrand !== 'all' || minimumPrice || maximumPrice) && <button onClick={() => { setSelectedBrand('all'); setMinimumPrice(''); setMaximumPrice(''); }} className="mb-0.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Reset filters</button>}
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-9">
        {error ? (
          <div
            className="rounded-2xl py-[72px] text-center"
            style={{ background: C.surface, border: `1px solid #fca5a5` }}
          >
            <p className="text-[15px] font-bold text-red-500">{error}</p>
            <button
              onClick={fetchProducts}
              className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: C.accent }}
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-[72px]" style={{ color: C.textMuted, fontFamily: FONT.body }}>
            Loading products…
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            className="rounded-2xl py-[72px] text-center"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
          >
            <Tag size={40} color={C.textMuted} className="mx-auto mb-3.5" />
            <p className="text-[15px] font-bold" style={{ color: C.textSoft }}>No products found.</p>
            <p className="text-[13px] mt-1.5" style={{ color: C.textMuted }}>
              Try a different search or category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}