import { useState, useEffect } from 'react';
import { useToast } from '../../components/Toast';

export default function ConsultantNotes() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dateFilter, setDateFilter] = useState(''); // Mặc định "Tất cả" để hiển thị tất cả ghi chú
  const [viewMode, setViewMode] = useState('input'); // 'input' hoặc 'view' - 'input' là nhập ghi chú, 'view' là xem ghi chú đã gửi
  const [showFormAfterSubmit, setShowFormAfterSubmit] = useState(true); // Hiển thị form sau khi gửi
  
  const [formData, setFormData] = useState({
    noi_dung: '',
    ket_luan_nganh: '',
    muc_quan_tam: 3,
    diem_du_kien: '',
    yeu_cau_bo_sung: '',
    chia_se_voi_thisinh: false,
    tom_tat: '',
  });

  const [currentGhiChuId, setCurrentGhiChuId] = useState(null);

  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [evidencesToDelete, setEvidencesToDelete] = useState([]);
  const [showEvidenceForm, setShowEvidenceForm] = useState(true); // Luôn hiển thị vì minh chứng là bắt buộc
  const [evidenceForm, setEvidenceForm] = useState({
    duong_dan: '',
    ten_file: '',
    loai_file: 'link',
    mo_ta: '',
    la_minh_chung: true,
    file: null, // File object để upload
  });

  const toast = useToast();

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const consultantId = currentUser.idnguoidung || currentUser.id || '5';

  useEffect(() => {
    fetchSessions();
  }, [dateFilter, viewMode]);

  useEffect(() => {
    if (selectedSession) {
      fetchSessionDetail(selectedSession);
      // Reset showFormAfterSubmit khi chọn session mới
      setShowFormAfterSubmit(true);
    }
  }, [selectedSession]);

  // Reset showFormAfterSubmit và filter khi chuyển chế độ
  useEffect(() => {
    setShowFormAfterSubmit(true);
    setSelectedSession(null);
    setSessionDetail(null);
    // Ở chế độ "view", reset filter để hiển thị tất cả ghi chú đã gửi
    if (viewMode === 'view') {
      setDateFilter(''); // Tất cả thời gian
    }
  }, [viewMode]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = {
        consultant_id: consultantId,
        date_filter: dateFilter,
        view_mode: viewMode, // Gửi view_mode để backend filter đúng
      };
      // Chỉ áp dụng filter_upcoming ở chế độ "input" (Nhập ghi chú)
      // Ở chế độ "view" (Xem ghi chú đã gửi), hiển thị tất cả ghi chú, kể cả quá khứ
      if (viewMode === 'input') {
        params.filter_upcoming = true; // Chỉ lọc ngày hôm nay và các ngày chưa hết hạn
      }

      const response = await fetch(
        `http://localhost:8000/api/consultation-notes?${new URLSearchParams(params)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      // Kiểm tra status code
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', response.status, errorText);
        try {
          const errorData = JSON.parse(errorText);
          toast.push({ 
            type: 'error', 
            title: errorData.message || `Lỗi ${response.status}: Không thể tải danh sách buổi tư vấn` 
          });
        } catch (e) {
          toast.push({ 
            type: 'error', 
            title: `Lỗi ${response.status}: Không thể tải danh sách buổi tư vấn` 
          });
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        // Backend đã filter theo view_mode, chỉ cần sử dụng data trực tiếp
        setSessions(data.data);
        if (data.data.length > 0 && !selectedSession) {
          setSelectedSession(data.data[0].id);
        } else if (data.data.length === 0) {
          setSelectedSession(null);
          setSessionDetail(null);
        }
      } else {
        toast.push({ type: 'error', title: data.message || 'Không thể tải danh sách buổi tư vấn' });
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.push({ 
        type: 'error', 
        title: error.message === 'Failed to fetch' 
          ? 'Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không.' 
          : 'Lỗi kết nối: ' + error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetail = async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/consultation-notes/${sessionId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      // Kiểm tra status code
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', response.status, errorText);
        try {
          const errorData = JSON.parse(errorText);
          toast.push({ 
            type: 'error', 
            title: errorData.message || `Lỗi ${response.status}: Không thể tải chi tiết buổi tư vấn` 
          });
        } catch (e) {
          toast.push({ 
            type: 'error', 
            title: `Lỗi ${response.status}: Không thể tải chi tiết buổi tư vấn` 
          });
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        setSessionDetail(data.data);
        const session = data.data.session;
        // Ưu tiên hiển thị NHÁP nếu có cả NHÁP và CHỐT (theo đặc tả)
        const ghiChu = data.data.ghi_chu_nhap || data.data.ghi_chu_chot;
        const isChot = !!data.data.ghi_chu_chot;
        
        if (ghiChu) {
          setFormData({
            noi_dung: ghiChu.noi_dung || '',
            ket_luan_nganh: ghiChu.ket_luan_nganh || '',
            muc_quan_tam: ghiChu.muc_quan_tam || 3,
            diem_du_kien: ghiChu.diem_du_kien || '',
            yeu_cau_bo_sung: ghiChu.yeu_cau_bo_sung || '',
            chia_se_voi_thisinh: ghiChu.chia_se_voi_thisinh || false,
            tom_tat: session.nhanxet || '',
          });
          setCurrentGhiChuId(ghiChu.id || null);
        } else {
          setFormData({
            noi_dung: '',
            ket_luan_nganh: '',
            muc_quan_tam: 3,
            diem_du_kien: '',
            yeu_cau_bo_sung: '',
            chia_se_voi_thisinh: false,
            tom_tat: session.nhanxet || '',
          });
          setCurrentGhiChuId(null);
        }

        const existingEvidence = (data.data.minh_chung || []).map((file) => ({
          clientId: `existing-${file.id_file}`,
          mode: 'existing',
          id_file: file.id_file,
          ten_file: file.ten_file,
          loai_file: file.loai_file,
          mo_ta: file.mo_ta,
          la_minh_chung: !!file.la_minh_chung,
          duong_dan: file.duong_dan,
          file: null,
        }));
        setEvidenceFiles(existingEvidence);
        setEvidencesToDelete([]);
        setShowEvidenceForm(true); // Luôn hiển thị form minh chứng
      }
    } catch (error) {
      console.error('Error fetching session detail:', error);
      toast.push({ 
        type: 'error', 
        title: error.message === 'Failed to fetch' 
          ? 'Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không.' 
          : 'Lỗi kết nối: ' + error.message 
      });
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedSession) return;

    try {
      setSaving(true);
      const formDataToSend = new FormData();
      formDataToSend.append('id_lichtuvan', String(selectedSession));
      formDataToSend.append('id_tuvanvien', String(consultantId));
      if (formData.noi_dung !== undefined && formData.noi_dung !== null) {
        formDataToSend.append('noi_dung', formData.noi_dung);
      }
      if (formData.ket_luan_nganh !== undefined && formData.ket_luan_nganh !== null) {
        formDataToSend.append('ket_luan_nganh', formData.ket_luan_nganh);
      }
      if (formData.muc_quan_tam !== undefined && formData.muc_quan_tam !== null) {
        formDataToSend.append('muc_quan_tam', String(formData.muc_quan_tam));
      }
      if (formData.diem_du_kien !== undefined && formData.diem_du_kien !== null && formData.diem_du_kien !== '') {
        formDataToSend.append('diem_du_kien', String(formData.diem_du_kien));
      }
      if (formData.yeu_cau_bo_sung) {
        formDataToSend.append('yeu_cau_bo_sung', formData.yeu_cau_bo_sung);
      }
      if (formData.tom_tat) {
        formDataToSend.append('tom_tat', formData.tom_tat);
      }
      formDataToSend.append('chia_se_voi_thisinh', formData.chia_se_voi_thisinh ? '1' : '0');

      // Lấy minh chứng từ danh sách đã thêm
      let newEvidences = evidenceFiles.filter((ev) => ev.mode === 'new');
      
      // Kiểm tra xem có minh chứng đang nhập trong form không (chưa thêm vào danh sách)
      const hasFormEvidence = evidenceForm.ten_file && evidenceForm.ten_file.trim() !== '' && 
                              (evidenceForm.file || (evidenceForm.duong_dan && evidenceForm.duong_dan.trim() !== '' && evidenceForm.duong_dan !== 'https://...'));
      
      if (hasFormEvidence) {
        // Tự động thêm minh chứng đang nhập trong form vào danh sách gửi đi
        const formEvidence = {
          clientId: `form-${Date.now()}`,
          mode: 'new',
          ten_file: evidenceForm.ten_file,
          loai_file: evidenceForm.loai_file,
          mo_ta: evidenceForm.mo_ta,
          la_minh_chung: evidenceForm.la_minh_chung,
          duong_dan: evidenceForm.file ? '' : evidenceForm.duong_dan,
          file: evidenceForm.file || null,
        };
        newEvidences.push(formEvidence);
      }
      
      console.log('Preparing to send evidences:', newEvidences.length, newEvidences);
      
      newEvidences.forEach((ev, index) => {
        formDataToSend.append(`new_evidences[${index}][ten_file]`, ev.ten_file || '');
        formDataToSend.append(`new_evidences[${index}][loai_file]`, ev.loai_file || 'link');
        formDataToSend.append(`new_evidences[${index}][la_minh_chung]`, ev.la_minh_chung ? '1' : '0');
        formDataToSend.append(`new_evidences[${index}][mo_ta]`, ev.mo_ta || '');
        
        // Nếu có file, gửi file (file sẽ được upload và tạo URL ở backend)
        if (ev.file) {
          formDataToSend.append(`new_evidences[${index}][file]`, ev.file);
          console.log(`Added file for evidence ${index}:`, ev.file.name, 'Size:', ev.file.size);
        } 
        // Nếu không có file nhưng có URL hợp lệ, gửi URL
        else if (ev.duong_dan && ev.duong_dan.trim() !== '' && ev.duong_dan !== 'https://...' && !ev.duong_dan.includes('https://...')) {
          formDataToSend.append(`new_evidences[${index}][duong_dan]`, ev.duong_dan);
          console.log(`Added URL for evidence ${index}:`, ev.duong_dan);
        } else {
          console.warn(`Evidence ${index} has no file and no valid URL:`, ev);
        }
      });

      evidencesToDelete.forEach((id, index) => {
        formDataToSend.append(`remove_evidence_ids[${index}]`, String(id));
      });

      // Debug: Log FormData contents
      console.log('Sending FormData:', {
        id_lichtuvan: selectedSession,
        newEvidencesCount: newEvidences.length,
        newEvidences: newEvidences.map(ev => ({
          ten_file: ev.ten_file,
          loai_file: ev.loai_file,
          has_file: !!ev.file,
          has_duong_dan: !!ev.duong_dan,
        })),
      });

      const response = await fetch('http://localhost:8000/api/consultation-notes/draft', {
        method: 'POST',
        body: formDataToSend,
      });

      // Kiểm tra status code
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', response.status, errorText);
        try {
          const errorData = JSON.parse(errorText);
          toast.push({ 
            type: 'error', 
            title: errorData.message || `Lỗi ${response.status}: Gửi thất bại` 
          });
          if (errorData.errors) {
            console.error('Validation errors:', errorData.errors);
          }
        } catch (e) {
          toast.push({ 
            type: 'error', 
            title: `Lỗi ${response.status}: ${errorText || 'Không thể gửi'}` 
          });
        }
        return;
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        toast.push({ type: 'success', title: 'Gửi thành công' });
        setEvidencesToDelete([]);
        // Ẩn form sau khi gửi thành công
        setShowFormAfterSubmit(false);
        
        // Cập nhật id_ghichu từ response
        if (data.data && data.data.id_ghichu) {
          setCurrentGhiChuId(data.data.id_ghichu);
        }
        
        // Xóa form minh chứng sau khi gửi thành công (nếu có minh chứng đang nhập trong form)
        if (hasFormEvidence) {
          setEvidenceForm({
            duong_dan: '',
            ten_file: '',
            loai_file: 'link',
            mo_ta: '',
            la_minh_chung: true,
            file: null,
          });
        }
        
        // Refresh để hiển thị minh chứng mới
        await fetchSessionDetail(selectedSession);
        await fetchSessions();
      } else {
        toast.push({ type: 'error', title: data.message || 'Gửi thất bại' });
        if (data.errors) {
          console.error('Validation errors:', data.errors);
        }
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.push({ type: 'error', title: 'Lỗi kết nối: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleAddEvidence = () => {
    if (!selectedSession) return;

    if (!evidenceForm.file && !evidenceForm.duong_dan) {
      toast.push({ type: 'error', title: 'Vui lòng chọn file hoặc nhập URL' });
      return;
    }

    if (!evidenceForm.ten_file) {
      toast.push({ type: 'error', title: 'Vui lòng nhập tên file' });
      return;
    }

    const newEvidence = {
      clientId: `new-${Date.now()}`,
      mode: 'new',
      ten_file: evidenceForm.ten_file,
      loai_file: evidenceForm.loai_file,
      mo_ta: evidenceForm.mo_ta,
      la_minh_chung: evidenceForm.la_minh_chung,
      duong_dan: evidenceForm.file ? '' : evidenceForm.duong_dan,
      file: evidenceForm.file || null,
    };

    setEvidenceFiles((prev) => [...prev, newEvidence]);
    setEvidenceForm({
      duong_dan: '',
      ten_file: '',
      loai_file: 'link',
      mo_ta: '',
      la_minh_chung: true,
      file: null,
    });
    // Không đóng form, giữ hiển thị để có thể thêm nhiều minh chứng
    toast.push({ type: 'success', title: 'Minh chứng đã được thêm vào danh sách. Nhấn "Gửi ngay" để lưu tất cả.' });
  };

  const handleDeleteEvidence = (evidence) => {
    if (!confirm('Bạn có chắc chắn muốn xóa minh chứng này?')) return;

    setEvidenceFiles((prev) => prev.filter((item) => item.clientId !== evidence.clientId));

    if (evidence.mode === 'existing' && evidence.id_file) {
      setEvidencesToDelete((prev) => [...prev, evidence.id_file]);
      toast.push({ type: 'info', title: 'Minh chứng sẽ được xóa khi bạn gửi.' });
    } else {
      toast.push({ type: 'info', title: 'Đã bỏ minh chứng khỏi danh sách tạm.' });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Chờ xử lý': 'bg-yellow-100 text-yellow-800',
      'Đã đặt lịch': 'bg-blue-100 text-blue-800',
      'Đã kết thúc': 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getApprovalInfo = (value) => {
    const map = {
      '1': { text: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-700' },
      '2': { text: 'Đã duyệt', className: 'bg-green-100 text-green-700' },
      '3': { text: 'Từ chối', className: 'bg-red-100 text-red-700' },
    };
    return map[String(value)] || { text: 'Không xác định', className: 'bg-gray-100 text-gray-600' };
  };

  // Helper function để kiểm tra file có phải là hình ảnh không
  const isImageFile = (file) => {
    if (!file) return false;
    
    // Kiểm tra extension từ tên file
    const fileName = file.ten_file || file.name || '';
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const lowerFileName = fileName.toLowerCase();
    
    // Kiểm tra extension
    if (imageExtensions.some(ext => lowerFileName.endsWith(ext))) {
      return true;
    }
    
    // Kiểm tra loại file nếu có
    if (file.loai_file === 'hinh_anh' || file.type?.startsWith('image/')) {
      return true;
    }
    
    return false;
  };

  // Helper function để lấy URL preview hình ảnh
  const getImagePreviewUrl = (file) => {
    if (!file) return null;
    
    // Nếu là file mới (chưa upload), tạo object URL từ file object
    if (file.file && file.file instanceof File) {
      return URL.createObjectURL(file.file);
    }
    
    // Nếu là file đã lưu, dùng đường dẫn
    if (file.duong_dan) {
      return file.duong_dan;
    }
    
    return null;
  };

  const selectedSessionData = sessions.find(s => s.id === selectedSession);
  // Kiểm tra điều kiện chỉnh sửa
  const isApproved = sessionDetail?.session?.duyetlich === 2;
  const isChot = sessionDetail?.ghi_chu_chot ? true : false;
  
  // Kiểm tra thời hạn sửa (48h sau khi chốt)
  let canEditAfterChot = true;
  if (isChot && sessionDetail?.ghi_chu_chot?.thoi_han_sua_den) {
    const thoiHanSua = new Date(sessionDetail.ghi_chu_chot.thoi_han_sua_den);
    const now = new Date();
    canEditAfterChot = now < thoiHanSua;
  }
  

  // Nếu đã chốt và hết hạn sửa → chỉ đọc hoàn toàn
  // Hoặc nếu ở chế độ "Xem ghi chú đã gửi" → luôn chỉ đọc
  const isReadOnly = viewMode === 'view' || (isChot && !canEditAfterChot);
  
  // Kiểm tra xem có nên ẩn form không
  // Ẩn form nếu: đã gửi thành công (showFormAfterSubmit = false)
  const shouldHideForm = !showFormAfterSubmit;
  
  const canEdit = viewMode === 'input' && selectedSessionData?.can_edit !== false && isApproved && (!isChot || canEditAfterChot) && !isReadOnly && showFormAfterSubmit;
  const canAddNote = viewMode === 'input' && selectedSessionData?.can_add_note !== false && isApproved && (!isChot || canEditAfterChot) && !isReadOnly && showFormAfterSubmit;

  useEffect(() => {
    // Chỉ ẩn form minh chứng nếu ở chế độ chỉ đọc
    if (isReadOnly) {
      setShowEvidenceForm(false);
    } else {
      setShowEvidenceForm(true); // Luôn hiển thị nếu có thể chỉnh sửa
    }
  }, [isReadOnly]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Ghi chú sau buổi</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('input')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              viewMode === 'input'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Nhập ghi chú
          </button>
          <button
            onClick={() => setViewMode('view')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              viewMode === 'view'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Xem ghi chú đã gửi
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Sidebar - Danh sách buổi */}
        <div className="md:col-span-1">
          <div className="card p-4">
            <h2 className="font-semibold mb-3">Danh sách buổi</h2>
            <div className="space-y-4">
              <div className="grid gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Thời gian</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="input"
                  >
                    <option value="">Tất cả</option>
                    <option value="today">Hôm nay</option>
                    <option value="7days">7 ngày</option>
                    <option value="month">Tháng này</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {viewMode === 'view' 
                    ? 'Không có ghi chú đã gửi nào.' 
                    : 'Không có buổi phù hợp bộ lọc.'}
                </p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSession(session.id)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      selectedSession === session.id
                        ? 'bg-primary-50 border-primary-500'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {session.ngayhen ? formatDate(session.ngayhen) : 'Chưa có ngày'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {session.thisinhten || 'Chưa có thí sinh'}
                    </div>
                      <div className="flex items-center gap-2 mt-2 text-[11px]">
                        <span className={`px-2 py-0.5 rounded-full ${getStatusColor(session.tinhtrang)}`}>
                          {session.tinhtrang || 'Không xác định'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full ${getApprovalInfo(session.duyetlich).className}`}>
                          {getApprovalInfo(session.duyetlich).text}
                        </span>
                      </div>
                    {session.nhanxet && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {session.nhanxet}
                      </div>
                    )}
                    {session.ghi_chu_chot && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                        Đã chốt
                      </span>
                    )}
                  </button>
                ))
              )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="md:col-span-2">
          {!selectedSession || !sessionDetail ? (
            <div className="card p-8 text-center text-gray-500">
              {viewMode === 'view' 
                ? 'Chọn một buổi tư vấn để xem ghi chú đã gửi'
                : 'Chọn một buổi tư vấn để xem và chỉnh sửa ghi chú'}
            </div>
          ) : viewMode === 'view' && !sessionDetail.ghi_chu_chot && !sessionDetail.ghi_chu_nhap ? (
            <div className="card p-8 text-center text-gray-500">
              <p className="mb-2">Buổi tư vấn này chưa có ghi chú đã gửi.</p>
              <p className="text-sm">Vui lòng chọn buổi khác hoặc chuyển sang chế độ "Nhập ghi chú".</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Session Info Header */}
              <div className="card p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {sessionDetail.session.ngayhen
                        ? formatDate(sessionDetail.session.ngayhen)
                        : 'Chưa có ngày'} — {sessionDetail.session.thisinhten || 'Chưa có thí sinh'}
                    </h2>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(sessionDetail.session.tinhtrang)}`}>
                      {sessionDetail.session.tinhtrang}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs ${getApprovalInfo(sessionDetail.session.duyetlich).className}`}>
                      {getApprovalInfo(sessionDetail.session.duyetlich).text}
                    </span>
                    {sessionDetail.ghi_chu_chot && (
                      <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                        ĐÃ CHỐT
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {sessionDetail.session.chudetuvan}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {sessionDetail.session.molavande || 'Trực tiếp'}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {sessionDetail.session.giobatdau} - {sessionDetail.session.ketthuc}
                  </span>
                  {sessionDetail.session.danhdanhgiadem && (
                    <a
                      href={sessionDetail.session.danhdanhgiadem}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-sm hover:underline"
                    >
                      Phòng/Link
                    </a>
                  )}
                </div>
                {sessionDetail.session.nhanxet && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded mb-2">
                    <strong>Tóm tắt:</strong> {sessionDetail.session.nhanxet}
                  </div>
                )}
                {sessionDetail.ghi_chu_chot && sessionDetail.ghi_chu_chot.thoi_han_sua_den && (
                  <div className={`text-xs p-2 rounded mb-2 ${
                    canEditAfterChot 
                      ? 'text-blue-700 bg-blue-50' 
                      : 'text-red-700 bg-red-50'
                  }`}>
                    {canEditAfterChot ? (
                      <>⏰ Có thể sửa đến: {new Date(sessionDetail.ghi_chu_chot.thoi_han_sua_den).toLocaleString('vi-VN')}</>
                    ) : (
                      <>🔒 Đã hết hạn sửa: {new Date(sessionDetail.ghi_chu_chot.thoi_han_sua_den).toLocaleString('vi-VN')} - Không thể chỉnh sửa</>
                    )}
                  </div>
                )}
                {/* Banner cảnh báo buổi chưa duyệt */}
                {sessionDetail.session.duyetlich !== 2 && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                    ⚠️ <strong>Buổi chưa được duyệt</strong> - Không thể nhập ghi chú cho buổi này.
                  </div>
                )}
                {/* Banner thông báo đã chốt và khóa */}
                {isChot && !canEditAfterChot && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                    🔒 <strong>Biên bản đã được chốt và hết hạn sửa</strong> - Chỉ có thể xem, không thể chỉnh sửa.
                  </div>
                )}
                {/* Banner thông báo đã chốt nhưng còn có thể sửa */}
                {isChot && canEditAfterChot && (
                  <div className="mt-2 text-sm text-green-600 bg-green-50 p-3 rounded border border-green-200">
                    ✅ <strong>Biên bản đã được chốt</strong> - Bạn vẫn có thể sửa trong thời hạn 48 giờ.
                  </div>
                )}
              </div>

              {/* Thông báo thành công khi đã gửi */}
              {shouldHideForm && viewMode === 'input' && (
                <div className="card p-6 bg-green-50 border-2 border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">✅</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-green-800 mb-1">Gửi thành công!</h3>
                      <p className="text-sm text-green-700">
                        Ghi chú và minh chứng đã được lưu thành công. Bạn có thể xem lại trong mục "Xem ghi chú đã gửi".
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowFormAfterSubmit(true);
                        setViewMode('view');
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                    >
                      Xem ghi chú đã gửi
                    </button>
                  </div>
                </div>
              )}

              {/* Thông báo khi ghi chú đã chốt và quá thời hạn ở chế độ nhập */}
              {viewMode === 'input' && isChot && !canEditAfterChot && showFormAfterSubmit && (
                <div className="card p-6 bg-orange-50 border-2 border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">🔒</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-orange-800 mb-1">Ghi chú đã được chốt</h3>
                      <p className="text-sm text-orange-700">
                        Ghi chú này đã được chốt và quá thời hạn chỉnh sửa. Vui lòng chuyển sang mục "Xem ghi chú đã gửi" để xem chi tiết.
                      </p>
                    </div>
                    <button
                      onClick={() => setViewMode('view')}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
                    >
                      Xem ghi chú đã gửi
                    </button>
                  </div>
                </div>
              )}

              {/* Note Form - Gộp với minh chứng thành 1 form */}
              {/* Hiển thị form khi: 
                  - Không bị ẩn (showFormAfterSubmit = true)
                  - VÀ (showFormAfterSubmit = true HOẶC viewMode = 'view' và có ghi_chu_chot hoặc ghi_chu_nhap)
                  - VÀ không phải là ghi chú đã chốt và quá thời hạn ở chế độ nhập
              */}
              {!shouldHideForm && 
               (showFormAfterSubmit || (viewMode === 'view' && (sessionDetail?.ghi_chu_chot || sessionDetail?.ghi_chu_nhap))) && 
               !(viewMode === 'input' && isChot && !canEditAfterChot) && (
              <div className="card p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Ghi chú buổi họp và minh chứng</h3>
                  {viewMode === 'view' && (sessionDetail?.ghi_chu_chot || sessionDetail?.ghi_chu_nhap) && (
                    <span className="text-xs text-green-600 font-medium">📋 Ghi chú đã được gửi</span>
                  )}
                  {viewMode === 'input' && !sessionDetail.ghi_chu_chot && !sessionDetail.ghi_chu_nhap && (
                    <span className="text-xs text-gray-500">Chưa có ghi chú cho buổi này. Hãy nhập và Gửi ngay.</span>
                  )}
                </div>
                
                <div className="space-y-6">
                  {/* Phần Ghi chú tổng kết */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Ghi chú tổng kết</h4>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nội dung ghi chú *</label>
                      <textarea
                        value={formData.noi_dung}
                        onChange={(e) => setFormData({ ...formData, noi_dung: e.target.value })}
                        rows={6}
                        className="input w-full"
                        placeholder="Nhập nội dung ghi chú chi tiết..."
                        disabled={isReadOnly || !isApproved || !canAddNote}
                        readOnly={isReadOnly}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {formData.noi_dung.length}/20 ký tự tối thiểu
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Định hướng ngành *</label>
                        <select
                          value={formData.ket_luan_nganh}
                          onChange={(e) => setFormData({ ...formData, ket_luan_nganh: e.target.value })}
                          className="input w-full"
                          disabled={isReadOnly || !isApproved || !canAddNote}
                        >
                          <option value="">Chọn định hướng ngành</option>
                          <option value="CNTT">CNTT</option>
                          <option value="Kinh tế">Kinh tế</option>
                          <option value="Ngôn ngữ">Ngôn ngữ</option>
                          <option value="Y dược">Y dược</option>
                          <option value="Kỹ thuật">Kỹ thuật</option>
                          <option value="Khoa học xã hội">Khoa học xã hội</option>
                          <option value="Nghệ thuật">Nghệ thuật</option>
                          <option value="Giáo dục">Giáo dục</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Mức quan tâm: {formData.muc_quan_tam}/5
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={formData.muc_quan_tam}
                          onChange={(e) => setFormData({ ...formData, muc_quan_tam: parseInt(e.target.value) })}
                          className="w-full"
                          disabled={isReadOnly || !isApproved || !canAddNote}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Điểm dự kiến</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="30"
                          value={formData.diem_du_kien}
                          onChange={(e) => setFormData({ ...formData, diem_du_kien: e.target.value })}
                          className="input w-full"
                          placeholder="0.00 - 30.00"
                          disabled={isReadOnly || !isApproved || !canAddNote}
                          readOnly={isReadOnly}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Yêu cầu bổ sung</label>
                        <input
                          type="text"
                          value={formData.yeu_cau_bo_sung}
                          onChange={(e) => setFormData({ ...formData, yeu_cau_bo_sung: e.target.value })}
                          className="input w-full"
                          placeholder="VD: Cần chứng chỉ IELTS 5.5"
                          disabled={isReadOnly || !isApproved || !canAddNote}
                          readOnly={isReadOnly}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Tóm tắt hiển thị ở danh sách</label>
                      <input
                        type="text"
                        value={formData.tom_tat}
                        onChange={(e) => setFormData({ ...formData, tom_tat: e.target.value })}
                        className="input w-full"
                        placeholder="Tóm tắt ngắn gọn (tối đa 255 ký tự)"
                        maxLength={255}
                        disabled={isReadOnly || !isApproved || !canAddNote}
                        readOnly={isReadOnly}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {formData.tom_tat.length}/255 ký tự
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="chia_se"
                        checked={formData.chia_se_voi_thisinh}
                        onChange={(e) => setFormData({ ...formData, chia_se_voi_thisinh: e.target.checked })}
                        className="mr-2"
                        disabled={isReadOnly || !isApproved || !canAddNote}
                      />
                      <label htmlFor="chia_se" className="text-sm">
                        Chia sẻ với thí sinh
                      </label>
                    </div>
                  </div>

                  {/* Phần Tệp đính kèm / Minh chứng - Luôn hiển thị vì bắt buộc */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Tệp đính kèm / Minh chứng <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs text-gray-500 font-normal">
                          ({evidenceFiles.length} {evidenceFiles.length === 1 ? 'mục' : 'mục'})
                        </span>
                      </h4>
                    </div>

                    {!isReadOnly && isApproved && canAddNote && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Chọn file (hoặc nhập URL bên dưới)</label>
                          <input
                            type="file"
                            accept="image/*,video/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setEvidenceForm({
                                  ...evidenceForm,
                                  file: file,
                                  ten_file: file.name, // Tự động điền tên file
                                  loai_file: file.type.startsWith('image/') ? 'hinh_anh' :
                                            file.type.startsWith('video/') ? 'video' :
                                            file.type === 'application/pdf' ? 'pdf' : 'link',
                                  duong_dan: '', // Xóa URL nếu chọn file
                                });
                              }
                            }}
                            className="input w-full"
                          />
                          {evidenceForm.file && (
                            <div className="text-xs text-gray-500 mt-1">
                              Đã chọn: {evidenceForm.file.name} ({(evidenceForm.file.size / 1024 / 1024).toFixed(2)} MB)
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Hoặc nhập URL</label>
                          <input
                            type="text"
                            value={evidenceForm.duong_dan}
                            onChange={(e) => {
                              setEvidenceForm({
                                ...evidenceForm,
                                duong_dan: e.target.value,
                                file: null, // Xóa file nếu nhập URL
                              });
                            }}
                            className="input w-full"
                            placeholder="https://..."
                            disabled={!!evidenceForm.file}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {evidenceForm.file ? 'Vui lòng bỏ chọn file để nhập URL' : 'Nhập URL nếu không chọn file'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Tên file *</label>
                          <input
                            type="text"
                            value={evidenceForm.ten_file}
                            onChange={(e) => setEvidenceForm({ ...evidenceForm, ten_file: e.target.value })}
                            className="input w-full"
                            placeholder="Tên file hoặc mô tả"
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Loại file</label>
                            <select
                              value={evidenceForm.loai_file}
                              onChange={(e) => setEvidenceForm({ ...evidenceForm, loai_file: e.target.value })}
                              className="input w-full"
                            >
                              <option value="link">Link</option>
                              <option value="hinh_anh">Hình ảnh</option>
                              <option value="video">Video</option>
                              <option value="pdf">PDF</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Mô tả </label>
                            <input
                              type="text"
                              value={evidenceForm.mo_ta}
                              onChange={(e) => setEvidenceForm({ ...evidenceForm, mo_ta: e.target.value })}
                              className="input w-full"
                              placeholder="Mô tả ngắn"
                            />
                          </div>
                        </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={evidenceForm.la_minh_chung}
                          onChange={(e) => setEvidenceForm({ ...evidenceForm, la_minh_chung: e.target.checked })}
                          className="mr-2"
                        />
                        <label className="text-sm">Là minh chứng</label>
                      </div>
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        💡 <strong>Lưu ý:</strong> Nhập thông tin minh chứng và nhấn "Gửi ngay" ở cuối form để lưu tất cả (ghi chú và minh chứng).
                      </div>
                    </div>
                    )}

                    <div className="space-y-2">
                      {evidenceFiles.length === 0 ? (
                        <p className="text-sm text-gray-500">Chưa có minh chứng nào</p>
                      ) : (
                        evidenceFiles.map((file) => {
                          const isImage = isImageFile(file);
                          const imageUrl = isImage ? getImagePreviewUrl(file) : null;
                          
                          return (
                            <div
                              key={file.clientId}
                              className={`p-3 bg-gray-50 rounded-lg ${isImage ? 'space-y-2' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  {file.duong_dan ? (
                                    <a
                                      href={file.duong_dan}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm font-medium text-primary-600 hover:underline"
                                    >
                                      {file.ten_file}
                                    </a>
                                  ) : (
                                    <span className="text-sm font-medium text-gray-700">
                                      {file.ten_file}
                                    </span>
                                  )}
                                  {file.mode === 'new' && (
                                    <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                      ⏳ Chưa lưu (sẽ lưu khi nhấn "Gửi ngay")
                                    </span>
                                  )}
                                  {file.mo_ta && (
                                    <div className="text-xs text-gray-500 mt-1">{file.mo_ta}</div>
                                  )}
                                  <div className="text-xs text-gray-400 mt-1">
                                    {file.loai_file} {file.la_minh_chung && '• Minh chứng'}
                                  </div>
                                </div>
                                {!isReadOnly && isApproved && canAddNote && (
                                  <button
                                    onClick={() => handleDeleteEvidence(file)}
                                    className="text-red-600 hover:text-red-800 text-sm ml-2"
                                  >
                                    Xóa
                                  </button>
                                )}
                              </div>
                              {/* Hiển thị preview hình ảnh nếu là file hình ảnh */}
                              {isImage && imageUrl && (
                                <div className="mt-2">
                                  <img
                                    src={imageUrl}
                                    alt={file.ten_file || 'Preview'}
                                    className="max-w-full h-auto max-h-64 rounded border border-gray-200"
                                    onError={(e) => {
                                      // Ẩn hình ảnh nếu không load được
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Nút lưu chung cho cả ghi chú và minh chứng */}
                  <div className="flex gap-3 justify-end items-center border-t pt-4">
                    {evidenceFiles.filter(ev => ev.mode === 'new').length > 0 && (
                      <span className="text-xs text-blue-600 mr-auto">
                        📎 Có {evidenceFiles.filter(ev => ev.mode === 'new').length} minh chứng mới chưa lưu
                      </span>
                    )}
                    {!isReadOnly && (
                      <button
                        onClick={handleSaveDraft}
                        disabled={isReadOnly || !isApproved || !canAddNote || saving}
                        className="btn-primary"
                      >
                        {saving ? 'Đang gửi...' : 'Gửi ngay'}
                      </button>
                    )}
                    {isReadOnly && (
                      <div className="text-sm text-gray-500 italic">
                        Biên bản đã được gửi và khóa. Không thể chỉnh sửa.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}
      </div>
          )}
        </div>
      </div>
    </div>
  );
}

