import { NavLink, Link } from "react-router-dom";

const link =
  "block px-4 py-2 rounded-lg transition hover:bg-[#1bb6a2]/20 text-white hover:text-white";
const active = "bg-white/80 text-[#168886] font-semibold";

export default function SidebarAnalyst() {
  return (
    <aside className="w-72 bg-primary-700 text-white min-h-screen p-4 sticky top-0">
      <div className="mb-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-orange-500 grid place-items-center text-white font-bold shadow-sm">VN</div>
          <span className="font-bold text-white">Tuyển Sinh</span>
        </Link>
      </div>
      <nav className="space-y-2">
        <NavLink to="/analyst/data" className={({isActive})=>`${link} ${isActive?active:""}`}>
          Quản lý dữ liệu
        </NavLink>
        <NavLink to="/analyst/university" className={({isActive})=>`${link} ${isActive?active:""}`}>
          Cập nhật trường đại học
        </NavLink>
        <NavLink to="/analyst/majors" className={({isActive})=>`${link} ${isActive?active:""}`}>
          Quản lý ngành học
        </NavLink>
        <NavLink to="/analyst/admission-majors" className={({isActive})=>`${link} ${isActive?active:""}`}>
          Quản lý ngành tuyển sinh
        </NavLink>
        <NavLink to="/analyst/admission-methods" className={({isActive})=>`${link} ${isActive?active:""}`}>
          Quản lý phương thức xét tuyển
        </NavLink>
        <NavLink to="/analyst/analysis" className={({isActive})=>`${link} ${isActive?active:""}`}>
          Phân tích và Dự báo
        </NavLink>
        <NavLink to="/analyst/posts" className={({isActive})=>`${link} ${isActive?active:""}`}>
          Đăng tin
        </NavLink>
      </nav>
    </aside>
  );
}