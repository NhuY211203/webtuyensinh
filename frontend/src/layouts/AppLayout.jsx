import { useState } from "react";
import { Outlet } from "react-router-dom";
import CollapsibleSidebar from "../components/CollapsibleSidebar.jsx";
import Footer from "./Footer.jsx";
import Topbar from "../components/Topbar.jsx";
import FloatingChatIcon from "../components/FloatingChatIcon.jsx";

export default function AppLayout() {
  // chiều rộng khi mở/thu sidebar
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Topbar */}
      <Topbar onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Main content area */}
      <div className="flex flex-1">
        {/* Sidebar sticky */}
        <div className={`${collapsed ? 'w-16' : 'w-64'} shrink-0`}>
          <CollapsibleSidebar 
            collapsed={collapsed} 
            setCollapsed={setCollapsed}
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Nội dung chính */}
          <main className="min-h-screen p-6">
            <div className="max-w-5xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Footer - đặt ngoài để không bị sidebar che */}
      <Footer />

      {/* Floating Chat Icon */}
      <FloatingChatIcon />
    </div>
  );
}
