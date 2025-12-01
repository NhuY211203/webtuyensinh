import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";

export default function AdmissionProjectManagement() {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);

  const [schools, setSchools] = useState([]);
  const [years, setYears] = useState([]);

  const [filters, setFilters] = useState({
    keyword: "",
    idtruong: "",
    nam_tuyen_sinh: "",
    trang_thai: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    idtruong: "",
    nam_tuyen_sinh: "",
    tieu_de: "",
    thong_tin_tom_tat: "",
    thong_tin_day_du: "",
    file_pdf_url: "",
    trang_thai: 1,
  });
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Load dropdowns
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [schoolsRes, yearRes] = await Promise.all([
          api.getSchools({ perPage: 500 }),
          api.get("/years"),
        ]);

        const s = Array.isArray(schoolsRes?.data) ? schoolsRes.data : [];
        setSchools(s);

        let ys = Array.isArray(yearRes?.data) ? yearRes.data : [];
        // Fallback nếu API /years không có dữ liệu
        if (!ys.length) {
          ys = [
            { value: "2026", label: "2026" },
            { value: "2025", label: "2025" },
            { value: "2024", label: "2024" },
            { value: "2023", label: "2023" },
            { value: "2022", label: "2022" },
            { value: "2021", label: "2021" },
            { value: "2020", label: "2020" },
          ];
        }
        setYears(ys);
      } catch (e) {
        console.error("Failed to load meta for admission projects", e);
        // Nếu lỗi API, vẫn cung cấp danh sách năm mặc định
        setYears([
          { value: "2026", label: "2026" },
          { value: "2025", label: "2025" },
          { value: "2024", label: "2024" },
          { value: "2023", label: "2023" },
          { value: "2022", label: "2022" },
          { value: "2021", label: "2021" },
          { value: "2020", label: "2020" },
        ]);
      }
    };
    loadMeta();
  }, []);

  // Load projects when filters change
  useEffect(() => {
    loadProjects(1);
  }, [filters.idtruong, filters.nam_tuyen_sinh, filters.trang_thai, filters.keyword]);

  const buildQuery = (page) => {
    const params = {
      page,
      per_page: 20,
    };
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.idtruong) params.idtruong = filters.idtruong;
    if (filters.nam_tuyen_sinh) params.nam_tuyen_sinh = filters.nam_tuyen_sinh;
    if (filters.trang_thai !== "" && filters.trang_thai !== null) {
      params.trang_thai = filters.trang_thai;
    }
    return params;
  };

  const loadProjects = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.getAdmissionProjects(buildQuery(page));
      const list = Array.isArray(res?.data) ? res.data : [];
      setProjects(list);
      setPagination(res?.pagination || null);
    } catch (e) {
      console.error("Failed to load admission projects", e);
      setProjects([]);
      setPagination(null);
      showToast("Không thể tải danh sách đề án", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormErrors({});
    setFormData({
      idtruong: "",
      nam_tuyen_sinh: "",
      tieu_de: "",
      thong_tin_tom_tat: "",
      thong_tin_day_du: "",
      file_pdf_url: "",
      trang_thai: 1,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      idtruong: item.idtruong?.toString() || "",
      nam_tuyen_sinh: item.nam_tuyen_sinh?.toString() || "",
      tieu_de: item.tieu_de || "",
      thong_tin_tom_tat: item.thong_tin_tom_tat || "",
      thong_tin_day_du: item.thong_tin_day_du || "",
      file_pdf_url: item.file_pdf_url || "",
      trang_thai: item.trang_thai ?? 1,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.idtruong) errors.idtruong = "Bắt buộc chọn trường";
    if (!formData.nam_tuyen_sinh) errors.nam_tuyen_sinh = "Bắt buộc chọn năm tuyển sinh";
    if (!formData.tieu_de.trim()) errors.tieu_de = "Tiêu đề đề án là bắt buộc";
    if (formData.file_pdf_url && !/^https?:\/\//i.test(formData.file_pdf_url)) {
      errors.file_pdf_url = "Đường dẫn PDF phải là URL hợp lệ (bắt đầu bằng http hoặc https)";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Vui lòng kiểm tra lại thông tin đề án", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        idtruong: parseInt(formData.idtruong, 10),
        nam_tuyen_sinh: parseInt(formData.nam_tuyen_sinh, 10),
        tieu_de: formData.tieu_de.trim(),
        thong_tin_tom_tat: formData.thong_tin_tom_tat || null,
        thong_tin_day_du: formData.thong_tin_day_du || null,
        file_pdf_url: formData.file_pdf_url || null,
        trang_thai: Number(formData.trang_thai),
      };

      let res;
      if (editingItem) {
        res = await api.updateAdmissionProject(editingItem.idde_an, payload);
      } else {
        res = await api.createAdmissionProject(payload);
      }

      if (res?.success) {
        showToast(editingItem ? "Cập nhật đề án thành công" : "Thêm đề án mới thành công", "success");
        setShowModal(false);
        resetForm();
        await loadProjects(pagination?.current_page || 1);
      } else {
        showToast(res?.message || "Có lỗi xảy ra khi lưu đề án", "error");
      }
    } catch (e) {
      console.error("Failed to save admission project", e);
      const msg = e?.response?.data?.message || e.message || "Có lỗi xảy ra khi lưu đề án";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đề án tuyển sinh này?")) return;
    setLoading(true);
    try {
      const res = await api.deleteAdmissionProject(id);
      if (res?.success) {
        showToast("Xóa đề án thành công", "success");
        await loadProjects(pagination?.current_page || 1);
      } else {
        showToast(res?.message || "Không thể xóa đề án", "error");
      }
    } catch (e) {
      console.error("Failed to delete admission project", e);
      showToast(e?.message || "Không thể xóa đề án", "error");
    } finally {
      setLoading(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý đề án tuyển sinh</h1>
          <p className="text-sm text-slate-600 mt-1">
            Thêm đề án cho từng trường/năm, sau đó bấm <strong>PT</strong> để khai báo
            phương thức và <strong>Ngành</strong> cho từng phương thức. Các bảng phụ
            (hồ sơ, quy đổi, xét tuyển thẳng…) sẽ lấy dữ liệu dựa trên đề án này.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-5 space-y-4">
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Trường</label>
            <select
              className="input"
              value={filters.idtruong}
              onChange={(e) => handleFilterChange("idtruong", e.target.value)}
            >
              <option value="">Tất cả</option>
              {schools.map((s) => (
                <option key={s.idtruong} value={s.idtruong}>
                  {s.tentruong}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Năm tuyển sinh</label>
            <select
              className="input"
              value={filters.nam_tuyen_sinh}
              onChange={(e) => handleFilterChange("nam_tuyen_sinh", e.target.value)}
            >
              <option value="">Tất cả</option>
              {years.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Trạng thái</label>
            <select
              className="input"
              value={filters.trang_thai}
              onChange={(e) => handleFilterChange("trang_thai", e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="1">Đang áp dụng</option>
              <option value="0">Ngưng áp dụng</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Từ khóa</label>
            <input
              className="input"
              placeholder="Tìm theo tiêu đề, tóm tắt..."
              value={filters.keyword}
              onChange={(e) => handleFilterChange("keyword", e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn-outline"
            onClick={() =>
              setFilters({
                keyword: "",
                idtruong: "",
                nam_tuyen_sinh: "",
                trang_thai: "",
              })
            }
          >
            🔄 Làm mới
          </button>
          <button type="button" className="btn-primary" onClick={openCreateModal}>
            + Thêm đề án
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Danh sách đề án tuyển sinh</h2>
          <div className="text-sm text-gray-500">
            Tổng: {pagination?.total ?? projects.length}{" "}
            {pagination && `| Trang: ${pagination.current_page}/${pagination.last_page}`}
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Trường</th>
                  <th className="px-3 py-2 text-left">Năm</th>
                  <th className="px-3 py-2 text-left">Tiêu đề</th>
                  <th className="px-3 py-2 text-center">Số PT</th>
                  <th className="px-3 py-2 text-center">Trạng thái</th>
                  <th className="px-3 py-2 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.idde_an} className="border-t">
                    <td className="px-3 py-2">
                      {p.truong?.tentruong ||
                        schools.find((s) => s.idtruong === p.idtruong)?.tentruong ||
                        `ID: ${p.idtruong}`}
                    </td>
                    <td className="px-3 py-2">{p.nam_tuyen_sinh}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium line-clamp-2">{p.tieu_de}</div>
                      {p.thong_tin_tom_tat && (
                        <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                          {p.thong_tin_tom_tat}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {p.phuong_thuc_chi_tiet_count ?? p.so_phuong_thuc ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.trang_thai === 1
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {p.trang_thai === 1 ? "Đang áp dụng" : "Ngưng áp dụng"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        <Link
                          to={`/analyst/admission-projects/${p.idde_an}/methods`}
                          className="px-3 py-1 text-xs rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          PT
                        </Link>
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded bg-teal-50 text-teal-700 hover:bg-teal-100"
                          onClick={() => openEditModal(p)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100"
                          onClick={() => handleDelete(p.idde_an)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                      <div className="space-y-1">
                        <p>Chưa có đề án nào cho hệ thống.</p>
                        <p>
                          1) Bấm <strong>+ Thêm đề án</strong> để tạo đề án cho từng trường/năm.{" "}
                          2) Tại cột Thao tác, dùng nút <strong>PT</strong> để
                          quản lý phương thức và nút <strong>Ngành</strong> để cấu hình
                          ngành áp dụng. 3) Sau khi hoàn tất, dữ liệu sẽ hiển thị cho các
                          trang tra cứu của người dùng.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                      Đang tải...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              className="btn-outline"
              disabled={pagination.current_page <= 1}
              onClick={() => loadProjects(pagination.current_page - 1)}
            >
              Trước
            </button>
            {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
              .slice(
                Math.max(0, (pagination.current_page || 1) - 3),
                Math.max(0, (pagination.current_page || 1) - 3) + 5
              )
              .map((p) => (
                <button
                  key={p}
                  className={`px-3 py-1 rounded ${
                    p === pagination.current_page ? "bg-teal-600 text-white" : "bg-gray-200"
                  }`}
                  onClick={() => loadProjects(p)}
                >
                  {p}
                </button>
              ))}
            <button
              className="btn-outline"
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => loadProjects(pagination.current_page + 1)}
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={showModal}
        title={editingItem ? "Cập nhật đề án tuyển sinh" : "Thêm đề án tuyển sinh"}
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
                className={`input w-full ${formErrors.idtruong ? "border-red-500" : ""}`}
                value={formData.idtruong}
                onChange={(e) => setFormData({ ...formData, idtruong: e.target.value })}
                required
              >
                <option value="">Chọn trường</option>
                {schools.map((s) => (
                  <option key={s.idtruong} value={s.idtruong}>
                    {s.tentruong}
                  </option>
                ))}
              </select>
              {formErrors.idtruong && (
                <p className="text-xs text-red-500 mt-1">{formErrors.idtruong}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Năm tuyển sinh <span className="text-red-500">*</span>
              </label>
              <select
                className={`input w-full ${formErrors.nam_tuyen_sinh ? "border-red-500" : ""}`}
                value={formData.nam_tuyen_sinh}
                onChange={(e) => setFormData({ ...formData, nam_tuyen_sinh: e.target.value })}
                required
              >
                <option value="">Chọn năm</option>
                {years.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
              {formErrors.nam_tuyen_sinh && (
                <p className="text-xs text-red-500 mt-1">{formErrors.nam_tuyen_sinh}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tiêu đề đề án <span className="text-red-500">*</span>
            </label>
            <input
              className={`input w-full ${formErrors.tieu_de ? "border-red-500" : ""}`}
              value={formData.tieu_de}
              onChange={(e) => setFormData({ ...formData, tieu_de: e.target.value })}
              placeholder="VD: ĐỀ ÁN TUYỂN SINH ĐẠI HỌC KINH TẾ QUỐC DÂN 2026"
              maxLength={500}
              required
            />
            {formErrors.tieu_de && (
              <p className="text-xs text-red-500 mt-1">{formErrors.tieu_de}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Thông tin tóm tắt</label>
            <textarea
              className="input w-full"
              rows={3}
              value={formData.thong_tin_tom_tat}
              onChange={(e) => setFormData({ ...formData, thong_tin_tom_tat: e.target.value })}
              placeholder="Mô tả ngắn về đề án, điểm nổi bật..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Thông tin đầy đủ</label>
            <textarea
              className="input w-full"
              rows={4}
              value={formData.thong_tin_day_du}
              onChange={(e) => setFormData({ ...formData, thong_tin_day_du: e.target.value })}
              placeholder="Thông tin chi tiết về quy chế, đối tượng, điều kiện..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Link file PDF đề án</label>
              <input
                className={`input w-full ${formErrors.file_pdf_url ? "border-red-500" : ""}`}
                value={formData.file_pdf_url}
                onChange={(e) => setFormData({ ...formData, file_pdf_url: e.target.value })}
                placeholder="https://..."
              />
              {formErrors.file_pdf_url && (
                <p className="text-xs text-red-500 mt-1">{formErrors.file_pdf_url}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trạng thái</label>
              <select
                className="input w-full"
                value={formData.trang_thai}
                onChange={(e) =>
                  setFormData({ ...formData, trang_thai: Number(e.target.value) })
                }
              >
                <option value={1}>Đang áp dụng</option>
                <option value={0}>Ngưng áp dụng</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Hủy
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
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


