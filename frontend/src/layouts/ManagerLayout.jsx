import { NavLink, Outlet } from "react-router-dom";
import Topbar from "../components/Topbar.jsx";

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
      <div className="flex-1 flex flex-col">
        <Topbar />
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
