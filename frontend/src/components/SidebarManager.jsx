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

const Section = ({ title, children }) => (
  <div className="mb-6">
    <div className="mb-2 font-semibold opacity-90">{title}</div>
    <div className="flex flex-col gap-2">
      {children}
    </div>
  </div>
);

export default function SidebarManager() {
  return (
    <aside className="w-72 bg-primary-700 text-white min-h-screen p-4 sticky top-0">
      <div className="mb-6">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Logo" className="h-9 w-9" />
          <span className="font-bold text-white">Hoa Học Trò</span>
        </Link>
      </div>
      <Section title="Quản lý chung">
        <Item to="/manager">Tổng quan</Item>
      </Section>
      <Section title="Quản lý tài khoản thí sinh">
        <Item to="/manager/students">Quản lý thí sinh</Item>
      </Section>
      <Section title="Quản lý nhân sự">
        <Item to="/manager/staff">Quản lý nhân sự</Item>
        <Item to="/manager/consultant-calendar">Lịch tư vấn</Item>
      </Section>
      <Section title="Quản lý nội dung">
        <Item to="/manager/news-approval">Phê duyệt tin tuyển sinh</Item>
      </Section>
    </aside>
  );
}
