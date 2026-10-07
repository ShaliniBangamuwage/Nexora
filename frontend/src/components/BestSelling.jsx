import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';

export default function BestSelling() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/products/featured`)
      .then((response) => {
        if (!response.ok) throw new Error('Featured catalog unavailable');
        return response.json();
      })
      .then((rows) => { if (active) setProducts(Array.isArray(rows) ? rows.slice(0, 3) : []); })
      .catch((error) => console.warn('Could not load store picks:', error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading || !products.length) return null;
  return <section className="bg-slate-50 py-12">
    <div className="mx-auto max-w-6xl px-5">
      <header className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Customer favorites</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Popular tech</h2></header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{products.map((product, index) => <button key={product.id} onClick={() => navigate(`/customer/products/${product.id}`, { state: { product } })} className="flex min-h-36 items-center gap-4 border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:shadow-md"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-900">{index + 1}</span>{(product.images?.[0] || product.imageUrl) ? <img src={product.images?.[0] || product.imageUrl} alt="" className="h-20 w-20 shrink-0 object-contain" /> : <span className="grid h-20 w-20 shrink-0 place-items-center bg-slate-50 text-xs text-slate-400">No image</span>}<span className="min-w-0"><span className="block truncate text-xs font-semibold uppercase text-slate-500">{product.brand || product.manufacturer || 'NEXORA'}</span><span className="mt-1 block line-clamp-2 text-sm font-semibold text-slate-900">{product.name}</span><span className="mt-2 block text-sm font-bold text-emerald-800">Rs. {Number(product.price ?? product.retailPrice ?? 0).toFixed(2)}</span></span></button>)}</div>
    </div>
  </section>;
}
