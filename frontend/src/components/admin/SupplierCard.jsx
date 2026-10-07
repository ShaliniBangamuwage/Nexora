import { useState, useEffect } from "react";
import { db } from "../../services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { MdEmail, MdPhone } from "react-icons/md";
import { FaStar } from "react-icons/fa";

export const SupplierCard = ({ supplier, onView }) => {
  const [stats, setStats] = useState({
    products: 0, totalOrders: 0, pendingOrders: 0, approvedOrders: 0, completedOrders: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const sid = supplier.userId || supplier.id;
        const productsSnap = await getDocs(query(collection(db, "products"), where("supplierId", "==", sid)));
        const ordersSnap   = await getDocs(query(collection(db, "purchaseOrders"), where("supplierId", "==", sid)));
        const allOrders = ordersSnap.docs.map((d) => d.data());
        setStats({
          products:        productsSnap.size,
          totalOrders:     allOrders.length,
          pendingOrders:   allOrders.filter((o) => o.status === "PENDING").length,
          approvedOrders:  allOrders.filter((o) => o.status === "APPROVED").length,
          completedOrders: allOrders.filter((o) => o.status === "COMPLETED").length,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, [supplier.id, supplier.userId]);

  const isActive = (supplier.status || "active") === "active";

  const statItems = [
    { label: "Products",     value: stats.products,       color: "text-slate-700",    bg: "bg-slate-50" },
    { label: "Total Orders", value: stats.totalOrders,    color: "text-violet-600",   bg: "bg-violet-50" },
    { label: "Pending",      value: stats.pendingOrders,  color: "text-amber-500",    bg: "bg-amber-50" },
    { label: "Approved",     value: stats.approvedOrders, color: "text-emerald-600",  bg: "bg-emerald-50" },
  ];

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/60 hover:border-violet-100">
      
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500" />

      <div className="p-6 flex flex-col flex-1">
        {/* Avatar + Status */}
        <div className="flex justify-between items-start mb-5">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-violet-200">
              {(supplier.name || supplier.email || "S").charAt(0).toUpperCase()}
            </div>
            <span className={`absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${isActive ? "bg-emerald-400" : "bg-red-400"}`} />
          </div>
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider
            ${isActive
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-red-50 text-red-600 ring-1 ring-red-200"}`}>
            {supplier.status || "Active"}
          </span>
        </div>

        {/* Name & Contact Person */}
        <h3 className="text-[17px] font-bold text-slate-800 leading-tight mb-0.5 truncate">
          {supplier.name || "Unknown Supplier"}
        </h3>
        <p className="text-xs text-slate-400 font-medium mb-4 truncate">
          {supplier.contactPerson || supplier.email || "No contact"}
        </p>

        {/* Contact Info */}
        <div className="flex flex-col gap-2 bg-slate-50/70 rounded-xl p-3 mb-4 border border-slate-100">
          <span className="flex items-center gap-2.5 text-xs text-slate-600 font-medium truncate">
            <span className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <MdEmail size={13} className="text-violet-500" />
            </span>
            {supplier.email || "N/A"}
          </span>
          <span className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
            <span className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <MdPhone size={13} className="text-violet-500" />
            </span>
            {supplier.phone || "N/A"}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <FaStar
                key={s}
                size={12}
                className={Number(supplier.rating) >= s ? "text-amber-400" : "text-slate-200"}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {supplier.rating ? `${supplier.rating} / 5` : "No rating"}
          </span>
        </div>

        {/* Categories */}
        {supplier.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {supplier.categories.map((cat, i) => (
              <span key={i} className="bg-violet-50 text-violet-700 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-violet-100">
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {statItems.map((s) => (
              <div key={s.label} className={`flex flex-col items-center ${s.bg} rounded-xl py-3 px-2 text-center border border-slate-100`}>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">{s.label}</span>
                <strong className={`text-2xl font-black ${s.color}`}>{s.value}</strong>
              </div>
            ))}
          </div>

          <button
            onClick={onView}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl border-none cursor-pointer transition-all duration-200 text-sm tracking-wide shadow-md shadow-violet-200 hover:shadow-violet-300 active:scale-[0.98]"
          >
            View Orders
            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs font-black">
              {stats.totalOrders}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};