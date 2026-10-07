import {
  User, Mail, Phone, MapPin, Shield,
  Edit2, Save, X,
} from "lucide-react";
import { C, FONT, inputStyle } from "./profileTheme";

// ── Field ─────────────────────────────────────────────────────────────────────
// Label + input wrapper used in the edit form.
// `icon` is an optional Lucide component rendered inline before the label text.
function Field({ label, icon: Icon, children }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label
        className="text-[11px] font-bold uppercase tracking-[0.08em] flex items-center gap-[5px]"
        style={{ color: C.textMuted }}
      >
        {Icon && <Icon size={11} color={C.accent} />}
        {label}
      </label>
      {/* Slotted input or textarea */}
      {children}
    </div>
  );
}

// ── InfoRow ───────────────────────────────────────────────────────────────────
// Read-only display row used in the non-editing view.
// Shows an icon, a small label, and the field value.
// `accent` flag renders the value in the app accent colour (used for email).
function InfoRow({ icon: Icon, label, value, accent }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-[10px]"
      style={{ background: "rgba(26,135,225,0.03)", border: `1px solid ${C.border}` }}
    >
      {/* Icon badge */}
      <div
        className="w-[34px] h-[34px] rounded-lg shrink-0 flex items-center justify-center"
        style={{ background: "rgba(26,135,225,0.1)" }}
      >
        <Icon size={15} color={C.accent} />
      </div>
      <div className="flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: C.textMuted }}>
          {label}
        </p>
        {/* Value — uses accent colour when `accent` prop is true */}
        <p className="text-[13px] font-semibold mt-[2px]" style={{ color: accent ? C.accent : C.textPrimary }}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// ── ProfileDetails ────────────────────────────────────────────────────────────
// Card that toggles between a read-only info view and an editable form.
// The parent controls all state; this component is purely presentational.
// Props:
//   user                          — current user object (read-only values)
//   editing / saving              — UI state flags
//   fullName / phone / address    — controlled field values
//   onFullNameChange / onPhoneChange / onAddressChange — field change handlers
//   onEdit / onCancel / onSave    — action callbacks
export default function ProfileDetails({
  user,
  editing, saving,
  fullName, phone, address,
  onFullNameChange, onPhoneChange, onAddressChange,
  onEdit, onCancel, onSave,
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: "0 1px 4px rgba(26,135,225,0.07)",
      }}
    >
      {/* ── Card header with Edit / Save / Cancel controls ── */}
      <div
        className="px-5 py-[14px] flex justify-between items-center"
        style={{ background: "rgba(26,135,225,0.04)", borderBottom: `1px solid ${C.border}` }}
      >
        <p
          className="text-[11px] font-bold uppercase tracking-[0.08em] flex items-center gap-[6px]"
          style={{ color: C.textMuted }}
        >
          <User size={12} color={C.accent} />
          Profile Details
        </p>

        {/* Show "Edit Profile" when not editing; show "Cancel" + "Save" when editing */}
        {!editing ? (
          <button
            onClick={onEdit}
            className="flex items-center gap-[6px] text-[12px] font-semibold px-[14px] py-[6px] rounded-lg cursor-pointer"
            style={{ color: C.accent, background: "rgba(26,135,225,0.08)", border: `1px solid ${C.border}`, fontFamily: FONT.body }}
          >
            <Edit2 size={12} /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            {/* Cancel — discards unsaved changes */}
            <button
              onClick={onCancel}
              className="flex items-center gap-[5px] text-[12px] font-semibold px-3 py-[6px] rounded-lg cursor-pointer"
              style={{ color: C.textMuted, background: "#f1f5f9", border: `1px solid ${C.border}`, fontFamily: FONT.body }}
            >
              <X size={12} /> Cancel
            </button>
            {/* Save — disabled and lightened while the API call is in flight */}
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-[5px] text-[12px] font-semibold text-white px-[14px] py-[6px] rounded-lg border-none"
              style={{
                background: saving ? "#93c5fd" : C.accent,
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: FONT.body,
                boxShadow: "0 4px 12px rgba(26,135,225,0.25)",
              }}
            >
              <Save size={12} /> {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* ── Card body: edit form or read-only rows ── */}
      <div className="px-5 py-[18px] flex flex-col gap-[14px]">
        {editing ? (
          <>
            {/* Editable fields for name, phone, and address */}
            <Field label="Full Name" icon={User}>
              <input style={inputStyle} value={fullName} onChange={e => onFullNameChange(e.target.value)} placeholder="Your full name" />
            </Field>
            {/* Email is read-only — users cannot change their login email here */}
            <Field label="Email" icon={Mail}>
              <input
                style={{ ...inputStyle, background: "#f8fafc", color: C.textMuted, cursor: "not-allowed" }}
                value={user.email}
                disabled
              />
            </Field>
            <Field label="Phone" icon={Phone}>
              <input style={inputStyle} value={phone} onChange={e => onPhoneChange(e.target.value)} placeholder="Phone number" />
            </Field>
            <Field label="Address" icon={MapPin}>
              <textarea
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                rows={3}
                value={address}
                onChange={e => onAddressChange(e.target.value)}
                placeholder="Your delivery address"
              />
            </Field>
          </>
        ) : (
          /* Read-only info rows for all profile fields */
          <div className="flex flex-col gap-[10px]">
            <InfoRow icon={User}   label="Full Name" value={user.fullName} />
            <InfoRow icon={Mail}   label="Email"     value={user.email}   accent />
            <InfoRow icon={Phone}  label="Phone"     value={user.phone} />
            <InfoRow icon={MapPin} label="Address"   value={user.address || "No address set"} />
            <InfoRow icon={Shield} label="Status"    value={user.status  || "active"} />
          </div>
        )}
      </div>
    </div>
  );
}