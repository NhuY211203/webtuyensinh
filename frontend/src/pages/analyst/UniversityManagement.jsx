import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";

export default function UniversityManagement() {
  const [activeTab, setActiveTab] = useState("universities"); // "universities" or "facilities"
  
  // Universities state
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  // Facilities state
  const [facilities, setFacilities] = useState([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);
  const [facilitiesSearchTerm, setFacilitiesSearchTerm] = useState("");
  const [facilitiesPage, setFacilitiesPage] = useState(1);
  const [facilitiesTotalPages, setFacilitiesTotalPages] = useState(1);
  const [facilitiesTotalRecords, setFacilitiesTotalRecords] = useState(0);
  const [selectedFacilityIds, setSelectedFacilityIds] = useState([]);
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [showFacilityDeleteModal, setShowFacilityDeleteModal] = useState(false);
  const [deleteFacilityId, setDeleteFacilityId] = useState(null);
  const [selectedUniversityId, setSelectedUniversityId] = useState("");
  
  // Form data for universities
  const [formData, setFormData] = useState({
    matruong: "",
    tentruong: "",
    diachi: "",
    dienthoai: "",
    lienhe: "",
    sodienthoai: "",
    ngaythanhlap: "",
    motantuong: ""
  });

  // Form data for facilities
  const [facilityFormData, setFacilityFormData] = useState({
    idtruong: "",
    ten_coso: "",
    khuvuc: "Miền Bắc",
    diachi_coso: ""
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});
  const [facilityFormErrors, setFacilityFormErrors] = useState({});

  // Load universities data
  const loadUniversities = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: "20",
        ...(search && { search })
      });
      
      const response = await fetch(`http://localhost:8000/api/admin/truongdaihoc?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setUniversities(data.data);
        setTotalPages(data.pagination.last_page);
        setTotalRecords(data.pagination.total);
        setCurrentPage(data.pagination.current_page);
      } else {
        showToast("Lỗi khi tải dữ liệu", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };


  // Export data
  const exportData = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      
      const response = await fetch(`http://localhost:8000/api/admin/truongdaihoc/export?${params}`);
      const data = await response.json();
      
      if (data.success) {
        // Convert to CSV
        const csvContent = convertToCSV(data.data);
        downloadCSV(csvContent, "truongdaihoc.csv");
        showToast("Xuất dữ liệu thành công", "success");
      } else {
        showToast("Lỗi khi xuất dữ liệu", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối", "error");
    }
  };

  // Convert data to CSV
  const convertToCSV = (data) => {
    const headers = ["ID", "Mã trường", "Tên trường", "Địa chỉ", "Điện thoại", "Liên hệ", "Số điện thoại", "Ngày thành lập", "Mô tả"];
    const rows = data.map(item => [
      item.idtruong,
      item.matruong,
      item.tentruong,
      item.diachi,
      item.dienthoai || "",
      item.lienhe || "",
      item.sodienthoai || "",
      item.ngaythanhlap || "",
      item.motantuong || ""
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")
    ).join("\n");
  };

  // Download CSV file
  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.matruong.trim()) {
      errors.matruong = "Mã trường là bắt buộc";
    } else if (formData.matruong.length > 20) {
      errors.matruong = "Mã trường không được vượt quá 20 ký tự";
    }
    
    if (!formData.tentruong.trim()) {
      errors.tentruong = "Tên trường là bắt buộc";
    } else if (formData.tentruong.length > 255) {
      errors.tentruong = "Tên trường không được vượt quá 255 ký tự";
    }
    
    if (!formData.diachi.trim()) {
      errors.diachi = "Địa chỉ là bắt buộc";
    } else if (formData.diachi.length > 500) {
      errors.diachi = "Địa chỉ không được vượt quá 500 ký tự";
    }
    
    if (formData.dienthoai && formData.dienthoai.length > 20) {
      errors.dienthoai = "Điện thoại không được vượt quá 20 ký tự";
    }
    
    if (formData.sodienthoai && formData.sodienthoai.length > 20) {
      errors.sodienthoai = "Số điện thoại không được vượt quá 20 ký tự";
    }
    
    if (formData.lienhe && formData.lienhe.length > 255) {
      errors.lienhe = "Liên hệ không được vượt quá 255 ký tự";
    }
    
    if (formData.motantuong && formData.motantuong.length > 1000) {
      errors.motantuong = "Mô tả không được vượt quá 1000 ký tự";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    // If date is already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    // If date is in other format, try to convert
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split('T')[0];
    } catch {
      return "";
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      showToast("Vui lòng kiểm tra lại thông tin đã nhập", "error");
      return;
    }
    
    setLoading(true);
    setFormErrors({});
    
    try {
      // Prepare data - remove empty strings for optional fields
      const submitData = {
        matruong: formData.matruong.trim(),
        tentruong: formData.tentruong.trim(),
        diachi: formData.diachi.trim(),
        dienthoai: formData.dienthoai.trim() || null,
        lienhe: formData.lienhe.trim() || null,
        sodienthoai: formData.sodienthoai.trim() || null,
        ngaythanhlap: formData.ngaythanhlap || null,
        motantuong: formData.motantuong.trim() || null
      };
      
      const url = editingUniversity 
        ? `http://localhost:8000/api/admin/truongdaihoc/${editingUniversity.idtruong}`
        : "http://localhost:8000/api/admin/truongdaihoc";
      
      const method = editingUniversity ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        const successMessage = editingUniversity 
          ? "Cập nhật trường đại học thành công" 
          : "Thêm mới trường đại học thành công";
        
        // Show toast first
        showToast(successMessage, "success");
        
        // Close modal after a short delay to show toast
        setTimeout(() => {
          setShowModal(false);
          resetForm();
          loadUniversities(currentPage, searchTerm);
        }, 100);
      } else {
        // Handle validation errors from server
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
      const response = await fetch(`http://localhost:8000/api/admin/truongdaihoc/${deleteId}`, {
        method: "DELETE"
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast("Xóa trường đại học thành công", "success");
        setShowDeleteModal(false);
        setDeleteId(null);
        loadUniversities(currentPage, searchTerm);
      } else {
        showToast(data.message || "Có lỗi xảy ra khi xóa", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      showToast("Vui lòng chọn ít nhất một trường để xóa", "error");
      return;
    }
    
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} trường đại học không?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/admin/truongdaihoc/bulk", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast(data.message || "Xóa thành công", "success");
        setSelectedIds([]);
        loadUniversities(currentPage, searchTerm);
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
      matruong: "",
      tentruong: "",
      diachi: "",
      dienthoai: "",
      lienhe: "",
      sodienthoai: "",
      ngaythanhlap: "",
      motantuong: ""
    });
    setFormErrors({});
    setEditingUniversity(null);
  };

  // Show toast message
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    // Auto hide after 4 seconds
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(universities.map(u => u.idtruong));
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
  const openEditModal = (university) => {
    setEditingUniversity(university);
    setFormData({
      matruong: university.matruong || "",
      tentruong: university.tentruong || "",
      diachi: university.diachi || "",
      dienthoai: university.dienthoai || "",
      lienhe: university.lienhe || "",
      sodienthoai: university.sodienthoai || "",
      ngaythanhlap: formatDateForInput(university.ngaythanhlap),
      motantuong: university.motantuong || ""
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    loadUniversities(1, searchTerm);
  };

  // Load facilities data
  const loadFacilities = async (page = 1, search = "", idtruong = "") => {
    setFacilitiesLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: "20",
        ...(search && { search }),
        ...(idtruong && { idtruong })
      });
      
      const response = await fetch(`http://localhost:8000/api/admin/cosotruong?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setFacilities(data.data);
        setFacilitiesTotalPages(data.pagination.last_page);
        setFacilitiesTotalRecords(data.pagination.total);
        setFacilitiesPage(data.pagination.current_page);
      } else {
        showToast("Lỗi khi tải dữ liệu cơ sở", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối", "error");
    } finally {
      setFacilitiesLoading(false);
    }
  };

  // Load universities for dropdown (needed for facilities tab)
  useEffect(() => {
    if (activeTab === "facilities" && universities.length === 0) {
      loadUniversities(1, "");
    }
  }, [activeTab]);

  // Load data on mount and when page changes
  useEffect(() => {
    if (activeTab === "universities") {
      loadUniversities(currentPage, searchTerm);
    } else if (activeTab === "facilities") {
      loadFacilities(facilitiesPage, facilitiesSearchTerm, selectedUniversityId);
    }
  }, [currentPage, facilitiesPage, activeTab]);

  // Load facilities when university filter changes
  useEffect(() => {
    if (activeTab === "facilities") {
      loadFacilities(1, facilitiesSearchTerm, selectedUniversityId);
    }
  }, [selectedUniversityId]);

  // Facility handlers
  const validateFacilityForm = () => {
    const errors = {};
    
    if (!facilityFormData.idtruong) {
      errors.idtruong = "Trường đại học là bắt buộc";
    }
    
    if (!facilityFormData.ten_coso.trim()) {
      errors.ten_coso = "Tên cơ sở là bắt buộc";
    } else if (facilityFormData.ten_coso.length > 255) {
      errors.ten_coso = "Tên cơ sở không được vượt quá 255 ký tự";
    }
    
    if (!facilityFormData.khuvuc) {
      errors.khuvuc = "Khu vực là bắt buộc";
    }
    
    if (!facilityFormData.diachi_coso.trim()) {
      errors.diachi_coso = "Địa chỉ cơ sở là bắt buộc";
    } else if (facilityFormData.diachi_coso.length > 500) {
      errors.diachi_coso = "Địa chỉ cơ sở không được vượt quá 500 ký tự";
    }
    
    setFacilityFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFacilitySubmit = async (e) => {
    e.preventDefault();
    
    if (!validateFacilityForm()) {
      showToast("Vui lòng kiểm tra lại thông tin đã nhập", "error");
      return;
    }
    
    setFacilitiesLoading(true);
    setFacilityFormErrors({});
    
    try {
      const submitData = {
        idtruong: parseInt(facilityFormData.idtruong),
        ten_coso: facilityFormData.ten_coso.trim(),
        khuvuc: facilityFormData.khuvuc,
        diachi_coso: facilityFormData.diachi_coso.trim()
      };
      
      const url = editingFacility 
        ? `http://localhost:8000/api/admin/cosotruong/${editingFacility.id}`
        : "http://localhost:8000/api/admin/cosotruong";
      
      const method = editingFacility ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        const successMessage = editingFacility 
          ? "Cập nhật cơ sở thành công" 
          : "Thêm mới cơ sở thành công";
        
        showToast(successMessage, "success");
        
        setTimeout(() => {
          setShowFacilityModal(false);
          resetFacilityForm();
          loadFacilities(facilitiesPage, facilitiesSearchTerm, selectedUniversityId);
        }, 100);
      } else {
        if (data.errors) {
          const serverErrors = {};
          Object.keys(data.errors).forEach(key => {
            serverErrors[key] = Array.isArray(data.errors[key]) 
              ? data.errors[key][0] 
              : data.errors[key];
          });
          setFacilityFormErrors(serverErrors);
        }
        const errorMessage = data.message || "Có lỗi xảy ra";
        const errors = data.errors ? Object.values(data.errors).flat().join(", ") : "";
        showToast(errorMessage + (errors ? `: ${errors}` : ""), "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối: " + error.message, "error");
    } finally {
      setFacilitiesLoading(false);
    }
  };

  const handleFacilityDelete = async () => {
    if (!deleteFacilityId) return;
    
    setFacilitiesLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/admin/cosotruong/${deleteFacilityId}`, {
        method: "DELETE"
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast("Xóa cơ sở thành công", "success");
        setShowFacilityDeleteModal(false);
        setDeleteFacilityId(null);
        loadFacilities(facilitiesPage, facilitiesSearchTerm, selectedUniversityId);
      } else {
        showToast(data.message || "Có lỗi xảy ra khi xóa", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối: " + error.message, "error");
    } finally {
      setFacilitiesLoading(false);
    }
  };

  const handleFacilityBulkDelete = async () => {
    if (selectedFacilityIds.length === 0) {
      showToast("Vui lòng chọn ít nhất một cơ sở để xóa", "error");
      return;
    }
    
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedFacilityIds.length} cơ sở không?`)) {
      return;
    }
    
    setFacilitiesLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/admin/cosotruong/bulk", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedFacilityIds })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast(data.message || "Xóa thành công", "success");
        setSelectedFacilityIds([]);
        loadFacilities(facilitiesPage, facilitiesSearchTerm, selectedUniversityId);
      } else {
        showToast(data.message || "Có lỗi xảy ra khi xóa", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối: " + error.message, "error");
    } finally {
      setFacilitiesLoading(false);
    }
  };

  const handleFacilitySelectAll = (checked) => {
    if (checked) {
      setSelectedFacilityIds(facilities.map(f => f.id));
    } else {
      setSelectedFacilityIds([]);
    }
  };

  const handleFacilitySelect = (id, checked) => {
    if (checked) {
      setSelectedFacilityIds([...selectedFacilityIds, id]);
    } else {
      setSelectedFacilityIds(selectedFacilityIds.filter(i => i !== id));
    }
  };

  const openFacilityEditModal = (facility) => {
    setEditingFacility(facility);
    setFacilityFormData({
      idtruong: facility.idtruong.toString(),
      ten_coso: facility.ten_coso || "",
      khuvuc: facility.khuvuc || "Miền Bắc",
      diachi_coso: facility.diachi_coso || ""
    });
    setFacilityFormErrors({});
    setShowFacilityModal(true);
  };

  const resetFacilityForm = () => {
    setFacilityFormData({
      idtruong: selectedUniversityId || "",
      ten_coso: "",
      khuvuc: "Miền Bắc",
      diachi_coso: ""
    });
    setFacilityFormErrors({});
    setEditingFacility(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cập nhật trường đại học</h1>
      </div>

      {/* Tabs */}
      <div className="card p-0">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("universities")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "universities"
                ? "border-b-2 border-teal-600 text-teal-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Quản lý trường đại học
          </button>
          <button
            onClick={() => setActiveTab("facilities")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "facilities"
                ? "border-b-2 border-teal-600 text-teal-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Quản lý cơ sở
          </button>
        </div>
      </div>

      {/* Universities Tab */}
      {activeTab === "universities" && (
        <>
      {/* Search and Actions Bar */}
      <div className="card p-5">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearch} className="flex-1 w-full md:w-auto">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, mã trường, địa chỉ..."
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
                  onClick={() => {
                    setSearchTerm("");
                    loadUniversities(1, "");
                  }}
                  className="btn-outline"
                >
                  Xóa
                </button>
              )}
            </div>
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
            <label className="btn-outline cursor-pointer">
              📥 Nhập CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const form = new FormData();
                    form.append('file', file);
                    const res = await fetch('http://localhost:8000/api/admin/truongdaihoc/import', { method: 'POST', body: form });
                    const data = await res.json();
                    if (data.success) {
                      const s = data.summary || {};
                      showToast(`Nhập CSV thành công: thêm ${s.created||0}, cập nhật ${s.updated||0}, lỗi ${s.failed||0}`, 'success');
                      loadUniversities(1, searchTerm);
                    } else {
                      showToast(data.message || 'Nhập CSV thất bại', 'error');
                    }
                  } catch (err) {
                    showToast('Lỗi kết nối khi nhập CSV', 'error');
                  } finally {
                    e.target.value = '';
                  }
                }}
              />
            </label>
            <button
              onClick={exportData}
              className="btn-outline"
              disabled={loading}
            >
              📥 Xuất CSV
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="btn-outline bg-red-50 text-red-600 hover:bg-red-100"
                disabled={loading}
              >
                🗑️ Xóa ({selectedIds.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Universities Table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Danh sách trường đại học</h2>
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
                      checked={selectedIds.length === universities.length && universities.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-4 py-2 text-left">Mã trường</th>
                  <th className="px-4 py-2 text-left">Tên trường</th>
                  <th className="px-4 py-2 text-left">Địa chỉ</th>
                  <th className="px-4 py-2 text-left">Điện thoại</th>
                  <th className="px-4 py-2 text-left">Ngày thành lập</th>
                  <th className="px-4 py-2 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {universities.map((university) => (
                  <tr key={university.idtruong} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(university.idtruong)}
                        onChange={(e) => handleSelect(university.idtruong, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-2">{university.matruong}</td>
                    <td className="px-4 py-2">{university.tentruong}</td>
                    <td className="px-4 py-2">{university.diachi}</td>
                    <td className="px-4 py-2">{university.dienthoai || "-"}</td>
                    <td className="px-4 py-2">{formatDateForDisplay(university.ngaythanhlap)}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(university)}
                          className="px-3 py-1 text-sm bg-teal-50 text-teal-600 rounded hover:bg-teal-100"
                          title="Sửa"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(university.idtruong);
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
                {universities.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      Không tìm thấy dữ liệu
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
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
              onClick={() => loadUniversities(currentPage - 1, searchTerm)}
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
                  onClick={() => loadUniversities(p, searchTerm)}
                >
                  {p}
                </button>
              ))}
            <button
              className="btn-outline"
              disabled={currentPage === totalPages}
              onClick={() => loadUniversities(currentPage + 1, searchTerm)}
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        title={editingUniversity ? "Cập nhật trường đại học" : "Thêm trường đại học"}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Mã trường <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`input w-full ${formErrors.matruong ? 'border-red-500' : ''}`}
                value={formData.matruong}
                onChange={(e) => {
                  setFormData({ ...formData, matruong: e.target.value });
                  if (formErrors.matruong) {
                    setFormErrors({ ...formErrors, matruong: '' });
                  }
                }}
                placeholder="VD: DH001"
                maxLength={20}
              />
              {formErrors.matruong && (
                <p className="text-red-500 text-xs mt-1">{formErrors.matruong}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Tên trường <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`input w-full ${formErrors.tentruong ? 'border-red-500' : ''}`}
                value={formData.tentruong}
                onChange={(e) => {
                  setFormData({ ...formData, tentruong: e.target.value });
                  if (formErrors.tentruong) {
                    setFormErrors({ ...formErrors, tentruong: '' });
                  }
                }}
                placeholder="VD: Đại học Bách Khoa"
                maxLength={255}
              />
              {formErrors.tentruong && (
                <p className="text-red-500 text-xs mt-1">{formErrors.tentruong}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Địa chỉ <span className="text-red-500">*</span>
            </label>
            <textarea
              className={`input w-full ${formErrors.diachi ? 'border-red-500' : ''}`}
              rows="3"
              value={formData.diachi}
              onChange={(e) => {
                setFormData({ ...formData, diachi: e.target.value });
                if (formErrors.diachi) {
                  setFormErrors({ ...formErrors, diachi: '' });
                }
              }}
              placeholder="VD: 268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM"
              maxLength={500}
            />
            {formErrors.diachi && (
              <p className="text-red-500 text-xs mt-1">{formErrors.diachi}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.diachi.length}/500 ký tự
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Điện thoại</label>
              <input
                type="tel"
                className={`input w-full ${formErrors.dienthoai ? 'border-red-500' : ''}`}
                value={formData.dienthoai}
                onChange={(e) => {
                  setFormData({ ...formData, dienthoai: e.target.value });
                  if (formErrors.dienthoai) {
                    setFormErrors({ ...formErrors, dienthoai: '' });
                  }
                }}
                placeholder="VD: (028) 3865 2222"
                maxLength={20}
              />
              {formErrors.dienthoai && (
                <p className="text-red-500 text-xs mt-1">{formErrors.dienthoai}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số điện thoại</label>
              <input
                type="tel"
                className={`input w-full ${formErrors.sodienthoai ? 'border-red-500' : ''}`}
                value={formData.sodienthoai}
                onChange={(e) => {
                  setFormData({ ...formData, sodienthoai: e.target.value });
                  if (formErrors.sodienthoai) {
                    setFormErrors({ ...formErrors, sodienthoai: '' });
                  }
                }}
                placeholder="VD: 0123456789"
                maxLength={20}
              />
              {formErrors.sodienthoai && (
                <p className="text-red-500 text-xs mt-1">{formErrors.sodienthoai}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Liên hệ</label>
            <input
              type="text"
              className={`input w-full ${formErrors.lienhe ? 'border-red-500' : ''}`}
              value={formData.lienhe}
              onChange={(e) => {
                setFormData({ ...formData, lienhe: e.target.value });
                if (formErrors.lienhe) {
                  setFormErrors({ ...formErrors, lienhe: '' });
                }
              }}
              placeholder="VD: phòng Đào tạo"
              maxLength={255}
            />
            {formErrors.lienhe && (
              <p className="text-red-500 text-xs mt-1">{formErrors.lienhe}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ngày thành lập</label>
            <input
              type="date"
              className="input w-full"
              value={formData.ngaythanhlap}
              onChange={(e) => setFormData({ ...formData, ngaythanhlap: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-500 mt-1">
              Chọn ngày thành lập của trường
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              className={`input w-full ${formErrors.motantuong ? 'border-red-500' : ''}`}
              rows="4"
              value={formData.motantuong}
              onChange={(e) => {
                setFormData({ ...formData, motantuong: e.target.value });
                if (formErrors.motantuong) {
                  setFormErrors({ ...formErrors, motantuong: '' });
                }
              }}
              placeholder="Nhập mô tả về trường đại học..."
              maxLength={1000}
            />
            {formErrors.motantuong && (
              <p className="text-red-500 text-xs mt-1">{formErrors.motantuong}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.motantuong.length}/1000 ký tự
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
              {loading ? "Đang xử lý..." : editingUniversity ? "Cập nhật" : "Thêm mới"}
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
          <p>Bạn có chắc chắn muốn xóa trường đại học này không?</p>
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
        </>
      )}

      {/* Facilities Tab */}
      {activeTab === "facilities" && (
        <>
          {/* Filter and Actions Bar */}
          <div className="card p-5">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-4 flex-1">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Lọc theo trường</label>
                  <select
                    className="input w-full"
                    value={selectedUniversityId}
                    onChange={(e) => {
                      setSelectedUniversityId(e.target.value);
                      setFacilitiesPage(1);
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
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    loadFacilities(1, facilitiesSearchTerm, selectedUniversityId);
                  }}
                  className="flex-1"
                >
                  <label className="block text-sm font-medium mb-2">Tìm kiếm</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tìm kiếm cơ sở..."
                      className="input flex-1"
                      value={facilitiesSearchTerm}
                      onChange={(e) => setFacilitiesSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="btn-primary">
                      Tìm
                    </button>
                  </div>
                </form>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFacilityFormData({
                      idtruong: selectedUniversityId || "",
                      ten_coso: "",
                      khuvuc: "Miền Bắc",
                      diachi_coso: ""
                    });
                    setFacilityFormErrors({});
                    setEditingFacility(null);
                    setShowFacilityModal(true);
                  }}
                  className="btn-primary"
                  disabled={!selectedUniversityId}
                >
                  + Thêm cơ sở
                </button>
                {selectedFacilityIds.length > 0 && (
                  <button
                    onClick={handleFacilityBulkDelete}
                    className="btn-outline bg-red-50 text-red-600 hover:bg-red-100"
                    disabled={facilitiesLoading}
                  >
                    🗑️ Xóa ({selectedFacilityIds.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Facilities Table */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Danh sách cơ sở</h2>
              <div className="text-sm text-gray-500">
                Tổng: {facilitiesTotalRecords} | Trang: {facilitiesPage}/{facilitiesTotalPages}
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
                          checked={selectedFacilityIds.length === facilities.length && facilities.length > 0}
                          onChange={(e) => handleFacilitySelectAll(e.target.checked)}
                        />
                      </th>
                      <th className="px-4 py-2 text-left">Trường</th>
                      <th className="px-4 py-2 text-left">Tên cơ sở</th>
                      <th className="px-4 py-2 text-left">Khu vực</th>
                      <th className="px-4 py-2 text-left">Địa chỉ</th>
                      <th className="px-4 py-2 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facilities.map((facility) => (
                      <tr key={facility.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedFacilityIds.includes(facility.id)}
                            onChange={(e) => handleFacilitySelect(facility.id, e.target.checked)}
                          />
                        </td>
                        <td className="px-4 py-2">{facility.tentruong || `ID: ${facility.idtruong}`}</td>
                        <td className="px-4 py-2">{facility.ten_coso}</td>
                        <td className="px-4 py-2">{facility.khuvuc}</td>
                        <td className="px-4 py-2">{facility.diachi_coso}</td>
                        <td className="px-4 py-2">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openFacilityEditModal(facility)}
                              className="px-3 py-1 text-sm bg-teal-50 text-teal-600 rounded hover:bg-teal-100"
                              title="Sửa"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => {
                                setDeleteFacilityId(facility.id);
                                setShowFacilityDeleteModal(true);
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
                    {facilities.length === 0 && !facilitiesLoading && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                          Không tìm thấy dữ liệu
                        </td>
                      </tr>
                    )}
                    {facilitiesLoading && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                          Đang tải...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {facilitiesTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  className="btn-outline"
                  disabled={facilitiesPage === 1}
                  onClick={() => loadFacilities(facilitiesPage - 1, facilitiesSearchTerm, selectedUniversityId)}
                >
                  Trước
                </button>
                {Array.from({ length: facilitiesTotalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, facilitiesPage - 3), Math.max(0, facilitiesPage - 3) + 5)
                  .map((p) => (
                    <button
                      key={p}
                      className={`px-3 py-1 rounded ${
                        p === facilitiesPage ? "bg-teal-600 text-white" : "bg-gray-200"
                      }`}
                      onClick={() => loadFacilities(p, facilitiesSearchTerm, selectedUniversityId)}
                    >
                      {p}
                    </button>
                  ))}
                <button
                  className="btn-outline"
                  disabled={facilitiesPage === facilitiesTotalPages}
                  onClick={() => loadFacilities(facilitiesPage + 1, facilitiesSearchTerm, selectedUniversityId)}
                >
                  Sau
                </button>
              </div>
            )}
          </div>

          {/* Facility Add/Edit Modal */}
          <Modal
            open={showFacilityModal}
            title={editingFacility ? "Cập nhật cơ sở" : "Thêm cơ sở"}
            onClose={() => {
              setShowFacilityModal(false);
              resetFacilityForm();
            }}
          >
            <form onSubmit={handleFacilitySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Trường đại học <span className="text-red-500">*</span>
                </label>
                <select
                  className={`input w-full ${facilityFormErrors.idtruong ? 'border-red-500' : ''}`}
                  value={facilityFormData.idtruong}
                  onChange={(e) => {
                    setFacilityFormData({ ...facilityFormData, idtruong: e.target.value });
                    if (facilityFormErrors.idtruong) {
                      setFacilityFormErrors({ ...facilityFormErrors, idtruong: '' });
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
                {facilityFormErrors.idtruong && (
                  <p className="text-red-500 text-xs mt-1">{facilityFormErrors.idtruong}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên cơ sở <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`input w-full ${facilityFormErrors.ten_coso ? 'border-red-500' : ''}`}
                  value={facilityFormData.ten_coso}
                  onChange={(e) => {
                    setFacilityFormData({ ...facilityFormData, ten_coso: e.target.value });
                    if (facilityFormErrors.ten_coso) {
                      setFacilityFormErrors({ ...facilityFormErrors, ten_coso: '' });
                    }
                  }}
                  placeholder="VD: Cơ sở chính, Cơ sở 2..."
                  required
                  maxLength={255}
                />
                {facilityFormErrors.ten_coso && (
                  <p className="text-red-500 text-xs mt-1">{facilityFormErrors.ten_coso}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Khu vực <span className="text-red-500">*</span>
                </label>
                <select
                  className={`input w-full ${facilityFormErrors.khuvuc ? 'border-red-500' : ''}`}
                  value={facilityFormData.khuvuc}
                  onChange={(e) => {
                    setFacilityFormData({ ...facilityFormData, khuvuc: e.target.value });
                    if (facilityFormErrors.khuvuc) {
                      setFacilityFormErrors({ ...facilityFormErrors, khuvuc: '' });
                    }
                  }}
                  required
                >
                  <option value="Miền Bắc">Miền Bắc</option>
                  <option value="Miền Trung">Miền Trung</option>
                  <option value="Miền Nam">Miền Nam</option>
                </select>
                {facilityFormErrors.khuvuc && (
                  <p className="text-red-500 text-xs mt-1">{facilityFormErrors.khuvuc}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Địa chỉ cơ sở <span className="text-red-500">*</span>
                </label>
                <textarea
                  className={`input w-full ${facilityFormErrors.diachi_coso ? 'border-red-500' : ''}`}
                  rows="3"
                  value={facilityFormData.diachi_coso}
                  onChange={(e) => {
                    setFacilityFormData({ ...facilityFormData, diachi_coso: e.target.value });
                    if (facilityFormErrors.diachi_coso) {
                      setFacilityFormErrors({ ...facilityFormErrors, diachi_coso: '' });
                    }
                  }}
                  placeholder="VD: 144 Xuân Thủy, Cầu Giấy, Hà Nội"
                  required
                  maxLength={500}
                />
                {facilityFormErrors.diachi_coso && (
                  <p className="text-red-500 text-xs mt-1">{facilityFormErrors.diachi_coso}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {facilityFormData.diachi_coso.length}/500 ký tự
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowFacilityModal(false);
                    resetFacilityForm();
                  }}
                  className="btn-outline"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={facilitiesLoading}
                  className="btn-primary"
                >
                  {facilitiesLoading ? "Đang xử lý..." : editingFacility ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </Modal>

          {/* Facility Delete Modal */}
          <Modal
            open={showFacilityDeleteModal}
            title="Xác nhận xóa"
            onClose={() => setShowFacilityDeleteModal(false)}
          >
            <div className="space-y-4">
              <p>Bạn có chắc chắn muốn xóa cơ sở này không?</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowFacilityDeleteModal(false)}
                  className="btn-outline"
                >
                  Hủy
                </button>
                <button
                  onClick={handleFacilityDelete}
                  disabled={facilitiesLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {facilitiesLoading ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </Modal>
        </>
      )}

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

