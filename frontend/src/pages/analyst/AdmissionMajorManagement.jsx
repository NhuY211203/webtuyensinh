import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";

export default function AdmissionMajorManagement() {
  const [admissionMajors, setAdmissionMajors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  // Filter states
  const [selectedUniversityId, setSelectedUniversityId] = useState("");
  const [selectedMajorCode, setSelectedMajorCode] = useState("");
  
  // Dropdown data
  const [universities, setUniversities] = useState([]);
  const [majors, setMajors] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    idtruong: "",
    manganh: "",
    hinhthuc: "",
    thoiluong_nam: "",
    so_ky: "",
    hocphi_ky: "",
    hocphi_ghichu: "",
    decuong_url: "",
    mota_tomtat: ""
  });
  const [formErrors, setFormErrors] = useState({});

  // Load universities for dropdown
  const loadUniversities = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/truongdaihoc?per_page=1000&page=1');
      const data = await response.json();
      if (data.success) {
        setUniversities(data.data);
      }
    } catch (error) {
      console.error('Error loading universities:', error);
    }
  };

  // Load majors for dropdown
  const loadMajors = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/nganhhoc?perPage=1000&page=1');
      const data = await response.json();
      if (data.data) {
        setMajors(data.data);
      }
    } catch (error) {
      console.error('Error loading majors:', error);
    }
  };

  // Load admission majors data
  const loadAdmissionMajors = async (page = 1, keyword = "", idtruong = "", manganh = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: "20",
      });
      
      if (keyword) params.append('keyword', keyword);
      if (idtruong) params.append('idtruong', idtruong);
      if (manganh) params.append('manganh', manganh);
      
      console.log('Loading with params:', { page, keyword, idtruong, manganh });
      console.log('URL:', `http://localhost:8000/api/admin/nganh-truong?${params}`);
      
      const response = await fetch(`http://localhost:8000/api/admin/nganh-truong?${params}`);
      const data = await response.json();
      
      console.log('API Response:', data);
      console.log('Data items:', data.data);
      console.log('Pagination:', data.pagination);
      
      if (data.success) {
        setAdmissionMajors(data.data || []);
        setTotalPages(data.pagination.last_page || 1);
        setTotalRecords(data.pagination.total || 0);
        setCurrentPage(data.pagination.current_page || 1);
      } else {
        showToast(data.message || "Lỗi khi tải dữ liệu", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadUniversities();
    loadMajors();
  }, []);

  useEffect(() => {
    loadAdmissionMajors(currentPage, searchTerm, selectedUniversityId, selectedMajorCode);
  }, [currentPage, searchTerm, selectedUniversityId, selectedMajorCode]);

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.idtruong) {
      errors.idtruong = "Trường đại học là bắt buộc";
    }
    
    if (!formData.manganh) {
      errors.manganh = "Ngành học là bắt buộc";
    }
    
    if (formData.thoiluong_nam && (isNaN(formData.thoiluong_nam) || formData.thoiluong_nam < 1 || formData.thoiluong_nam > 10)) {
      errors.thoiluong_nam = "Thời lượng phải từ 1 đến 10 năm";
    }
    
    if (formData.so_ky && (isNaN(formData.so_ky) || formData.so_ky < 1 || formData.so_ky > 20)) {
      errors.so_ky = "Số kỳ phải từ 1 đến 20";
    }
    
    if (formData.hocphi_ky && (isNaN(formData.hocphi_ky) || formData.hocphi_ky < 0)) {
      errors.hocphi_ky = "Học phí phải là số dương";
    }
    
    if (formData.hinhthuc && formData.hinhthuc.length > 100) {
      errors.hinhthuc = "Hình thức không được vượt quá 100 ký tự";
    }
    
    if (formData.hocphi_ghichu && formData.hocphi_ghichu.length > 500) {
      errors.hocphi_ghichu = "Ghi chú học phí không được vượt quá 500 ký tự";
    }
    
    if (formData.decuong_url && formData.decuong_url.length > 255) {
      errors.decuong_url = "URL đề cương không được vượt quá 255 ký tự";
    }
    
    if (formData.mota_tomtat && formData.mota_tomtat.length > 1000) {
      errors.mota_tomtat = "Mô tả không được vượt quá 1000 ký tự";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast("Vui lòng kiểm tra lại thông tin đã nhập", "error");
      return;
    }
    
    setLoading(true);
    setFormErrors({});
    
    try {
      const payload = {
        idtruong: parseInt(formData.idtruong),
        manganh: formData.manganh,
        hinhthuc: formData.hinhthuc || null,
        thoiluong_nam: formData.thoiluong_nam ? parseInt(formData.thoiluong_nam) : null,
        so_ky: formData.so_ky ? parseInt(formData.so_ky) : null,
        hocphi_ky: formData.hocphi_ky ? parseInt(formData.hocphi_ky) : null,
        hocphi_ghichu: formData.hocphi_ghichu || null,
        decuong_url: formData.decuong_url || null,
        mota_tomtat: formData.mota_tomtat || null,
      };
      
      const url = editingItem 
        ? `http://localhost:8000/api/admin/nganh-truong/${editingItem.idnganhtruong}`
        : "http://localhost:8000/api/admin/nganh-truong";
      
      const method = editingItem ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        const successMessage = editingItem 
          ? "Cập nhật ngành tuyển sinh thành công" 
          : "Thêm mới ngành tuyển sinh thành công";
        
        showToast(successMessage, "success");
        
        setTimeout(() => {
          setShowModal(false);
          resetForm();
          loadAdmissionMajors(currentPage, searchTerm, selectedUniversityId, selectedMajorCode);
        }, 100);
      } else {
        if (data.errors) {
          const serverErrors = {};
          Object.keys(data.errors).forEach(key => {
            serverErrors[key] = Array.isArray(data.errors[key]) 
              ? data.errors[key][0] 
              : data.errors[key];
          });
          setFormErrors(serverErrors);
        }
        const errorMessage = data.message || "Có lỗi xảy ra";
        const errors = data.errors ? Object.values(data.errors).flat().join(", ") : "";
        showToast(errorMessage + (errors ? `: ${errors}` : ""), "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/admin/nganh-truong/${deleteId}`, {
        method: "DELETE"
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast("Xóa ngành tuyển sinh thành công", "success");
        setShowDeleteModal(false);
        setDeleteId(null);
        loadAdmissionMajors(currentPage, searchTerm, selectedUniversityId, selectedMajorCode);
      } else {
        showToast(data.message || "Có lỗi xảy ra khi xóa", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      idtruong: "",
      manganh: "",
      hinhthuc: "",
      thoiluong_nam: "",
      so_ky: "",
      hocphi_ky: "",
      hocphi_ghichu: "",
      decuong_url: "",
      mota_tomtat: ""
    });
    setFormErrors({});
    setEditingItem(null);
  };

  // Show toast message
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(admissionMajors.map(item => item.idnganhtruong));
    } else {
      setSelectedIds([]);
    }
  };

  // Handle select individual
  const handleSelect = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(i => i !== id));
    }
  };

  // Open edit modal
  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      idtruong: item.idtruong?.toString() || "",
      manganh: item.manganh || "",
      hinhthuc: item.hinhthuc || "",
      thoiluong_nam: item.thoiluong_nam?.toString() || "",
      so_ky: item.so_ky?.toString() || "",
      hocphi_ky: item.hocphi_ky?.toString() || "",
      hocphi_ghichu: item.hocphi_ghichu || "",
      decuong_url: item.decuong_url || "",
      mota_tomtat: item.mota_tomtat || ""
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadAdmissionMajors(1, searchTerm, selectedUniversityId, selectedMajorCode);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedUniversityId("");
    setSelectedMajorCode("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý ngành tuyển sinh</h1>
      </div>

      {/* Search and Filters Bar */}
      <div className="card p-5">
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên trường, tên ngành, mô tả..."
              className="input flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              Tìm kiếm
            </button>
            {(searchTerm || selectedUniversityId || selectedMajorCode) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-outline"
              >
                Xóa bộ lọc
              </button>
            )}
          </form>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Lọc theo trường</label>
              <select
                className="input w-full"
                value={selectedUniversityId}
                onChange={(e) => {
                  setSelectedUniversityId(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Tất cả trường</option>
                {universities.map((univ) => (
                  <option key={univ.idtruong} value={univ.idtruong}>
                    {univ.tentruong}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Lọc theo ngành</label>
              <select
                className="input w-full"
                value={selectedMajorCode}
                onChange={(e) => {
                  setSelectedMajorCode(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Tất cả ngành</option>
                {majors.map((major) => (
                  <option key={major.manganh} value={major.manganh}>
                    {major.tennganh} ({major.manganh})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary"
            >
              + Thêm mới
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} mục không?`)) {
                    // Bulk delete functionality would go here
                    showToast("Chức năng xóa nhiều đang được phát triển", "info");
                  }
                }}
                className="btn-outline bg-red-50 text-red-600 hover:bg-red-100"
                disabled={loading}
              >
                🗑️ Xóa ({selectedIds.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Danh sách ngành tuyển sinh</h2>
          <div className="text-sm text-gray-500">
            Tổng: {totalRecords} | Trang: {currentPage}/{totalPages}
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === admissionMajors.length && admissionMajors.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-4 py-2 text-left">Trường</th>
                  <th className="px-4 py-2 text-left">Ngành</th>
                  <th className="px-4 py-2 text-left">Hình thức</th>
                  <th className="px-4 py-2 text-left">Thời lượng</th>
                  <th className="px-4 py-2 text-left">Số kỳ</th>
                  <th className="px-4 py-2 text-left">Học phí/kỳ</th>
                  <th className="px-4 py-2 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {admissionMajors.map((item) => (
                  <tr key={item.idnganhtruong} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.idnganhtruong)}
                        onChange={(e) => handleSelect(item.idnganhtruong, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-2">{item.tentruong || `ID: ${item.idtruong}`}</td>
                    <td className="px-4 py-2">{item.tennganh || item.manganh}</td>
                    <td className="px-4 py-2">{item.hinhthuc || "-"}</td>
                    <td className="px-4 py-2">{item.thoiluong_nam ? `${item.thoiluong_nam} năm` : "-"}</td>
                    <td className="px-4 py-2">{item.so_ky || "-"}</td>
                    <td className="px-4 py-2">
                      {item.hocphi_ky 
                        ? new Intl.NumberFormat('vi-VN').format(item.hocphi_ky) + " đ"
                        : "-"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-3 py-1 text-sm bg-teal-50 text-teal-600 rounded hover:bg-teal-100"
                          title="Sửa"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(item.idnganhtruong);
                            setShowDeleteModal(true);
                          }}
                          className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                          title="Xóa"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {admissionMajors.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                      Không tìm thấy dữ liệu
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                      Đang tải...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              className="btn-outline"
              disabled={currentPage === 1}
              onClick={() => loadAdmissionMajors(currentPage - 1, searchTerm, selectedUniversityId, selectedMajorCode)}
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5)
              .map((p) => (
                <button
                  key={p}
                  className={`px-3 py-1 rounded ${
                    p === currentPage ? "bg-teal-600 text-white" : "bg-gray-200"
                  }`}
                  onClick={() => loadAdmissionMajors(p, searchTerm, selectedUniversityId, selectedMajorCode)}
                >
                  {p}
                </button>
              ))}
            <button
              className="btn-outline"
              disabled={currentPage === totalPages}
              onClick={() => loadAdmissionMajors(currentPage + 1, searchTerm, selectedUniversityId, selectedMajorCode)}
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        title={editingItem ? "Cập nhật ngành tuyển sinh" : "Thêm ngành cho trường"}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Trường <span className="text-red-500">*</span>
              </label>
              <select
                className={`input w-full ${formErrors.idtruong ? 'border-red-500' : ''}`}
                value={formData.idtruong}
                onChange={(e) => {
                  setFormData({ ...formData, idtruong: e.target.value });
                  if (formErrors.idtruong) {
                    setFormErrors({ ...formErrors, idtruong: '' });
                  }
                }}
                required
              >
                <option value="">Chọn trường đại học</option>
                {universities.map((univ) => (
                  <option key={univ.idtruong} value={univ.idtruong}>
                    {univ.tentruong}
                  </option>
                ))}
              </select>
              {formErrors.idtruong && (
                <p className="text-red-500 text-xs mt-1">{formErrors.idtruong}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Ngành <span className="text-red-500">*</span>
              </label>
              <select
                className={`input w-full ${formErrors.manganh ? 'border-red-500' : ''}`}
                value={formData.manganh}
                onChange={(e) => {
                  setFormData({ ...formData, manganh: e.target.value });
                  if (formErrors.manganh) {
                    setFormErrors({ ...formErrors, manganh: '' });
                  }
                }}
                required
              >
                <option value="">Chọn ngành</option>
                {majors.map((major) => (
                  <option key={major.manganh} value={major.manganh}>
                    {major.tennganh} ({major.manganh})
                  </option>
                ))}
              </select>
              {formErrors.manganh && (
                <p className="text-red-500 text-xs mt-1">{formErrors.manganh}</p>
              )}
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Hình thức</label>
              <input
                type="text"
                className={`input w-full ${formErrors.hinhthuc ? 'border-red-500' : ''}`}
                value={formData.hinhthuc}
                onChange={(e) => {
                  setFormData({ ...formData, hinhthuc: e.target.value });
                  if (formErrors.hinhthuc) {
                    setFormErrors({ ...formErrors, hinhthuc: '' });
                  }
                }}
                placeholder="VD: Chính quy"
                maxLength={100}
              />
              {formErrors.hinhthuc && (
                <p className="text-red-500 text-xs mt-1">{formErrors.hinhthuc}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Thời lượng (năm)</label>
              <input
                type="number"
                className={`input w-full ${formErrors.thoiluong_nam ? 'border-red-500' : ''}`}
                value={formData.thoiluong_nam}
                onChange={(e) => {
                  setFormData({ ...formData, thoiluong_nam: e.target.value });
                  if (formErrors.thoiluong_nam) {
                    setFormErrors({ ...formErrors, thoiluong_nam: '' });
                  }
                }}
                placeholder="VD: 4"
                min="1"
                max="10"
              />
              {formErrors.thoiluong_nam && (
                <p className="text-red-500 text-xs mt-1">{formErrors.thoiluong_nam}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số kỳ</label>
              <input
                type="number"
                className={`input w-full ${formErrors.so_ky ? 'border-red-500' : ''}`}
                value={formData.so_ky}
                onChange={(e) => {
                  setFormData({ ...formData, so_ky: e.target.value });
                  if (formErrors.so_ky) {
                    setFormErrors({ ...formErrors, so_ky: '' });
                  }
                }}
                placeholder="VD: 8"
                min="1"
                max="20"
              />
              {formErrors.so_ky && (
                <p className="text-red-500 text-xs mt-1">{formErrors.so_ky}</p>
              )}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Học phí/kỳ</label>
              <input
                type="number"
                className={`input w-full ${formErrors.hocphi_ky ? 'border-red-500' : ''}`}
                value={formData.hocphi_ky}
                onChange={(e) => {
                  setFormData({ ...formData, hocphi_ky: e.target.value });
                  if (formErrors.hocphi_ky) {
                    setFormErrors({ ...formErrors, hocphi_ky: '' });
                  }
                }}
                placeholder="VD: 5000000"
                min="0"
              />
              {formErrors.hocphi_ky && (
                <p className="text-red-500 text-xs mt-1">{formErrors.hocphi_ky}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ghi chú học phí</label>
              <input
                type="text"
                className={`input w-full ${formErrors.hocphi_ghichu ? 'border-red-500' : ''}`}
                value={formData.hocphi_ghichu}
                onChange={(e) => {
                  setFormData({ ...formData, hocphi_ghichu: e.target.value });
                  if (formErrors.hocphi_ghichu) {
                    setFormErrors({ ...formErrors, hocphi_ghichu: '' });
                  }
                }}
                placeholder="VD: Học phí theo quy định"
                maxLength={500}
              />
              {formErrors.hocphi_ghichu && (
                <p className="text-red-500 text-xs mt-1">{formErrors.hocphi_ghichu}</p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Đề cương URL</label>
            <input
              type="url"
              className={`input w-full ${formErrors.decuong_url ? 'border-red-500' : ''}`}
              value={formData.decuong_url}
              onChange={(e) => {
                setFormData({ ...formData, decuong_url: e.target.value });
                if (formErrors.decuong_url) {
                  setFormErrors({ ...formErrors, decuong_url: '' });
                }
              }}
              placeholder="https://example.com/decuong.pdf"
              maxLength={255}
            />
            {formErrors.decuong_url && (
              <p className="text-red-500 text-xs mt-1">{formErrors.decuong_url}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Mô tả tóm tắt</label>
            <textarea
              className={`input w-full ${formErrors.mota_tomtat ? 'border-red-500' : ''}`}
              rows="4"
              value={formData.mota_tomtat}
              onChange={(e) => {
                setFormData({ ...formData, mota_tomtat: e.target.value });
                if (formErrors.mota_tomtat) {
                  setFormErrors({ ...formErrors, mota_tomtat: '' });
                }
              }}
              placeholder="Nhập mô tả về ngành tuyển sinh..."
              maxLength={1000}
            />
            {formErrors.mota_tomtat && (
              <p className="text-red-500 text-xs mt-1">{formErrors.mota_tomtat}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.mota_tomtat.length}/1000 ký tự
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="btn-outline"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Đang xử lý..." : editingItem ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        title="Xác nhận xóa"
        onClose={() => setShowDeleteModal(false)}
      >
        <div className="space-y-4">
          <p>Bạn có chắc chắn muốn xóa ngành tuyển sinh này không?</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn-outline"
            >
              Hủy
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: "", type: "success" })}
      />
    </div>
  );
}

