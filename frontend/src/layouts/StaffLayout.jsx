
import { useState } from "react";
import { Outlet } from "react-router-dom";
import SidebarStaff from "../components/SidebarStaff.jsx";
import Topbar from "../components/Topbar.jsx";
import StaffChatBox from "../components/StaffChatBox.jsx";

export default function StaffLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Sidebar cho Staff */}
      <SidebarStaff />
      
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

      {/* Staff Chat Box */}
      <StaffChatBox />
    </div>
  );
}
