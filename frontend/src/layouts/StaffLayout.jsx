
import { NavLink, Outlet } from "react-router-dom";

export default function StaffLayout() {
  const link =
    "block px-4 py-2 rounded-lg transition hover:bg-[#1bb6a2]/20 text-white hover:text-white";
  const active =
    "bg-white/80 text-[#168886] font-semibold";

  return (
    <div className="min-h-screen flex">
      {/* SIDEBAR */}
  <aside className="w-72 bg-primary-700 text-white min-h-screen p-4 sticky top-0">
  <h2 className="text-lg font-semibold mb-4">Người phụ trách</h2>
        <nav className="space-y-2">
          <NavLink end to="/staff" className={({isActive})=>`${link} ${isActive?active: ""}`}>Yêu cầu tư vấn</NavLink>
          <NavLink to="/staff/assign" className={({isActive})=>`${link} ${isActive?active: ""}`}>Phân công chuyên gia</NavLink>
          <NavLink to="/staff/calendar" className={({isActive})=>`${link} ${isActive?active: ""}`}>Lịch hệ thống</NavLink>
          <NavLink to="/staff/notifications" className={({isActive})=>`${link} ${isActive?active: ""}`}>Gửi thông báo/nhắc lịch</NavLink>
          <NavLink to="/staff/consultants" className={({isActive})=>`${link} ${isActive?active: ""}`}>Quản lý chuyên gia</NavLink>
        </nav>
      </aside>

      {/* MAIN */}
      <div className="flex-1">
        {/* Topbar gọn */}
        <div className="h-16 border-b flex items-center justify-between px-6 bg-white/80 backdrop-blur">
          <div className="text-black font-medium">Xin chào, Nguyễn Quốc Bảo</div>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-white font-semibold">N</span>
            <div className="text-sm">
              <div className="font-semibold">Nguyễn Quốc Bảo</div>
              <div className="text-gray-500">bao@example.com</div>
            </div>
          </div>
        </div>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
