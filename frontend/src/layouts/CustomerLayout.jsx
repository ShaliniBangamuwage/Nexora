import { useTheme } from "../context/ThemeContext";
import CustomerNavbar from "../components/CustomerNavbar";
import CustomerFooter from "../components/CustomerFooter";
import { Outlet } from "react-router-dom";

export default function CustomerLayout() {
  const { isDarkMode } = useTheme();

  return (
    <div 
      className="flex flex-col min-h-screen w-full"
      style={{ 
        background: 'var(--bg-primary)', 
        color: 'var(--text-primary)',
        transition: 'background-color 0.3s ease, color 0.3s ease'
      }}
    >
      <CustomerNavbar />
      <main className="flex-1 p-5 w-full">
        <Outlet />
      </main>
      <CustomerFooter />
    </div>
  );
}