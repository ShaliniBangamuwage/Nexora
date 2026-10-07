// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  surface:     "var(--bg-secondary)",
  border:      "var(--card-border)",
  textPrimary: "var(--text-primary)",
  textSoft:    "var(--text-secondary)",
  successText: "#059669",
  successBg:   "rgba(16,185,129,0.08)",
};

// Reusable row for each line item in the summary (label + value)
function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-[6px]">
      <span className="text-[13px]" style={{ color: C.textSoft }}>{label}</span>
      <span className="text-[13px] font-semibold" style={{ color: C.textPrimary }}>{value}</span>
    </div>
  );
}

// Displays the order cost breakdown: subtotal, courier charge, tax, and grand total
// Props:
//   total         — cart subtotal (items only, before courier)
//   courierCharge — delivery fee; defaults to 0 if not provided
export default function OrderSummary({ total, courierCharge = 0 }) {
  // Grand total = subtotal + courier charge (tax is currently 0%)
  const grandTotal = total + courierCharge;

  return (
    <div
      className="rounded-xl px-5 py-[18px] mt-3"
      style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(26,135,225,0.07)" }}
    >
      {/* Line-item breakdown */}
      <SummaryRow label="Subtotal"       value={`Rs. ${total.toFixed(2)}`} />
      <SummaryRow label="Courier Charge" value={`Rs. ${courierCharge.toFixed(2)}`} />
      <SummaryRow label="Tax (0%)"       value="Rs. 0.00" />

      {/* Divider before grand total */}
      <div className="my-3" style={{ borderTop: `1px solid ${C.border}` }} />

      {/* Grand total row — larger font to draw attention */}
      <div className="flex justify-between items-center">
        <span className="text-[15px] font-semibold" style={{ color: C.textPrimary }}>Total</span>
        <span className="text-[18px] font-bold"     style={{ color: C.textPrimary }}>Rs. {grandTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}