import { NotificationIcon, formatDate, getTypeLabel, getCardAccent } from './notificationHelpers';

export const NotificationCard = ({ notification, onClick, onMarkRead }) => {
  const unread = !notification.read;
  return (
    <div
      onClick={() => onClick(notification)}
      className={`relative bg-white px-6 py-5 rounded-xl shadow-sm border-l-4 ${getCardAccent(notification.type, unread)}
        flex gap-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
        ${unread ? 'bg-slate-50' : ''}`}
    >
      <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-slate-100">
        <NotificationIcon type={notification.type} size={22} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
          <span className="text-[13px] font-semibold text-blue-600 uppercase tracking-wide">
            {getTypeLabel(notification.type)}
          </span>
          <span className="text-[13px] text-slate-400">{formatDate(notification.createdAt)}</span>
        </div>

        <p className="text-[15px] text-slate-800 mb-1.5 leading-relaxed m-0">{notification.message}</p>

        {notification.supplierName && (
          <p className="text-[13px] text-slate-500 mt-1 m-0">Supplier: {notification.supplierName}</p>
        )}

        {notification.productName && (
          <p className="text-[13px] text-slate-500 mt-1 m-0">
            Product: {notification.productName}
            {notification.quantity && ` • Qty: ${notification.quantity}`}
          </p>
        )}

        {notification.type === 'ORDER_SHIPPED' && notification.trackingNumber && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-3 flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 flex-wrap"
          >
            <div className="flex items-center gap-3 min-w-0">
              {notification.courier && (
                <span className="text-[12px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-md whitespace-nowrap">
                  {notification.courier}
                </span>
              )}

              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] text-slate-400 uppercase tracking-wide whitespace-nowrap">
                  Tracking
                </span>
                <span className="text-[13px] font-mono font-semibold text-slate-800 tracking-wide truncate">
                  {notification.trackingNumber}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(notification.trackingNumber);
                  }}
                  title="Copy tracking number"
                  className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0.5 flex items-center"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            </div>

            {notification.trackingUrl && (
              <a
                href={notification.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[12.5px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors duration-150 whitespace-nowrap"
              >
                Track shipment
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>

      {unread && (
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
          <button
            onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id); }}
            className="text-[12px] text-blue-600 font-medium hover:underline bg-transparent border-none cursor-pointer"
          >
            Mark as read
          </button>
        </div>
      )}
    </div>
  );
};