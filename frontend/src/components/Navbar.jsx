
import { Link, NavLink } from "react-router-dom";

const NavItem = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `px-3 py-2 rounded-full text-sm font-medium ${
        isActive ? "bg-primary-100 text-primary-700" : "text-gray-700 hover:bg-gray-100"
      }`
    }
  >
    {children}
  </NavLink>
);

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/logo.svg" 
            alt="Hoa học trò" 
            className="h-12 w-12 object-contain"
          />
          <span className="font-bold text-gray-900 text-2xl">Hoa Học Trò</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <NavItem to="/">Trang chủ</NavItem>
          <NavItem to="/search">Tìm kiếm</NavItem>
          <NavItem to="/news">Tin tức</NavItem>
          {/* <NavItem to="/admin/programs">Quản trị</NavItem> */}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="px-3 py-2 text-sm text-primary-700 hover:bg-primary-50 rounded-full">Đăng nhập</Link>
          <Link to="/register" className="btn-primary">Đăng ký</Link>
        </div>
      </div>
    </header>
  );
}


// import { Link, NavLink } from "react-router-dom";
// import { useData } from "../context/DataContext.jsx";

// const NavItem = ({ to, children }) => (
//   <NavLink
//     to={to}
//     className={({ isActive }) =>
//       `px-3 py-2 rounded-full text-sm font-medium ${
//         isActive ? "bg-primary-100 text-primary-700" : "text-gray-700 hover:bg-gray-100"
//       }`
//     }
//   >
//     {children}
//   </NavLink>
// );

// export default function Navbar() {
//   const { user } = useData();
//   return (
//     <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
//       <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
//         <Link to="/" className="flex items-center gap-2">
//           <div className="h-9 w-9 rounded-xl bg-primary-600 grid place-items-center text-white font-bold">AP</div>
//           <span className="font-semibold">Tuyển Sinh</span>
//         </Link>
//         <nav className="hidden md:flex items-center gap-1">
//           <NavItem to="/">Trang chủ</NavItem>
//           <NavItem to="/search">Tìm kiếm</NavItem>
//         </nav>
//         <div className="flex items-center gap-2">
//           {user ? (
//             <Link to="/dashboard" className="px-3 py-2 rounded-full bg-primary-50 text-primary-700">
//               Xin chào, <b>{user.name.split(" ").slice(-1).join("")}</b>
//             </Link>
//           ) : (
//             <>
//               <Link to="/login" className="px-3 py-2 text-sm text-primary-700 hover:bg-primary-50 rounded-full">Đăng nhập</Link>
//               <Link to="/register" className="btn-primary">Đăng ký</Link>
//             </>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// }
