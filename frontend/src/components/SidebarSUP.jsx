import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  MdDashboard, MdNotifications, MdShoppingCart, MdInventory,
  MdLocalShipping, MdReceiptLong, MdSettings, MdLogout,
  MdChevronLeft, MdChevronRight,
} from "react-icons/md";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      navigate('/login');
    }
  };

  const menuItems = [
    { id: 1, icon: <MdDashboard size={20} />,     text: "Dashboard",          path: "/supplier" },
    { id: 2, icon: <MdNotifications size={20} />, text: "Restock Alert",      path: "/supplier/restock-alert" },
    { id: 3, icon: <MdShoppingCart size={20} />,  text: "Purchase Orders",    path: "/supplier/purchase-orders" },
    { id: 4, icon: <MdInventory size={20} />,     text: "Product Catalog",    path: "/supplier/product-catalog" },
    { id: 5, icon: <MdLocalShipping size={20} />, text: "Update Delivery",    path: "/supplier/update-delivery" },
    { id: 6, icon: <MdReceiptLong size={20} />,   text: "Invoice & Payments", path: "/supplier/invoices" },
    { id: 7, icon: <MdSettings size={20} />,      text: "Settings",           path: "/supplier/settings" },
    { id: 8, icon: <MdDashboard size={20} />,     text: "AI Analytics",       path: "/supplier/aianalytics" },
  ];

  return (
    <div className={`${isCollapsed ? "w-[72px]" : "w-[240px]"}
      h-screen bg-blue-700 text-white flex flex-col fixed left-0 top-0 z-[1000]
      transition-all duration-300 ease-in-out`}
    >
      {/* Header */}
      <div className={`flex items-center h-[68px] px-4 border-b border-blue-600/60 shrink-0
        ${isCollapsed ? "justify-center" : "justify-between"}`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-white shadow-sm flex items-center justify-center border-2 border-white/20">
              <img src="/logo.png" alt="MediCareX" className="w-full h-full object-cover scale-110" />
            </div>
            <span className="text-[15px] font-bold text-white tracking-tight whitespace-nowrap">
              MediCareX
            </span>
          </div>
        )}

        {isCollapsed && (
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-white shadow-sm flex items-center justify-center border-2 border-white/20">
            <img src="/logo.png" alt="MediCareX" className="w-full h-full object-cover scale-110" />
          </div>
        )}

        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-blue-200 hover:text-white hover:bg-blue-600 transition shrink-0"
          >
            <MdChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Expand chevron when collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="mx-auto mt-3 flex items-center justify-center w-8 h-8 rounded-lg text-blue-200 hover:text-white hover:bg-blue-600 transition"
        >
          <MdChevronRight size={18} />
        </button>
      )}

      {/* Section label */}
      {!isCollapsed && (
        <p className="px-4 pt-5 pb-2 text-[10px] font-bold uppercase tracking-widest text-blue-300/70 select-none">
          Navigation
        </p>
      )}

      {/* Nav items */}
      <nav className="flex-1 py-1 px-2 overflow-y-auto flex flex-col gap-0.5">
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === "/supplier"}
            title={isCollapsed ? item.text : undefined}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline transition-all duration-200 group
              ${isActive
                ? "bg-white/20 text-white"
                : "text-blue-100/80 hover:bg-white/10 hover:text-white"
              }
              ${isCollapsed ? "justify-center" : ""}`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator bar */}
                {isActive && !isCollapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-amber-400 rounded-r-full" />
                )}
                <span className="shrink-0">{item.icon}</span>
                {!isCollapsed && (
                  <span className={`text-[13.5px] whitespace-nowrap ${isActive ? "font-semibold" : "font-medium"}`}>
                    {item.text}
                  </span>
                )}
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-blue-900 border border-blue-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-xl z-50">
                    {item.text}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2 py-3 border-t border-blue-600/60 shrink-0">
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={`group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
            text-blue-200 bg-transparent border-none cursor-pointer font-medium
            transition hover:bg-red-500/20 hover:text-red-300
            ${isCollapsed ? "justify-center" : ""}`}
        >
          <MdLogout size={20} className="shrink-0" />
          {!isCollapsed && (
            <span className="text-[13.5px]">Logout</span>
          )}
          {isCollapsed && (
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-blue-900 border border-blue-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-xl z-50">
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );
}