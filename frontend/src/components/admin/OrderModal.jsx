import { formatDate, getStatusStyle } from './orderHelpers';

const DETAIL_FIELDS = (order) => [
  { label: 'Product',      value: order.productName || order.product },
  { label: 'Product Code', value: order.productCode, mono: true },
  { label: 'Category',     value: order.category },
  { label: 'Supplier',     value: order.supplierName },
  { label: 'Quantity',     value: `${order.quantity} units` },
  { label: 'Unit Price',   value: `Rs. ${Number(order.unitPrice).toFixed(2)}` },
  {
    label: 'Total Amount',
    value: `Rs. ${Number(order.totalAmount ?? order.quantity * order.unitPrice).toFixed(2)}`,
    highlight: 'text-emerald-600 text-lg font-bold',
  },
  { label: 'Order Date', value: formatDate(order.orderDate || order.createdAt) },
  ...(order.approvalDate   ? [{ label: 'Approval Date',   value: formatDate(order.approvalDate) }]   : []),
  ...(order.completionDate ? [{ label: 'Completion Date', value: formatDate(order.completionDate) }] : []),
];

/* ── Delivery Tracking ───────────────────────────────────────────── */

const TRACK_STEPS = [
  { key: 'APPROVED',     label: 'Ordered',      shortLabel: 'Ordered',      dateField: 'approvalDate', fallbackField: 'createdAt' },
  { key: 'PACKED',       label: 'Packed',       shortLabel: 'Packed',       dateField: 'packedAt' },
  { key: 'IN DELIVERY',  label: 'In Transit',   shortLabel: 'In Transit',   dateField: 'shippedAt' },
  { key: 'DELIVERED',    label: 'Delivered',    shortLabel: 'Delivered',    dateField: 'deliveredAt' },
  { key: 'COMPLETED',    label: 'Completed',    shortLabel: 'Completed',    dateField: 'completionDate', fallbackField: 'completedAt' },
];

const formatTrackDate = (ts) => {
  if (!ts) return null;
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return null; }
};

const getStepDate = (order, step) =>
  order[step.dateField] || (step.fallbackField ? order[step.fallbackField] : null);

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const TrackIcon = () => (
  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v11.177m0-11.177L12.63 4.005a1.125 1.125 0 00-1.259-.32L4.5 6.375M14.25 7.573L18.75 12" />
  </svg>
);

const DeliveryTracker = ({ order }) => {
  const currentIndex = TRACK_STEPS.findIndex((s) => s.key === order.status);

  // Not yet approved / rejected — nothing to track
  if (currentIndex === -1 && order.status !== 'COMPLETED') return null;

  const activeIndex = currentIndex === -1 ? TRACK_STEPS.length - 1 : currentIndex;

  const history = TRACK_STEPS
    .map((step, idx) => ({ ...step, idx, date: getStepDate(order, step) }))
    .filter((step) => step.idx <= activeIndex)
    .reverse();

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-6 pt-5 pb-4 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
          <TrackIcon />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800 m-0">Delivery Tracking</h4>
          {order.trackingNumber && (
            <p className="text-[11px] text-slate-400 font-mono mt-0.5 m-0">
              Tracking No: <span className="text-slate-600 font-semibold">{order.trackingNumber}</span>
            </p>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start">
          {TRACK_STEPS.map((step, idx) => {
            const isDone    = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const isLast    = idx === TRACK_STEPS.length - 1;

            return (
              <div key={step.key} className={`flex items-center ${isLast ? 'flex-none' : 'flex-1'}`}>
                <div className="flex flex-col items-center" style={{ width: 76 }}>
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full shrink-0 transition-all duration-300
                      ${isDone
                        ? 'bg-blue-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-white text-slate-300 border-2 border-slate-200'}`}
                  >
                    {isDone ? (
                      <CheckIcon />
                    ) : isCurrent ? (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-[11px] font-semibold text-center leading-tight
                      ${isDone || isCurrent ? 'text-slate-700' : 'text-slate-300'}`}
                  >
                    {step.shortLabel}
                  </span>
                </div>

                {!isLast && (
                  <div className="flex-1 h-[2px] -mt-5 rounded-full overflow-hidden bg-slate-200">
                    <div
                      className="h-full bg-blue-600 transition-all duration-500"
                      style={{ width: idx < activeIndex ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* History list */}
      {history.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Status History</p>
          <ul className="space-y-3">
            {history.map((step, i) => {
              const dateLabel = formatTrackDate(step.date);
              return (
                <li key={step.key} className="flex items-start gap-3">
                  <span className="mt-1 flex flex-col items-center">
                    <span className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-blue-600' : 'bg-slate-300'}`} />
                    {i !== history.length - 1 && <span className="w-px flex-1 bg-slate-200 mt-1" style={{ minHeight: 16 }} />}
                  </span>
                  <div className="pb-0.5">
                    <p className={`text-[13px] font-semibold m-0 ${i === 0 ? 'text-slate-800' : 'text-slate-500'}`}>
                      {step.label}
                    </p>
                    <p className="text-[11px] text-slate-400 m-0 mt-0.5">
                      {dateLabel || 'Date not recorded'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export const OrderModal = ({ order, onClose, onMarkReceived }) => (
  <div
    className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-5"
    style={{ animation: 'fadeIn 0.2s ease-out' }}
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl w-full max-w-[700px] max-h-[90vh] overflow-y-auto shadow-2xl"
      style={{ animation: 'slideUp 0.3s ease-out' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-7 py-6 border-b-2 border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 m-0">Order Details</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-3xl text-slate-400 bg-transparent border-none cursor-pointer rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-all duration-200"
        >
          ×
        </button>
      </div>

      <div className="p-7">
        {/* PO ID + Status */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-slate-100">
          <h3 className="text-xl font-semibold text-blue-600 font-mono m-0">
            {order.poId || order.productId}
          </h3>
          <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-semibold uppercase ${getStatusStyle(order.status)}`}>
            {order.status}
          </span>
        </div>

        {/* Delivery Tracking */}
        <DeliveryTracker order={order} />

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-5 mb-6">
          {DETAIL_FIELDS(order).map((item) => (
            <div key={item.label} className="flex flex-col">
              <label className="text-[13px] text-slate-500 font-medium mb-1.5">{item.label}</label>
              <p className={`m-0 text-[15px] text-slate-800 font-medium ${item.highlight || ''} ${item.mono ? 'font-mono text-sm' : ''}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-slate-50 px-4 py-4 rounded-lg mb-5">
            <label className="block text-[13px] text-slate-500 font-semibold mb-2">Notes</label>
            <p className="m-0 text-sm text-slate-800 leading-relaxed">{order.notes}</p>
          </div>
        )}

        {/* Rejection Reason */}
        {order.rejectionReason && (
          <div className="bg-red-50 border-l-4 border-red-500 px-4 py-4 rounded-lg mb-5">
            <label className="block text-[13px] text-red-700 font-semibold mb-2">Rejection Reason</label>
            <p className="m-0 text-sm text-red-900 leading-relaxed">{order.rejectionReason}</p>
          </div>
        )}

        {/* Mark as Received */}
        {order.status === 'DELIVERED' && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5 text-center">
            <p className="text-sm text-orange-700 font-semibold mb-3 m-0">
              🚚 Supplier has marked this order as Delivered
            </p>
            <button
              onClick={() => onMarkReceived(order.id, order)}
              className="w-full py-3.5 px-6 bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg mb-2"
            >
              ✓ Confirm Receipt &amp; Mark as Completed
            </button>
            <p className="m-0 text-[13px] text-orange-700">
              Confirming receipt will update inventory and unlock the final 50% payment.
            </p>
          </div>
        )}

        {/* Already Completed */}
        {order.status === 'COMPLETED' && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5 text-center">
            <p className="text-sm text-emerald-700 font-semibold m-0">
              Order completed. Inventory updated and final payment unlocked.
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);