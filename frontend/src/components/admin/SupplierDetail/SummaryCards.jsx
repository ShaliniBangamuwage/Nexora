export const SummaryCards = ({ orders }) => {
  const cards = [
    {
      label: "Total Orders",
      value: orders.length,
      color: "text-slate-800",
      bg: "bg-slate-50",
      ring: "ring-slate-200",
      icon: (
        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: "Pending",
      value: orders.filter((o) => o.status === "PENDING").length,
      color: "text-amber-600",
      bg: "bg-amber-50",
      ring: "ring-amber-200",
      icon: (
        <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Approved",
      value: orders.filter((o) => o.status === "APPROVED").length,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-200",
      icon: (
        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Rejected",
      value: orders.filter((o) => o.status === "REJECTED").length,
      color: "text-red-600",
      bg: "bg-red-50",
      ring: "ring-red-200",
      icon: (
        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Completed",
      value: orders.filter((o) => o.status === "COMPLETED").length,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      ring: "ring-cyan-200",
      icon: (
        <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    {
      label: "Total Value",
      value: `Rs. ${orders.reduce((s, o) => s + (Number(o.amount || o.totalAmount) || 0), 0).toFixed(2)}`,
      color: "text-violet-700",
      bg: "bg-violet-50",
      ring: "ring-violet-200",
      icon: (
        <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bg} rounded-2xl p-4 ring-1 ${card.ring} flex flex-col gap-3 hover:shadow-md transition-all duration-200`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{card.label}</span>
            <span className={`w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center`}>
              {card.icon}
            </span>
          </div>
          <p className={`text-2xl font-black ${card.color} leading-none tracking-tight`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
};