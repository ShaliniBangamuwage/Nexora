import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

// ── Style helpers ─────────────────────────────────────────────────────────────

// Returns background, text, and border colour tokens based on order status
export const statusColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'delivered':  return { bg: '#f0fdf4',               color: '#16a34a', border: '#bbf7d0' };
    case 'approved':   return { bg: 'rgba(26,135,225,0.08)', color: '#1a87e1', border: 'rgba(26,135,225,0.25)' };
    case 'processing': return { bg: '#f5f3ff',               color: '#7c3aed', border: '#ddd6fe' };
    case 'cancelled':  return { bg: '#fef2f2',               color: '#dc2626', border: '#fecaca' };
    default:           return { bg: '#fffbeb',               color: '#d97706', border: '#fde68a' }; // pending
  }
};

// Alias used by PrescriptionPage to reference statusColor under a different name
export const getStatusColor = statusColor;

// Returns colour tokens for return request status (approved / rejected / pending)
export const returnStatusColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'approved': return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
    case 'rejected': return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
    default:         return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' }; // pending
  }
};

// Returns colour tokens for refund status (processed / rejected / pending)
export const refundStatusColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'processed': return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
    case 'rejected':  return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
    default:          return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' }; // pending
  }
};

// Renders the appropriate Lucide icon for a given order status
export function StatusIcon({ status }) {
  switch ((status || '').toLowerCase()) {
    case 'delivered':
    case 'approved':   return <CheckCircle size={12} />;
    case 'processing': return <Clock size={12} />;
    case 'cancelled':  return <XCircle size={12} />;
    default:           return <AlertCircle size={12} />; // pending / unknown
  }
}

// Reusable pill badge combining a StatusIcon and status label.
// Accepts an optional `colors` override; falls back to statusColor(status).
// Used by PrescriptionPage and OrderCard.
export function StatusBadge({ status, colors }) {
  const sc = colors || statusColor(status);
  return (
    <span
      className="flex items-center gap-[5px] text-[11px] font-bold px-[13px] py-[5px] rounded-[20px] uppercase tracking-[0.06em]"
      style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
    >
      <StatusIcon status={status} />
      {status || 'Pending'}
    </span>
  );
}