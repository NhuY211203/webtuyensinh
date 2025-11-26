import { useState } from "react";
import { Outlet } from "react-router-dom";
import SidebarConsultant from "../components/SidebarConsultant.jsx";
import Topbar from "../components/Topbar.jsx";
import FloatingChatIcon from "../components/FloatingChatIcon.jsx";

export default function ConsultantLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Sidebar cho Consultant */}
      <SidebarConsultant />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <Topbar />
        
        {/* Nội dung chính */}
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Chat Icon */}
      <FloatingChatIcon />
    </div>
  );
}
