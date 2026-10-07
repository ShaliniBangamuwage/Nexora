import { useState } from 'react';
import { NotificationIcon, formatDate, getTypeLabel, DETAIL_FIELDS } from './notificationHelpers';

const ConfirmActionCard = ({ title, message, confirmLabel, tone = 'blue', onConfirm, onCancel, loading }) => {
  const toneMap = {
    blue:  { bg: 'bg-blue-100',    icon: 'text-blue-600',    btn: 'bg-blue-600 hover:bg-blue-700' },
    red:   { bg: 'bg-red-100',     icon: 'text-red-600',     btn: 'bg-red-600 hover:bg-red-700' },
    green: { bg: 'bg-emerald-100', icon: 'text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700' },
  };
  const t = toneMap[tone];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1100] p-5">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6" style={{ animation: 'slideUp 0.2s ease-out' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${t.bg}`}>
            <svg className={`h-5 w-5 ${t.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        </div>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed whitespace-pre-line">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={loading} className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 transition flex items-center justify-center gap-2 ${t.btn}`}>
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing…
              </>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const ResultBanner = ({ result }) => {
  if (!result) return null;
  const isError = result.type === 'error';
  return (
    <div className={`mb-6 flex items-start gap-3 rounded-xl px-4 py-3.5 border text-sm font-medium ${isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
      <span className="mt-0.5 shrink-0">
        {isError ? (
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        ) : (
          <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
          </svg>
        )}
      </span>
      <span className="leading-snug">{result.message}</span>
    </div>
  );
};

export const NotificationModal = ({ notification, onClose, onMarkRead, onDelete, onMarkReceived }) => {
  const [processing, setProcessing]       = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [result, setResult]               = useState(null);

  const confirmReceived = async () => {
    try {
      setProcessing(true);
      await onMarkReceived(notification.id);
      setPendingAction(null);
      setResult({ type: 'success', message: 'Order marked as received. Inventory has been updated.' });
      setTimeout(onClose, 1200);
    } catch (e) {
      setPendingAction(null);
      setResult({ type: 'error', message: 'Failed to process order: ' + e.message });
    } finally {
      setProcessing(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setProcessing(true);
      await onDelete(notification.id);
      setPendingAction(null);
      onClose();
    } catch (e) {
      setPendingAction(null);
      setResult({ type: 'error', message: 'Failed to delete notification: ' + e.message });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-5" onClick={onClose} style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="bg-white rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: 'slideUp 0.3s ease-out' }}>
        <div className="flex justify-between items-center px-7 py-6 border-b-2 border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 m-0">Notification Details</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-3xl text-slate-400 bg-transparent border-none cursor-pointer rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-all">
            ×
          </button>
        </div>

        <div className="p-7">
          <ResultBanner result={result} />

          <div className="flex gap-4 items-start mb-6 pb-5 border-b-2 border-slate-100">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              <NotificationIcon type={notification.type} size={30} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 m-0 mb-1 uppercase tracking-wide">
                {getTypeLabel(notification.type)}
              </h3>
              <p className="text-[13px] text-slate-400 m-0">{formatDate(notification.createdAt)}</p>
            </div>
          </div>

          <div className="bg-slate-50 border-l-4 border-blue-500 px-4 py-4 rounded-lg mb-6">
            <p className="m-0 text-[15px] text-slate-800 leading-relaxed">{notification.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {DETAIL_FIELDS.filter(([key]) => notification[key]).map(([key, label, fmt]) => (
              <div key={key} className="flex flex-col">
                <label className="text-[13px] text-slate-500 font-medium mb-1.5">{label}</label>
                <p className="m-0 text-[15px] text-slate-800 font-semibold">
                  {fmt ? fmt(notification[key]) : notification[key]}
                </p>
              </div>
            ))}
          </div>

          {notification.type === 'ORDER_SHIPPED' && notification.trackingNumber && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {notification.courier && (
                  <div className="flex flex-col">
                    <label className="text-[13px] text-blue-700 font-medium mb-1">Courier</label>
                    <p className="m-0 text-[15px] text-slate-800 font-semibold">{notification.courier}</p>
                  </div>
                )}
                <div className="flex flex-col">
                  <label className="text-[13px] text-blue-700 font-medium mb-1">Tracking Number</label>
                  <p className="m-0 text-[15px] text-slate-800 font-semibold">{notification.trackingNumber}</p>
                </div>
              </div>
              {notification.trackingUrl ? (
                <a href={notification.trackingUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-base font-semibold no-underline transition-all">
                  Track Shipment →
                </a>
              ) : (
                <p className="m-0 text-[13px] text-blue-700 text-center">
                  No tracking link available for this courier
                </p>
              )}
            </div>
          )}

          {notification.type === 'ORDER_APPROVED' && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 text-center mb-6">
              <button onClick={() => setPendingAction('receive')} disabled={processing || notification.read} className="w-full py-3.5 px-6 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all mb-2">
                {notification.read ? 'Already Processed' : '✓ Mark as Received'}
              </button>
              <p className="m-0 text-[13px] text-blue-700">
                {notification.read ? 'This order has been processed' : 'Click to confirm product receipt and update inventory'}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-5 border-t-2 border-slate-100 flex-wrap">
            {!notification.read && (
              <button onClick={() => onMarkRead(notification.id)} className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg border-none cursor-pointer transition-all">
                Mark as Read
              </button>
            )}
            <button onClick={() => setPendingAction('delete')} className="flex-1 py-3 px-5 bg-slate-100 hover:bg-red-500 text-red-500 hover:text-white border-2 border-red-400 text-sm font-semibold rounded-lg cursor-pointer transition-all">
              Delete
            </button>
          </div>
        </div>
      </div>

      {pendingAction === 'receive' && (
        <ConfirmActionCard
          title="Mark Order as Received?"
          message={'This will:\n• Update order status to COMPLETED\n• Add units to your inventory\n• Update product availability'}
          confirmLabel="Confirm Receipt"
          tone="green"
          loading={processing}
          onConfirm={confirmReceived}
          onCancel={() => setPendingAction(null)}
        />
      )}
      {pendingAction === 'delete' && (
        <ConfirmActionCard
          title="Delete Notification?"
          message="This notification will be permanently removed. This action cannot be undone."
          confirmLabel="Delete"
          tone="red"
          loading={processing}
          onConfirm={confirmDelete}
          onCancel={() => setPendingAction(null)}
        />
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 }              to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
};