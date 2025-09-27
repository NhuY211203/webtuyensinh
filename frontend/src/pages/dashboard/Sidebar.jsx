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

export default function Sidebar() {
  return (
    <aside className="w-72 bg-primary-700 text-white min-h-screen p-4 sticky top-0">
      <div className="mb-4 font-semibold opacity-90">Bảng điều khiển</div>
      <div className="flex flex-col gap-2">
        <Item to="/dashboard">Tổng quan</Item>
        <Item to="/dashboard/trends">Thống kê xu hướng</Item>
        <Item to="/dashboard/application">Phiếu đăng ký</Item>
        <Item to="/dashboard/notifications">Nhận thông báo</Item>
        <Item to="/dashboard/search">Tra cứu nhanh</Item>
        <Item to="/dashboard/payments">Thanh toán</Item>
        <Item to="/dashboard/appointments">Lịch tư vấn</Item>
        <Item to="/dashboard/certificates">Chứng chỉ ngoại ngữ</Item>
      </div>
    </aside>
  );
}
