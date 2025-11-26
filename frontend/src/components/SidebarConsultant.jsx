import { NavLink, Link } from "react-router-dom";

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

export default function SidebarConsultant() {
  return (
    <aside className="w-72 bg-primary-700 text-white min-h-screen p-4 sticky top-0">
      <div className="mb-6">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Logo" className="h-9 w-9" />
          <span className="font-bold text-white">Hoa Học Trò</span>
        </Link>
      </div>
      <div className="mb-4 font-semibold opacity-90">Chuyên gia tư vấn</div>
      <div className="flex flex-col gap-2">
        <Item to="/consultant">Tổng quan</Item>
        <Item to="/consultant/schedule">Lịch của tôi</Item>
        <Item to="/consultant/meetings">Phòng họp / Link</Item>
        <Item to="/consultant/notes">Ghi chú sau buổi</Item>
        <Item to="/consultant/candidates">Hồ sơ thí sinh</Item>
      </div>
    </aside>
  );
}
