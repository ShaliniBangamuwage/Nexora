import React from 'react';

const STATUS_CONFIG = {
  APPROVED:      { border: 'border-blue-400',    badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',       dot: 'bg-blue-400'    },
  PACKED:        { border: 'border-violet-400',  badge: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200', dot: 'bg-violet-400'  },
  'IN DELIVERY': { border: 'border-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',    dot: 'bg-amber-400'   },
  DELIVERED:     { border: 'border-emerald-400', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-400' },
  COMPLETED:     { border: 'border-teal-400',    badge: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',       dot: 'bg-teal-400'    },
};

const STATUS_FLOW = ['APPROVED', 'PACKED', 'IN DELIVERY', 'DELIVERED'];

/* ── StatusBadge ── */
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || {};
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${cfg.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

/* ── PaymentBadge ── */
const PaymentBadge = ({ unlocked }) =>
  !unlocked ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
      Awaiting Payment
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
      Payment Received
    </span>
  );

/* ── OrderDetailsGrid ── */
const OrderDetailsGrid = ({ delivery, amountLabel = 'Amount' }) => (
  <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
    {[
      { label: 'Pharmacy',   value: delivery.pharmacy || 'MediCareX' },
      { label: 'Quantity',   value: `${delivery.quantity} units` },
      { label: 'Order Date', value: delivery.date },
      { label: amountLabel,  value: `Rs. ${Number(delivery.amount || delivery.totalAmount || 0).toFixed(2)}`, green: true },
    ].map(({ label, value, green }) => (
      <div key={label} className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        <p className={`text-sm font-semibold ${green ? 'text-emerald-600' : 'text-slate-700'}`}>{value}</p>
      </div>
    ))}
  </div>
);

/* ── TrackingRow ── */
const TrackingRow = ({ trackingNumber, className = '' }) => {
  if (!trackingNumber) return null;
  return (
    <div className={`flex items-center gap-2.5 rounded-lg bg-blue-50 border border-blue-100 px-4 py-2.5 text-sm ${className}`}>
      <svg className="h-4 w-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10" />
      </svg>
      <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Tracking</span>
      <span className="font-mono text-sm font-semibold text-blue-700">{trackingNumber}</span>
    </div>
  );
};

/* ── DeliveryCard ── */
const DeliveryCard = ({ delivery, isUpdating, onStatusChange }) => {
  const cfg        = STATUS_CONFIG[delivery.status] || {};
  const unlocked   = delivery.initialPaymentStatus === 'PAID';
  const idx        = STATUS_FLOW.indexOf(delivery.status);
  const nextStatus = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;

  return (
    <div className={`rounded-2xl border-l-4 border-y border-r bg-white shadow-sm transition-opacity
      ${cfg.border} ${isUpdating ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge status={delivery.status} />
          <span className="text-sm font-bold text-slate-800">{delivery.poId}</span>
          <span className="text-sm text-slate-500">{delivery.product || delivery.productName}</span>
        </div>
        <PaymentBadge unlocked={unlocked} />
      </div>

      {/* Card Body */}
      <div className="px-6 py-5 space-y-4">
        <OrderDetailsGrid delivery={delivery} />
        <TrackingRow trackingNumber={delivery.trackingNumber} />

        {/* Delivered notice */}
        {delivery.status === 'DELIVERED' && (
          <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <svg className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              Delivery complete. Awaiting MediCareX to confirm receipt and mark as Completed.
            </p>
          </div>
        )}

        {/* Payment lock notice */}
        {!unlocked && delivery.status !== 'DELIVERED' && (
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <svg className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="text-xs font-medium text-amber-800 leading-relaxed">
              Delivery is locked until MediCareX completes the initial 50% payment. Check the Invoice &amp; Payments page for updates.
            </p>
          </div>
        )}
      </div>

      {/* Card Footer — Actions */}
      {delivery.status !== 'DELIVERED' && (
        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 px-6 py-4 bg-slate-50/60 rounded-b-2xl">
          <select
            value={delivery.status}
            disabled={isUpdating || !unlocked}
            onChange={(e) => onStatusChange(delivery, e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <option value="">Change status…</option>
            {STATUS_FLOW.map((s) => (
              <option key={s} value={s} disabled={s === delivery.status}>{s}</option>
            ))}
          </select>

          {nextStatus && (
            <button
              disabled={isUpdating || !unlocked}
              onClick={() => onStatusChange(delivery, nextStatus)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition
                ${unlocked
                  ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
              {isUpdating ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Updating…
                </>
              ) : unlocked ? (
                <>
                  Mark as {nextStatus}
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </>
              ) : (
                <>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Locked
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export { StatusBadge, PaymentBadge, OrderDetailsGrid, TrackingRow };
export default DeliveryCard;