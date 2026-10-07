import { Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft } from 'lucide-react';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:          "var(--bg-primary)",
  surface:     "var(--bg-secondary)",
  border:      "var(--card-border)",
  accent:      "var(--accent-blue)",
  textPrimary: "var(--text-primary)",
  textMuted:   "var(--text-secondary)",
};

const FONT = { body: "'DM Sans', sans-serif" };

// Shown when the customer's cart has no items
export default function EmptyCart() {
  return (
    // Full-screen centered layout using the app background colour
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg, fontFamily: FONT.body }}>
      {/* Card container */}
      <div
        className="text-center rounded-2xl px-16 py-12"
        style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(26,135,225,0.07)" }}
      >
        {/* Cart icon badge */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: C.bg, border: `1px solid ${C.border}` }}
        >
          <ShoppingCart size={24} color={C.textMuted} />
        </div>

        {/* Empty state heading */}
        <h1 className="text-[18px] font-bold mb-2" style={{ color: C.textPrimary }}>Your cart is empty</h1>

        {/* Supporting message */}
        <p className="text-[13px] mb-6" style={{ color: C.textMuted }}>Looks like you haven't added anything yet.</p>

        {/* CTA — navigates back to the products listing */}
        <Link
          to="/customer/products"
          className="inline-flex items-center gap-[6px] text-[13px] font-semibold rounded-lg px-[18px] py-2 no-underline"
          style={{ color: C.accent, background: "rgba(26,135,225,0.08)", border: `1px solid ${C.border}` }}
        >
          <ArrowLeft size={14} /> Continue Shopping
        </Link>
      </div>
    </div>
  );
}