export default function Card({ title, value, header, children }) {
  return (
    <div className="relative bg-[var(--bg-secondary)] px-6 py-5 rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.1)] min-h-[100px] flex flex-col justify-center border border-[var(--navbar-border)]">
      
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 h-full w-1.5 bg-blue-700 rounded-l-xl" />

      {/* Stat mode — original behaviour, unchanged */}
      {value    && <h3 className="text-2xl font-bold text-[var(--text-primary)]">{value}</h3>}
      {title    && <p  className="text-sm text-[var(--text-secondary)] mt-1">{title}</p>}

      {/* Container mode — header slot + children */}
      {header   && <div className="mb-3">{header}</div>}
      {children && <div>{children}</div>}
    </div>
  );
}