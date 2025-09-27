import { NavLink, Outlet } from "react-router-dom";

export default function ManagerLayout() {
  const link =
    "block px-4 py-2 rounded-lg transition hover:bg-[#1bb6a2]/20 text-white hover:text-white";
  const active =
    "bg-white/80 text-[#168886] font-semibold";

  return (
    <div className="min-h-screen flex">
      {/* SIDEBAR */}
      <aside className="w-72 bg-primary-700 text-white min-h-screen p-4 sticky top-0">
        <h2 className="text-lg font-semibold mb-4">Quản lý chung</h2>
        <nav className="space-y-2">
          <NavLink end to="/manager" className={({isActive})=>`${link} ${isActive?active:""}`}>Tổng quan</NavLink>
          <NavLink to="/manager/users" className={({isActive})=>`${link} ${isActive?active:""}`}>Người dùng & quyền</NavLink>
          <NavLink to="/manager/logs" className={({isActive})=>`${link} ${isActive?active:""}`}>Nhật ký hệ thống</NavLink>
          <NavLink to="/manager/settings" className={({isActive})=>`${link} ${isActive?active:""}`}>Cấu hình</NavLink>
          <NavLink to="/manager/reports" className={({isActive})=>`${link} ${isActive?active:""}`}>Báo cáo</NavLink>
        </nav>
      </aside>

      {/* MAIN */}
      <div className="flex-1">
        {/* Topbar */}
        <div className="h-16 border-b flex items-center justify-between px-6 bg-white/80 backdrop-blur">
          <div className="text-black font-medium">Xin chào, Nguyễn Quốc Bảo</div>
          <div className="flex items-center gap-3">
            <input
              placeholder="Tìm nhanh (user, log, báo cáo...)"
              className="hidden md:block rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500"
            />
            <button className="relative h-9 w-9 rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100">
              🔔
              <span className="absolute -top-1 -right-1 text-[10px] bg-red-500 text-white rounded-full px-1">3</span>
            </button>
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


// import Topbar from "../components/Topbar.jsx";
// import { Outlet } from "react-router-dom";
// import SidebarManager from "../components/SidebarManager.jsx";

// export default function ManagerLayout() {
//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="flex">
//         <SidebarManager />
//         <div className="flex-1 flex flex-col">
//           <Topbar />
//           <div className="p-6 max-w-6xl">
//             <Outlet />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
