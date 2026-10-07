import React from 'react';
import { StatusBadge, OrderDetailsGrid, TrackingRow } from './DeliveryCard';

const formatTs = (ts) => {
  if (!ts) return null;
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return null; }
};

/* ── TimelineStep ── */
const TimelineRow = ({ icon, label, value, isLast }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600 ring-2 ring-white">
          {icon}
        </div>
        {!isLast && <div className="mt-1 h-full w-px bg-teal-100" style={{ minHeight: 16 }} />}
      </div>
      <div className="pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
};

/* ── FinalPaymentBadge ── */
const FinalPaymentBadge = ({ status }) =>
  status === 'PAID' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75" />
      </svg>
      Fully Paid
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
      Final Payment Pending
    </span>
  );

const TIMELINE_STEPS = [
  {
    label: 'Order Approved',
    key: '_createdAt',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    label: 'Packed At',
    key: '_packedAt',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
  },
  {
    label: 'Shipped At',
    key: '_shippedAt',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    label: 'Delivered & Completed',
    key: '_completedAt',
    fallbackKey: '_deliveredAt',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    ),
  },
];

const CompletedDeliveryCard = ({ delivery }) => {
  const visibleSteps = TIMELINE_STEPS.filter(({ key, fallbackKey }) =>
    formatTs(fallbackKey ? (delivery[key] ?? delivery[fallbackKey]) : delivery[key])
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

      {/* Teal accent top strip */}
      <div className="h-1 w-full bg-gradient-to-r from-teal-400 to-teal-500" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge status="COMPLETED" />
          <span className="text-sm font-bold text-slate-800">{delivery.poId}</span>
          <span className="text-sm text-slate-500">{delivery.product || delivery.productName}</span>
        </div>
        <FinalPaymentBadge status={delivery.finalPaymentStatus} />
      </div>

      {/* Details */}
      <div className="px-6 py-5">
        <OrderDetailsGrid delivery={delivery} amountLabel="Total Amount" />
      </div>

      {/* Timeline */}
      {visibleSteps.length > 0 && (
        <div className="px-6 pb-5">
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-5 py-4">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Delivery Timeline</p>
            <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4">
              {TIMELINE_STEPS.map(({ label, key, fallbackKey, icon }, i) => (
                <TimelineRow
                  key={label}
                  label={label}
                  value={formatTs(fallbackKey ? (delivery[key] ?? delivery[fallbackKey]) : delivery[key])}
                  icon={icon}
                  isLast={i === TIMELINE_STEPS.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {delivery.trackingNumber && (
        <div className="px-6 pb-5">
          <TrackingRow trackingNumber={delivery.trackingNumber} />
        </div>
      )}
    </div>
  );
};

export default CompletedDeliveryCard;