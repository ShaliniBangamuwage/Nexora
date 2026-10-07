import Sidebar from './SidebarSUP';
import Header from './HeaderSUP';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 ml-[260px] flex flex-col">
        <Header />
        <main className="mt-[70px] p-6 min-h-[calc(100vh-70px)]">
          {children}
        </main>
      </div>
    </div>
  );
}