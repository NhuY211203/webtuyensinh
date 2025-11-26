import { useState, useEffect } from "react";
import Modal from "../../components/Modal.jsx";
import apiService from "../../services/api.js";

// Modal thêm/sửa tư vấn viên
function ExpertModal({ open, onClose, expert, onSave, isEdit = false, majorGroups = [], apiErrors = {} }) {
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    nganhHoc: "", 
    address: "",
    birthday: "",
    gender: "",
    status: "Hoạt động" 
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cập nhật form khi expert prop thay đổi
  useEffect(() => {
    if (expert) {
      setForm({
        name: expert.name || "",
        email: expert.email || "",
        phone: expert.phone || "",
        nganhHoc: expert.nganhHocId || "",
        address: expert.address || "",
        birthday: expert.birthday || "",
        gender: expert.gender || "",
        status: expert.status || "Hoạt động"
      });
    } else {
      setForm({
        name: "",
        email: "",
        phone: "",
        nganhHoc: "",
        address: "",
        birthday: "",
        gender: "",
        status: "Hoạt động"
      });
    }
    // Reset errors khi modal mở
    setErrors({});
  }, [expert, open]);

  // Cập nhật errors từ API
  useEffect(() => {
    if (Object.keys(apiErrors).length > 0) {
      setErrors(apiErrors);
    }
  }, [apiErrors]);

  // Validation functions
  const validateName = (name) => {
    if (!name || name.trim().length === 0) {
      return "Họ tên là bắt buộc";
    }
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 60) {
      return "Họ tên phải từ 2-60 ký tự";
    }
    // Chỉ cho phép chữ có dấu, khoảng trắng, ' hoặc -
    const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠưăâêôơ\s'-]+$/;
    if (!nameRegex.test(trimmed)) {
      return "Họ tên chỉ được chứa chữ cái, khoảng trắng, dấu ' hoặc -";
    }
    // Không cho phép nhiều khoảng trắng liên tiếp
    if (/\s{2,}/.test(trimmed)) {
      return "Không được có nhiều khoảng trắng liên tiếp";
    }
    return null;
  };

  const validateEmail = (email) => {
    if (!email || email.trim().length === 0) {
      return "Email là bắt buộc";
    }
    const trimmed = email.trim();
    if (trimmed.length > 191) {
      return "Email không được quá 191 ký tự";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return "Email không đúng định dạng";
    }
    return null;
  };

  const validatePhone = (phone) => {
    if (!phone || phone.trim().length === 0) {
      return "Số điện thoại là bắt buộc";
    }
    const trimmed = phone.trim();
    // Chỉ cho phép số
    if (!/^\d+$/.test(trimmed)) {
      return "Số điện thoại chỉ được chứa số";
    }
    // VN mobile validation
    if (trimmed.startsWith('0')) {
      if (trimmed.length !== 10) {
        return "Số điện thoại bắt đầu bằng 0 phải có 10 số";
      }
      const firstDigit = trimmed[1];
      if (!['3', '5', '7', '8', '9'].includes(firstDigit)) {
        return "Số điện thoại không hợp lệ (đầu số phải là 3, 5, 7, 8, 9)";
      }
    } else if (trimmed.startsWith('+84')) {
      if (trimmed.length < 11 || trimmed.length > 12) {
        return "Số điện thoại bắt đầu bằng +84 phải có 11-12 ký tự";
      }
      const firstDigit = trimmed[3];
      if (!['3', '5', '7', '8', '9'].includes(firstDigit)) {
        return "Số điện thoại không hợp lệ (đầu số phải là 3, 5, 7, 8, 9)";
      }
    } else {
      return "Số điện thoại phải bắt đầu bằng 0 hoặc +84";
    }
    return null;
  };

  const validateNganhHoc = (nganhHoc) => {
    if (!nganhHoc || nganhHoc === "") {
      return "Nhóm ngành là bắt buộc";
    }
    const exists = majorGroups.some(group => group.id == nganhHoc);
    if (!exists) {
      return "Nhóm ngành không hợp lệ";
    }
    return null;
  };

  const validateAddress = (address) => {
    if (address && address.trim().length > 255) {
      return "Địa chỉ không được quá 255 ký tự";
    }
    if (address && address.trim().length === 0) {
      return "Địa chỉ không được để trống";
    }
    return null;
  };

  const validateBirthday = (birthday) => {
    if (!birthday) return null; // Không bắt buộc
    
    const today = new Date();
    const birthDate = new Date(birthday);
    
    if (birthDate > today) {
      return "Ngày sinh không được lớn hơn hôm nay";
    }
    
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18 || age > 65) {
      return "Tuổi phải từ 18-65";
    }
    
    return null;
  };

  const validateGender = (gender) => {
    if (gender && !['Nam', 'Nữ', 'Khác'].includes(gender)) {
      return "Giới tính không hợp lệ";
    }
    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    
    const nameError = validateName(form.name);
    if (nameError) newErrors.name = nameError;
    
    const emailError = validateEmail(form.email);
    if (emailError) newErrors.email = emailError;
    
    const phoneError = validatePhone(form.phone);
    if (phoneError) newErrors.phone = phoneError;
    
    const nganhHocError = validateNganhHoc(form.nganhHoc);
    if (nganhHocError) newErrors.nganhHoc = nganhHocError;
    
    const addressError = validateAddress(form.address);
    if (addressError) newErrors.address = addressError;
    
    const birthdayError = validateBirthday(form.birthday);
    if (birthdayError) newErrors.birthday = birthdayError;
    
    const genderError = validateGender(form.gender);
    if (genderError) newErrors.gender = genderError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Chặn submit nhiều lần
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Chuẩn hóa dữ liệu trước khi gửi
      const normalizedForm = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address?.trim() || "",
        birthday: form.birthday || null,
        gender: form.gender || null
      };
      
      await onSave(normalizedForm);
    } catch (error) {
      console.error('Error saving consultant:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form khi modal đóng
  useEffect(() => {
    if (!open) {
      setForm({
        name: "",
        email: "",
        phone: "",
        nganhHoc: "",
        address: "",
        birthday: "",
        gender: "",
        status: "Hoạt động"
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open]);

  // Real-time validation khi user nhập
  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear error khi user bắt đầu nhập
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <Modal open={open} title={isEdit ? "Sửa tư vấn viên" : "Thêm tư vấn viên mới"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
          <input
            type="text"
            required
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập họ tên"
            value={form.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            required
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập email"
            value={form.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
          <input
            type="tel"
            required
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập số điện thoại (VD: 0123456789 hoặc +84123456789)"
            value={form.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm ngành *</label>
          <select
            required
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.nganhHoc ? 'border-red-500' : 'border-gray-300'
            }`}
            value={form.nganhHoc}
            onChange={(e) => handleFieldChange('nganhHoc', e.target.value)}
          >
            <option value="">Chọn nhóm ngành</option>
            {majorGroups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          {errors.nganhHoc && (
            <p className="mt-1 text-sm text-red-600">{errors.nganhHoc}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
          <input
            type="text"
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập địa chỉ"
            value={form.address || ""}
            onChange={(e) => handleFieldChange('address', e.target.value)}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
          <input
            type="date"
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.birthday ? 'border-red-500' : 'border-gray-300'
            }`}
            value={form.birthday || ""}
            onChange={(e) => handleFieldChange('birthday', e.target.value)}
          />
          {errors.birthday && (
            <p className="mt-1 text-sm text-red-600">{errors.birthday}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
          <select
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.gender ? 'border-red-500' : 'border-gray-300'
            }`}
            value={form.gender || ""}
            onChange={(e) => handleFieldChange('gender', e.target.value)}
          >
            <option value="">Chọn giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
          {errors.gender && (
            <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={form.status}
            onChange={(e) => handleFieldChange('status', e.target.value)}
          >
            <option value="Hoạt động">🟢 Hoạt động</option>
            <option value="Tạm dừng">⛔ Tạm dừng</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang xử lý...
              </span>
            ) : (
              isEdit ? "Cập nhật" : "Thêm mới"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Modal xem chi tiết
function DetailModal({ open, onClose, expert }) {
  if (!expert) return null;
  
  return (
    <Modal open={open} title="Chi tiết tư vấn viên" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Họ tên</label>
            <p className="text-gray-900">{expert.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900">{expert.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Số điện thoại</label>
            <p className="text-gray-900">{expert.phone}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Nhóm ngành</label>
            <p className="text-gray-900">{expert.nganhHoc}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Trạng thái</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              expert.status === "Hoạt động" 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {expert.status === "Hoạt động" ? "🟢 Hoạt động" : "⛔ Tạm dừng"}
            </span>
          </div>
        </div>
        
        {expert.schedule && (
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Lịch tư vấn</label>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Chưa có lịch tư vấn</p>
        </div>
      </div>
        )}
    </div>
    </Modal>
  );
}

export default function StaffExperts() {
  const [experts, setExperts] = useState([]);
  const [majorGroups, setMajorGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingExpert, setEditingExpert] = useState(null);
  const [viewingExpert, setViewingExpert] = useState(null);
  const [apiErrors, setApiErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [nganhFilter, setNganhFilter] = useState("all");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 20
  });

  // Load data từ API
  useEffect(() => {
    loadConsultants();
    loadMajorGroups();
  }, []);

  // Load consultants từ API
  const loadConsultants = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: searchTerm,
        status: statusFilter,
        nganh: nganhFilter,
        page: pagination.current_page,
        perPage: pagination.per_page
      };
      
      const response = await apiService.getConsultants(params);
      if (response.success) {
        setExperts(response.data);
        setPagination({
          current_page: response.current_page,
          last_page: response.last_page,
          total: response.total,
          per_page: response.per_page
        });
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading consultants:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load major groups từ API
  const loadMajorGroups = async () => {
    try {
      const response = await apiService.getMajorGroups();
      if (response.success) {
        setMajorGroups(response.data);
      }
    } catch (err) {
      console.error('Error loading major groups:', err);
    }
  };

  // Reload data khi filter thay đổi
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Reset về trang 1 khi filter thay đổi
      setPagination(prev => ({ ...prev, current_page: 1 }));
      loadConsultants();
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, nganhFilter]);

  // Lọc dữ liệu (không cần nữa vì API đã filter)
  const filteredExperts = experts;

  const handleAddExpert = () => {
    setEditingExpert(null);
    setApiErrors({});
    setShowModal(true);
  };

  const handleEditExpert = (expert) => {
    setEditingExpert(expert);
    setApiErrors({});
    setShowModal(true);
  };

  const handleViewExpert = (expert) => {
    setViewingExpert(expert);
    setShowDetailModal(true);
  };

  const handleSaveExpert = async (formData) => {
    try {
      setLoading(true);
      if (editingExpert) {
        // Sửa tư vấn viên
        await apiService.updateConsultant(editingExpert.id, formData);
      } else {
        // Thêm tư vấn viên mới
        await apiService.createConsultant(formData);
      }
      setShowModal(false);
      setEditingExpert(null);
      loadConsultants(); // Reload data
      
      // Hiển thị thông báo thành công
      if (editingExpert) {
        alert('Cập nhật tư vấn viên thành công!');
      } else {
        alert('Tạo tư vấn viên thành công! Mật khẩu mặc định: 123456');
      }
    } catch (err) {
      // Xử lý lỗi từ API
      if (err.response && err.response.data) {
        const apiError = err.response.data;
        if (apiError.errors) {
          // Lỗi validation từ backend
          const fieldErrors = {};
          Object.keys(apiError.errors).forEach(field => {
            if (field === 'email') fieldErrors.email = 'Email đã tồn tại trong hệ thống';
            else if (field === 'phone') fieldErrors.phone = 'Số điện thoại đã tồn tại trong hệ thống';
            else fieldErrors[field] = apiError.errors[field][0];
          });
          setApiErrors(fieldErrors);
          return; // Không đóng modal nếu có lỗi validation
        }
      }
      setError(err.message);
      console.error('Error saving consultant:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpert = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tư vấn viên này?")) {
      try {
        setLoading(true);
        await apiService.deleteConsultant(id);
        loadConsultants(); // Reload data
      } catch (err) {
        setError(err.message);
        console.error('Error deleting consultant:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      setLoading(true);
      const expert = experts.find(e => e.id === id);
      const newStatus = expert.status === "Hoạt động" ? "Tạm dừng" : "Hoạt động";
      await apiService.updateConsultantStatus(id, newStatus);
      loadConsultants(); // Reload data
    } catch (err) {
      setError(err.message);
      console.error('Error updating status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Thống kê
  const activeCount = experts.filter(expert => expert.status === "Hoạt động").length;
  const inactiveCount = experts.filter(expert => expert.status === "Tạm dừng").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý tư vấn viên</h1>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <button
            onClick={handleAddExpert}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            ➕ Thêm mới
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bộ lọc và tìm kiếm */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🔍 Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">⛔ Lọc trạng thái</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Hoạt động">🟢 Hoạt động</option>
              <option value="Tạm dừng">⛔ Tạm dừng</option>
            </select>
          </div>
          
    <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📂 Lọc nhóm ngành</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={nganhFilter}
              onChange={(e) => setNganhFilter(e.target.value)}
            >
              <option value="all">Tất cả nhóm ngành</option>
              {majorGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bảng danh sách */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Đang tải...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Họ tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SĐT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhóm ngành
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
            </tr>
          </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExperts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      Không có tư vấn viên nào
                    </td>
                  </tr>
                ) : (
                  filteredExperts.map((expert) => (
                <tr key={expert.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {expert.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <a href={`mailto:${expert.email}`} className="text-blue-600 hover:text-blue-800">
                      {expert.email}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {expert.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {expert.nganhHoc}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      expert.status === "Hoạt động" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {expert.status === "Hoạt động" ? "🟢 Hoạt động" : "⛔ Tạm dừng"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleViewExpert(expert)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Xem chi tiết"
                      >
                        🔍
                      </button>
                      <button
                        onClick={() => handleEditExpert(expert)}
                        className="text-green-600 hover:text-green-800"
                        title="Sửa"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggleStatus(expert.id)}
                        className={`${
                          expert.status === "Hoạt động" 
                            ? "text-yellow-600 hover:text-yellow-800" 
                            : "text-green-600 hover:text-green-800"
                        }`}
                        title={expert.status === "Hoạt động" ? "Tạm dừng" : "Kích hoạt"}
                      >
                        {expert.status === "Hoạt động" ? "⏸️" : "▶️"}
                      </button>
                      <button
                        onClick={() => handleDeleteExpert(expert.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Xóa"
                      >
                        ❌
                      </button>
                    </div>
                </td>
              </tr>
                  ))
                )}
          </tbody>
        </table>
      </div>
        )}
      </div>

      {/* Footer - Thống kê */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex space-x-6 text-sm text-gray-600">
            <span>Tổng số: <span className="font-medium text-gray-900">{pagination.total}</span></span>
            <span>Hoạt động: <span className="font-medium text-green-600">{activeCount}</span></span>
            <span>Tạm dừng: <span className="font-medium text-red-600">{inactiveCount}</span></span>
          </div>
          <div className="mt-2 sm:mt-0 text-sm text-gray-500">
            Hiển thị {filteredExperts.length} trong {pagination.total} tư vấn viên
            {pagination.last_page > 1 && (
              <span className="ml-2">
                (Trang {pagination.current_page}/{pagination.last_page})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ExpertModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingExpert(null);
          setApiErrors({});
        }}
        expert={editingExpert}
        onSave={handleSaveExpert}
        isEdit={!!editingExpert}
        majorGroups={majorGroups}
        apiErrors={apiErrors}
      />

      <DetailModal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setViewingExpert(null);
        }}
        expert={viewingExpert}
      />
    </div>
  );
}


// export default function StaffExperts() {
//   const experts = [
//     { name: "Chuyên gia A", email: "a@example.com", status: "Hoạt động" },
//     { name: "Chuyên gia B", email: "b@example.com", status: "Tạm dừng" }
//   ];
//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-4">Quản lý chuyên gia</h1>
//       <div className="card overflow-hidden">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-50 text-gray-600">
//             <tr><th className="p-3 text-left">Tên</th><th className="p-3 text-left">Email</th><th className="p-3 text-center">Trạng thái</th><th className="p-3 text-center">Hành động</th></tr>
//           </thead>
//           <tbody>
//             {experts.map((e,i)=>(
//               <tr key={i} className="border-t">
//                 <td className="p-3">{e.name}</td>
//                 <td className="p-3">{e.email}</td>
//                 <td className="p-3 text-center">{e.status}</td>
//                 <td className="p-3 text-center">
//                   <button className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 mr-2">Sửa</button>
//                   <button className="px-3 py-1 rounded-full bg-gray-100">Khóa/Mở</button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
