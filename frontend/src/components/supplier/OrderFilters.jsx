const OrderFilters = ({ filterStatus, setFilterStatus, orders }) => {
  return (
    <div className="bg-white px-6 py-4 rounded-2xl shadow-[0_1px_4px_rgba(15,36,99,0.08)] border border-blue-50 mb-5 flex justify-between items-center flex-wrap gap-4">

      {/* Styled select dropdown */}
      <div className="relative">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="appearance-none pl-4 pr-10 py-2.5 border border-blue-200 rounded-lg text-sm font-semibold text-blue-700 cursor-pointer bg-blue-50 min-w-[180px] transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        >
          <option>All Orders</option>
          <option>PENDING</option>
          <option>APPROVED</option>
          <option>REJECTED</option>
          <option>COMPLETED</option>
        </select>
        {/* Chevron icon */}
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-blue-400">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Order count badges */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Total",    value: orders.length,                                          bg: "bg-blue-50  border-blue-200  text-blue-700"    },
          { label: "Pending",  value: orders.filter((o) => o.status === "PENDING").length,    bg: "bg-amber-50 border-amber-200 text-amber-700"   },
          { label: "Approved", value: orders.filter((o) => o.status === "APPROVED").length,   bg: "bg-emerald-50 border-emerald-200 text-emerald-700" },
        ].map((s) => (
          <span
            key={s.label}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider ${s.bg}`}
          >
            <span className="tabular-nums text-sm">{s.value}</span>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default OrderFilters;