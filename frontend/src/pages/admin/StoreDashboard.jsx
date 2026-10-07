import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CircleDollarSign, ClipboardList, Package, RefreshCw, Users } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import { getAuthHeaders } from '../../services/firebase';

export default function StoreDashboard() {
  const [summary, setSummary] = useState({ products: [], orders: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = await getAuthHeaders();
      const endpoints = ['/admin/catalog/products', '/orders', '/users'];
      const responses = await Promise.all(endpoints.map((path) => fetch(`${API_BASE_URL}${path}`, { headers })));
      const values = await Promise.all(responses.map(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || `Could not load ${response.url}`);
        return data;
      }));
      setSummary({ products: values[0], orders: values[1], users: values[2] });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const products = Array.isArray(summary.products) ? summary.products : [];
  const orders = Array.isArray(summary.orders) ? summary.orders : [];
  const users = Array.isArray(summary.users) ? summary.users : [];
  const lowStock = products.filter((product) => Number(product.stock || 0) <= 5 && product.status !== 'archived');
  const revenue = orders.filter((order) => order.paymentStatus === 'paid').reduce((total, order) => total + Number(order.totalAmount || 0), 0);
  const stats = [
    { label: 'Catalog products', value: products.filter((item) => item.status !== 'archived').length, icon: Package, tone: 'text-blue-800 bg-blue-50' },
    { label: 'Customer orders', value: orders.length, icon: ClipboardList, tone: 'text-emerald-800 bg-emerald-50' },
    { label: 'Customers', value: users.length, icon: Users, tone: 'text-orange-800 bg-orange-50' },
    { label: 'Paid revenue', value: `Rs. ${revenue.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`, icon: CircleDollarSign, tone: 'text-slate-800 bg-slate-100' },
  ];

  return <main className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">NEXORA operations</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Store Dashboard</h1></div><button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={15} /> Refresh</button></header>
    {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    {loading ? <p className="py-12 text-center text-slate-500">Loading store data…</p> : <>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon, tone }) => <article key={label} className="flex items-center gap-4 border border-slate-200 bg-white p-5"><span className={`grid h-10 w-10 place-items-center rounded-md ${tone}`}><Icon size={19} /></span><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{value}</p></div></article>)}</section>
      <section className="grid gap-6 lg:grid-cols-2">
        <article className="border border-slate-200 bg-white"><header className="flex items-center gap-2 border-b border-slate-200 px-5 py-4"><AlertTriangle size={17} className="text-amber-700" /><h2 className="font-semibold text-slate-900">Low stock</h2><span className="ml-auto text-xs text-slate-500">Threshold: 5 units</span></header><div className="divide-y divide-slate-100">{lowStock.slice(0, 8).map((product) => <div key={product.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm"><span className="min-w-0 truncate font-medium text-slate-800">{product.name || product.productName}</span><span className={`shrink-0 font-semibold ${Number(product.stock) === 0 ? 'text-red-700' : 'text-amber-700'}`}>{product.stock} left</span></div>)}{!lowStock.length && <p className="px-5 py-8 text-center text-sm text-slate-500">No low-stock items.</p>}</div></article>
        <article className="border border-slate-200 bg-white"><header className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Recent customer orders</h2></header><div className="divide-y divide-slate-100">{[...orders].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 8).map((order) => <div key={order.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm"><div className="min-w-0"><p className="truncate font-medium text-slate-800">{order.customerName || order.orderId}</p><p className="text-xs text-slate-500">{order.orderId} · {order.orderStatus}</p></div><span className="shrink-0 font-semibold text-slate-800">Rs. {Number(order.totalAmount || 0).toFixed(2)}</span></div>)}{!orders.length && <p className="px-5 py-8 text-center text-sm text-slate-500">No customer orders yet.</p>}</div></article>
      </section>
    </>}
  </main>;
}
