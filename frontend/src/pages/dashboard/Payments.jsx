import { useEffect, useState } from 'react';

export default function Payments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
    // Prefer user object -> idnguoidung/id; fallback to user_id keys; finally 0
    const storedUserRaw = window.localStorage.getItem('user') || sessionStorage.getItem('user') || '{}';
    let parsedUser = {};
    try { parsedUser = JSON.parse(storedUserRaw || '{}'); } catch { parsedUser = {}; }
    const resolvedUserId = parsedUser.idnguoidung || parsedUser.id || window.localStorage.getItem('user_id') || sessionStorage.getItem('user_id') || 0;
    const userId = Number(resolvedUserId) || 0;

    fetch(`${API_BASE}/api/payments/history?userId=${userId}`)
      .then(async r => {
        try { return await r.json(); } catch { return { success:false }; }
      })
      .then(res => {
        if (res?.success) setRows(res.data || []);
        else console.warn('payments/history response', res);
      })
      .catch(err => console.error('payments/history error', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Lịch sử thanh toán</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3">Mã giao dịch</th>
              <th className="text-left p-3">Ngày thanh toán</th>
              <th className="text-right p-3">Số tiền (₫)</th>
              <th className="text-left p-3">Phương thức</th>
              <th className="text-center p-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="p-3" colSpan={5}>Đang tải...</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td className="p-3" colSpan={5}>Chưa có giao dịch</td></tr>
            )}
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-3">{r.ma_giao_dich}</td>
                <td className="p-3">{r.ngay_thanh_toan || '-'}</td>
                <td className="p-3 text-right">{Number(r.so_tien || 0).toLocaleString()}</td>
                <td className="p-3">{r.phuong_thuc}</td>
                <td className="p-3 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs ${r.trang_thai==='Đã thanh toán'?'bg-green-100 text-green-700': r.trang_thai==='Thất bại'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>{r.trang_thai}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
