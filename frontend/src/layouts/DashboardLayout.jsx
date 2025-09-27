import Topbar from "../components/Topbar.jsx";
import { Outlet } from "react-router-dom";
import Sidebar from "../pages/dashboard/Sidebar.jsx";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <div className="p-6 max-w-6xl">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
