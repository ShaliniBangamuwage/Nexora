import { MdArrowBack, MdEmail, MdPhone, MdBadge } from "react-icons/md";
import { FaStar } from "react-icons/fa";
import { OrdersTable } from "./SupplierDetail/OrdersTable";
import { SummaryCards } from "./SupplierDetail/SummaryCards";
import { RejectedOrders } from "./SupplierDetail/RejectedOrders";

export const SupplierDetail = ({ supplier, orders, adminRating, onRating, onBack }) => {
  const isActive = (supplier.status || "active") === "active";

  return (
    <div className="p-6 lg:p-10 bg-slate-50 min-h-screen max-w-[1400px] mx-auto">

      {/* Page Header */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-1">Supplier Management</p>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-800 leading-tight">Supplier Detail</h1>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md text-sm"
        >
          <MdArrowBack size={16} className="text-violet-500" />
          Back to Suppliers
        </button>
      </div>

      {/* Supplier Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500" />
        <div className="p-6 lg:p-8">
          <div className="flex gap-6 lg:gap-8 items-start flex-wrap">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-4xl lg:text-5xl font-black shadow-lg shadow-violet-200">
                {(supplier.name || supplier.email || "S").charAt(0).toUpperCase()}
              </div>
              <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm ${isActive ? "bg-emerald-400" : "bg-red-400"}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h2 className="text-xl lg:text-2xl font-black text-slate-800">{supplier.name || "Unknown Supplier"}</h2>
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider
                  ${isActive ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-600 ring-1 ring-red-200"}`}>
                  {supplier.status || "Active"}
                </span>
              </div>
              <p className="text-sm text-slate-400 font-medium mb-5">{supplier.contactPerson || "No contact person"}</p>

              {/* Contact row */}
              <div className="flex flex-wrap gap-3 mb-5">
                {[
                  { icon: <MdEmail size={14} className="text-violet-400" />, value: supplier.email },
                  { icon: <MdPhone size={14} className="text-violet-400" />, value: supplier.phone },
                  { icon: <MdBadge size={14} className="text-violet-400" />, value: supplier.supplierId },
                ].map((item, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl"
                  >
                    {item.icon}
                    {item.value || "N/A"}
                  </span>
                ))}
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Admin Rating</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      size={20}
                      className={`cursor-pointer transition-all duration-150 hover:scale-110 ${
                        star <= adminRating ? "text-amber-400 drop-shadow-sm" : "text-slate-200"
                      }`}
                      onClick={() => onRating(star)}
                    />
                  ))}
                </div>
                {adminRating > 0 && (
                  <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full ring-1 ring-amber-200">
                    {adminRating} / 5
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-violet-500 to-indigo-500" />
        <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide">Purchase Orders</h3>
        <span className="ml-auto text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full ring-1 ring-violet-200">
          {orders.length} total
        </span>
      </div>

      <SummaryCards orders={orders} />
      <OrdersTable orders={orders} />
      <RejectedOrders orders={orders} />
    </div>
  );
};