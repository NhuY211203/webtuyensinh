import { Link, NavLink } from "react-router-dom";
import { useState } from "react";

export default function CollapsibleSidebar({ collapsed, setCollapsed, mobileOpen, onMobileClose }) {
  const [openSearch, setOpenSearch] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openRegistrationPayment, setOpenRegistrationPayment] = useState(true);
  const [openPredictionAdvising, setOpenPredictionAdvising] = useState(false);

  const MenuItem = ({ to, children, icon, isActive }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-md mx-1 my-1 hover:bg-white/10 transition-colors ${
          isActive ? "bg-white/20" : ""
        }`
      }
      title={children}
    >
      <span className="text-lg">{icon}</span>
      <span className={`${collapsed ? "hidden" : "block"} truncate`}>
        {children}
      </span>
    </NavLink>
  );

  const SubMenuItem = ({ to, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-6 py-2 rounded-md mx-1 my-1 hover:bg-white/10 transition-colors text-sm ${
          isActive ? "bg-white/20" : ""
        }`
      }
      title={children}
    >
      <span className={`${collapsed ? "hidden" : "block"} truncate`}>
        {children}
      </span>
    </NavLink>
  );

  const CollapsibleSection = ({ title, icon, isOpen, onToggle, children }) => (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-md mx-1 my-1 hover:bg-white/10 focus:outline-none transition-colors"
        title={title}
      >
        {/* icon trái */}
        <span className="text-lg shrink-0">{icon}</span>

        {/* text: co giãn, không đẩy mũi tên; cắt … nếu dài */}
        <span className={`${collapsed ? "hidden" : "flex-1 min-w-0 truncate text-left"}`}>
          {title}
        </span>

        {/* mũi tên: cố định mép phải */}
        {!collapsed && (
          <svg
            className={`ml-2 shrink-0 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
            width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
          >
            <path d="M7 10l5 5 5-5H7z" />
          </svg>
        )}
      </button>
      {!collapsed && isOpen && (
        <div className="ml-2">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <aside
      className={`
        bg-teal-700 text-white h-screen sticky top-0 z-40 mb-8
        transition-all duration-300
        overflow-y-auto overflow-x-hidden
        sidebar-scroll
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
    >
      {/* HEADER: logo bên trái + nút thu gọn bên phải */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-white/10">
        {/* Logo bên trái */}
        <div className="flex items-center gap-2">
          <Link to="/" className="inline-flex items-center justify-center">
            <img 
              src="/logo.svg" 
              alt="Hoa học trò" 
              className="h-8 w-8 object-contain"
            />
          </Link>
          {/* Tên app – ẩn khi thu gọn */}
          <span className={`text-base font-semibold transition-opacity ${collapsed ? "opacity-0 w-0" : "opacity-100"}`}>
            Hoa học trò
          </span>
        </div>

        {/* Nút thu gọn bên phải */}
        <div className="flex items-center gap-2">
          {/* Nút đóng mobile */}
          <button
            onClick={onMobileClose}
            className="lg:hidden shrink-0 p-2 rounded-md bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 transition-colors"
            aria-label="Đóng menu"
            title="Đóng"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>

          {/* Nút sổ/thu gọn – icon bullet list */}
          <button
            onClick={() => setCollapsed(v => !v)}
            className="hidden lg:block shrink-0 p-2 rounded-md bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 transition-colors"
            aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            title={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            {/* SVG icon 3 dòng: chấm tròn + thanh ngang bo tròn */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="6" r="2"></circle>
              <rect x="9" y="4.5" rx="1.5" ry="1.5" width="10" height="3"></rect>

              <circle cx="5" cy="12" r="2"></circle>
              <rect x="9" y="10.5" rx="1.5" ry="1.5" width="10" height="3"></rect>

              <circle cx="5" cy="18" r="2"></circle>
              <rect x="9" y="16.5" rx="1.5" ry="1.5" width="10" height="3"></rect>
            </svg>
          </button>
        </div>
      </div>

      {/* Menu */}
      <nav className="py-2">
        {/* Tin tức */}
        <MenuItem to="/dashboard/news" icon="📰">
          Tin tức
        </MenuItem>

        {/* Định hướng ngành */}
        <MenuItem to="/dashboard/career-test" icon="🧭">
          Định hướng ngành học
        </MenuItem>

        {/* Thi thử ĐGNL */}
        <MenuItem to="/dashboard/dgnl-practice" icon="📝">
          Thi thử đánh giá năng lực
        </MenuItem>

        {/* TRA CỨU */}
        <CollapsibleSection
          title="TRA CỨU"
          icon="📚"
          isOpen={openSearch}
          onToggle={() => setOpenSearch(!openSearch)}
        >
          <SubMenuItem to="/dashboard/search-trends">Tra cứu xu hướng ngành học</SubMenuItem>
          <SubMenuItem to="/dashboard/historic-scores">Tra cứu điểm chuẩn nhiều năm</SubMenuItem>
          <SubMenuItem to="/dashboard/admission-info">Tra cứu thông tin tuyển sinh</SubMenuItem>
          <SubMenuItem to="/dashboard/admission-projects">Tra cứu đề án tuyển sinh</SubMenuItem>
          <SubMenuItem to="/dashboard/calculate-transcript-score">Tính điểm xét học bạ THPT</SubMenuItem>
          <SubMenuItem to="/dashboard/calculate-graduation-score">Tính điểm tốt nghiệp THPT</SubMenuItem>
        </CollapsibleSection>

        {/* HỒ SƠ */}
        <CollapsibleSection
          title="HỒ SƠ"
          icon="🗂️"
          isOpen={openProfile}
          onToggle={() => setOpenProfile(!openProfile)}
        >
          <SubMenuItem to="/dashboard/profile">Hồ sơ cá nhân </SubMenuItem>
        </CollapsibleSection>

        {/* ĐĂNG KÝ & THANH TOÁN */}
        <CollapsibleSection
          title="ĐĂNG KÝ & THANH TOÁN"
          icon="💳"
          isOpen={openRegistrationPayment}
          onToggle={() => setOpenRegistrationPayment(!openRegistrationPayment)}
        >
          <SubMenuItem to="/dashboard/wishes">Hướng dẫn đăng ký nguyện vọng</SubMenuItem>
          <SubMenuItem to="/dashboard/payment-history">Lịch sử thanh toán</SubMenuItem>
          <SubMenuItem to="/dashboard/reward-points">Điểm đổi thưởng</SubMenuItem>
        </CollapsibleSection>

        {/* DỰ ĐOÁN & TƯ VẤN */}
        <CollapsibleSection
          title="DỰ ĐOÁN & TƯ VẤN"
          icon="🤖"
          isOpen={openPredictionAdvising}
          onToggle={() => setOpenPredictionAdvising(!openPredictionAdvising)}
        >
          <SubMenuItem to="/dashboard/predictions">Dự đoán & Đánh giá cơ hội</SubMenuItem>
          <SubMenuItem to="/dashboard/advising-chatbot">Các câu hỏi thường gặp</SubMenuItem>
          <SubMenuItem to="/dashboard/appointments">Đặt lịch tư vấn với chuyên gia</SubMenuItem>
        </CollapsibleSection>

        {/* KHÁC đã được xóa theo yêu cầu */}

      </nav>
    </aside>
  );
}