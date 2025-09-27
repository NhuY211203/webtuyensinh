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

export default function SidebarStaff() {
  return (
    <aside className="w-72 bg-primary-700 text-white min-h-screen p-4 sticky top-0">
      <div className="mb-4 font-semibold opacity-90">Người phụ trách</div>
      <div className="flex flex-col gap-2">
        <Item to="/staff">Yêu cầu tư vấn</Item>
        <Item to="/staff/assign">Phân công chuyên gia</Item>
        <Item to="/staff/calendar">Lịch hệ thống</Item>
        <Item to="/staff/notifications">Gửi thông báo/nhắc lịch</Item>
        <Item to="/staff/experts">Quản lý chuyên gia</Item>
      </div>
    </aside>
  );
}
