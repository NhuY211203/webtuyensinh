import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles, allowedRoleIds }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Nếu chưa đăng nhập
  if (!user.id) {
    return <Navigate to="/login" replace />;
  }
  
  // Nếu vai trò không được phép truy cập (theo tên hoặc theo id)
  const deniedByName = Array.isArray(allowedRoles) && !allowedRoles.includes(user.vaitro);
  const deniedById = Array.isArray(allowedRoleIds) && !allowedRoleIds.includes(user.idvaitro);
  if ((Array.isArray(allowedRoles) && deniedByName) || (Array.isArray(allowedRoleIds) && deniedById)) {
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
      case 'Nhân viên phân tích dữ liệu':
        return <Navigate to="/analyst" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }
  
  return children;
}
