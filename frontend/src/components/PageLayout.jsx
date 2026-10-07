/**
 * PageLayout — src/components/PageLayout.jsx
 *
 * Wraps every dashboard page with consistent padding,
 * mobile hamburger spacing, and a standard header.
 *
 * Props:
 *  title       → page title string
 *  subtitle    → page subtitle string (optional)
 *  actions     → JSX for top-right header buttons (optional)
 *  children    → page content
 *
 * Usage:
 *  <PageLayout title="Admin Dashboard" subtitle="MediCareX · Pharmacy Management">
 *    <YourContent />
 *  </PageLayout>
 */
export default function PageLayout({ title, subtitle, actions, children }) {
  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* Page header — mt-10 on mobile clears the hamburger button */}
      <div className="mt-10 md:mt-0 mb-5 md:mb-7 flex items-start justify-between gap-3 flex-wrap">
        <div>
          {title && (
            <h1 className="text-xl md:text-3xl font-bold text-slate-800 leading-tight">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-slate-500 text-sm md:text-[15px] mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap">{actions}</div>
        )}
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}