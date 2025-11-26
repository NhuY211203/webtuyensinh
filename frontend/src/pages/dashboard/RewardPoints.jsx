import { useEffect, useState } from 'react';
import { useToast } from '../../components/Toast';

export default function RewardPoints() {
  const [points, setPoints] = useState([]);
  const [summary, setSummary] = useState({
    tong_diem: 0,
    tong_diem_chua_dung: 0,
    tong_diem_da_dung: 0,
    so_luong_chua_dung: 0,
    so_luong_da_dung: 0,
  });
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchRewardPoints();
  }, []);

  const fetchRewardPoints = async () => {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
      const storedUserRaw = window.localStorage.getItem('user') || sessionStorage.getItem('user') || '{}';
      let parsedUser = {};
      try { parsedUser = JSON.parse(storedUserRaw || '{}'); } catch { parsedUser = {}; }
      const resolvedUserId = parsedUser.idnguoidung || parsedUser.id || window.localStorage.getItem('user_id') || sessionStorage.getItem('user_id') || 0;
      const userId = Number(resolvedUserId) || 0;

      const response = await fetch(`${API_BASE}/api/my-reward-points?user_id=${userId}`);
      const data = await response.json();

      if (data.success) {
        setPoints(data.data || []);
        setSummary(data.summary || {
          tong_diem: 0,
          tong_diem_chua_dung: 0,
          tong_diem_da_dung: 0,
          so_luong_chua_dung: 0,
          so_luong_da_dung: 0,
        });
      } else {
        toast.push({ type: 'error', title: data.message || 'Không thể tải điểm đổi thưởng' });
      }
    } catch (err) {
      console.error('Error loading reward points:', err);
      toast.push({ type: 'error', title: 'Lỗi kết nối' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Điểm đổi thưởng</h1>

      {/* Tổng hợp điểm */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Tổng điểm</p>
              <p className="text-3xl font-bold">{summary.tong_diem.toLocaleString()}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Điểm chưa sử dụng</p>
              <p className="text-3xl font-bold">{summary.tong_diem_chua_dung.toLocaleString()}</p>
              <p className="text-green-100 text-xs mt-1">{summary.so_luong_chua_dung} điểm</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm mb-1">Điểm đã sử dụng</p>
              <p className="text-3xl font-bold">{summary.tong_diem_da_dung.toLocaleString()}</p>
              <p className="text-gray-100 text-xs mt-1">{summary.so_luong_da_dung} điểm</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách điểm */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Lịch sử điểm đổi thưởng</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : points.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Bạn chưa có điểm đổi thưởng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-4">Số điểm</th>
                  <th className="text-left p-4">Trạng thái</th>
                  <th className="text-left p-4">Ngày nhận</th>
                  <th className="text-left p-4">Lịch tư vấn</th>
                  <th className="text-left p-4">Người tạo</th>
                </tr>
              </thead>
              <tbody>
                {points.map((point) => (
                  <tr key={point.iddiem_boi_duong} className="border-t hover:bg-gray-50">
                    <td className="p-4">
                      <span className="font-semibold text-blue-600 text-lg">
                        +{point.so_diem.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          point.trang_thai === 1
                            ? 'bg-green-100 text-green-700'
                            : point.trang_thai === 2
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {point.trang_thai_text}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{point.ngay_tao_formatted}</td>
                    <td className="p-4">
                      {point.lichtuvan ? (
                        <div>
                          <div className="font-medium text-gray-800">
                            {point.lichtuvan.tieude || 'Lịch tư vấn'}
                          </div>
                          {point.lichtuvan.ngayhen && (
                            <div className="text-xs text-gray-500">
                              Ngày: {point.lichtuvan.ngayhen}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {point.nguoi_tao ? (
                        <span className="text-gray-600">{point.nguoi_tao.hoten}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Thông tin bổ sung */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Thông tin về điểm đổi thưởng:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Điểm được trao khi lịch tư vấn của bạn bị thay đổi</li>
              <li>Bạn có thể sử dụng điểm để đổi các dịch vụ và ưu đãi</li>
              <li>Điểm không có thời hạn sử dụng</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

