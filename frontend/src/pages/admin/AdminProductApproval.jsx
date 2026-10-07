import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import PageLayout from '../../components/PageLayout';
import ResponsiveTable from '../../components/ResponsiveTable';
import { auth } from '../../services/firebase';

const API_BASE = `${(import.meta.env.VITE_API_URL_RAILWAY && import.meta.env.VITE_API_URL_RAILWAY !== 'undefined' ? import.meta.env.VITE_API_URL_RAILWAY : 'http://localhost:5000')}/api`;

const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
};

const STATUS_BADGE = {
  pending:  { cls: 'bg-amber-50 text-amber-700 border border-amber-200',         label: 'Pending'  },
  approved: { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',   label: 'Approved' },
  rejected: { cls: 'bg-red-50 text-red-600 border border-red-200',               label: 'Rejected' },
};

function formatDate(val) {
  if (!val) return '—';
  if (val._seconds) return new Date(val._seconds * 1000).toLocaleDateString();
  const d = new Date(val);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

// Inline toast notification component
function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-5 right-5 z-[2000] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-lg border pointer-events-auto min-w-[300px] max-w-[420px] transition-all duration-300 ${
            t.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : t.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-sky-50 border-sky-200 text-sky-800'
          }`}
          style={{ animation: 'slideInRight 0.25s ease-out' }}
        >
          <span className="text-lg mt-0.5 shrink-0">
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[13px] leading-tight">{t.title}</p>
            {t.body && <p className="text-[12px] mt-0.5 opacity-80 leading-snug">{t.body}</p>}
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="shrink-0 opacity-50 hover:opacity-100 text-base leading-none mt-0.5 bg-transparent border-none cursor-pointer"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default function AdminProductApproval() {
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal]     = useState(null);
  const [rejectReason, setRejectReason]   = useState('');
  const [filter, setFilter]               = useState('pending');
  const [search, setSearch]               = useState('');
  const [toasts, setToasts]               = useState([]);

  const addToast = (type, title, body = '') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, body }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const authHeaders = await getAuthHeaders();
      const res  = await fetch(`${API_BASE}/admin/pending-products`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) { console.error('API error:', data); setProducts([]); return; }
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (product) => {
    try {
      setActionLoading(product.id);
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/admin/pending-products/${product.id}/approve`, {
        method: 'PATCH',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Approval failed');
      const { productCode } = await res.json();
      addToast('success', `"${product.productName}" approved`, `Product code: ${productCode}`);
      fetchAll();
    } catch (err) {
      console.error(err);
      addToast('error', 'Approval failed', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (product) => { setRejectModal(product); setRejectReason(''); };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      setActionLoading(rejectModal.id);
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/admin/pending-products/${rejectModal.id}/reject`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body:    JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) throw new Error('Rejection failed');
      addToast('success', `"${rejectModal.productName}" rejected`, 'Supplier has been notified.');
      setRejectModal(null);
      setRejectReason('');
      fetchAll();
    } catch (err) {
      console.error(err);
      addToast('error', 'Rejection failed', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount  = products.filter((p) => p.status === 'pending').length;
  const approvedCount = products.filter((p) => p.status === 'approved').length;
  const rejectedCount = products.filter((p) => p.status === 'rejected').length;

  const filtered = products.filter((p) => {
    const matchFilter = filter === 'all' || p.status === filter;
    const matchSearch =
      p.productName?.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const FILTER_TABS = [
    { key: 'pending',  label: 'Pending',  count: pendingCount,    color: 'amber'   },
    { key: 'approved', label: 'Approved', count: approvedCount,   color: 'emerald' },
    { key: 'rejected', label: 'Rejected', count: rejectedCount,   color: 'red'     },
    { key: 'all',      label: 'All',      count: products.length, color: 'slate'   },
  ];

  const tabActive = {
    amber:   'bg-amber-500 text-white border-amber-500',
    emerald: 'bg-emerald-600 text-white border-emerald-600',
    red:     'bg-red-500 text-white border-red-500',
    slate:   'bg-slate-600 text-white border-slate-600',
  };

  // Column definitions for ResponsiveTable
  const columns = [
    {
      key: 'productName',
      label: 'Product',
      render: (_val, product) => (
        <div className="max-w-[200px]">
          <p className="font-semibold text-slate-800 text-[13px] truncate">{product.productName}</p>
          {product.manufacturer && (
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{product.manufacturer}</p>
          )}
          {product.description && (
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{product.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (_val, product) => (
        <span className="text-[12px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md font-medium">
          {product.category}
        </span>
      ),
    },
    {
      key: 'supplierName',
      label: 'Supplier',
      render: (_val, product) => (
        <span className="inline-block bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-1 rounded-md text-[12px] font-medium">
          {product.supplierName || '—'}
        </span>
      ),
    },
    {
      key: 'wholesalePrice',
      label: 'Wholesale Price',
      render: (_val, product) => (
        <div>
          <p className="text-[13px] font-semibold text-slate-800">
            Rs.{Number(product.wholesalePrice).toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Retail: Rs.{(Number(product.wholesalePrice) * 1.2).toFixed(2)}
          </p>
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (_val, product) => (
        <div>
          <p className="text-[13px] text-slate-700">{product.stock} units</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Min: {product.minStock}</p>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Submitted',
      render: (_val, product) => (
        <span className="text-[12px] text-slate-400 whitespace-nowrap">
          {formatDate(product.createdAt)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_val, product) => {
        const badge = STATUS_BADGE[product.status] || STATUS_BADGE.pending;
        return (
          <div>
            <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold ${badge.cls}`}>
              {badge.label}
            </span>
            {product.status === 'approved' && product.productCode && (
              <p className="text-[11px] text-emerald-600 font-mono mt-1.5">{product.productCode}</p>
            )}
            {product.status === 'rejected' && product.rejectionReason && (
              <p className="text-[11px] text-red-400 mt-1.5 max-w-[120px] leading-tight">
                {product.rejectionReason}
              </p>
            )}
          </div>
        );
      },
    },
  ];

  // Row actions for ResponsiveTable
  const renderActions = (product) => {
    const isActioning = actionLoading === product.id;
    const isPending   = product.status === 'pending';

    if (!isPending) {
      return <span className="text-slate-300 text-sm">—</span>;
    }

    return (
      <div className="flex gap-2">
        <button
          onClick={() => handleApprove(product)}
          disabled={isActioning}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-all duration-150"
        >
          {isActioning ? '…' : 'Approve'}
        </button>
        <button
          onClick={() => openRejectModal(product)}
          disabled={isActioning}
          className="px-3 py-1.5 bg-white hover:bg-red-50 border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed text-red-600 text-[12px] font-semibold rounded-lg cursor-pointer transition-all duration-150"
        >
          Reject
        </button>
      </div>
    );
  };

  return (
    <PageLayout
      title="Product Approval"
      subtitle="Review and approve supplier product submissions"
    >
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card title="Awaiting Review" value={pendingCount}  />
        <Card title="Approved"        value={approvedCount} />
        <Card title="Rejected"        value={rejectedCount} />
      </div>

      {/* Filters + search */}
      <div className="bg-white px-4 py-3.5 rounded-xl border border-slate-200 mb-5 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150 border ${
                filter === tab.key
                  ? tabActive[tab.color]
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${
                filter === tab.key ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search product, supplier or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[240px] max-w-sm px-4 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10 transition-all duration-150 bg-slate-50 placeholder-slate-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
        <ResponsiveTable
          columns={columns}
          data={filtered}
          keyField="id"
          loading={loading}
          emptyMessage="No products match this filter"
          cardTitle="productName"
          cardBadge="status"
          actions={renderActions}
        />
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5"
          style={{ animation: 'fadeIn 0.15s ease-out' }}
          onClick={() => setRejectModal(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[460px] shadow-2xl overflow-hidden"
            style={{ animation: 'slideUp 0.2s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-red-500 text-base font-bold">✕</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900">Reject product</h3>
                  <p className="text-[12px] text-slate-400 mt-0.5">This action will notify the supplier</p>
                </div>
              </div>
            </div>

            {/* Product info strip */}
            <div className="mx-6 mt-4 px-4 py-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-[13px] font-semibold text-slate-800">{rejectModal.productName}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Submitted by {rejectModal.supplierName}</p>
            </div>

            {/* Reason textarea */}
            <div className="px-6 pt-4 pb-5">
              <label className="block mb-2 text-[13px] font-semibold text-slate-700">
                Rejection reason
                <span className="ml-1 text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Missing required certifications, incorrect pricing…"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-[13px] resize-none focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all duration-150 bg-white text-slate-800 placeholder-slate-300"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">Sent to the supplier as a notification.</p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-2.5">
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.id}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-[13px] rounded-lg border-none cursor-pointer transition-all duration-150"
              >
                {actionLoading === rejectModal.id ? 'Rejecting…' : 'Confirm rejection'}
              </button>
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[13px] rounded-lg border-none cursor-pointer transition-all duration-150"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(20px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
      `}</style>
    </PageLayout>
  );
}