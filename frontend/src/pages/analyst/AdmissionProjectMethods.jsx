import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";

export default function AdmissionProjectMethods() {
  const { id } = useParams(); // idde_an
  const navigate = useNavigate();
  const projectId = Number(id);

  const [project, setProject] = useState(null);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [formData, setFormData] = useState({
    ma_phuong_thuc: "",
    ten_phuong_thuc: "",
    thu_tu_hien_thi: "",
    doi_tuong: "",
    dieu_kien_xet_tuyen: "",
    cong_thuc_tinh_diem: "",
    mo_ta_quy_che: "",
    thoi_gian_bat_dau: "",
    thoi_gian_ket_thuc: "",
    ghi_chu: "",
    trang_thai: 1,
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!projectId) return;
    loadProject();
    loadMethods();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const res = await api.getAdmissionProjectDetail(projectId);
      if (res?.success) {
        setProject(res.data);
      } else {
        showToast("Không tìm thấy đề án tuyển sinh", "error");
      }
    } catch (e) {
      console.error("Failed to load project detail", e);
      showToast("Không thể tải thông tin đề án", "error");
    }
  };

  const loadMethods = async () => {
    setLoading(true);
    try {
      const res = await api.getProjectMethods(projectId);
      const list = Array.isArray(res?.data) ? res.data : [];
      setMethods(list);
    } catch (e) {
      console.error("Failed to load project methods", e);
      setMethods([]);
      showToast("Không thể tải danh sách phương thức", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormErrors({});
    setFormData({
      ma_phuong_thuc: "",
      ten_phuong_thuc: "",
      thu_tu_hien_thi: "",
      doi_tuong: "",
      dieu_kien_xet_tuyen: "",
      cong_thuc_tinh_diem: "",
      mo_ta_quy_che: "",
      thoi_gian_bat_dau: "",
      thoi_gian_ket_thuc: "",
      ghi_chu: "",
      trang_thai: 1,
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
      ma_phuong_thuc: item.ma_phuong_thuc || "",
      ten_phuong_thuc: item.ten_phuong_thuc || "",
      thu_tu_hien_thi: item.thu_tu_hien_thi?.toString() || "",
      doi_tuong: item.doi_tuong || "",
      dieu_kien_xet_tuyen: item.dieu_kien_xet_tuyen || "",
      cong_thuc_tinh_diem: item.cong_thuc_tinh_diem || "",
      mo_ta_quy_che: item.mo_ta_quy_che || "",
      thoi_gian_bat_dau: item.thoi_gian_bat_dau
        ? item.thoi_gian_bat_dau.slice(0, 16)
        : "",
      thoi_gian_ket_thuc: item.thoi_gian_ket_thuc
        ? item.thoi_gian_ket_thuc.slice(0, 16)
        : "",
      ghi_chu: item.ghi_chu || "",
      trang_thai: item.trang_thai ?? 1,
    });
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.ma_phuong_thuc.trim()) {
      errors.ma_phuong_thuc = "Mã phương thức là bắt buộc";
    }
    if (!formData.ten_phuong_thuc.trim()) {
      errors.ten_phuong_thuc = "Tên phương thức là bắt buộc";
    }
    if (
      formData.thoi_gian_bat_dau &&
      formData.thoi_gian_ket_thuc &&
      new Date(formData.thoi_gian_ket_thuc) < new Date(formData.thoi_gian_bat_dau)
    ) {
      errors.thoi_gian_ket_thuc = "Thời gian kết thúc phải >= thời gian bắt đầu";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Vui lòng kiểm tra lại thông tin phương thức", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        idde_an: projectId,
        ma_phuong_thuc: formData.ma_phuong_thuc.trim(),
        ten_phuong_thuc: formData.ten_phuong_thuc.trim(),
        thu_tu_hien_thi: formData.thu_tu_hien_thi
          ? Number(formData.thu_tu_hien_thi)
          : null,
        doi_tuong: formData.doi_tuong || null,
        dieu_kien_xet_tuyen: formData.dieu_kien_xet_tuyen || null,
        cong_thuc_tinh_diem: formData.cong_thuc_tinh_diem || null,
        mo_ta_quy_che: formData.mo_ta_quy_che || null,
        thoi_gian_bat_dau: formData.thoi_gian_bat_dau || null,
        thoi_gian_ket_thuc: formData.thoi_gian_ket_thuc || null,
        ghi_chu: formData.ghi_chu || null,
        trang_thai: Number(formData.trang_thai),
      };

      let res;
      if (editingItem) {
        res = await api.updateProjectMethod(editingItem.idphuong_thuc_chi_tiet, payload);
      } else {
        res = await api.createProjectMethod(payload);
      }

      if (res?.success) {
        showToast(
          editingItem
            ? "Cập nhật phương thức tuyển sinh thành công"
            : "Thêm phương thức tuyển sinh thành công",
          "success"
        );
        setShowModal(false);
        resetForm();
        await loadMethods();
      } else {
        showToast(res?.message || "Không thể lưu phương thức", "error");
      }
    } catch (e) {
      console.error("Failed to save project method", e);
      showToast(e?.message || "Không thể lưu phương thức", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (idphuong_thuc_chi_tiet) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phương thức này?")) return;
    setLoading(true);
    try {
      const res = await api.deleteProjectMethod(idphuong_thuc_chi_tiet);
      if (res?.success) {
        showToast("Xóa phương thức tuyển sinh thành công", "success");
        await loadMethods();
      } else {
        showToast(res?.message || "Không thể xóa phương thức", "error");
      }
    } catch (e) {
      console.error("Failed to delete project method", e);
      showToast(e?.message || "Không thể xóa phương thức", "error");
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
          <button
            type="button"
            className="text-sm text-slate-600 hover:text-teal-600"
            onClick={() => navigate("/analyst/admission-projects")}
          >
            ← Quay lại danh sách đề án
          </button>
          <h1 className="text-2xl font-bold mt-2">Phương thức tuyển sinh</h1>
          {project && (
            <p className="text-sm text-slate-600 mt-1">
              Đề án: <span className="font-semibold">{project.tieu_de}</span> • Năm{" "}
              {project.nam_tuyen_sinh}
            </p>
          )}
        </div>
        <button type="button" className="btn-primary" onClick={openCreateModal}>
          + Thêm phương thức
        </button>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Danh sách phương thức tuyển sinh</h2>
          <div className="text-sm text-gray-500">
            Tổng: {methods.length} phương thức
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Mã PT</th>
                  <th className="px-3 py-2 text-left">Tên phương thức</th>
                  <th className="px-3 py-2 text-left">Thời gian</th>
                  <th className="px-3 py-2 text-center">Trạng thái</th>
                  <th className="px-3 py-2 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((m) => (
                  <tr key={m.idphuong_thuc_chi_tiet} className="border-t">
                    <td className="px-3 py-2 font-semibold">{m.ma_phuong_thuc}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{m.ten_phuong_thuc}</div>
                      {m.doi_tuong && (
                        <div className="text-xs text-gray-500 line-clamp-1">
                          Đối tượng: {m.doi_tuong}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {m.thoi_gian_bat_dau && (
                        <div>
                          Bắt đầu:{" "}
                          {new Date(m.thoi_gian_bat_dau).toLocaleString("vi-VN")}
                        </div>
                      )}
                      {m.thoi_gian_ket_thuc && (
                        <div>
                          Kết thúc:{" "}
                          {new Date(m.thoi_gian_ket_thuc).toLocaleString("vi-VN")}
                        </div>
                      )}
                      {!m.thoi_gian_bat_dau && !m.thoi_gian_ket_thuc && (
                        <span>Chưa cấu hình</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.trang_thai === 1
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {m.trang_thai === 1 ? "Đang áp dụng" : "Ngưng áp dụng"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        <Link
                          to={`/analyst/admission-methods/${m.idphuong_thuc_chi_tiet}`}
                          className="px-3 py-1 text-xs rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          Chi tiết
                        </Link>
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded bg-teal-50 text-teal-700 hover:bg-teal-100"
                          onClick={() => openEditModal(m)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100"
                          onClick={() =>
                            handleDelete(m.idphuong_thuc_chi_tiet)
                          }
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {methods.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-gray-500"
                    >
                      Chưa có phương thức nào. Hãy thêm phương thức tuyển sinh.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-gray-500"
                    >
                      Đang tải...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        title={editingItem ? "Cập nhật phương thức tuyển sinh" : "Thêm phương thức tuyển sinh"}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Mã phương thức <span className="text-red-500">*</span>
              </label>
              <input
                className={`input w-full ${
                  formErrors.ma_phuong_thuc ? "border-red-500" : ""
                }`}
                value={formData.ma_phuong_thuc}
                onChange={(e) =>
                  setFormData({ ...formData, ma_phuong_thuc: e.target.value })
                }
                placeholder="VD: THPT, HOC_BA, DGNL_HCM..."
                required
              />
              {formErrors.ma_phuong_thuc && (
                <p className="text-xs text-red-500 mt-1">
                  {formErrors.ma_phuong_thuc}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Tên phương thức <span className="text-red-500">*</span>
              </label>
              <input
                className={`input w-full ${
                  formErrors.ten_phuong_thuc ? "border-red-500" : ""
                }`}
                value={formData.ten_phuong_thuc}
                onChange={(e) =>
                  setFormData({ ...formData, ten_phuong_thuc: e.target.value })
                }
                placeholder="VD: Xét tuyển bằng điểm thi tốt nghiệp THPT"
                required
              />
              {formErrors.ten_phuong_thuc && (
                <p className="text-xs text-red-500 mt-1">
                  {formErrors.ten_phuong_thuc}
                </p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Thứ tự hiển thị
              </label>
              <input
                type="number"
                className="input w-full"
                value={formData.thu_tu_hien_thi}
                onChange={(e) =>
                  setFormData({ ...formData, thu_tu_hien_thi: e.target.value })
                }
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Trạng thái
              </label>
              <select
                className="input w-full"
                value={formData.trang_thai}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trang_thai: Number(e.target.value),
                  })
                }
              >
                <option value={1}>Đang áp dụng</option>
                <option value={0}>Ngưng áp dụng</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Đối tượng áp dụng
            </label>
            <textarea
              className="input w-full"
              rows={2}
              value={formData.doi_tuong}
              onChange={(e) =>
                setFormData({ ...formData, doi_tuong: e.target.value })
              }
              placeholder="Ví dụ: Thí sinh đã tốt nghiệp THPT..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Điều kiện xét tuyển
            </label>
            <textarea
              className="input w-full"
              rows={3}
              value={formData.dieu_kien_xet_tuyen}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dieu_kien_xet_tuyen: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Công thức tính điểm
            </label>
            <textarea
              className="input w-full"
              rows={2}
              value={formData.cong_thuc_tinh_diem}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cong_thuc_tinh_diem: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Mô tả / Quy chế chi tiết
            </label>
            <textarea
              className="input w-full"
              rows={3}
              value={formData.mo_ta_quy_che}
              onChange={(e) =>
                setFormData({ ...formData, mo_ta_quy_che: e.target.value })
              }
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Thời gian bắt đầu
              </label>
              <input
                type="datetime-local"
                className="input w-full"
                value={formData.thoi_gian_bat_dau}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    thoi_gian_bat_dau: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Thời gian kết thúc
              </label>
              <input
                type="datetime-local"
                className={`input w-full ${
                  formErrors.thoi_gian_ket_thuc ? "border-red-500" : ""
                }`}
                value={formData.thoi_gian_ket_thuc}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    thoi_gian_ket_thuc: e.target.value,
                  })
                }
              />
              {formErrors.thoi_gian_ket_thuc && (
                <p className="text-xs text-red-500 mt-1">
                  {formErrors.thoi_gian_ket_thuc}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú</label>
            <textarea
              className="input w-full"
              rows={2}
              value={formData.ghi_chu}
              onChange={(e) =>
                setFormData({ ...formData, ghi_chu: e.target.value })
              }
            />
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


