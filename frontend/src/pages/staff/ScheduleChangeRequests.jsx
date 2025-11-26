import { useState, useEffect } from "react";
import { useToast } from "../../components/Toast";

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-5 max-h-[90vh] overflow-y-auto">
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

export default function ScheduleChangeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [filter, setFilter] = useState("pending"); // pending, approved, rejected, all
  const toast = useToast();

  // Danh sách 4 ca học cố định
  const timeSlots = [
    { start: '07:00', end: '09:00', label: '07:00 - 09:00' },
    { start: '09:05', end: '11:05', label: '09:05 - 11:05' },
    { start: '13:05', end: '15:05', label: '13:05 - 15:05' },
    { start: '15:10', end: '17:10', label: '15:10 - 17:10' },
  ];

  useEffect(() => {
    fetchChangeRequests();
  }, [filter]);

  const fetchChangeRequests = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:8000/api/schedule-change-requests';
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data);
      } else {
        setError(data.message || 'Không thể tải danh sách yêu cầu');
        toast.push({ type: 'error', title: data.message || 'Không thể tải danh sách yêu cầu' });
      }
    } catch (err) {
      console.error("Error loading change requests:", err);
      setError("Lỗi kết nối");
      toast.push({ type: 'error', title: 'Lỗi kết nối' });
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (request) => {
    setCurrentRequest(request);
    setApprovalNote("");
    setDetailOpen(true);
  };

  const handleApprove = async () => {
    if (!currentRequest) return;
    
    try {
      const currentUserId = localStorage.getItem('userId') || '6';
      const response = await fetch(`http://localhost:8000/api/schedule-change-requests/${currentRequest.iddoilich}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ghichu_duyet: approvalNote.trim() || null,
          approver_id: currentUserId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.push({ type: 'success', title: 'Đã duyệt yêu cầu thay đổi lịch thành công' });
        setDetailOpen(false);
        setCurrentRequest(null);
        setApprovalNote("");
        fetchChangeRequests();
      } else {
        toast.push({ type: 'error', title: data.message || 'Không thể duyệt yêu cầu' });
      }
    } catch (err) {
      console.error("Error approving request:", err);
      toast.push({ type: 'error', title: 'Lỗi kết nối' });
    }
  };

  const handleReject = async () => {
    if (!currentRequest) return;
    
    if (!approvalNote.trim()) {
      toast.push({ type: 'error', title: 'Vui lòng nhập lý do từ chối' });
      return;
    }
    
    try {
      const currentUserId = localStorage.getItem('userId') || '6';
      const response = await fetch(`http://localhost:8000/api/schedule-change-requests/${currentRequest.iddoilich}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ghichu_duyet: approvalNote.trim(),
          approver_id: currentUserId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.push({ type: 'success', title: 'Đã từ chối yêu cầu thay đổi lịch' });
        setDetailOpen(false);
        setCurrentRequest(null);
        setApprovalNote("");
        fetchChangeRequests();
      } else {
        toast.push({ type: 'error', title: data.message || 'Không thể từ chối yêu cầu' });
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
      toast.push({ type: 'error', title: 'Lỗi kết nối' });
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      1: 'Chờ duyệt',
      2: 'Đã duyệt',
      3: 'Bị từ chối'
    };
    return statusMap[status] || 'Không xác định';
  };

  const getStatusColor = (status) => {
    const colorMap = {
      1: 'bg-yellow-100 text-yellow-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Xem xét thay đổi lịch tư vấn</h1>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        {[
          { key: 'pending', label: 'Chờ duyệt' },
          { key: 'approved', label: 'Đã duyệt' },
          { key: 'rejected', label: 'Bị từ chối' },
          { key: 'all', label: 'Tất cả' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full border text-sm ${
              filter === tab.key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => (
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
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
          Chưa có yêu cầu thay đổi lịch nào
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Lịch hiện tại</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Lịch mới</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Người yêu cầu</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Lý do</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Thời gian gửi</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((request) => {
                  const timeSlot = timeSlots.find(slot => slot.start === request.giomoi);
                  return (
                    <tr key={request.iddoilich} className="hover:bg-gray-50">
                      <td className="px-4 py-3">#{request.iddoilich}</td>
                      <td className="px-4 py-3">
                        {request.lichTuVan ? (
                          <div>
                            <div className="font-medium">
                              {request.lichTuVan.ngayhen ? new Date(request.lichTuVan.ngayhen).toLocaleDateString('vi-VN') : '-'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {request.lichTuVan.giobatdau} - {request.lichTuVan.ketthuc}
                            </div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">
                            {request.ngaymoi ? new Date(request.ngaymoi).toLocaleDateString('vi-VN') : '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {timeSlot ? timeSlot.label : request.giomoi || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {request.nguoiGuiYeuCau ? (
                          <div>
                            <div className="font-medium">{request.nguoiGuiYeuCau.hoten}</div>
                            <div className="text-xs text-gray-500">{request.nguoiGuiYeuCau.email}</div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs truncate" title={request.lydo_doilich}>
                          {request.lydo_doilich || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {request.thoigian_gui ? new Date(request.thoigian_gui).toLocaleString('vi-VN') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.trangthai_duyet)}`}>
                          {getStatusText(request.trangthai_duyet)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDetail(request)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal chi tiết */}
      <Modal open={detailOpen} onClose={() => { setDetailOpen(false); setCurrentRequest(null); setApprovalNote(""); }}>
        {currentRequest && (
          <div>
            <h2 className="text-xl font-bold mb-4">Chi tiết yêu cầu thay đổi lịch</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Lịch hiện tại:</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    {currentRequest.lichTuVan ? (
                      <>
                        <p className="text-sm">
                          <strong>Ngày:</strong> {currentRequest.lichTuVan.ngayhen ? new Date(currentRequest.lichTuVan.ngayhen).toLocaleDateString('vi-VN') : '-'}
                        </p>
                        <p className="text-sm">
                          <strong>Thời gian:</strong> {currentRequest.lichTuVan.giobatdau} - {currentRequest.lichTuVan.ketthuc}
                        </p>
                        <p className="text-sm">
                          <strong>Người đặt:</strong> {currentRequest.lichTuVan.nguoiDat?.hoten || '-'}
                        </p>
                      </>
                    ) : '-'}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Lịch mới:</p>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm">
                      <strong>Ngày:</strong> {currentRequest.ngaymoi ? new Date(currentRequest.ngaymoi).toLocaleDateString('vi-VN') : '-'}
                    </p>
                    <p className="text-sm">
                      <strong>Ca học:</strong> {timeSlots.find(slot => slot.start === currentRequest.giomoi)?.label || currentRequest.giomoi || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Người yêu cầu:</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm">
                    <strong>Tên:</strong> {currentRequest.nguoiGuiYeuCau?.hoten || '-'}
                  </p>
                  <p className="text-sm">
                    <strong>Email:</strong> {currentRequest.nguoiGuiYeuCau?.email || '-'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Lý do thay đổi:</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm">{currentRequest.lydo_doilich || '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Thời gian gửi:</p>
                <p className="text-sm text-gray-600">
                  {currentRequest.thoigian_gui ? new Date(currentRequest.thoigian_gui).toLocaleString('vi-VN') : '-'}
                </p>
              </div>

              {currentRequest.trangthai_duyet === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú {currentRequest.trangthai_duyet === 1 && '(Bắt buộc nếu từ chối)'}
                    </label>
                    <textarea
                      value={approvalNote}
                      onChange={(e) => setApprovalNote(e.target.value)}
                      placeholder="Nhập ghi chú..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <button
                      onClick={handleReject}
                      disabled={!approvalNote.trim()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Từ chối
                    </button>
                    <button
                      onClick={handleApprove}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Duyệt
                    </button>
                  </div>
                </>
              )}

              {currentRequest.trangthai_duyet !== 1 && (
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Người duyệt:</p>
                      <p className="text-sm text-gray-600">
                        {currentRequest.nguoiDuyet?.hoten || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Thời gian duyệt:</p>
                      <p className="text-sm text-gray-600">
                        {currentRequest.thoigian_duyet ? new Date(currentRequest.thoigian_duyet).toLocaleString('vi-VN') : '-'}
                      </p>
                    </div>
                  </div>
                  {currentRequest.ghichu_duyet && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Ghi chú duyệt:</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm">{currentRequest.ghichu_duyet}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

