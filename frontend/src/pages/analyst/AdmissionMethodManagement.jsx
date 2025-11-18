import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";

export default function AdmissionMethodManagement() {
  const [methods, setMethods] = useState([]);
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
  
  // Form data
  const [formData, setFormData] = useState({
    idxettuyen: "",
    tenptxt: "",
    mota: ""
  });
  const [formErrors, setFormErrors] = useState({});

  // Load methods data
  const loadMethods = async (page = 1, keyword = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: "20",
      });
      
      if (keyword) params.append('keyword', keyword);
      
      const response = await fetch(`http://localhost:8000/api/admin/phuong-thuc-xet-tuyen?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setMethods(data.data || []);
        setTotalPages(data.pagination.last_page || 1);
        setTotalRecords(data.pagination.total || 0);
        setCurrentPage(data.pagination.current_page || 1);
      } else {
        showToast("Lỗi khi tải dữ liệu", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    loadMethods(currentPage, searchTerm);
  }, [currentPage, searchTerm]);

  // Auto search when keyword changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadMethods(1, searchTerm);
    }, searchTerm ? 500 : 0);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.idxettuyen) {
      errors.idxettuyen = "Mã phương thức là bắt buộc";
    } else if (isNaN(formData.idxettuyen) || parseInt(formData.idxettuyen) < 1) {
      errors.idxettuyen = "Mã phương thức phải là số nguyên dương";
    }
    
    if (!formData.tenptxt.trim()) {
      errors.tenptxt = "Tên phương thức là bắt buộc";
    } else if (formData.tenptxt.length > 255) {
      errors.tenptxt = "Tên phương thức không được vượt quá 255 ký tự";
    }
    
    if (formData.mota && formData.mota.length > 1000) {
      errors.mota = "Mô tả không được vượt quá 1000 ký tự";
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
        idxettuyen: parseInt(formData.idxettuyen),
        tenptxt: formData.tenptxt.trim(),
        mota: formData.mota.trim() || null,
      };
      
      const url = editingItem 
        ? `http://localhost:8000/api/admin/phuong-thuc-xet-tuyen/${editingItem.idxettuyen}`
        : "http://localhost:8000/api/admin/phuong-thuc-xet-tuyen";
      
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
          ? "Cập nhật phương thức xét tuyển thành công" 
          : "Thêm mới phương thức xét tuyển thành công";
        
        showToast(successMessage, "success");
        
        setTimeout(() => {
          setShowModal(false);
          resetForm();
          loadMethods(currentPage, searchTerm);
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
      const response = await fetch(`http://localhost:8000/api/admin/phuong-thuc-xet-tuyen/${deleteId}`, {
        method: "DELETE"
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast("Xóa phương thức xét tuyển thành công", "success");
        setShowDeleteModal(false);
        setDeleteId(null);
        loadMethods(currentPage, searchTerm);
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
      idxettuyen: "",
      tenptxt: "",
      mota: ""
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
      setSelectedIds(methods.map(item => item.idxettuyen));
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
      idxettuyen: item.idxettuyen?.toString() || "",
      tenptxt: item.tenptxt || "",
      mota: item.mota || ""
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadMethods(1, searchTerm);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý phương thức xét tuyển</h1>
      </div>

      {/* Search and Actions Bar */}
      <div className="card p-5">
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên phương thức..."
              className="input flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              Tìm kiếm
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-outline"
              >
                Xóa bộ lọc
              </button>
            )}
          </form>
          
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
          <h2 className="font-semibold">Danh sách phương thức xét tuyển</h2>
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
                      checked={selectedIds.length === methods.length && methods.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-4 py-2 text-left">Mã phương thức</th>
                  <th className="px-4 py-2 text-left">Tên phương thức</th>
                  <th className="px-4 py-2 text-left">Mô tả</th>
                  <th className="px-4 py-2 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((item) => (
                  <tr key={item.idxettuyen} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.idxettuyen)}
                        onChange={(e) => handleSelect(item.idxettuyen, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-2 font-medium">{item.idxettuyen}</td>
                    <td className="px-4 py-2">{item.tenptxt}</td>
                    <td className="px-4 py-2">{item.mota || "-"}</td>
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
                            setDeleteId(item.idxettuyen);
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
                {methods.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      Không tìm thấy dữ liệu
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
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
              onClick={() => loadMethods(currentPage - 1, searchTerm)}
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
                  onClick={() => loadMethods(p, searchTerm)}
                >
                  {p}
                </button>
              ))}
            <button
              className="btn-outline"
              disabled={currentPage === totalPages}
              onClick={() => loadMethods(currentPage + 1, searchTerm)}
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        title={editingItem ? "Cập nhật phương thức xét tuyển" : "Thêm phương thức xét tuyển"}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Mã phương thức <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              className={`input w-full ${formErrors.idxettuyen ? 'border-red-500' : ''}`}
              value={formData.idxettuyen}
              onChange={(e) => {
                setFormData({ ...formData, idxettuyen: e.target.value });
                if (formErrors.idxettuyen) {
                  setFormErrors({ ...formErrors, idxettuyen: '' });
                }
              }}
              placeholder="VD: 1, 2, 3, 4..."
              min="1"
              required
              disabled={!!editingItem}
            />
            {formErrors.idxettuyen && (
              <p className="text-red-500 text-xs mt-1">{formErrors.idxettuyen}</p>
            )}
            {editingItem && (
              <p className="text-xs text-gray-500 mt-1">Không thể thay đổi mã phương thức khi chỉnh sửa</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tên phương thức <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`input w-full ${formErrors.tenptxt ? 'border-red-500' : ''}`}
              value={formData.tenptxt}
              onChange={(e) => {
                setFormData({ ...formData, tenptxt: e.target.value });
                if (formErrors.tenptxt) {
                  setFormErrors({ ...formErrors, tenptxt: '' });
                }
              }}
              placeholder="VD: Thi THPT, Học bạ, ĐGNL, ĐGTD..."
              maxLength={255}
              required
            />
            {formErrors.tenptxt && (
              <p className="text-red-500 text-xs mt-1">{formErrors.tenptxt}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              className={`input w-full ${formErrors.mota ? 'border-red-500' : ''}`}
              rows="4"
              value={formData.mota}
              onChange={(e) => {
                setFormData({ ...formData, mota: e.target.value });
                if (formErrors.mota) {
                  setFormErrors({ ...formErrors, mota: '' });
                }
              }}
              placeholder="Nhập mô tả về phương thức xét tuyển..."
              maxLength={1000}
            />
            {formErrors.mota && (
              <p className="text-red-500 text-xs mt-1">{formErrors.mota}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.mota.length}/1000 ký tự
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
          <p>Bạn có chắc chắn muốn xóa phương thức xét tuyển này không?</p>
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

