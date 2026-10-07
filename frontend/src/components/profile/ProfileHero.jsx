import { useRef } from "react";
import { Camera } from "lucide-react";
import { C, FONT } from "./profileTheme";
import PageBanner from "./PageBanner";

// Renders the profile hero section: banner, avatar with photo-upload button,
// full name, email, and status / role badges.
export default function ProfileHero({ user, onPhotoChange, uploading }) {
  // Hidden file input triggered programmatically by the camera button
  const fileRef = useRef(null);

  // Generate up to 2 uppercase initials from the user's full name as an avatar fallback
  const initials = (user.fullName || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  // Small pill badge for status and role — uses a green tint when active
  const Badge = ({ label, active }) => (
    <span
      className="text-[11px] font-bold px-[14px] py-1 rounded-[20px] uppercase tracking-[0.08em]"
      style={{
        background: active ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.15)",
        color:      active ? "#6ee7b7"               : "rgba(255,255,255,0.9)",
        border:     `1px solid ${active ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.25)"}`,
      }}
    >
      {label}
    </span>
  );

  return (
    // Extra bottom padding so the LoyaltyCard can overlap the banner with a negative margin
    <PageBanner paddingBottom="pb-20">
      {/* Hidden file input — accepts common image formats for avatar upload */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onPhotoChange}
      />

      {/* ── Avatar ── */}
      <div className="relative inline-block mb-[14px]">
        {/* Avatar circle — shows photo if available, initials otherwise */}
        <div
          className="w-[84px] h-[84px] rounded-full flex items-center justify-center overflow-hidden text-[28px] font-bold text-white"
          style={{
            background: user.photoURL ? "transparent" : "rgba(255,255,255,0.2)",
            border: "3px solid rgba(255,255,255,0.5)",
            fontFamily: FONT.display,
          }}
        >
          {/* FIX: only render <img> when photoURL is a non-empty string */}
          {user.photoURL
            ? <img src={user.photoURL || undefined} alt="Profile" className="w-full h-full object-cover" />
            : initials}
        </div>

        {/* Camera button — positioned bottom-right of the avatar */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 w-[26px] h-[26px] rounded-full flex items-center justify-center"
          style={{
            background: uploading ? "#93c5fd" : C.accent,
            border: "2px solid #ffffff",
            cursor: uploading ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          {uploading
            ? <span className="w-[10px] h-[10px] border-2 border-white border-t-transparent rounded-full inline-block animate-spin" />
            : <Camera size={12} color="#ffffff" />}
        </button>
      </div>

      {/* User's display name */}
      <h1 className="text-[26px] font-bold text-white mb-[6px]" style={{ fontFamily: FONT.display }}>
        {user.fullName}
      </h1>

      {/* Email */}
      <p className="text-[13px] mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
        {user.email}
      </p>

      {/* Status and role badges — FIX: was missing from your current code */}
      <div className="flex gap-2 justify-center flex-wrap">
        <Badge label={user.status || "active"}   active={user.status === "active"} />
        <Badge label={user.role   || "customer"} active={false} />
      </div>
    </PageBanner>
  );
}