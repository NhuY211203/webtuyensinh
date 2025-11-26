import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Settings, HelpCircle, User, Menu, X } from "lucide-react";
import api from "../services/api";

export default function Topbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userRemote, setUserRemote] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) setNotificationsOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Fetch notifications
  useEffect(() => {
    async function loadNotifications() {
      setLoading(true);
      try {
        const response = await api.getMyNotifications();
        if (response.success) {
          setNotifications(response.data || []);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, []);

  // Fetch user info from API (merge with local storage)
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/users').catch(() => fetch('http://127.0.0.1:8000/api/users'));
        if (!mounted || !res?.ok) return;
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
        const byEmail = user?.email ? list.find(u => (u.email || '').toLowerCase() === String(user.email).toLowerCase()) : null;
        const byAccount = byEmail || (user?.taikhoan ? list.find(u => String(u.taikhoan).toLowerCase() === String(user.taikhoan).toLowerCase()) : null);
        if (byAccount) setUserRemote(byAccount);
      } catch (_) {
        // ignore silently
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.markNotificationAsRead(notificationId);
      // Refresh notifications
      const response = await api.getMyNotifications();
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.da_doc).length;

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" 
              aria-label="Thông báo"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-amber-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Thông báo</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      Đang tải...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p>Không có thông báo nào</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.idthongbao} 
                          className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => handleMarkAsRead(notification.idthongbao)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {notification.tieude}
                              </p>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {notification.noidung}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {new Date(notification.ngaytao).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            {!notification.da_doc && (
                              <span className="ml-2 flex-shrink-0 w-2 h-2 bg-amber-500 rounded-full"></span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 hover:shadow-sm"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <div className="grid place-content-center h-8 w-8 rounded-full bg-emerald-600 text-white font-semibold">
                {((userRemote?.hoten || user?.hoten || user?.taikhoan || 'U')[0] || 'U').toUpperCase()}
              </div>
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
              >
                <MenuItem icon={LogOut} text="Đăng xuất" danger onClick={handleLogout} />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuItem({ icon: Icon, text, danger = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 ${danger ? "text-rose-600" : "text-slate-700"}`}
      role="menuitem"
    >
      <Icon className="w-4 h-4" />
      <span>{text}</span>
    </button>
  );
}
