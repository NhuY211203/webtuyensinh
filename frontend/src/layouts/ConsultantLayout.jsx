import Topbar from "../components/Topbar.jsx";
import { Outlet } from "react-router-dom";
import SidebarConsultant from "../components/SidebarConsultant.jsx";

export default function ConsultantLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <SidebarConsultant />
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
