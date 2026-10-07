const getStatusStyle = (status) => {
  switch (status) {
    case "PENDING":   return "bg-amber-50 text-amber-700 border border-amber-200";
    case "APPROVED":  return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "REJECTED":  return "bg-red-50 text-red-700 border border-red-200";
    case "COMPLETED": return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    default:          return "bg-gray-50 text-gray-500 border border-gray-200";
  }
};

const getInitialPaymentBadge = (order) => {
  if (order.status !== "APPROVED" && order.status !== "COMPLETED") return null;
  const paid = order.initialPaymentStatus === "PAID";
  return (
    <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
      ${paid
        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
        : "bg-amber-50 text-amber-700 border border-amber-200"
      }`}>
      {paid ? "Paid" : "Awaiting"}
    </span>
  );
};

const OrderTable = ({ loading, orders, onView, onApprove, onReject, formatDate }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-gray-100">
      {loading ? (
        <div className="py-20 text-center text-gray-400 text-sm font-semibold">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center px-8">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
          </div>
          <p className="text-sm font-bold text-gray-900 mb-1">No orders found</p>
          <p className="text-xs text-gray-400 font-medium">Orders from MediCareX will appear here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50">
                {["PO ID", "Product", "Qty", "Unit Price", "Total Amount", "Order Date", "Status", "Payment", "Action"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, index) => (
                <tr
                  key={o.id}
                  className={`border-b border-gray-100 hover:bg-gray-50/60 transition-colors duration-150 ${index === orders.length - 1 ? "border-none" : ""}`}
                >
                  {/* PO ID */}
                  <td className="px-4 py-4 font-mono font-bold text-gray-800 text-sm">{o.poId}</td>

                  {/* Product */}
                  <td className="px-4 py-4">
                    <p className="font-bold text-gray-900 text-sm m-0 leading-tight">{o.product || o.productName}</p>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5 m-0">{o.productCode}</p>
                  </td>

                  {/* Qty */}
                  <td className="px-4 py-4 text-sm font-semibold text-gray-700 tabular-nums">{o.quantity} <span className="text-gray-400 font-normal">units</span></td>

                  {/* Unit Price */}
                  <td className="px-4 py-4 text-sm font-semibold text-gray-700 tabular-nums">Rs. {Number(o.unitPrice).toFixed(2)}</td>

                  {/* Total Amount */}
                  <td className="px-4 py-4 text-sm font-bold text-emerald-600 tabular-nums">
                    Rs. {Number(o.amount || o.totalAmount).toFixed(2)}
                  </td>

                  {/* Order Date */}
                  <td className="px-4 py-4 text-xs font-medium text-gray-400">{formatDate(o.orderDate || o.createdAt)}</td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${getStatusStyle(o.status)}`}>
                      {o.status}
                    </span>
                  </td>

                  {/* Payment badge */}
                  <td className="px-4 py-4">{getInitialPaymentBadge(o)}</td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => onView(o)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 hover:border-gray-300 text-[11px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-all duration-200 hover:-translate-y-px"
                      >
                        View
                      </button>
                      {o.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => onApprove(o.id, o)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg border-none cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(16,185,129,0.30)]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onReject(o)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 text-[11px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-all duration-200 hover:-translate-y-px"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderTable;