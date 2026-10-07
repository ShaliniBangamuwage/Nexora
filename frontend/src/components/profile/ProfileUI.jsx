import React from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { C } from "./profileTheme";

// ── SectionCard ───────────────────────────────────────────────────────────────
// White card with a tinted header strip, icon, title, and subtitle.
// Used as the main container for each profile settings section.
export function SectionCard({ icon, title, subtitle, children }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: C.cardShadow,
      }}
    >
      {/* Tinted header strip with icon, title, and subtitle */}
      <div
        className="flex items-center gap-2.5 px-[22px] py-4"
        style={{
          background: C.accentFaint,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          className="w-[34px] h-[34px] rounded-lg flex items-center justify-center"
          style={{ background: C.accentFaint }}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: C.textPrimary }}>
            {title}
          </p>
          <p className="text-[11px]" style={{ color: C.textMuted }}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* Card body — slotted children stacked vertically */}
      <div className="p-[22px] flex flex-col gap-3.5">{children}</div>
    </div>
  );
}

// ── SectionLabel ──────────────────────────────────────────────────────────────
// Small uppercase label used as a visual divider inside a section.
// Accepts either a Lucide component reference or a pre-rendered React element as `icon`.
export function SectionLabel({ icon, label }) {
  const Icon = icon;

  return (
    <p
      className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] mb-4"
      style={{ color: C.textMuted }}
    >
      {/* Render a pre-rendered element directly; otherwise instantiate the component */}
      {React.isValidElement(icon)
        ? icon
        : Icon
        ? <Icon size={14} />
        : null}
      {label}
    </p>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
// Label + input wrapper used inside forms.
// `icon` is a pre-rendered element placed inline before the label text.
export function Field({ icon, label, children }) {
  return (
    <div>
      <label
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] mb-1.5"
        style={{ color: C.textMuted }}
      >
        {icon} {label}
      </label>
      {/* Slotted input or textarea */}
      {children}
    </div>
  );
}

// ── SuccessBanner ─────────────────────────────────────────────────────────────
// Green confirmation strip shown inline after a successful save action.
export function SuccessBanner({ message }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
      style={{
        background: C.successBg,
        border: `1px solid ${C.successBorder}`,
      }}
    >
      <CheckCircle size={15} color={C.successText} />
      <p className="text-[13px] font-semibold" style={{ color: C.successText }}>
        {message}
      </p>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
// Fixed top-right notification for success or error feedback.
// Returns null when no toast is active so it renders nothing.
export function Toast({ toast }) {
  if (!toast) return null;

  // Switch colours and icon based on whether this is an error or success toast
  const isError = toast.type === "error";

  return (
    <div
      className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold shadow-lg"
      style={{
        background: isError ? C.dangerBg : C.successBg,
        color: isError ? C.dangerText : C.successText,
        border: `1px solid ${isError ? C.dangerBorder : C.successBorder}`,
      }}
    >
      {isError ? (
        <AlertCircle size={15} color={C.dangerText} />
      ) : (
        <CheckCircle size={15} color={C.successText} />
      )}
      {toast.msg}
    </div>
  );
}