export const RejectedOrders = ({ orders }) => {
  const rejected = orders.filter((o) => o.status === "REJECTED");
  if (rejected.length === 0) return null;

  return (
    <div className="mt-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 leading-tight">Rejected Orders</h3>
          <p className="text-xs text-slate-400 font-medium">{rejected.length} order{rejected.length !== 1 ? "s" : ""} rejected</p>
        </div>
        <span className="ml-auto bg-red-50 text-red-600 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
          {rejected.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rejected.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden hover:shadow-md hover:border-red-200 transition-all duration-200"
          >
            {/* Card top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-red-400 to-rose-500" />

            <div className="p-5">
              {/* PO ID + Badge */}
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100">
                  {order.poId}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                  Rejected
                </span>
              </div>

              {/* Order Info */}
              <div className="space-y-2.5 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 w-20 pt-0.5 flex-shrink-0">Product</span>
                  <span className="text-sm font-semibold text-slate-700 leading-snug">{order.product || order.productName || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 w-20 flex-shrink-0">Quantity</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {order.quantity}
                    <span className="text-xs text-slate-400 font-normal ml-1">units</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 w-20 flex-shrink-0">Rejected</span>
                  <span className="text-sm text-slate-600">
                    {order.rejectionDate?.toDate
                      ? order.rejectionDate.toDate().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* Rejection Reason */}
              {order.rejectionReason && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1.5">Reason</p>
                  <p className="text-sm text-red-800 leading-relaxed italic">"{order.rejectionReason}"</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};