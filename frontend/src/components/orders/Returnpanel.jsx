import { RotateCcw, FileText } from 'lucide-react';
import { C } from '../profile/profileTheme';
import { returnStatusColor, refundStatusColor } from './Orderstatusutils';

// Displays the full details of a return request inside an OrderCard.
// Shows returned items, return/refund status badges, and any pharmacist note.
export default function ReturnPanel({ returnDoc }) {
  return (
    <div
      className="px-5 py-[14px]"
      style={{ borderBottom: `1px solid ${C.border}`, background: 'rgba(26,135,225,0.02)' }}
    >
      {/* Section heading */}
      <p
        className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 flex items-center gap-[6px]"
        style={{ color: C.textMuted }}
      >
        <RotateCcw size={12} color={C.accent} /> Return Request
      </p>

      {/* List of individual returned items with name, quantity, and reason */}
      <div className="flex flex-col gap-[6px] mb-3">
        {returnDoc.items?.map((item, i) => (
          <div
            key={i}
            className="flex justify-between text-[12px] rounded-lg px-3 py-[7px]"
            style={{ color: C.textSoft, background: 'rgba(26,135,225,0.04)', border: `1px solid ${C.border}` }}
          >
            <span className="font-semibold">{item.name} &times; {item.quantity}</span>
            <span style={{ color: C.textMuted }}>{item.reason}</span>
          </div>
        ))}
      </div>

      {/* Status badges: refund amount, return status, and refund status */}
      <div className="flex gap-[10px] flex-wrap items-center">
        {/* Calculated refund amount for this return */}
        <span
          className="text-[12px] font-semibold px-3 py-1 rounded-lg"
          style={{ color: C.textSoft, background: 'rgba(26,135,225,0.06)', border: `1px solid ${C.border}` }}
        >
          Refund: Rs. {(returnDoc.refundAmount || 0).toFixed(2)}
        </span>

        {/* Return request status badge (approved / rejected / pending) */}
        <span
          className="text-[11px] font-bold px-3 py-1 rounded-[20px] uppercase tracking-[0.05em]"
          style={(() => { const s = returnStatusColor(returnDoc.returnStatus); return { background: s.bg, color: s.color, border: `1px solid ${s.border}` }; })()}
        >
          Return: {returnDoc.returnStatus || 'pending'}
        </span>

        {/* Refund processing status badge (processed / rejected / pending) */}
        <span
          className="text-[11px] font-bold px-3 py-1 rounded-[20px] uppercase tracking-[0.05em]"
          style={(() => { const s = refundStatusColor(returnDoc.refundStatus); return { background: s.bg, color: s.color, border: `1px solid ${s.border}` }; })()}
        >
          Refund: {returnDoc.refundStatus || 'pending'}
        </span>
      </div>

      {/* Pharmacist adjustment note — only shown once the return has been actioned (not pending) */}
      {returnDoc.adjustmentNote && returnDoc.returnStatus !== 'pending' && (
        <div
          className="mt-3 rounded-[10px] px-[14px] py-[10px] flex gap-2 items-start"
          style={{ background: 'rgba(26,135,225,0.06)', border: `1px solid ${C.border}` }}
        >
          <FileText size={14} color={C.accent} className="mt-[1px] shrink-0" />
          <p className="text-[12px] leading-[1.6]" style={{ color: C.accentMid }}>
            <strong>Pharmacist note:</strong> {returnDoc.adjustmentNote}
          </p>
        </div>
      )}
    </div>
  );
}