import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, getAuthHeaders } from "../../services/firebase";
import PageLayout from "../../components/PageLayout";

const API_BASE = `${(import.meta.env.VITE_API_URL_RAILWAY && import.meta.env.VITE_API_URL_RAILWAY !== 'undefined' ? import.meta.env.VITE_API_URL_RAILWAY : 'http://localhost:5000')}/api`;
const REQUESTS_PER_PAGE = 6;

// ── Info field ──────────────────────────────────────────────────────────────
const Info = ({ label, value, span }) => (
  <div className={span ? 'col-span-2' : ''}>
    <span className="text-[11px] text-slate-400 font-semibold uppercase">{label}</span>
    <p className="text-sm font-medium text-slate-800 mt-0.5 break-words">{value || '—'}</p>
  </div>
);

// ── Pagination controls ──────────────────────────────────────────────────────
const Pagination = ({ page, totalPages, totalItems, onPrev, onNext }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
      <p className="text-xs md:text-sm text-slate-500">
        Showing {page * REQUESTS_PER_PAGE + 1}
        –{Math.min(page * REQUESTS_PER_PAGE + REQUESTS_PER_PAGE, totalItems)}
        {" "}of {totalItems}
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          disabled={page === 0}
          className="px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 transition-all duration-200 hover:border-blue-500 hover:text-blue-500 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 disabled:cursor-not-allowed">
          &lt;&lt;
        </button>

        <span className="text-sm font-medium text-slate-500">
          Page {page + 1} of {totalPages}
        </span>

        <button
          onClick={onNext}
          disabled={page >= totalPages - 1}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-900 to-blue-500 text-white text-sm font-semibold transition-all duration-200 hover:shadow-md disabled:opacity-40 disabled:hover:shadow-none disabled:cursor-not-allowed">
          &gt;&gt;
        </button>
      </div>
    </div>
  );
};

export default function AccountRequests() {
  const [requests, setRequests]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [pendingPage, setPendingPage]     = useState(0);
  const [processedPage, setProcessedPage] = useState(0);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'pendingRequests'), orderBy('requestedAt', 'desc'));
      const snap = await getDocs(q);
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    if (!request?.id) return;
    if (!window.confirm(`Approve ${request.type} account for ${request.companyName || request.fullName}?`)) return;
    setActionLoading(`${request.id}-approve`);
    try {
      const authHeaders = await getAuthHeaders();
      const res  = await fetch(`${API_BASE}/account-requests/${request.id}/approve`, { method: 'POST', headers: { ...authHeaders } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Approval failed');
      await fetchRequests();
      alert(`✓ Account approved!\n\nEmail: ${request.email}\nTemporary Password: ${data.tempPassword}\n\nThe user has been notified via email.`);
    } catch (err) {
      alert('Failed to approve: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (request) => {
    if (!request?.id) return;
    if (!window.confirm(`Reject request from ${request.companyName || request.fullName}?`)) return;
    setActionLoading(`${request.id}-reject`);
    try {
      const authHeaders = await getAuthHeaders();
      const res  = await fetch(`${API_BASE}/account-requests/${request.id}/reject`, { method: 'POST', headers: { ...authHeaders } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Rejection failed');
      await fetchRequests();
      alert('Request rejected. User has been notified.');
    } catch (err) {
      alert('Failed to reject: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered  = filter === 'all' ? requests : requests.filter(r => r.type === filter);
  const pending   = filtered.filter(r => r.status === 'pending');
  const processed = filtered.filter(r => r.status !== 'pending');

  // Reset both pagination indexes whenever the filter changes, so a new
  // filter never lands the user on a page that's now out of range
  useEffect(() => {
    setPendingPage(0);
    setProcessedPage(0);
  }, [filter]);

  const pendingTotalPages   = Math.max(1, Math.ceil(pending.length / REQUESTS_PER_PAGE));
  const processedTotalPages = Math.max(1, Math.ceil(processed.length / REQUESTS_PER_PAGE));
  const safePendingPage     = Math.min(pendingPage, pendingTotalPages - 1);
  const safeProcessedPage   = Math.min(processedPage, processedTotalPages - 1);

  const paginatedPending = pending.slice(
    safePendingPage * REQUESTS_PER_PAGE,
    safePendingPage * REQUESTS_PER_PAGE + REQUESTS_PER_PAGE
  );
  const paginatedProcessed = processed.slice(
    safeProcessedPage * REQUESTS_PER_PAGE,
    safeProcessedPage * REQUESTS_PER_PAGE + REQUESTS_PER_PAGE
  );

  // ── Request Card ──────────────────────────────────────────────────────────
  const RequestCard = ({ request }) => {
    if (!request?.id) return null;
    const isSupplier   = request.type === 'supplier';
    const isPending    = request.status === 'pending';
    const isApproved   = request.status === 'approved';
    const isApproveProcessing = actionLoading === `${request.id}-approve`;
    const isRejectProcessing  = actionLoading === `${request.id}-reject`;
    const isProcessing        = isApproveProcessing || isRejectProcessing;

    return (
      <div className={`bg-white rounded-xl border-2 p-4 md:p-5 transition-all
        ${isSupplier ? 'border-blue-200' : 'border-emerald-200'}
        ${!isPending ? 'opacity-70' : ''}`}>

        {/* Card Header */}
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase
              ${isSupplier ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {isSupplier ? 'Supplier' : 'Pharmacist'}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase
              ${isPending ? 'bg-amber-100 text-amber-700' : isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {request.status}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {request.requestedAt?.toDate().toLocaleDateString()}
          </span>
        </div>

        {/* Info Grid — 1 col on mobile, 2 col on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-4">
          {isSupplier ? (
            <>
              <Info label="Company"  value={request.companyName} />
              <Info label="Email"    value={request.email} />
              <Info label="Phone"    value={request.phone} />
              <Info label="Contact"  value={request.contactPerson} />
              <Info label="Reg. No"  value={request.businessRegNo} />
              <Info label="Bank"     value={request.bankName} />
              <Info label="Address"  value={request.businessAddress} span />
              {request.categories?.length > 0 && (
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Categories</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {request.categories.map(c => (
                      <span key={c} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <Info label="Name"           value={request.fullName} />
              <Info label="Email"          value={request.email} />
              <Info label="Phone"          value={request.phone} />
              <Info label="NIC"            value={request.nicNumber} />
              <Info label="License No"     value={request.licenseNumber} />
              <Info label="Expiry"         value={request.licenseExpiry} />
              <Info label="Specialization" value={request.specialization} span />
            </>
          )}
        </div>

        {/* Actions */}
        {isPending && (
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button onClick={() => handleApprove(request)} disabled={isProcessing}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-blue-500 text-white text-sm font-bold hover:-translate-y-0.5 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
              {isApproveProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Approving...
                </span>
              ) : '✓ Approve'}
            </button>
            <button onClick={() => handleReject(request)} disabled={isProcessing}
              className="flex-1 py-2.5 rounded-xl bg-red-50 border-2 border-red-200 text-red-600 text-sm font-bold hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isRejectProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                  Rejecting...
                </span>
              ) : '✕ Reject'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <PageLayout
      title="Account Requests"
      subtitle="Review and approve supplier and pharmacist registrations"
    >
      {/* Stats — 3 col always, compact on mobile */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { label: 'Pending',  value: requests.filter(r => r.status === 'pending').length,  color: 'bg-amber-50 border-amber-200 text-amber-700'  },
          { label: 'Approved', value: requests.filter(r => r.status === 'approved').length, color: 'bg-green-50 border-green-200 text-green-700'  },
          { label: 'Rejected', value: requests.filter(r => r.status === 'rejected').length, color: 'bg-red-50 border-red-200 text-red-700'        },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border-2 p-3 md:p-4 text-center ${s.color}`}>
            <p className="text-2xl md:text-3xl font-extrabold">{s.value}</p>
            <p className="text-xs md:text-sm font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs — scrollable on mobile */}
      <div className="flex gap-2 md:gap-3 mb-5 md:mb-6 overflow-x-auto pb-1">
        {[
          { key: 'all',        label: 'All Requests' },
          { key: 'supplier',   label: 'Suppliers'    },
          { key: 'pharmacist', label: 'Pharmacists'  },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all border-2 whitespace-nowrap flex-shrink-0
              ${filter === f.key
                ? 'bg-gradient-to-r from-blue-900 to-blue-500 text-white border-blue-500 shadow-md'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-blue-50'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading requests...</div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-6 md:mb-8">
              <h2 className="text-base md:text-lg font-bold text-slate-700 mb-3 md:mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                Pending Requests ({pending.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                {paginatedPending.map(r => r?.id ? <RequestCard key={r.id} request={r} /> : null)}
              </div>
              <Pagination
                page={safePendingPage}
                totalPages={pendingTotalPages}
                totalItems={pending.length}
                onPrev={() => setPendingPage(p => Math.max(0, p - 1))}
                onNext={() => setPendingPage(p => Math.min(pendingTotalPages - 1, p + 1))}
              />
            </div>
          )}

          {processed.length > 0 && (
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-700 mb-3 md:mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                Processed Requests ({processed.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                {paginatedProcessed.map(r => r?.id ? <RequestCard key={r.id} request={r} /> : null)}
              </div>
              <Pagination
                page={safeProcessedPage}
                totalPages={processedTotalPages}
                totalItems={processed.length}
                onPrev={() => setProcessedPage(p => Math.max(0, p - 1))}
                onNext={() => setProcessedPage(p => Math.min(processedTotalPages - 1, p + 1))}
              />
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl">
              <p className="text-4xl mb-4">📋</p>
              <p className="text-slate-500 text-lg font-medium">No requests found</p>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}