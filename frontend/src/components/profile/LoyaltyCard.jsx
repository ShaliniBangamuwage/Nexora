import { useState } from "react";
import { Star, Copy, CheckCircle, Gift, Zap, Trophy, Award } from "lucide-react";
import { C, FONT } from "./profileTheme";

// Level thresholds — must match backend calculateLevel() in loyalty.service.ts
// Silver: 1000–1999 | Gold: 2000–4999 | Platinum: 5000+
const LEVELS = {
  Silver: {
    min: 1000, max: 2000, next: "Gold",
    color: "#94A3B8",
    gradient: "linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)",
    glow: "rgba(148,163,184,0.4)",
    icon: <Star size={14} color="#fff" />,
  },
  Gold: {
    min: 2000, max: 5000, next: "Platinum",
    color: "#F59E0B",
    gradient: "linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)",
    glow: "rgba(245,158,11,0.4)",
    icon: <Trophy size={14} color="#fff" />,
  },
  Platinum: {
    min: 5000, max: 5000, next: null,
    color: "#8B5CF6",
    gradient: "linear-gradient(135deg, #C4B5FD 0%, #7C3AED 100%)",
    glow: "rgba(139,92,246,0.4)",
    icon: <Award size={14} color="#fff" />,
  },
};

export default function LoyaltyCard({ user }) {
  const [copied, setCopied] = useState(false);

  // Copies the customer ID to clipboard and briefly shows a confirmation state
  const copy = () => {
    if (!user?.customerId) return;
    navigator.clipboard.writeText(user.customerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const level     = user.level || "Silver";
  const lvl       = LEVELS[level] || LEVELS.Silver;
  const points    = user.totalPoints ?? user.loyaltyPoints ?? 0;
  const progress  = lvl.next
    ? Math.min(100, Math.max(0, ((points - lvl.min) / (lvl.max - lvl.min)) * 100))
    : 100;
  const ptsToNext = lvl.next ? Math.max(0, lvl.max - points) : 0;

  return (
    <div className="max-w-[700px] mx-auto px-6 -mt-9 relative z-10">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        .lc-card {
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          background: ${C.surface};
          border: 1px solid ${C.border};
          box-shadow: 0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
          font-family: 'Outfit', sans-serif;
        }
        .lc-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
          opacity: 0.15;
          pointer-events: none;
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .lc-bar-fill {
          background-size: 200% auto;
          animation: shimmer 2.5s linear infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 4px 12px var(--glow); }
          50%       { box-shadow: 0 4px 22px var(--glow); }
        }
        .lc-star-pulse { animation: pulse-glow 2.5s ease-in-out infinite; }
        .lc-offer-chip { transition: all 0.15s ease; }
        .lc-offer-chip:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59,130,246,0.15); }
        .lc-copy-btn { transition: all 0.15s ease; }
        .lc-copy-btn:hover { opacity: 0.85; transform: scale(1.02); }
      `}</style>

      <div className="lc-card">

        {/* Decorative background orbs */}
        <div className="lc-orb" style={{ width: 180, height: 180, background: lvl.color, top: -60, right: -40 }} />
        <div className="lc-orb" style={{ width: 120, height: 120, background: "#3B82F6", bottom: -40, left: 20 }} />

        {/* ── Top: points + level badge + customer ID ── */}
        <div style={{ padding: "22px 22px 16px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>

            {/* Left: animated star + points */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                className="lc-star-pulse"
                style={{
                  "--glow": lvl.glow,
                  width: 52, height: 52,
                  borderRadius: 16,
                  background: lvl.gradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Star size={24} color="#fff" fill="#fff" />
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 2 }}>
                  Loyalty Points
                </p>
                <p style={{
                  fontSize: 34, fontWeight: 800, lineHeight: 1,
                  background: lvl.gradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  {points.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Right: level pill + customer ID */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>

              {/* Level badge pill */}
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 13px", borderRadius: 999,
                background: lvl.gradient,
                boxShadow: `0 2px 12px ${lvl.glow}`,
              }}>
                <span style={{ fontSize: 13 }}>{lvl.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.06em" }}>
                  {level} Member
                </span>
              </div>

              {/* Customer ID copy button */}
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 10, color: "#94A3B8", marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Customer ID
                </p>
                <button
                  className="lc-copy-btn"
                  onClick={copy}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "5px 12px", borderRadius: 10,
                    border: `1.5px solid ${copied ? C.successBorder : C.border}`,
                    background: copied ? C.successBg : C.bg,
                    color: copied ? C.successText : C.accent,
                    fontSize: 12, fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : user.customerId}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.border} 30%, ${C.border} 70%, transparent)` }} />

        {/* ── Progress bar to next level ── */}
        {lvl.next && (
          <div style={{ padding: "14px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}>
                <Zap size={10} /> {level}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>
                {ptsToNext > 0
                  ? <><strong style={{ color: lvl.color }}>{ptsToNext.toLocaleString()}</strong> pts to {lvl.next}</>
                  : <span style={{ color: lvl.color, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={14} /> <span>{lvl.next} unlocked!</span>
                    </span>
                }
              </span>
            </div>
            {/* Progress track */}
            <div style={{ height: 8, borderRadius: 999, background: C.bg, overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)" }}>
              <div
                className="lc-bar-fill"
                style={{
                  height: "100%", width: `${progress}%`, borderRadius: 999,
                  background: `linear-gradient(90deg, ${lvl.color}, rgba(255,255,255,0.6) 50%, ${lvl.color})`,
                  backgroundSize: "200% auto",
                  transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: `0 0 10px ${lvl.glow}`,
                }}
              />
            </div>
          </div>
        )}

        {/* ── Recommended offers (only when available) ── */}
        {user.recommendedOffers?.length > 0 && (
          <>
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.border} 30%, ${C.border} 70%, transparent)` }} />
            <div style={{ padding: "14px 22px 18px" }}>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#94A3B8", marginBottom: 10,
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <Gift size={11} /> Your Offers
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {user.recommendedOffers.map((offer, i) => (
                  <div key={i} className="lc-offer-chip" style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 14px", borderRadius: 12,
                    background: "linear-gradient(135deg, #EFF6FF, #F0F9FF)",
                    border: "1px solid #BFDBFE",
                  }}>
                    <Trophy size={13} color="#3B82F6" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#1E40AF" }}>{offer}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
