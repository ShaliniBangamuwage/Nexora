import { formatDate, getStatusStyle } from './orderHelpers';

const TABLE_HEADERS = ['PO ID', 'Product', 'Supplier', 'Quantity', 'Unit Price', 'Total Amount', 'Status', 'Order Date', 'Actions'];

export const OrderTable = ({ loading, orders, onView }) => {
  if (loading) return <div className="py-20 text-center text-slate-500 text-lg">Loading orders...</div>;
  if (orders.length === 0) return <div className="py-20 text-center text-slate-500 text-lg">No orders found</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[900px]">
        <thead className="bg-slate-50">
          <tr>
            {TABLE_HEADERS.map((h) => (
              <th key={h} className="px-4 py-4 text-left text-[13px] font-semibold text-slate-500 uppercase tracking-wide border-b-2 border-slate-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
              <td className="px-4 py-4">
                <p className="font-mono font-semibold text-blue-600 text-sm m-0">
                  {order.productCode || order.poId || order.productId}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5 m-0">
                  {order.poId || order.productId}
                </p>
              </td>
              <td className="px-4 py-4">
                <p className="font-semibold text-slate-800 text-sm m-0">{order.productName || order.product}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5 m-0">{order.productCode}</p>
              </td>
              <td className="px-4 py-4 text-sm text-slate-800">{order.supplierName}</td>
              <td className="px-4 py-4 text-sm text-slate-800">{order.quantity} units</td>
              <td className="px-4 py-4 text-sm text-slate-800">Rs. {Number(order.unitPrice).toFixed(2)}</td>
              <td className="px-4 py-4 text-sm font-semibold text-emerald-600">
                Rs. {(order.totalAmount ?? order.quantity * order.unitPrice).toFixed(2)}
              </td>
              <td className="px-4 py-4">
                <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-semibold uppercase ${getStatusStyle(order.status)}`}>
                  {order.status}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-slate-600">
                {formatDate(order.orderDate || order.createdAt)}
              </td>
              <td className="px-4 py-4">
                <button
                  onClick={() => onView(order)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium rounded-lg border-none cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-md"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};