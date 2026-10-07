import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import PageLayout from '../../components/PageLayout';
import { useNotifications } from '../../components/admin/useNotifications';
import { FilterBar } from '../../components/admin/FilterBar';
import { NotificationCard } from '../../components/admin/NotificationCard';
import { NotificationModal } from '../../components/admin/NotificationModal';

const PAGE_SIZE = 10;

// Reusable empty/loading placeholder — shows a message and optional subtitle
const EmptyState = ({ message, sub }) => (
  <div className="bg-white rounded-xl shadow-sm py-20 text-center text-slate-500">
    <p className="text-lg mb-2">{message}</p>
    {sub && <small className="text-sm text-slate-400">{sub}</small>}
  </div>
);

// Builds a Daraz-style page list with ellipses, e.g. [1,2,3,4,5,'...',102]
const getPageNumbers = (current, total) => {
  const pages = [];
  const siblings = 1;
  const shouldShowLeftDots = current - siblings > 2;
  const shouldShowRightDots = current + siblings < total - 1;

  pages.push(1);

  if (shouldShowLeftDots) pages.push('dots-left');

  for (
    let i = Math.max(2, current - siblings);
    i <= Math.min(total - 1, current + siblings);
    i++
  ) {
    pages.push(i);
  }

  if (shouldShowRightDots) pages.push('dots-right');

  if (total > 1) pages.push(total);

  return pages;
};

// Pagination bar — numbered pages with prev/next arrows, matches app's blue/white theme
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500
                   hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed
                   disabled:hover:bg-white transition-colors"
        aria-label="Previous page"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>

      {pageNumbers.map((p, i) =>
        typeof p === 'number' ? (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-9 min-w-9 px-2.5 flex items-center justify-center rounded-lg text-sm font-semibold border transition-colors
              ${p === page
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
          >
            {p}
          </button>
        ) : (
          <span key={p + i} className="h-9 w-9 flex items-center justify-center text-slate-400 text-sm select-none">
            …
          </span>
        )
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500
                   hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed
                   disabled:hover:bg-white transition-colors"
        aria-label="Next page"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
};

const Notifications = () => {
  // All notification data and Firestore actions come from this hook
  const { notifications, loading, markAsRead, markAllAsRead, deleteById, markReceived } = useNotifications();

  const [filter, setFilter]     = useState('All'); // active type filter
  const [selected, setSelected] = useState(null);  // notification open in the detail modal
  const [page, setPage]         = useState(1);      // current pagination page

  // Filter notifications by type; "All" skips filtering
  const filtered = filter === 'All' ? notifications : notifications.filter((n) => n.type === filter);

  // Reset to page 1 whenever the filter (or underlying data) changes the result set
  useEffect(() => { setPage(1); }, [filter, notifications.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Count unread notifications for the button label and stat card
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Stat card config — always derived from the full list, unaffected by active filter
  const statCards = [
    { title: 'Total Notifications', value: notifications.length },
    { title: 'Unread',              value: unreadCount },
    { title: 'Orders Approved',     value: notifications.filter((n) => n.type === 'ORDER_APPROVED').length },
    { title: 'Low Stock Alerts',    value: notifications.filter((n) => n.type === 'LOW_STOCK_ALERT').length },
  ];

  return (
    <PageLayout
      title="Notifications"
      subtitle="Stay updated with supplier responses and stock alerts"
      actions={
        unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            Mark All as Read ({unreadCount})
          </button>
        )
      }
    >

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
        {statCards.map((card) => <Card key={card.title} {...card} />)}
      </div>

      {/* Filter bar to narrow list by notification type */}
      <FilterBar filter={filter} onFilter={setFilter} />

      {/* Result count */}
      {!loading && filtered.length > 0 && (
        <p className="text-[13px] text-slate-400 font-medium mt-4 mb-2">
          Showing {(safePage - 1) * PAGE_SIZE + 1}
          –{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} notifications
        </p>
      )}

      {/* Notification list — three states: loading, empty, or populated */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <EmptyState message="Loading notifications..." />
        ) : !filtered.length ? (
          <EmptyState message="No notifications found" sub="You'll see updates from suppliers here" />
        ) : (
          // Clicking a card sets it as selected, opening the detail modal
          paginated.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onClick={setSelected}
              onMarkRead={markAsRead}
            />
          ))
        )}
      </div>

      {/* Pagination controls */}
      {!loading && filtered.length > PAGE_SIZE && (
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* Detail modal — unmounts when selected is cleared (null) */}
      {selected && (
        <NotificationModal
          notification={selected}
          onClose={() => setSelected(null)}
          onMarkRead={markAsRead}
          onDelete={deleteById}
          onMarkReceived={markReceived}
        />
      )}

      {/* Keyframe animations for modal and card entrance transitions */}
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 }              to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </PageLayout>
  );
};

export default Notifications;