import { getOrderStatusStyle, formatResponseDate } from "../supplierHelpers";

const TABLE_HEADERS = [
  "PO ID", "Product", "Product Code", "Category",
  "Quantity", "Unit Price", "Total Amount", "Status",
  "Order Date"
];

export const OrdersTable = ({ orders }) => {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-8 flex flex-col items-center justify-center py-20 px-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-base font-semibold text-slate-500 mb-1">No orders yet</p>
        <p className="text-sm text-slate-400">Orders placed by admin will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm mb-8">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gradient-to-r from-violet-600 to-indigo-600">
              {TABLE_HEADERS.map((h) => (
                <th
                  key={h}
                  className="px-5 py-3.5 text-left text-[11px] font-bold text-white/90 uppercase tracking-widest whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.map((order, idx) => (
              <tr
                key={order.id}
                className={`transition-colors duration-150 hover:bg-violet-50/40 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
              >
                <td className="px-5 py-3.5">
                  <span className="font-mono text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100">
                    {order.poId}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm font-semibold text-slate-800 whitespace-nowrap">
                  {order.product || order.productName || "N/A"}
                </td>
                <td className="px-5 py-3.5 text-xs font-mono text-slate-500 bg-slate-50 whitespace-nowrap">
                  {order.productCode || "N/A"}
                </td>
                
                <td className="px-5 py-3.5 text-sm text-slate-700 font-semibold whitespace-nowrap">
                  {order.quantity || 0}
                  <span className="text-xs text-slate-400 font-normal ml-1">units</span>
                </td>
                <td className="px-5 py-3.5 text-sm font-bold text-emerald-600 whitespace-nowrap">
                  Rs. {Number(order.unitPrice || 0).toFixed(2)}
                </td>
                <td className="px-5 py-3.5 text-sm font-bold text-emerald-700 whitespace-nowrap">
                  Rs. {Number(order.amount || order.totalAmount || 0).toFixed(2)}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getOrderStatusStyle(order.status)}`}>
                    {order.status || "PENDING"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                  {order.date}
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                  {formatResponseDate(order)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer row count */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">
          Showing <span className="font-bold text-slate-600">{orders.length}</span> order{orders.length !== 1 ? "s" : ""}
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
      </div>
    </div>
  );
};