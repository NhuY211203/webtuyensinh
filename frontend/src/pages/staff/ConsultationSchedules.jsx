import { useState, useEffect } from "react";
import { useToast } from "../../components/Toast";

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-5 max-h-[90vh] overflow-y-auto">
        {children}
        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConsultationSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consultants, setConsultants] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [notesData, setNotesData] = useState(null);
  const [evidenceData, setEvidenceData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const toast = useToast();

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    timeFilter: "all", // all, past, upcoming
    status: "", // 1=Trống, 2=Đã đặt, 3=Đã hủy, 4=Hoàn thành
    consultantId: "",
    dateFrom: "",
    dateTo: "",
  });

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  useEffect(() => {
    fetchConsultants();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [filters, pagination.current_page]);

  const fetchConsultants = async () => {
    try {
      // Lấy tất cả tư vấn viên (không phân trang)
      const response = await fetch("http://localhost:8000/api/staff/consultants?perPage=1000&page=1");
      const data = await response.json();
      if (data.success) {
        // API trả về data là array hoặc paginated data
        const consultantsList = Array.isArray(data.data) ? data.data : (data.data?.data || data.data || []);
        setConsultants(consultantsList);
      } else {
        console.error("Failed to load consultants:", data.message);
      }
    } catch (err) {
      console.error("Error loading consultants:", err);
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current_page,
        per_page: pagination.per_page,
      });

      if (filters.search) params.append("search", filters.search);
      if (filters.timeFilter !== "all") params.append("time_filter", filters.timeFilter);
      if (filters.status) params.append("status", filters.status);
      if (filters.consultantId) params.append("consultant_id", filters.consultantId);
      if (filters.dateFrom) params.append("date_from", filters.dateFrom);
      if (filters.dateTo) params.append("date_to", filters.dateTo);

      const response = await fetch(`http://localhost:8000/api/consultation-schedules/all?${params}`);
      const data = await response.json();

      if (data.success) {
        setSchedules(data.data || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        setError(data.message || "Không thể tải danh sách lịch tư vấn");
        toast.push({ type: "error", title: data.message || "Không thể tải danh sách lịch tư vấn" });
      }
    } catch (err) {
      console.error("Error loading schedules:", err);
      setError("Lỗi kết nối");
      toast.push({ type: "error", title: "Lỗi kết nối" });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, current_page: page }));
  };

  const getStatusText = (status) => {
    const statusMap = {
      1: "Trống",
      2: "Đã đặt",
      3: "Đã hủy",
      4: "Hoàn thành",
    };
    return statusMap[status] || "Không xác định";
  };

  const getStatusColor = (status) => {
    const colorMap = {
      1: "bg-gray-100 text-gray-800",
      2: "bg-blue-100 text-blue-800",
      3: "bg-red-100 text-red-800",
      4: "bg-green-100 text-green-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  const getDuyetLichText = (duyetlich) => {
    const map = {
      1: "Chờ duyệt",
      2: "Đã duyệt",
      3: "Từ chối",
    };
    return map[duyetlich] || "Chưa duyệt";
  };

  const getDuyetLichColor = (duyetlich) => {
    const colorMap = {
      1: "bg-yellow-100 text-yellow-800",
      2: "bg-green-100 text-green-800",
      3: "bg-red-100 text-red-800",
    };
    return colorMap[duyetlich] || "bg-gray-100 text-gray-800";
  };

  const isPast = (date) => {
    if (!date) return false;
    const scheduleDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return scheduleDate < today;
  };

  const openDetail = async (schedule) => {
    setCurrentSchedule(schedule);
    setNotesData(null);
    setEvidenceData(null);
    setDetailLoading(true);
    setDetailOpen(true);

    try {
      // Lấy cả ghi chú và minh chứng cùng lúc
      const [notesResponse, evidenceResponse] = await Promise.all([
        fetch(`http://localhost:8000/api/consultation-notes/${schedule.idlichtuvan}?view_mode=view`),
        fetch(`http://localhost:8000/api/consultation-notes/${schedule.idlichtuvan}/evidence`)
      ]);

      const notesResult = await notesResponse.json();
      const evidenceResult = await evidenceResponse.json();

      if (notesResult.success) {
        setNotesData(notesResult.data);
      } else {
        toast.push({ type: "error", title: notesResult.message || "Không thể tải ghi chú" });
      }

      if (evidenceResult.success) {
        setEvidenceData(evidenceResult.data || []);
      } else {
        toast.push({ type: "error", title: evidenceResult.message || "Không thể tải minh chứng" });
      }
    } catch (err) {
      console.error("Error loading detail:", err);
      toast.push({ type: "error", title: "Lỗi kết nối" });
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý lịch tư vấn</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Tìm theo tên, email, tiêu đề..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian</label>
            <select
              value={filters.timeFilter}
              onChange={(e) => handleFilterChange("timeFilter", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="past">Đã qua</option>
              <option value="upcoming">Sắp tới</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="1">Trống</option>
              <option value="2">Đã đặt</option>
              <option value="3">Đã hủy</option>
              <option value="4">Hoàn thành</option>
            </select>
          </div>

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
                  search: "",
                  timeFilter: "all",
                  status: "",
                  consultantId: "",
                  dateFrom: "",
                  dateTo: "",
                });
                setPagination((prev) => ({ ...prev, current_page: 1 }));
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
          Không có lịch tư vấn nào
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Tiêu đề</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Ngày</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Thời gian</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Tư vấn viên</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Người đặt</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Duyệt lịch</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Phương thức</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schedules.map((schedule) => {
                    const past = isPast(schedule.ngayhen);
                    return (
                      <tr
                        key={schedule.idlichtuvan}
                        className={`hover:bg-gray-50 ${past ? "opacity-75" : ""}`}
                      >
                        <td className="px-4 py-3">#{schedule.idlichtuvan}</td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs truncate" title={schedule.tieude}>
                            {schedule.tieude || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {schedule.ngayhen
                            ? new Date(schedule.ngayhen).toLocaleDateString("vi-VN")
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {schedule.giobatdau && schedule.ketthuc
                            ? `${schedule.giobatdau} - ${schedule.ketthuc}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {schedule.nguoiDung ? (
                            <div>
                              <div className="font-medium">{schedule.nguoiDung.hoten}</div>
                              <div className="text-xs text-gray-500">{schedule.nguoiDung.email}</div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {schedule.nguoiDat ? (
                            <div>
                              <div className="font-medium">{schedule.nguoiDat.hoten}</div>
                              <div className="text-xs text-gray-500">{schedule.nguoiDat.email}</div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                              schedule.trangthai
                            )}`}
                          >
                            {getStatusText(schedule.trangthai)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {schedule.duyetlich ? (
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${getDuyetLichColor(
                                schedule.duyetlich
                              )}`}
                            >
                              {getDuyetLichText(schedule.duyetlich)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3">{schedule.molavande || "-"}</td>
                        <td className="px-4 py-3">
                          {past ? (
                            schedule.hasGhiChu || schedule.hasMinhChung ? (
                              <button
                                onClick={() => openDetail(schedule)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Xem chi tiết
                              </button>
                            ) : (
                              <span className="text-sm text-gray-500 italic">
                                Tư vấn viên chưa cập nhật
                              </span>
                            )
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="mt-4 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Trang {pagination.current_page} / {pagination.last_page} (Tổng: {pagination.total})
              </span>
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal chi tiết */}
      <Modal
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setCurrentSchedule(null);
          setNotesData(null);
          setEvidenceData(null);
        }}
      >
        {detailLoading ? (
          <div className="p-8 text-center">Đang tải...</div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Chi tiết buổi tư vấn</h2>

            {/* Phần Ghi chú */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Ghi chú</h3>
              {notesData ? (
                notesData.ghi_chu_chot ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Nội dung:</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{notesData.ghi_chu_chot.noi_dung || "-"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Kết luận ngành:</p>
                        <p className="text-sm">{notesData.ghi_chu_chot.ket_luan_nganh || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Mức quan tâm:</p>
                        <p className="text-sm">{notesData.ghi_chu_chot.muc_quan_tam || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Điểm dự kiến:</p>
                        <p className="text-sm">{notesData.ghi_chu_chot.diem_du_kien || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Trạng thái:</p>
                        <p className="text-sm">{notesData.ghi_chu_chot.trang_thai || "-"}</p>
                      </div>
                    </div>
                    {notesData.ghi_chu_chot.yeu_cau_bo_sung && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Yêu cầu bổ sung:</p>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{notesData.ghi_chu_chot.yeu_cau_bo_sung}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : notesData.ghi_chu_nhap ? (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-yellow-800">⚠️ Đây là bản nháp, chưa được chốt</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Nội dung:</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{notesData.ghi_chu_nhap.noi_dung || "-"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Kết luận ngành:</p>
                        <p className="text-sm">{notesData.ghi_chu_nhap.ket_luan_nganh || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Mức quan tâm:</p>
                        <p className="text-sm">{notesData.ghi_chu_nhap.muc_quan_tam || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Điểm dự kiến:</p>
                        <p className="text-sm">{notesData.ghi_chu_nhap.diem_du_kien || "-"}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">Chưa có ghi chú</div>
                )
              ) : (
                <div className="text-center text-gray-500 py-4">Chưa có ghi chú</div>
              )}
            </div>

            {/* Phần Minh chứng */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Minh chứng</h3>
              {evidenceData && Array.isArray(evidenceData) && evidenceData.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {evidenceData.map((file) => (
                    <div key={file.id_file || file.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700">{file.ten_file || file.tenFile || "Không có tên"}</p>
                        <p className="text-xs text-gray-500">{file.loai_file || file.loaiFile || "-"}</p>
                      </div>
                      {(file.mo_ta || file.moTa) && (
                        <p className="text-xs text-gray-600 mb-2">{file.mo_ta || file.moTa}</p>
                      )}
                      {(file.duong_dan || file.duongDan || file.url) && (
                        <a
                          href={file.duong_dan || file.duongDan || file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Xem file →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">Chưa có minh chứng</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

