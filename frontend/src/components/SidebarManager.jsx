import { NavLink } from "react-router-dom";
const Item = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition ${
        isActive ? "bg-primary-100 text-primary-700" : "text-white/90 hover:bg-white/10"
      }`
    }
  >{children}</NavLink>
);

export default function SidebarManager() {
  return (
    <aside className="w-72 bg-primary-700 text-white min-h-screen p-4 sticky top-0">
      <div className="mb-4 font-semibold opacity-90">Quản lý chung</div>
      <div className="flex flex-col gap-2">
        <Item to="/manager">Tổng quan</Item>
        <Item to="/manager/users">Người dùng & quyền</Item>
        <Item to="/manager/logs">Nhật ký hệ thống</Item>
        <Item to="/manager/settings">Cấu hình</Item>
        <Item to="/manager/reports">Báo cáo</Item>
      </div>
    </aside>
  );
}
