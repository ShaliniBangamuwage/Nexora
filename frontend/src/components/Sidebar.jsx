import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  MdDashboard,
  MdPeople,
  MdInventory,
  MdShoppingCart,
  MdNotifications,
  MdLogout,
  MdChevronLeft,
  MdChevronRight,
  MdMenu,
  MdClose,
} from "react-icons/md";

const navGroups = [
  {
    label: "Overview",
    items: [
      { id: 1, icon: MdDashboard, text: "Dashboard", path: "/admin", end: true },
    ],
  },
  {
    label: "Management",
    items: [
      { id: 2, icon: MdPeople,       text: "Customers", path: "/admin/users" },
      { id: 3, icon: MdInventory,    text: "Catalog & Inventory", path: "/admin/catalog" },
      { id: 4, icon: MdShoppingCart, text: "Store Orders", path: "/admin/orders" },
    ],
  },
  {
    label: "System",
    items: [
      { id: 5, icon: MdNotifications, text: "Notifications", path: "/admin/notifications" },
    ],
  },
];

const allItems = navGroups.flatMap((g) => g.items);

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const closeMobile = () => setIsMobileOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      navigate('/login');
      closeMobile();
    }
  };

  const SidebarContent = ({ mobile = false }) => (
    <div
      className={`
        flex flex-col h-full
        bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800
        ${!mobile && "shadow-[4px_0_24px_rgba(37,99,235,0.4)]"}
      `}
    >
      {/* ── Brand Header ── */}
      <div
        className={`
          flex items-center h-16 px-3 flex-shrink-0
          border-b border-white/10
          ${isCollapsed && !mobile ? "justify-center" : "justify-between"}
        `}
      >
        {/* Logo + Name */}
        <div className={`flex items-center gap-3 min-w-0 ${isCollapsed && !mobile ? "hidden" : "flex"}`}>
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white shadow-sm flex items-center justify-center border-2 border-white/20">
            <span className="text-[11px] font-black tracking-wide text-blue-800">NX</span>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-white leading-tight tracking-tight truncate">
              NEXORA
            </p>
            <p className="text-[9.5px] font-semibold text-white/45 uppercase tracking-[0.13em] mt-0.5">
              Admin Portal
            </p>
          </div>
        </div>

        {/* Collapsed logo only (desktop) */}
        {isCollapsed && !mobile && (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white shadow-sm flex items-center justify-center border-2 border-white/20">
            <span className="text-[11px] font-black tracking-wide text-blue-800">NX</span>
          </div>
        )}

        {/* Desktop collapse button */}
        {!isCollapsed && !mobile && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                       text-white/45 hover:text-white hover:bg-white/15
                       transition-all duration-150 border-none bg-transparent cursor-pointer"
          >
            <MdChevronLeft size={17} />
          </button>
        )}

        {/* Mobile close button */}
        {mobile && (
          <button
            onClick={closeMobile}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                       text-white/45 hover:text-white hover:bg-white/15
                       transition-all duration-150 border-none bg-transparent cursor-pointer"
          >
            <MdClose size={20} />
          </button>
        )}
      </div>

      {/* Expand button (collapsed desktop state) */}
      {isCollapsed && !mobile && (
        <div className="flex justify-center mt-3">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       text-white/45 hover:text-white hover:bg-white/15
                       transition-all duration-150 border-none bg-transparent cursor-pointer"
          >
            <MdChevronRight size={17} />
          </button>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-0.5
                      [&::-webkit-scrollbar]:w-[3px]
                      [&::-webkit-scrollbar-thumb]:rounded-full
                      [&::-webkit-scrollbar-thumb]:bg-white/20
                      [&::-webkit-scrollbar-track]:bg-transparent">

        {isCollapsed && !mobile
          /* ── Collapsed: icons only with tooltip ── */
          ? allItems.map(({ id, icon: Icon, text, path, end }) => (
              <NavLink
                key={id}
                to={path}
                end={end}
                className={({ isActive }) => `
                  group relative flex items-center justify-center
                  rounded-xl p-2.5 w-full no-underline
                  transition-all duration-150
                  ${isActive
                    ? "bg-white/20 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <Icon size={19} className="flex-shrink-0" />
                <span className="
                  pointer-events-none absolute left-full ml-3
                  px-2.5 py-1.5 rounded-lg text-[12px] font-medium
                  bg-blue-900 text-blue-100 whitespace-nowrap
                  border border-white/15 shadow-lg
                  opacity-0 translate-x-1
                  group-hover:opacity-100 group-hover:translate-x-0
                  transition-all duration-150 z-50
                ">
                  {text}
                </span>
              </NavLink>
            ))

          /* ── Expanded: grouped list ── */
          : navGroups.map((group, gi) => (
              <div key={gi}>
                {gi > 0 && <div className="h-px bg-white/10 my-2 mx-1" />}
                <p className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/38">
                  {group.label}
                </p>
                {group.items.map(({ id, icon: Icon, text, path, end }) => (
                  <NavLink
                    key={id}
                    to={path}
                    end={end}
                    onClick={mobile ? closeMobile : undefined}
                    className={({ isActive }) => `
                      group relative flex items-center gap-2.5
                      rounded-xl px-3 py-2.5 w-full no-underline mb-0.5
                      transition-all duration-150
                      ${isActive
                        ? "bg-white/20 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`
                            absolute left-0 top-1/2 -translate-y-1/2
                            w-[3px] h-[18px] rounded-r-full bg-white/80
                            transition-opacity duration-150
                            ${isActive ? "opacity-100" : "opacity-0"}
                          `}
                        />
                        <Icon
                          size={18}
                          className={`flex-shrink-0 transition-colors duration-150
                            ${isActive ? "text-white" : "text-white/65 group-hover:text-white"}`}
                        />
                        <span
                          className={`text-[13px] font-medium whitespace-nowrap leading-none
                            ${isActive ? "text-white" : "text-white/78 group-hover:text-white"}`}
                        >
                          {text}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
      </nav>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 border-t border-white/10 px-2 py-2">
        <button
          onClick={handleLogout}
          className={`
            group relative flex items-center gap-2.5 w-full
            rounded-xl px-3 py-2.5
            text-white/55 hover:text-red-300 hover:bg-red-500/15
            transition-all duration-150 cursor-pointer bg-transparent border-none
            ${isCollapsed && !mobile ? "justify-center" : ""}
          `}
        >
          <MdLogout
            size={18}
            className="flex-shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5"
          />
          {(!isCollapsed || mobile) && (
            <span className="text-[13px] font-medium">Logout</span>
          )}
          {isCollapsed && !mobile && (
            <span className="
              pointer-events-none absolute left-full ml-3
              px-2.5 py-1.5 rounded-lg text-[12px] font-medium
              bg-blue-900 text-blue-100 whitespace-nowrap
              border border-white/15 shadow-lg
              opacity-0 translate-x-1
              group-hover:opacity-100 group-hover:translate-x-0
              transition-all duration-150 z-50
            ">
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile Hamburger Button ── */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50
                   w-10 h-10 rounded-xl flex items-center justify-center
                   bg-blue-600 text-white shadow-lg
                   border-none cursor-pointer"
      >
        <MdMenu size={22} />
      </button>

      {/* ── Mobile Overlay ── */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobile}
        />
      )}

      {/* ── Mobile Drawer ── */}
      <div
        className={`
          md:hidden fixed top-0 left-0 h-screen w-[256px] z-50
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <SidebarContent mobile={true} />
      </div>

      {/* ── Desktop Sidebar ── */}
      <div
        className={`
          hidden md:flex flex-col
          ${isCollapsed ? "w-[72px]" : "w-[256px]"}
          h-screen fixed left-0 top-0 z-40
          transition-all duration-300 ease-in-out
        `}
      >
        <SidebarContent mobile={false} />
      </div>
    </>
  );
}