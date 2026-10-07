import { C, FONT } from "./profileTheme";

// Reusable full-width gradient banner used at the top of profile-style pages.
// Props:
//   title         — large white heading
//   subtitle      — optional supporting text beneath the title
//   children      — optional action buttons or badges rendered below the subtitle
//   paddingBottom — controls vertical spacing; defaults to "pb-12"
export default function PageBanner({ title, subtitle, children, paddingBottom = "pb-12" }) {
  return (
    <div
      className={`px-6 pt-14 ${paddingBottom} text-center`}
      style={{ background: C.bannerGradient }}
    >
      {/* Page title */}
      <h1
  className="text-[38px] font-bold text-white mb-3"
  style={{ fontFamily: FONT.body }}
>
        {title}
      </h1>

      {/* Optional subtitle — constrained width for readability */}
      {subtitle && (
        <p
          className="text-[15px] max-w-[520px] mx-auto mb-7"
        style={{ color: C.bannerSubtitle, fontFamily: FONT.body }}
        >
          {subtitle}
        </p>
      )}

      {/* Optional slotted content (e.g. CTA buttons or status badges) */}
      {children && (
        <div className="flex gap-3 justify-center flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}