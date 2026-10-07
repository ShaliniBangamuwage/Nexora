import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';

const dateValue = (value) => {
  if (value?.seconds) return value.seconds * 1000;
  const parsed = Date.parse(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function NewArrivals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/products`)
      .then((response) => {
        if (!response.ok) throw new Error('Catalog unavailable');
        return response.json();
      })
      .then((rows) => {
        if (active) setProducts((Array.isArray(rows) ? rows : []).sort((a, b) => dateValue(b.createdAt) - dateValue(a.createdAt)).slice(0, 4));
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <section className="py-14 text-center text-sm text-slate-500">Loading recent products…</section>;
  if (error || !products.length) return null;

  return <section className="border-y border-slate-200 bg-white py-12">
    <div className="mx-auto max-w-6xl px-5">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Recently added</p><h2 className="mt-1 text-2xl font-bold text-slate-900">New arrivals</h2></div><button onClick={() => navigate('/customer/products')} className="text-sm font-semibold text-blue-800">View all</button></header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <button key={product.id} onClick={() => navigate(`/customer/products/${product.id}`, { state: { product } })} className="overflow-hidden border border-slate-200 bg-white text-left transition hover:border-blue-300 hover:shadow-md"><div className="grid h-44 place-items-center bg-slate-50">{(product.images?.[0] || product.imageUrl) ? <img src={product.images?.[0] || product.imageUrl} alt={product.name} className="h-full w-full object-contain p-4" /> : <span className="text-sm text-slate-400">No image</span>}</div><div className="p-4"><p className="text-xs font-semibold uppercase text-slate-500">{product.brand || product.manufacturer || 'NEXORA'}</p><h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">{product.name}</h3><p className="mt-2 font-bold text-blue-800">Rs. {Number(product.price ?? product.retailPrice ?? 0).toFixed(2)}</p></div></button>)}</div>
    </div>
  </section>;
}
