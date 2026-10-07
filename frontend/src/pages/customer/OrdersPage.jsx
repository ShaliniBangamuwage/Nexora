import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PackageCheck, RefreshCw, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAuthHeaders } from '../../services/firebase';
import API_BASE_URL from '../../config/api';

const formatDate = (value) => {
  const date = value?.seconds ? new Date(value.seconds * 1000) : new Date(value || 0);
  return !value || Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function OrdersPage() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    if (!currentUser) { setOrders([]); setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/customer-orders`, { headers: await getAuthHeaders() });
      const data = await response.json().catch(() => []);
      if (!response.ok) throw new Error(data.message || 'Could not load your orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [currentUser]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-10 sm:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Your account</p><h1 className="mt-1 text-3xl font-bold text-slate-900">My Orders</h1></div>
        <button onClick={loadOrders} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={15} /> Refresh</button>
      </header>
      {error && <div role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {loading ? <p className="py-16 text-center text-slate-500">Loading your orders…</p> : orders.length === 0 ? (
        <div className="py-20 text-center"><ShoppingBag size={34} className="mx-auto mb-3 text-slate-400" /><h2 className="text-lg font-semibold text-slate-800">No orders yet</h2><p className="mt-1 text-sm text-slate-500">Your placed orders will appear here.</p><Link to="/customer/products" className="mt-5 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white no-underline">Browse products</Link></div>
      ) : <div className="divide-y divide-slate-200 border-y border-slate-200">{orders.map((order) => {
        const lines = order.items || order.types || [];
        return <article key={order.id} className="py-6">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="font-semibold text-slate-900">Order {order.orderId || order.id}</p><p className="mt-1 text-xs text-slate-500">Placed {formatDate(order.createdAt)}</p></div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded bg-slate-100 px-2.5 py-1 text-slate-700">{order.orderStatus || 'Pending'}</span><span className={`rounded px-2.5 py-1 ${order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{order.paymentStatus || 'Payment pending'}</span></div>
          </header>
          <div className="mt-4 divide-y divide-slate-100">{lines.map((item, index) => <div key={`${item.productId || item.id}-${index}`} className="flex items-center justify-between gap-4 py-3"><div className="flex min-w-0 items-center gap-3">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-12 w-12 rounded border border-slate-200 object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded border border-slate-200 bg-slate-50"><PackageCheck size={17} className="text-slate-400" /></span>}<div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{item.name || item.productName}</p><p className="text-xs text-slate-500">Qty {item.quantity || item.qty} · Rs. {Number(item.price || 0).toFixed(2)} each</p></div></div><p className="shrink-0 text-sm font-semibold text-slate-800">Rs. {Number(item.subtotal ?? Number(item.price || 0) * Number(item.quantity || item.qty || 0)).toFixed(2)}</p></div>)}</div>
          <footer className="mt-3 flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3 text-sm"><span className="text-slate-500">{order.paymentMethod || 'Payment'} · {order.phone || ''}</span><span className="font-bold text-slate-900">Total Rs. {Number(order.totalAmount || 0).toFixed(2)}</span></footer>
        </article>;
      })}</div>}
    </main>
  );
}
