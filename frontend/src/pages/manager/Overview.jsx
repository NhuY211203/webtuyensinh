import { useState, useEffect } from "react";

export default function ManagerOverview() {
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    new_users_week: 0,
    success_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    async function loadStats() {
      try {
        const res = await fetch("/api/admin-stats").catch(() =>
          fetch("http://127.0.0.1:8000/api/admin-stats")
        );
        
        if (!isMounted) return;
        
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStats(data.data);
          }
        } else {
          setError("Không thể tải thống kê");
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error loading stats:", err);
        setError("Lỗi kết nối");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    loadStats();
    return () => { isMounted = false; };
  }, []);

  const cards = [
    { title: "Tổng user", value: stats.total_users.toLocaleString() },
    { title: "Người dùng hoạt động", value: stats.active_users.toLocaleString() },
    { title: "Tỷ lệ thành công", value: `${stats.success_rate}%` },
    { title: "Người dùng mới/tuần", value: stats.new_users_week.toLocaleString() },
  ];

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Tổng quan hệ thống</h1>
        <div className="grid md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Tổng quan hệ thống</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Tổng quan hệ thống</h1>
      <div className="grid md:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="text-2xl font-semibold text-teal-700">{c.value}</div>
            <div className="text-gray-500">{c.title}</div>
            <div className="mt-3 h-2 rounded bg-teal-50">
              <div className="h-2 rounded bg-teal-500" style={{width: `${Math.min((i+1)*25, 100)}%`}}/>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="font-semibold mb-2">Xu hướng điểm chuẩn 5 năm</div>
          <div className="h-48 rounded-xl bg-gradient-to-r from-teal-50 to-white border border-dashed border-teal-200 flex items-center justify-center text-gray-500">
            (Chèn chart thật sau)
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="font-semibold mb-2">Tải hệ thống gần đây</div>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>10:30 – Cập nhật dữ liệu ĐH BK</li>
            <li>10:12 – User đăng nhập</li>
            <li>09:50 – Cron crawl dữ liệu</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
