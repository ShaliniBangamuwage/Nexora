import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="flex">
      <Sidebar />

      {/* On mobile: no left margin (sidebar is a drawer overlay)
          On desktop: push content right of the sidebar */}
      <div className="w-full md:ml-[256px] transition-all duration-300">
        <Header />
        <main className="p-4 md:p-5 bg-[#f5f7fb] min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}