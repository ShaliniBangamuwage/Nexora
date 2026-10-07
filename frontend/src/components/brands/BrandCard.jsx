import { Star, Package, Globe, ShieldCheck, Calendar } from "lucide-react";

const C = {
  surface: "var(--bg-secondary)",
  border: "var(--navbar-border)",
  accent: "var(--accent-blue)",
  textPrimary: "var(--text-primary)",
  textMuted: "var(--text-secondary)",
  textSoft: "var(--text-secondary)",
};

export default function BrandCard({ brand }) {
  return (
    <div
      className="rounded-2xl overflow-hidden min-h-0"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: "0 1px 4px rgba(26,135,225,0.07)",
      }}
    >
      {/* Image */}
      {brand.imageUrl ? (
        <img src={brand.imageUrl} alt={brand.name} className="w-full h-[220px] object-cover" />
      ) : (
        <div className="w-full h-[220px] flex items-center justify-center" style={{ background: "rgba(26,135,225,0.06)" }}>
          <span className="text-[56px] font-bold" style={{ color: C.accent }}>
            {brand.name?.charAt(0)}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-4 flex flex-col gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold" style={{ color: C.textPrimary }}>{brand.name}</p>
            <p className="text-[12px] mt-1" style={{ color: C.accent }}>{brand.tagline}</p>
          </div>
          <span
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase"
            style={{ background: "rgba(26,135,225,0.12)", color: C.accent }}
          >
            {brand.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-4 gap-2 text-center pb-3 mb-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          {[
            { icon: Star, value: brand.rating },
            { icon: Package, value: brand.products },
            { icon: Calendar, value: brand.established },
            { icon: Globe, value: brand.country },
          ].map(({ icon: Icon, value }, i) => (
            <div key={i} className="text-[10px]" style={{ color: C.textMuted }}>
              <Icon size={14} color={C.textMuted} className="mx-auto mb-1" />
              <p className="font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <p className="text-[13px] leading-5 line-clamp-3" style={{ color: C.textSoft }}>
          {brand.description}
        </p>
      </div>
    </div>
  );
}