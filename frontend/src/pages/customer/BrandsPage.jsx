import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, RefreshCw, Tag } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import { C, FONT } from '../../components/profile/profileTheme';

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/brands`);
      const data = await response.json().catch(() => []);
      if (!response.ok) throw new Error(data.message || 'Could not load brands');
      setBrands(Array.isArray(data) ? data : []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return <main className="min-h-screen" style={{ background: C.bg, fontFamily: FONT.body }}>
    <header className="border-b border-slate-200 bg-white px-5 py-12 sm:px-8"><div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-800">Shop by maker</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Technology brands</h1><p className="mt-2 max-w-xl text-sm text-slate-600">Browse electronics and accessories from the brands in our catalog.</p></div><button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><RefreshCw size={15} /> Refresh</button></div></header>
    <section className="mx-auto max-w-6xl px-5 py-9 sm:px-8">
      {error && <div role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {loading ? <p className="py-16 text-center text-slate-500">Loading brands…</p> : brands.length === 0 ? <div className="py-16 text-center"><Tag size={30} className="mx-auto mb-3 text-slate-400" /><h2 className="font-semibold text-slate-800">No brands published yet</h2><p className="mt-1 text-sm text-slate-500">Brands added to the electronics catalog will appear here.</p></div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{brands.map((brand) => <button key={brand.id} onClick={() => navigate(`/customer/products?brand=${encodeURIComponent(brand.name)}`)} className="group flex min-h-36 items-center justify-between gap-4 border border-slate-200 bg-white p-5 text-left transition hover:border-blue-300 hover:shadow-md"><div className="flex min-w-0 items-center gap-4">{brand.imageUrl ? <img src={brand.imageUrl} alt="" className="h-14 w-14 rounded border border-slate-200 object-contain p-1" /> : <span className="grid h-14 w-14 shrink-0 place-items-center rounded bg-slate-50 text-blue-800"><Tag size={22} /></span>}<span className="min-w-0"><span className="block truncate text-lg font-bold text-slate-900">{brand.name}</span>{brand.tagline && <span className="mt-1 block line-clamp-2 text-sm text-slate-500">{brand.tagline}</span>}</span></div><ArrowUpRight size={17} className="shrink-0 text-slate-400 group-hover:text-blue-800" /></button>)}</div>}
    </section>
  </main>;
}
