import { useState, useEffect } from "react";
import { useToast } from "../../components/Toast";

export default function Statistics() {
  const [statistics, setStatistics] = useState([]);
  const [summary, setSummary] = useState({
    tong_so_tu_van_vien: 0,
    tong_so_buoi_tu_van: 0,
    tong_doanh_thu: 0,
    tong_so_lan_thay_doi_lich: 0,
    tong_tien_cong: 0,
  });
  const [loading, setLoading] = useState(true);
  const [consultants, setConsultants] = useState([]);
  const toast = useToast();

  // Filters
  const [filters, setFilters] = useState({
    consultantId: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    fetchConsultants();
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [filters]);

  const fetchConsultants = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/staff/consultants?perPage=1000&page=1");
      const data = await response.json();
      if (data.success) {
        const consultantsList = Array.isArray(data.data) ? data.data : (data.data?.data || data.data || []);
        setConsultants(consultantsList);
      }
    } catch (err) {
      console.error("Error loading consultants:", err);
    }
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.consultantId) params.append("consultant_id", filters.consultantId);
      if (filters.dateFrom) params.append("date_from", filters.dateFrom);
      if (filters.dateTo) params.append("date_to", filters.dateTo);

      const response = await fetch(`http://localhost:8000/api/staff/consultant-statistics?${params}`);
      const data = await response.json();

      if (data.success) {
        setStatistics(data.data || []);
        setSummary(data.summary || {
          tong_so_tu_van_vien: 0,
          tong_so_buoi_tu_van: 0,
          tong_doanh_thu: 0,
          tong_so_lan_thay_doi_lich: 0,
          tong_tien_cong: 0,
        });
      } else {
        toast.push({ type: "error", title: data.message || "Không thể tải thống kê" });
      }
    } catch (err) {
      console.error("Error loading statistics:", err);
      toast.push({ type: "error", title: "Lỗi kết nối" });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Thống kê tư vấn viên</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Consultant Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tư vấn viên</label>
            <select
              value={filters.consultantId}
              onChange={(e) => handleFilterChange("consultantId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả tư vấn viên</option>
              {consultants.map((consultant) => (
                <option key={consultant.id || consultant.idnguoidung} value={consultant.id || consultant.idnguoidung}>
                  {consultant.name || consultant.hoten}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  consultantId: "",
                  dateFrom: "",
                  dateTo: "",
                });
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Tổng số tư vấn viên</p>
              <p className="text-3xl font-bold">{summary.tong_so_tu_van_vien}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Tổng số buổi tư vấn</p>
              <p className="text-3xl font-bold">{summary.tong_so_buoi_tu_van}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Tổng doanh thu</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.tong_doanh_thu)}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Tổng số lần đổi lịch</p>
              <p className="text-3xl font-bold">{summary.tong_so_lan_thay_doi_lich}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm mb-1">Tổng tiền công</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.tong_tien_cong)}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Chi tiết thống kê từng tư vấn viên</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : statistics.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>Chưa có dữ liệu thống kê</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-4">Tư vấn viên</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-center p-4">Số buổi tư vấn</th>
                  <th className="text-right p-4">Doanh thu</th>
                  <th className="text-center p-4">Số lần đổi lịch</th>
                  <th className="text-right p-4">Tiền công</th>
                  <th className="text-left p-4">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {statistics.map((stat) => (
                  <tr key={stat.idnguoidung} className="border-t hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium text-gray-800">{stat.hoten}</div>
                    </td>
                    <td className="p-4 text-gray-600">{stat.email}</td>
                    <td className="p-4 text-center">
                      <span className="font-semibold text-blue-600">{stat.so_buoi_tu_van}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(stat.tong_doanh_thu)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-semibold ${stat.so_lan_thay_doi_lich > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                        {stat.so_lan_thay_doi_lich}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-semibold text-indigo-600">
                        {formatCurrency(stat.tong_tien_cong)}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {stat.so_buoi_tu_van > 0 && (
                        <div>
                          <div>Mỗi buổi: {formatCurrency(stat.tien_cong_moi_buoi)}</div>
                          {stat.so_lan_thay_doi_lich > 0 && (
                            <div>Trừ mỗi lần đổi: {formatCurrency(stat.tru_tien_moi_lan_doi_lich)}</div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Thông tin về tính toán tiền công:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Tiền công = (Số buổi tư vấn × 500,000 VND) - (Số lần đổi lịch × 150,000 VND)</li>
              <li>Chỉ tính các buổi tư vấn đã hoàn thành (trạng thái: Hoàn thành)</li>
              <li>Chỉ tính các giao dịch đã thanh toán thành công</li>
              <li>Số lần đổi lịch chỉ tính các yêu cầu đã được duyệt</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

