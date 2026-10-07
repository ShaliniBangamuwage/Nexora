import { useNavigate } from "react-router-dom";
import { ShoppingBag, RotateCcw, Settings, ChevronRight } from "lucide-react";
import { C, FONT } from "./profileTheme";

// ── QuickLinkCard ─────────────────────────────────────────────────────────────
// Individual tappable card that navigates to a section of the app.
// Props:
//   icon    — Lucide icon component
//   label   — primary link text
//   sub     — short description shown below the label
//   color   — accent colour used for the icon and its background tint
//   onClick — navigation handler
function QuickLinkCard({ icon: Icon, label, sub, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-[14px] rounded-xl cursor-pointer transition-shadow duration-150"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: "0 1px 4px rgba(26,135,225,0.07)",
      }}
      // Subtle lift on hover to indicate interactivity
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(26,135,225,0.14)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(26,135,225,0.07)"}
    >
      {/* Coloured icon container — tint is derived from the accent colour at 9% opacity */}
      <div
        className="w-[38px] h-[38px] rounded-[10px] shrink-0 flex items-center justify-center"
        style={{ background: color + "18" }}
      >
        <Icon size={18} color={color} />
      </div>

      {/* Label and supporting description */}
      <div className="flex-1">
        <p className="text-[13px] font-bold" style={{ color: C.textPrimary }}>{label}</p>
        {sub && <p className="text-[11px] mt-[2px]" style={{ color: C.textMuted }}>{sub}</p>}
      </div>

      {/* Right-facing chevron indicates this card is a navigation link */}
      <ChevronRight size={15} color={C.textMuted} />
    </div>
  );
}

// ── QuickLinks ────────────────────────────────────────────────────────────────
// Card containing shortcuts to the customer's most-used store sections.
export default function QuickLinks() {
  const navigate = useNavigate();

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: "0 1px 4px rgba(26,135,225,0.07)",
      }}
    >
      {/* Card header */}
      <div
        className="px-5 py-[14px]"
        style={{ background: "rgba(26,135,225,0.04)", borderBottom: `1px solid ${C.border}` }}
      >
        <p
          className="text-[11px] font-bold uppercase tracking-[0.08em] flex items-center gap-[6px]"
          style={{ color: C.textMuted }}
        >
          <Settings size={12} color={C.accent} /> Quick Links
        </p>
      </div>

      {/* ── Navigation link cards ── */}
      <div className="px-4 py-[14px] flex flex-col gap-[10px]">
        {/* Orders — view history and track deliveries */}
        <QuickLinkCard
          icon={ShoppingBag} label="My Orders"
          sub="View order history and track deliveries"
          color={C.accent}
          onClick={() => navigate("/customer/orders")}
        />
        {/* Returns — initiate returns and check refund status */}
        <QuickLinkCard
          icon={RotateCcw} label="Returns"
          sub="Request returns and track refunds"
          color="#f59e0b"
          onClick={() => navigate("/customer/returns")}
        />
      </div>
    </div>
  );
}