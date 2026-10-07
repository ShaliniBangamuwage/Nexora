import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search, X } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import { getAuthHeaders } from '../../services/firebase';

const ORDER_STATUSES = ['Pending-Payment', 'Pending-COD', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Payment-Failed'];
const dateLabel = (value) => {
  const date = value?.seconds ? new Date(value.seconds * 1000) : new Date(value || 0);
  return Number.isNaN(date.getTime()) || !value ? '—' : date.toLocaleString();
};

export default function StoreOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState('');

  const request = useCallback(async (path, options = {}) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await request('/orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [request]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const updateStatus = async (order, orderStatus) => {
    setUpdating(order.id);
    try {
      await request(`/orders/${order.id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderStatus }),
      });
      setOrders((rows) => rows.map((row) => row.id === order.id ? { ...row, orderStatus } : row));
    } catch (err) { setError(err.message); }
    finally { setUpdating(''); }
  };

  const settlePayment = async (order) => {
    setUpdating(order.id);
    try {
      await request(`/customer-orders/${order.id}/settle-payment`, { method: 'PUT' });
      setOrders((rows) => rows.map((row) => row.id === order.id ? { ...row, paymentStatus: 'paid', orderStatus: 'Processing' } : row));
    } catch (err) { setError(err.message); }
    finally { setUpdating(''); }
  };

  const filtered = orders.filter((order) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [order.orderId, order.customerName, order.email, order.phone, order.orderStatus]
      .some((value) => String(value || '').toLowerCase().includes(term));
  });

  return (
    <section className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Customer fulfillment</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Store Orders</h1></div>
        <button onClick={loadOrders} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><RefreshCw size={15} /> Refresh</button>
      </header>
      <label className="flex max-w-md items-center gap-2 rounded-md border border-slate-300 bg-white px-3"><Search size={16} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order or customer" className="w-full py-2.5 text-sm outline-none" /></label>
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {loading ? <p className="py-12 text-center text-slate-500">Loading orders…</p> : <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Order status</th><th className="px-4 py-3">Placed</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{filtered.map((order) => <tr key={order.id}>
            <td className="px-4 py-3"><button onClick={() => setSelected(order)} className="font-semibold text-blue-800 hover:underline">{order.orderId || order.id}</button></td>
            <td className="px-4 py-3"><p className="font-medium text-slate-900">{order.customerName || 'Customer'}</p><p className="text-xs text-slate-500">{order.email || ''} {order.phone ? `· ${order.phone}` : ''}</p></td>
            <td className="px-4 py-3">{(order.items || order.types || []).reduce((sum, item) => sum + Number(item.quantity || item.qty || 0), 0)} item(s)</td>
            <td className="px-4 py-3 font-semibold">Rs. {Number(order.totalAmount || 0).toFixed(2)}</td>
            <td className="px-4 py-3"><span>{order.paymentMethod || '—'}</span><span className="ml-2 text-xs text-slate-500">{order.paymentStatus || 'pending'}</span></td>
            <td className="px-4 py-3"><select aria-label={`Status for ${order.orderId || order.id}`} value={ORDER_STATUSES.includes(order.orderStatus) ? order.orderStatus : 'Processing'} disabled={updating === order.id} onChange={(event) => updateStatus(order, event.target.value)} className="max-w-[175px] rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"><option value={order.orderStatus} hidden>{order.orderStatus || 'Processing'}</option>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select>{['COD', 'WHATSAPP'].includes(String(order.paymentMethod).toUpperCase()) && order.paymentStatus !== 'paid' && <button onClick={() => settlePayment(order)} disabled={updating === order.id} className="mt-2 block rounded border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-800 disabled:opacity-50">Mark paid</button>}</td>
            <td className="px-4 py-3 text-xs text-slate-500">{dateLabel(order.createdAt)}</td>
          </tr>)}{!filtered.length && <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-500">No matching customer orders.</td></tr>}</tbody>
        </table>
      </div>}
      {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section role="dialog" aria-modal="true" aria-label="Order details" className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-5 shadow-xl sm:p-7">
        <header className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">Order {selected.orderId || selected.id}</h2><button aria-label="Close" onClick={() => setSelected(null)}><X size={18} /></button></header>
        <dl className="grid gap-3 border-b border-slate-100 pb-5 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Customer</dt><dd className="font-medium">{selected.customerName}</dd></div><div><dt className="text-slate-500">Email / Phone</dt><dd>{selected.email} · {selected.phone}</dd></div><div className="sm:col-span-2"><dt className="text-slate-500">Delivery address</dt><dd>{selected.address || '—'}</dd></div><div><dt className="text-slate-500">Payment</dt><dd>{selected.paymentMethod} · {selected.paymentStatus}</dd></div><div><dt className="text-slate-500">Total</dt><dd className="font-semibold">Rs. {Number(selected.totalAmount || 0).toFixed(2)}</dd></div></dl>
        <h3 className="mb-2 mt-5 font-semibold">Products</h3><div className="divide-y divide-slate-100">{(selected.items || selected.types || []).map((item, index) => <div key={`${item.productId || item.id}-${index}`} className="flex justify-between gap-3 py-3 text-sm"><div><p className="font-medium">{item.name || item.productName}</p><p className="text-xs text-slate-500">Qty {item.quantity || item.qty} × Rs. {Number(item.price || 0).toFixed(2)}</p></div><p className="font-semibold">Rs. {Number(item.subtotal ?? Number(item.price || 0) * Number(item.quantity || item.qty || 0)).toFixed(2)}</p></div>)}</div>
      </section></div>}
    </section>
  );
}
