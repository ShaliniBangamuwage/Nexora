import { MdShoppingCart, MdCheckCircle, MdCancel, MdWarning, MdCampaign, MdLocalShipping } from 'react-icons/md';

export const NOTIFICATION_TYPES = ['All', 'ORDER_PLACED', 'ORDER_APPROVED', 'ORDER_REJECTED', 'LOW_STOCK_ALERT', 'ORDER_SHIPPED'];

export const DETAIL_FIELDS = [
  ['poId',         'PO ID'],
  ['supplierName', 'Supplier'],
  ['productName',  'Product'],
  ['quantity',     'Quantity',     (v) => `${v} units`],
  ['totalAmount',  'Total Amount', (v) => `Rs. ${Number(v).toFixed(2)}`],
];

export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = timestamp._seconds
    ? new Date(timestamp._seconds * 1000)
    : timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const getTypeLabel = (type) => type.replace(/_/g, ' ');

export const getCardAccent = (type, unread) => {
  if (unread) return 'border-blue-600';
  const map = {
    ORDER_PLACED:    'border-blue-400',
    ORDER_APPROVED:  'border-emerald-400',
    ORDER_REJECTED:  'border-red-400',
    LOW_STOCK_ALERT: 'border-amber-400',
    ORDER_SHIPPED:   'border-indigo-400',
  };
  return map[type] ?? 'border-slate-300';
};

const ICON_MAP = {
  ORDER_PLACED:    (s) => <MdShoppingCart  size={s} className="text-blue-500" />,
  ORDER_APPROVED:  (s) => <MdCheckCircle   size={s} className="text-emerald-500" />,
  ORDER_REJECTED:  (s) => <MdCancel        size={s} className="text-red-500" />,
  LOW_STOCK_ALERT: (s) => <MdWarning       size={s} className="text-amber-500" />,
  ORDER_SHIPPED:   (s) => <MdLocalShipping size={s} className="text-indigo-500" />,
};

export const NotificationIcon = ({ type, size = 24 }) => {
  const Icon = ICON_MAP[type] ?? ((s) => <MdCampaign size={s} className="text-slate-500" />);
  return Icon(size);
};