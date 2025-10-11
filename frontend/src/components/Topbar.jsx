import { Link, useNavigate } from "react-router-dom";

export default function Topbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="font-semibold text-gray-800">Xin chào, {user?.hoten}</div>
      <div className="flex items-center gap-3">
        <button className="px-3 py-2 rounded-full bg-gray-100 text-gray-700">🔔</button>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary-600 text-white grid place-items-center font-bold">
            {user?.hoten?.slice(0,1) || "U"}
          </div>
          <div className="text-sm">
            <div className="font-medium">{user?.hoten}</div>
            <div className="text-gray-500">{user?.email}</div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
