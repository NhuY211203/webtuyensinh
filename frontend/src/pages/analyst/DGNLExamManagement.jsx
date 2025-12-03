import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";

export default function DGNLExamManagement() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [filters, setFilters] = useState({
    keyword: "",
    to_chuc: "",
  });

  const [formData, setFormData] = useState({
    makythi: "",
    tenkythi: "",
    to_chuc: "",
    so_cau: "",
    thoi_luong_phut: "",
    hinh_thuc: "",
    mo_ta_tong_quat: "",
    ghi_chu: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadExams();
  }, [filters.keyword, filters.to_chuc]);

  const loadExams = async () => {
    setLoading(true);
    try {
      const res = await api.getDGNLExams(filters);
      if (res?.success) {
        setExams(res.data || []);
      } else {
        showToast("Không thể tải danh sách kỳ thi", "error");
      }
    } catch (e) {
      console.error("Failed to load exams", e);
      setExams([]);
      showToast("Không thể tải danh sách kỳ thi", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormErrors({});
    setFormData({
      makythi: "",
      tenkythi: "",
      to_chuc: "",
      so_cau: "",
      thoi_luong_phut: "",
      hinh_thuc: "",
      mo_ta_tong_quat: "",
      ghi_chu: "",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormErrors({});
    setFormData({
      makythi: item.makythi || "",
      tenkythi: item.tenkythi || "",
      to_chuc: item.to_chuc || "",
      so_cau: item.so_cau?.toString() || "",
      thoi_luong_phut: item.thoi_luong_phut?.toString() || "",
      hinh_thuc: item.hinh_thuc || "",
      mo_ta_tong_quat: item.mo_ta_tong_quat || "",
      ghi_chu: item.ghi_chu || "",
    });
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.makythi.trim()) {
      errors.makythi = "Mã kỳ thi là bắt buộc";
    }
    if (!formData.tenkythi.trim()) {
      errors.tenkythi = "Tên kỳ thi là bắt buộc";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Vui lòng kiểm tra lại thông tin", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        makythi: formData.makythi.trim(),
        tenkythi: formData.tenkythi.trim(),
        to_chuc: formData.to_chuc || null,
        so_cau: formData.so_cau ? Number(formData.so_cau) : null,
        thoi_luong_phut: formData.thoi_luong_phut ? Number(formData.thoi_luong_phut) : null,
        hinh_thuc: formData.hinh_thuc || null,
        mo_ta_tong_quat: formData.mo_ta_tong_quat || null,
        ghi_chu: formData.ghi_chu || null,
      };

      let res;
      if (editingItem) {
        res = await api.updateDGNLExam(editingItem.idkythi, payload);
      } else {
        res = await api.createDGNLExam(payload);
      }

      if (res?.success) {
        showToast(
          editingItem ? "Cập nhật kỳ thi thành công" : "Tạo kỳ thi thành công",
          "success"
        );
        setShowModal(false);
        resetForm();
        await loadExams();
      } else {
        showToast(res?.message || "Không thể lưu kỳ thi", "error");
      }
    } catch (e) {
      console.error("Failed to save exam", e);
      showToast(e?.message || "Không thể lưu kỳ thi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa kỳ thi này?")) return;
    setLoading(true);
    try {
      const res = await api.deleteDGNLExam(id);
      if (res?.success) {
        showToast("Xóa kỳ thi thành công", "success");
        await loadExams();
      } else {
        showToast(res?.message || "Không thể xóa kỳ thi", "error");
      }
    } catch (e) {
      console.error("Failed to delete exam", e);
      showToast(e?.message || "Không thể xóa kỳ thi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id) => {
    if (!window.confirm("Bạn có muốn tạo bản sao của kỳ thi này?")) return;
    setLoading(true);
    try {
      const res = await api.duplicateDGNLExam(id);
      if (res?.success) {
        showToast("Sao chép kỳ thi thành công", "success");
        await loadExams();
      } else {
        showToast(res?.message || "Không thể sao chép kỳ thi", "error");
      }
    } catch (e) {
      console.error("Failed to duplicate exam", e);
      showToast(e?.message || "Không thể sao chép kỳ thi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await api.downloadDGNLTemplate();
      showToast("Đã tải template thành công", "success");
    } catch (e) {
      showToast("Không thể tải template", "error");
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Quản lý bài thi ĐGNL</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Quản lý các kỳ thi ĐGNL, sections, câu hỏi và đáp án
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            className="btn-outline w-full sm:w-auto"
            onClick={handleDownloadTemplate}
          >
            📥 Tải template
          </button>
          <button type="button" className="btn-primary w-full sm:w-auto" onClick={openCreateModal}>
            + Thêm kỳ thi
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Tìm kiếm</label>
            <input
              className="input w-full"
              placeholder="Mã kỳ thi, tên kỳ thi, tổ chức..."
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tổ chức</label>
            <input
              className="input w-full"
              placeholder="Lọc theo tổ chức..."
              value={filters.to_chuc}
              onChange={(e) => setFilters({ ...filters, to_chuc: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="btn-outline w-full"
              onClick={() => setFilters({ keyword: "", to_chuc: "" })}
            >
              🔄 Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="font-semibold">Danh sách kỳ thi ĐGNL</h2>
          <div className="text-sm text-gray-500">Tổng: {exams.length} kỳ thi</div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 sm:px-3 py-2 text-left">Mã kỳ thi</th>
                    <th className="px-2 sm:px-3 py-2 text-left">Tên kỳ thi</th>
                    <th className="px-2 sm:px-3 py-2 text-left hidden sm:table-cell">Tổ chức</th>
                    <th className="px-2 sm:px-3 py-2 text-center">Số câu</th>
                    <th className="px-2 sm:px-3 py-2 text-center hidden md:table-cell">Sections</th>
                    <th className="px-2 sm:px-3 py-2 text-center hidden lg:table-cell">Thời lượng</th>
                    <th className="px-2 sm:px-3 py-2 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam.idkythi} className="border-t">
                      <td className="px-2 sm:px-3 py-2 font-semibold">{exam.makythi}</td>
                      <td className="px-2 sm:px-3 py-2">
                        <div className="font-medium break-words max-w-[200px]">{exam.tenkythi}</div>
                        <div className="text-xs text-gray-500 sm:hidden mt-1">{exam.to_chuc || "—"}</div>
                      </td>
                      <td className="px-2 sm:px-3 py-2 hidden sm:table-cell">{exam.to_chuc || "—"}</td>
                      <td className="px-2 sm:px-3 py-2 text-center">
                        {exam.tong_so_cau_hoi || 0}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-center hidden md:table-cell">
                        {exam.tong_so_section || 0}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-center hidden lg:table-cell">
                        {exam.thoi_luong_phut ? `${exam.thoi_luong_phut} phút` : "—"}
                      </td>
                      <td className="px-2 sm:px-3 py-2">
                        <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                          <button
                            onClick={() => navigate(`/analyst/dgnl-exams/${exam.idkythi}`)}
                            className="px-2 sm:px-3 py-1 text-xs rounded bg-blue-50 text-blue-700 hover:bg-blue-100 whitespace-nowrap"
                            title="Xem chi tiết"
                          >
                            👁️
                          </button>
                          <button
                            type="button"
                            className="px-2 sm:px-3 py-1 text-xs rounded bg-teal-50 text-teal-700 hover:bg-teal-100 whitespace-nowrap"
                            onClick={() => openEditModal(exam)}
                            title="Sửa"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="px-2 sm:px-3 py-1 text-xs rounded bg-purple-50 text-purple-700 hover:bg-purple-100 whitespace-nowrap"
                            onClick={() => handleDuplicate(exam.idkythi)}
                            title="Sao chép"
                          >
                            📋
                          </button>
                          <button
                            type="button"
                            className="px-2 sm:px-3 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100 whitespace-nowrap"
                            onClick={() => handleDelete(exam.idkythi)}
                            title="Xóa"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {exams.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                        Chưa có kỳ thi nào. Hãy thêm kỳ thi mới.
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                        Đang tải...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        title={editingItem ? "Cập nhật kỳ thi ĐGNL" : "Thêm kỳ thi ĐGNL mới"}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Mã kỳ thi <span className="text-red-500">*</span>
              </label>
              <input
                className={`input w-full ${formErrors.makythi ? "border-red-500" : ""}`}
                value={formData.makythi}
                onChange={(e) => setFormData({ ...formData, makythi: e.target.value })}
                placeholder="VD: DGNL_2025_01"
                required
                disabled={!!editingItem}
              />
              {formErrors.makythi && (
                <p className="text-xs text-red-500 mt-1">{formErrors.makythi}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Tên kỳ thi <span className="text-red-500">*</span>
              </label>
              <input
                className={`input w-full ${formErrors.tenkythi ? "border-red-500" : ""}`}
                value={formData.tenkythi}
                onChange={(e) => setFormData({ ...formData, tenkythi: e.target.value })}
                placeholder="VD: ĐGNL ĐHQG-HCM 2025"
                required
              />
              {formErrors.tenkythi && (
                <p className="text-xs text-red-500 mt-1">{formErrors.tenkythi}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tổ chức</label>
              <input
                className="input w-full"
                value={formData.to_chuc}
                onChange={(e) => setFormData({ ...formData, to_chuc: e.target.value })}
                placeholder="VD: ĐHQG-HCM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số câu</label>
              <input
                type="number"
                className="input w-full"
                value={formData.so_cau}
                onChange={(e) => setFormData({ ...formData, so_cau: e.target.value })}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Thời lượng (phút)</label>
              <input
                type="number"
                className="input w-full"
                value={formData.thoi_luong_phut}
                onChange={(e) => setFormData({ ...formData, thoi_luong_phut: e.target.value })}
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Hình thức</label>
            <input
              className="input w-full"
              value={formData.hinh_thuc}
              onChange={(e) => setFormData({ ...formData, hinh_thuc: e.target.value })}
              placeholder="VD: Trực tuyến, Trực tiếp..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả tổng quan</label>
            <textarea
              className="input w-full"
              rows={3}
              value={formData.mo_ta_tong_quat}
              onChange={(e) => setFormData({ ...formData, mo_ta_tong_quat: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú</label>
            <textarea
              className="input w-full"
              rows={2}
              value={formData.ghi_chu}
              onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              className="btn-outline w-full sm:w-auto"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Hủy
            </button>
            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
              {loading ? "Đang lưu..." : editingItem ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: "", type: "success" })}
      />
    </div>
  );
}

