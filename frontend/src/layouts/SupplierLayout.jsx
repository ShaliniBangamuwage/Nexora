import { useState } from "react";
import SidebarSUP from "../components/SidebarSUP";
import HeaderSUP from "../components/HeaderSUP";
import { Outlet } from "react-router-dom";

export default function SupplierLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex">
      <SidebarSUP 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
      />

      <div className={`w-full transition-all duration-300 ${
        isCollapsed ? "md:ml-[72px]" : "md:ml-[240px]"
      }`}>
        <HeaderSUP 
          isCollapsed={isCollapsed} 
          setIsMobileOpen={setIsMobileOpen} 
        />
        <main className="px-4 md:px-6 pb-6 pt-[92px] bg-[#f0f4fb] min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
