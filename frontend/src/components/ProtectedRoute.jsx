import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Nếu chưa đăng nhập
  if (!user.id) {
    return <Navigate to="/login" replace />;
  }
  
  // Nếu vai trò không được phép truy cập
  if (allowedRoles && !allowedRoles.includes(user.vaitro)) {
    // Redirect về trang phù hợp với vai trò
    switch (user.vaitro) {
      case 'Thành viên':
        return <Navigate to="/dashboard" replace />;
      case 'Tư vấn viên':
        return <Navigate to="/consultant" replace />;
      case 'Người phụ trách':
        return <Navigate to="/staff" replace />;
      case 'Admin':
        return <Navigate to="/manager" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }
  
  return children;
}
