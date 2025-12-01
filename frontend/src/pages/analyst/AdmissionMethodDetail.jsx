import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";

// Forward declaration to avoid any hoisting issues for the Extra tab
function MethodExtraTab(props) {
  return MethodExtraTabInner(props);
}

// Simple helper to normalise tab name
const TABS = [
  { key: "majors", label: "Ngành" },
  { key: "documents", label: "Hồ sơ" },
  { key: "conversion", label: "Quy đổi NN" },
  { key: "priority", label: "Ưu tiên" },
  { key: "direct", label: "Xét thẳng" },
  { key: "extra", label: "Thông tin bổ sung" },
];

export default function AdmissionMethodDetail() {
  const { methodId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const methodIdNumber = Number(methodId);

  const [method, setMethod] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const activeTab = searchParams.get("tab") || "majors";

  useEffect(() => {
    if (!methodIdNumber) return;
    loadMethodDetail();
  }, [methodIdNumber]);

  const loadMethodDetail = async () => {
    try {
      const res = await api.getAdmissionMethodDetail(methodIdNumber);
      if (res?.success) {
        const data = res.data;
        setMethod(data);
        const projectInfo = data?.de_an || data?.deAn;
        setProject(projectInfo || null);
      } else {
        showToast("Không tìm thấy phương thức tuyển sinh", "error");
      }
    } catch (e) {
      console.error("Failed to load method detail", e);
      showToast("Không thể tải thông tin phương thức", "error");
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const handleChangeTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", key);
    setSearchParams(next);
  };

  const goBackToMethods = () => {
    if (project) {
      navigate(`/analyst/admission-projects/${project.idde_an || project.id}/methods`);
    } else {
      navigate("/analyst/admission-projects");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            className="text-sm text-slate-600 hover:text-teal-600"
            onClick={goBackToMethods}
          >
            ← Quay lại danh sách phương thức
          </button>
          <h1 className="text-2xl font-bold mt-2">Chi tiết phương thức tuyển sinh</h1>
          {method && (
            <p className="text-sm text-slate-600 mt-1">
              Phương thức:{" "}
              <span className="font-semibold">
                {method.ten_phuong_thuc} ({method.ma_phuong_thuc})
              </span>
              {project && (
                <>
                  {" "}
                  • Đề án: {project.tieu_de} (Năm {project.nam_tuyen_sinh})
                </>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex flex-wrap gap-3">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleChangeTab(tab.key)}
                className={`whitespace-nowrap px-3 py-2 text-sm border-b-2 ${
                  isActive
                    ? "border-teal-600 text-teal-700 font-semibold"
                    : "border-transparent text-slate-600 hover:text-teal-600 hover:border-teal-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "majors" && (
        <MethodMajorsTab
          methodId={methodIdNumber}
          method={method}
          project={project}
          loading={loading}
          setLoading={setLoading}
          showToast={showToast}
        />
      )}

      {activeTab === "documents" && (
        <MethodDocumentsTab
          methodId={methodIdNumber}
          showToast={showToast}
        />
      )}

      {activeTab === "conversion" && (
        <MethodConversionTab
          methodId={methodIdNumber}
          showToast={showToast}
        />
      )}

      {activeTab === "priority" && (
        <MethodPriorityTab
          methodId={methodIdNumber}
          showToast={showToast}
        />
      )}

      {activeTab === "direct" && (
        <MethodDirectTab
          methodId={methodIdNumber}
          showToast={showToast}
        />
      )}

      {activeTab === "extra" && (
        <MethodExtraTab
          methodId={methodIdNumber}
          showToast={showToast}
        />
      )}

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: "", type: "success" })}
      />
    </div>
  );
}

// --- Majors tab (tái sử dụng logic chính từ AdmissionMethodMajors) ---

function MethodMajorsTab({ methodId, method, project, loading, setLoading, showToast }) {
  const [majors, setMajors] = useState([]);
  const [availableMajors, setAvailableMajors] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    idnganhtruong: "",
    ghi_chu: "",
    loai_nganh: "NGANH_VIET",
    thu_tu: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const [selectedCombos, setSelectedCombos] = useState([]);
  const [customComboInput, setCustomComboInput] = useState("");
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [comboModalLoading, setComboModalLoading] = useState(false);
  const [comboModalData, setComboModalData] = useState([]);
  const [comboModalPage, setComboModalPage] = useState(1);
  const [comboModalLastPage, setComboModalLastPage] = useState(1);
  const [comboModalTotal, setComboModalTotal] = useState(0);
  const [comboModalSearch, setComboModalSearch] = useState("");
  const [comboModalSelected, setComboModalSelected] = useState([]);

  useEffect(() => {
    if (!methodId) return;
    loadMajors();
  }, [methodId]);

  useEffect(() => {
    if (project?.idtruong) {
      loadAvailableMajors(project.idtruong);
    }
  }, [project?.idtruong]);

  const normalizeCombo = (code = "") => code.replace(/\s+/g, "").toUpperCase();

  const addCombos = (codes = []) => {
    setSelectedCombos((prev) => {
      const set = new Set(prev.map(normalizeCombo));
      codes.forEach((code) => {
        const norm = normalizeCombo(code);
        if (norm) set.add(norm);
      });
      return Array.from(set);
    });
  };

  const removeCombo = (code) => {
    setSelectedCombos((prev) =>
      prev.filter((item) => normalizeCombo(item) !== normalizeCombo(code))
    );
  };

  const handleAddCustomCombos = () => {
    const parts = customComboInput
      .split(/[;,]/)
      .map((c) => normalizeCombo(c))
      .filter(Boolean);
    if (parts.length) {
      addCombos(parts);
      setCustomComboInput("");
    }
  };

  const openComboModal = () => {
    setComboModalOpen(true);
    setComboModalSelected(selectedCombos.map(normalizeCombo));
    setComboModalSearch("");
    loadComboModalData(1, "");
  };

  const closeComboModal = () => {
    setComboModalOpen(false);
    setComboModalSelected([]);
  };

  const loadComboModalData = async (page = 1, keyword = comboModalSearch) => {
    setComboModalLoading(true);
    try {
      const res = await api.getSubjectCombos({
        per_page: 12,
        page,
        keyword,
      });
      const list = Array.isArray(res?.data) ? res.data : [];
      setComboModalData(list);
      setComboModalPage(res?.current_page || page);
      setComboModalLastPage(res?.last_page || 1);
      setComboModalTotal(res?.total ?? list.length);
    } catch (error) {
      console.error("Failed to load subject combos", error);
      setComboModalData([]);
    } finally {
      setComboModalLoading(false);
    }
  };

  const toggleComboModalSelection = (code) => {
    const norm = normalizeCombo(code);
    setComboModalSelected((prev) =>
      prev.includes(norm) ? prev.filter((item) => item !== norm) : [...prev, norm]
    );
  };

  const handleComboModalConfirm = () => {
    addCombos(comboModalSelected);
    closeComboModal();
  };

  const loadAvailableMajors = async (schoolId) => {
    try {
      const res = await api.getUniversityMajors({
        idtruong: schoolId,
        per_page: 500,
      });
      const list = Array.isArray(res?.data) ? res.data : [];
      setAvailableMajors(list);
    } catch (e) {
      console.error("Failed to load university majors", e);
      setAvailableMajors([]);
    }
  };

  const loadMajors = async () => {
    setLoading(true);
    try {
      const res = await api.getMethodMajors(methodId);
      const list = Array.isArray(res?.data) ? res.data : [];
      setMajors(list);
    } catch (e) {
      console.error("Failed to load method majors", e);
      setMajors([]);
      showToast("Không thể tải danh sách ngành theo phương thức", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormErrors({});
    setFormData({
      idnganhtruong: "",
      ghi_chu: "",
      loai_nganh: "NGANH_VIET",
      thu_tu: "",
    });
    setSelectedCombos([]);
    setCustomComboInput("");
  };

  const availableOptions = availableMajors.map((item) => ({
    value: item.idnganhtruong,
    label: `${item.tennganh || item.manganh || "Ngành"} (${item.idnganhtruong})`,
  }));

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormErrors({});
    const combos = (item.to_hop_mon || "")
      .split(";")
      .map((c) => normalizeCombo(c))
      .filter(Boolean);
    setSelectedCombos(combos);
    setCustomComboInput("");
    setFormData({
      idnganhtruong: item.idnganhtruong?.toString() || "",
      ghi_chu: item.ghi_chu || "",
      loai_nganh: item.loai_nganh || "NGANH_VIET",
      thu_tu: item.thu_tu?.toString() || "",
    });
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.idnganhtruong) {
      errors.idnganhtruong = "Vui lòng chọn ngành";
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
      const comboList = selectedCombos
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);
      const payload = {
        idphuong_thuc_chi_tiet: methodId,
        idnganhtruong: Number(formData.idnganhtruong),
        to_hop_mon: comboList.length ? comboList.join(";") : null,
        ghi_chu: formData.ghi_chu || null,
        loai_nganh: formData.loai_nganh || null,
        thu_tu: formData.thu_tu ? Number(formData.thu_tu) : null,
      };

      let res;
      if (editingItem) {
        res = await api.updateMethodMajor(editingItem.idnganh_phuong_thuc, payload);
      } else {
        res = await api.createMethodMajor(payload);
      }

      if (res?.success) {
        showToast(
          editingItem
            ? "Cập nhật ngành theo phương thức thành công"
            : "Thêm ngành vào phương thức thành công",
          "success"
        );
        setShowModal(false);
        resetForm();
        await loadMajors();
      } else {
        showToast(res?.message || "Không thể lưu ngành theo phương thức", "error");
      }
    } catch (e) {
      console.error("Failed to save method major", e);
      showToast(e?.message || "Không thể lưu ngành theo phương thức", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (idnganh_phuong_thuc) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ngành này khỏi phương thức?")) return;
    setLoading(true);
    try {
      const res = await api.deleteMethodMajor(idnganh_phuong_thuc);
      if (res?.success) {
        showToast("Xóa ngành khỏi phương thức thành công", "success");
        await loadMajors();
      } else {
        showToast(res?.message || "Không thể xóa ngành", "error");
      }
    } catch (e) {
      console.error("Failed to delete method major", e);
      showToast(e?.message || "Không thể xóa ngành", "error");
    } finally {
      setLoading(false);
    }
  };

  const resolveMajorName = (item) => {
    if (!item) return "Ngành (không xác định)";
    const rel = item.nganhTruong || item.nganh_truong;
    if (rel) {
      return `${rel.tennganh || rel.manganh || "Ngành"} (${rel.idnganhtruong || ""})`;
    }
    const fromList = availableMajors.find(
      (m) => Number(m.idnganhtruong) === Number(item.idnganhtruong)
    );
    if (fromList) {
      return `${fromList.tennganh || fromList.manganh} (${fromList.idnganhtruong})`;
    }
    return `Ngành ${item.idnganhtruong}`;
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold mb-1">Danh sách ngành theo phương thức</h2>
          <p className="text-xs text-slate-500">
            Cấu hình các ngành được áp dụng cho phương thức này, kèm tổ hợp môn và loại ngành.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreateModal}>
          + Thêm ngành
        </button>
      </div>

      <div className="card p-5 mt-3">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            Tổng: {majors.length} ngành áp dụng
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Ngành</th>
                  <th className="px-3 py-2 text-left">Tổ hợp môn</th>
                  <th className="px-3 py-2 text-left">Loại ngành</th>
                  <th className="px-3 py-2 text-left">Ghi chú</th>
                  <th className="px-3 py-2 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {majors.map((item) => (
                  <tr key={item.idnganh_phuong_thuc} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-medium">{resolveMajorName(item)}</div>
                      {availableMajors.length === 0 && (
                        <div className="text-xs text-slate-500">
                          ID ngành: {item.idnganhtruong}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {item.to_hop_mon || (
                        <span className="text-slate-400">Chưa cập nhật</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {item.loai_nganh || "Không xác định"}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {item.ghi_chu || "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded bg-teal-50 text-teal-700 hover:bg-teal-100"
                          onClick={() => openEditModal(item)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100"
                          onClick={() => handleDelete(item.idnganh_phuong_thuc)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {majors.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                      Chưa có ngành nào được cấu hình cho phương thức này.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                      Đang tải...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit modal */}
      <Modal
        open={showModal}
        title={editingItem ? "Cập nhật ngành theo phương thức" : "Thêm ngành theo phương thức"}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Ngành <span className="text-red-500">*</span>
            </label>
            <select
              className={`input w-full ${formErrors.idnganhtruong ? "border-red-500" : ""}`}
              value={formData.idnganhtruong}
              onChange={(e) => setFormData({ ...formData, idnganhtruong: e.target.value })}
              required
            >
              <option value="">
                {project?.truong?.tentruong
                  ? `Chọn ngành của ${project.truong.tentruong}`
                  : "Chọn ngành"}
              </option>
              {availableOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {formErrors.idnganhtruong && (
              <p className="text-xs text-red-500 mt-1">{formErrors.idnganhtruong}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">Tổ hợp môn</label>
                <button
                  type="button"
                  onClick={openComboModal}
                  className="text-xs px-2 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
                >
                  Chọn từ danh sách
                </button>
              </div>
              <div className="border border-slate-200 rounded-xl p-3 space-y-3">
                <div className="flex gap-2 items-center">
                  <input
                    className="input flex-1"
                    value={customComboInput}
                    onChange={(e) => setCustomComboInput(e.target.value)}
                    placeholder="Nhập tổ hợp khác (VD: D15;V01)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomCombos();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCombos}
                    className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                  >
                    Thêm
                  </button>
                </div>
                {selectedCombos.length > 0 && (
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-500">Đã chọn:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCombos.map((code) => (
                        <span
                          key={code}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100"
                        >
                          {code}
                          <button
                            type="button"
                            className="text-emerald-700 hover:text-emerald-900"
                            onClick={() => removeCombo(code)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  Bạn có thể chọn nhiều tổ hợp cùng lúc. Nếu không tìm thấy trong danh sách, nhập
                  nhanh ở ô bên trên hoặc bấm “Chọn từ danh sách”.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Loại ngành</label>
              <select
                className="input w-full"
                value={formData.loai_nganh}
                onChange={(e) => setFormData({ ...formData, loai_nganh: e.target.value })}
              >
                <option value="NGANH_VIET">Ngành hiện hữu</option>
                <option value="NGANH_MOI">Ngành mới</option>
                <option value="NGANH_QUOC_TE">Ngành quốc tế</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Thứ tự hiển thị</label>
              <input
                className="input w-full"
                type="number"
                value={formData.thu_tu}
                min="0"
                onChange={(e) => setFormData({ ...formData, thu_tu: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ghi chú</label>
              <input
                className="input w-full"
                value={formData.ghi_chu}
                onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
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

      {/* Combo picker modal */}
      <Modal
        open={comboModalOpen}
        title="Chọn tổ hợp môn"
        onClose={closeComboModal}
      >
        <div className="space-y-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              loadComboModalData(1, comboModalSearch);
            }}
          >
            <input
              className="input flex-1"
              placeholder="Tìm theo mã hoặc mô tả tổ hợp..."
              value={comboModalSearch}
              onChange={(e) => setComboModalSearch(e.target.value)}
            />
            <button type="submit" className="btn-primary px-4 py-2 text-sm">
              Tìm
            </button>
          </form>

          <div className="border border-slate-200 rounded-xl max-h-72 overflow-y-auto">
            {comboModalLoading ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                Đang tải danh sách tổ hợp...
              </div>
            ) : comboModalData.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                Không tìm thấy tổ hợp phù hợp.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left w-10"></th>
                    <th className="px-3 py-2 text-left">Mã tổ hợp</th>
                    <th className="px-3 py-2 text-left">Môn xét tuyển / mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  {comboModalData.map((item) => {
                    const code = item.ma_to_hop || item.code;
                    const normCode = normalizeCombo(code);
                    const desc = item.mo_ta || item.label || "";
                    return (
                      <tr key={code} className="border-t">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            className="rounded text-teal-600"
                            checked={comboModalSelected.includes(normCode)}
                            onChange={() => toggleComboModalSelection(normCode)}
                          />
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-900">{code}</td>
                        <td className="px-3 py-2 text-slate-600">{desc || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {comboModalLastPage > 1 && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <button
                type="button"
                className="btn-outline"
                disabled={comboModalPage <= 1}
                onClick={() => loadComboModalData(Math.max(1, comboModalPage - 1), comboModalSearch)}
              >
                Trước
              </button>
              <span>
                Trang {comboModalPage}/{comboModalLastPage}
              </span>
              <button
                type="button"
                className="btn-outline"
                disabled={comboModalPage >= comboModalLastPage}
                onClick={() =>
                  loadComboModalData(
                    Math.min(comboModalLastPage, comboModalPage + 1),
                    comboModalSearch
                  )
                }
              >
                Sau
              </button>
            </div>
          )}

          <div className="flex justify-between text-xs text-slate-500">
            <span>Đã chọn: {comboModalSelected.length} tổ hợp</span>
            <span>Tổng tổ hợp trong danh sách: {comboModalTotal}</span>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={closeComboModal}>
              Hủy
            </button>
            <button type="button" className="btn-primary" onClick={handleComboModalConfirm}>
              Xác nhận
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// --- Documents tab: Ho so xet tuyen ---

function MethodDocumentsTab({ methodId, showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    loai_ho_so: "CHUNG",
    noi_dung: "",
    thu_tu: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!methodId) return;
    loadDocuments();
  }, [methodId]);

  const resetForm = () => {
    setEditingItem(null);
    setFormErrors({});
    setFormData({
      loai_ho_so: "CHUNG",
      noi_dung: "",
      thu_tu: "",
    });
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.getMethodDocuments({
        idphuong_thuc_chi_tiet: methodId,
        per_page: 200,
      });
      const list = Array.isArray(res?.data) ? res.data : [];
      setItems(list);
    } catch (e) {
      console.error("Failed to load method documents", e);
      setItems([]);
      showToast("Không thể tải danh sách hồ sơ xét tuyển", "error");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormErrors({});
    setFormData({
      loai_ho_so: item.loai_ho_so || "CHUNG",
      noi_dung: item.noi_dung || "",
      thu_tu: item.thu_tu?.toString() || "",
    });
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.noi_dung.trim()) {
      errors.noi_dung = "Nội dung hồ sơ là bắt buộc";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Vui lòng kiểm tra lại thông tin hồ sơ", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        idphuong_thuc_chi_tiet: methodId,
        loai_ho_so: formData.loai_ho_so,
        noi_dung: formData.noi_dung.trim(),
        thu_tu: formData.thu_tu ? Number(formData.thu_tu) : 0,
      };

      let res;
      if (editingItem) {
        res = await api.updateMethodDocument(editingItem.idho_so, payload);
      } else {
        res = await api.createMethodDocument(payload);
      }

      if (res?.success) {
        showToast(
          editingItem ? "Cập nhật hồ sơ xét tuyển thành công" : "Thêm hồ sơ xét tuyển thành công",
          "success"
        );
        setShowModal(false);
        resetForm();
        await loadDocuments();
      } else {
        showToast(res?.message || "Không thể lưu hồ sơ xét tuyển", "error");
      }
    } catch (e) {
      console.error("Failed to save method document", e);
      showToast(e?.message || "Không thể lưu hồ sơ xét tuyển", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (idho_so) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hồ sơ này?")) return;
    setLoading(true);
    try {
      const res = await api.deleteMethodDocument(idho_so);
      if (res?.success) {
        showToast("Xóa hồ sơ xét tuyển thành công", "success");
        await loadDocuments();
      } else {
        showToast(res?.message || "Không thể xóa hồ sơ", "error");
      }
    } catch (e) {
      console.error("Failed to delete method document", e);
      showToast(e?.message || "Không thể xóa hồ sơ", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderLoaiHoSo = (value) => {
    if (value === "CHUNG") return "Hồ sơ chung";
    if (value === "THEO_DOI_TUONG") return "Theo đối tượng";
    if (value === "THEO_KHU_VUC") return "Theo khu vực";
    return value || "Không xác định";
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold mb-1">Hồ sơ xét tuyển</h2>
          <p className="text-xs text-slate-500">
            Danh sách giấy tờ thí sinh cần chuẩn bị cho phương thức này. Bạn có thể phân loại theo
            hồ sơ chung, theo đối tượng hoặc theo khu vực.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreateModal}>
          + Thêm hồ sơ
        </button>
      </div>

      <div className="card p-5 mt-3">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">Tổng: {items.length} dòng hồ sơ</div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left w-40">Loại hồ sơ</th>
                  <th className="px-3 py-2 text-left">Nội dung</th>
                  <th className="px-3 py-2 text-center w-24">Thứ tự</th>
                  <th className="px-3 py-2 text-center w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.idho_so} className="border-t">
                    <td className="px-3 py-2 text-xs font-medium text-slate-700">
                      {renderLoaiHoSo(item.loai_ho_so)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700 whitespace-pre-line">
                      {item.noi_dung}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-slate-600">
                      {item.thu_tu ?? 0}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded bg-teal-50 text-teal-700 hover:bg-teal-100"
                          onClick={() => openEditModal(item)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100"
                          onClick={() => handleDelete(item.idho_so)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                      Chưa có cấu hình hồ sơ cho phương thức này. Hãy thêm ít nhất 1 dòng hồ sơ để
                      thí sinh biết cần chuẩn bị gì.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                      Đang tải...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        open={showModal}
        title={editingItem ? "Cập nhật hồ sơ xét tuyển" : "Thêm hồ sơ xét tuyển"}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Loại hồ sơ <span className="text-red-500">*</span>
              </label>
              <select
                className="input w-full"
                value={formData.loai_ho_so}
                onChange={(e) => setFormData({ ...formData, loai_ho_so: e.target.value })}
              >
                <option value="CHUNG">Hồ sơ chung</option>
                <option value="THEO_DOI_TUONG">Theo đối tượng</option>
                <option value="THEO_KHU_VUC">Theo khu vực</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Thứ tự hiển thị
              </label>
              <input
                type="number"
                className="input w-full"
                value={formData.thu_tu}
                min="0"
                onChange={(e) => setFormData({ ...formData, thu_tu: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Nội dung hồ sơ <span className="text-red-500">*</span>
            </label>
            <textarea
              className={`input w-full ${formErrors.noi_dung ? "border-red-500" : ""}`}
              rows={4}
              value={formData.noi_dung}
              onChange={(e) => setFormData({ ...formData, noi_dung: e.target.value })}
              placeholder="Ví dụ: Bản sao công chứng Học bạ THPT (lớp 10, 11, 12)..."
            />
            {formErrors.noi_dung && (
              <p className="text-xs text-red-500 mt-1">{formErrors.noi_dung}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
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
            <button type="submit" className="btn-primary">
              {loading ? "Đang lưu..." : editingItem ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// --- Conversion tab: Bang quy doi diem ngoai ngu ---

function MethodConversionTab({ methodId, showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    loai_chung_chi: "IELTS",
    ten_chung_chi: "",
    muc_diem_min: "",
    muc_diem_max: "",
    diem_quy_doi: "",
    thu_tu: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!methodId) return;
    loadItems();
  }, [methodId]);

  const resetForm = () => {
    setEditingItem(null);
    setFormErrors({});
    setFormData({
      loai_chung_chi: "IELTS",
      ten_chung_chi: "",
      muc_diem_min: "",
      muc_diem_max: "",
      diem_quy_doi: "",
      thu_tu: "",
    });
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.getLanguageConversions({
        idphuong_thuc_chi_tiet: methodId,
        per_page: 200,
      });
      const list = Array.isArray(res?.data) ? res.data : [];
      setItems(list);
    } catch (e) {
      console.error("Failed to load language conversions", e);
      setItems([]);
      showToast("Không thể tải bảng quy đổi điểm ngoại ngữ", "error");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormErrors({});
    setFormData({
      loai_chung_chi: item.loai_chung_chi || "IELTS",
      ten_chung_chi: item.ten_chung_chi || "",
      muc_diem_min: item.muc_diem_min?.toString() || "",
      muc_diem_max: item.muc_diem_max?.toString() || "",
      diem_quy_doi: item.diem_quy_doi?.toString() || "",
      thu_tu: item.thu_tu?.toString() || "",
    });
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.diem_quy_doi) {
      errors.diem_quy_doi = "Điểm quy đổi là bắt buộc";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Vui lòng kiểm tra lại thông tin quy đổi", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        idphuong_thuc_chi_tiet: methodId,
        loai_chung_chi: formData.loai_chung_chi,
        ten_chung_chi: formData.ten_chung_chi || null,
        muc_diem_min: formData.muc_diem_min ? Number(formData.muc_diem_min) : null,
        muc_diem_max: formData.muc_diem_max ? Number(formData.muc_diem_max) : null,
        diem_quy_doi: Number(formData.diem_quy_doi),
        thu_tu: formData.thu_tu ? Number(formData.thu_tu) : 0,
      };

      let res;
      if (editingItem) {
        res = await api.updateLanguageConversion(editingItem.idquy_doi, payload);
      } else {
        res = await api.createLanguageConversion(payload);
      }

      if (res?.success) {
        showToast(
          editingItem
            ? "Cập nhật quy đổi điểm ngoại ngữ thành công"
            : "Thêm dòng quy đổi điểm ngoại ngữ thành công",
          "success"
        );
        setShowModal(false);
        resetForm();
        await loadItems();
      } else {
        showToast(res?.message || "Không thể lưu quy đổi điểm ngoại ngữ", "error");
      }
    } catch (e) {
      console.error("Failed to save language conversion", e);
      showToast(e?.message || "Không thể lưu quy đổi điểm ngoại ngữ", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (idquy_doi) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa dòng quy đổi này?")) return;
    setLoading(true);
    try {
      const res = await api.deleteLanguageConversion(idquy_doi);
      if (res?.success) {
        showToast("Xóa quy đổi điểm ngoại ngữ thành công", "success");
        await loadItems();
      } else {
        showToast(res?.message || "Không thể xóa quy đổi", "error");
      }
    } catch (e) {
      console.error("Failed to delete language conversion", e);
      showToast(e?.message || "Không thể xóa quy đổi", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold mb-1">Quy đổi điểm ngoại ngữ</h2>
          <p className="text-xs text-slate-500">
            Cấu hình bảng quy đổi điểm cho các chứng chỉ ngoại ngữ (IELTS, TOEFL iBT, TOEIC...) sang
            thang điểm 10 áp dụng cho phương thức này.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreateModal}>
          + Thêm quy đổi
        </button>
      </div>

      <div className="card p-5 mt-3">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">Tổng: {items.length} dòng quy đổi</div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left w-32">Loại chứng chỉ</th>
                  <th className="px-3 py-2 text-left">Tên chứng chỉ</th>
                  <th className="px-3 py-2 text-center w-32">Từ</th>
                  <th className="px-3 py-2 text-center w-32">Đến</th>
                  <th className="px-3 py-2 text-center w-32">Điểm quy đổi</th>
                  <th className="px-3 py-2 text-center w-20">Thứ tự</th>
                  <th className="px-3 py-2 text-center w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.idquy_doi} className="border-t">
                    <td className="px-3 py-2 text-xs font-medium text-slate-700">
                      {item.loai_chung_chi}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      {item.ten_chung_chi || "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-slate-700">
                      {item.muc_diem_min ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-slate-700">
                      {item.muc_diem_max ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-xs font-semibold text-emerald-700">
                      {item.diem_quy_doi}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-slate-600">
                      {item.thu_tu ?? 0}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded bg-teal-50 text-teal-700 hover:bg-teal-100"
                          onClick={() => openEditModal(item)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100"
                          onClick={() => handleDelete(item.idquy_doi)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                      Chưa có cấu hình quy đổi ngoại ngữ cho phương thức này.
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

      <Modal
        open={showModal}
        title={editingItem ? "Cập nhật quy đổi điểm ngoại ngữ" : "Thêm quy đổi điểm ngoại ngữ"}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Loại chứng chỉ <span className="text-red-500">*</span>
              </label>
              <select
                className="input w-full"
                value={formData.loai_chung_chi}
                onChange={(e) =>
                  setFormData({ ...formData, loai_chung_chi: e.target.value })
                }
              >
                <option value="IELTS">IELTS</option>
                <option value="TOEFL_IBT">TOEFL iBT</option>
                <option value="TOEIC">TOEIC</option>
                <option value="KHAC">Khác</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Tên chứng chỉ</label>
              <input
                className="input w-full"
                value={formData.ten_chung_chi}
                onChange={(e) =>
                  setFormData({ ...formData, ten_chung_chi: e.target.value })
                }
                placeholder="VD: IELTS Academic, TOEFL iBT..."
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Điểm từ</label>
              <input
                type="number"
                step="0.1"
                className="input w-full"
                value={formData.muc_diem_min}
                onChange={(e) =>
                  setFormData({ ...formData, muc_diem_min: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Điểm đến</label>
              <input
                type="number"
                step="0.1"
                className="input w-full"
                value={formData.muc_diem_max}
                onChange={(e) =>
                  setFormData({ ...formData, muc_diem_max: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Điểm quy đổi (thang 10) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                className={`input w-full ${
                  formErrors.diem_quy_doi ? "border-red-500" : ""
                }`}
                value={formData.diem_quy_doi}
                onChange={(e) =>
                  setFormData({ ...formData, diem_quy_doi: e.target.value })
                }
              />
              {formErrors.diem_quy_doi && (
                <p className="text-xs text-red-500 mt-1">{formErrors.diem_quy_doi}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Thứ tự hiển thị</label>
            <input
              type="number"
              className="input w-full"
              value={formData.thu_tu}
              min="0"
              onChange={(e) => setFormData({ ...formData, thu_tu: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
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
            <button type="submit" className="btn-primary">
              {loading ? "Đang lưu..." : editingItem ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// --- Priority tab: Quy dinh diem uu tien de an ---

function MethodPriorityTab({ methodId, showToast }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nguong_diem: "",
    muc_diem_cong_cctaqt: "",
    cong_thuc_diem_uu_tien: "",
    mo_ta_quy_dinh: "",
  });

  useEffect(() => {
    if (!methodId) return;
    loadData();
  }, [methodId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getMethodPriorityRules({
        idphuong_thuc_chi_tiet: methodId,
      });
      const list = Array.isArray(res?.data) ? res.data : [];
      setItem(list[0] || null);
    } catch (e) {
      console.error("Failed to load priority rule", e);
      setItem(null);
      showToast("Không thể tải quy định điểm ưu tiên", "error");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = () => {
    if (item) {
      setFormData({
        nguong_diem: item.nguong_diem?.toString() || "",
        muc_diem_cong_cctaqt: item.muc_diem_cong_cctaqt?.toString() || "",
        cong_thuc_diem_uu_tien: item.cong_thuc_diem_uu_tien || "",
        mo_ta_quy_dinh: item.mo_ta_quy_dinh || "",
      });
    } else {
      setFormData({
        nguong_diem: "",
        muc_diem_cong_cctaqt: "",
        cong_thuc_diem_uu_tien: "",
        mo_ta_quy_dinh: "",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        idphuong_thuc_chi_tiet: methodId,
        nguong_diem: formData.nguong_diem ? Number(formData.nguong_diem) : null,
        muc_diem_cong_cctaqt: formData.muc_diem_cong_cctaqt
          ? Number(formData.muc_diem_cong_cctaqt)
          : null,
        cong_thuc_diem_uu_tien: formData.cong_thuc_diem_uu_tien || null,
        mo_ta_quy_dinh: formData.mo_ta_quy_dinh || null,
        ...(item?.idquy_dinh_de_an ? { idquy_dinh_de_an: item.idquy_dinh_de_an } : {}),
      };

      const res = await api.saveMethodPriorityRule(payload);
      if (res?.success) {
        showToast("Lưu quy định điểm ưu tiên thành công", "success");
        setShowModal(false);
        await loadData();
      } else {
        showToast(res?.message || "Không thể lưu quy định điểm ưu tiên", "error");
      }
    } catch (e) {
      console.error("Failed to save priority rule", e);
      showToast(e?.message || "Không thể lưu quy định điểm ưu tiên", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item?.idquy_dinh_de_an) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa quy định điểm ưu tiên này?")) return;
    setLoading(true);
    try {
      const res = await api.deleteMethodPriorityRule(item.idquy_dinh_de_an);
      if (res?.success) {
        showToast("Xóa quy định điểm ưu tiên thành công", "success");
        setItem(null);
      } else {
        showToast(res?.message || "Không thể xóa quy định điểm ưu tiên", "error");
      }
    } catch (e) {
      console.error("Failed to delete priority rule", e);
      showToast(e?.message || "Không thể xóa quy định điểm ưu tiên", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold mb-1">Quy định điểm ưu tiên</h2>
          <p className="text-xs text-slate-500">
            Mô tả cách cộng điểm ưu tiên riêng cho phương thức này (ngưỡng điểm áp dụng, mức cộng cho
            thí sinh có chứng chỉ quốc tế, công thức điểm ưu tiên...).
          </p>
        </div>
        <div className="flex gap-2">
          {item && (
            <button
              type="button"
              className="px-3 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100"
              onClick={handleDelete}
            >
              Xóa
            </button>
          )}
          <button type="button" className="btn-primary" onClick={openEdit}>
            {item ? "Sửa quy định" : "Thêm quy định"}
          </button>
        </div>
      </div>

      <div className="card p-5 mt-3 text-sm text-slate-700">
        {loading ? (
          <p className="text-center text-slate-500">Đang tải...</p>
        ) : item ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-6">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">
                  Ngưỡng điểm áp dụng
                </div>
                <div className="mt-1 font-semibold">
                  {item.nguong_diem != null ? item.nguong_diem : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">
                  Mức cộng (CCTAQT)
                </div>
                <div className="mt-1 font-semibold">
                  {item.muc_diem_cong_cctaqt != null ? item.muc_diem_cong_cctaqt : "—"}
                </div>
              </div>
            </div>
            {item.cong_thuc_diem_uu_tien && (
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">
                  Công thức điểm ưu tiên
                </div>
                <pre className="mt-1 text-xs whitespace-pre-wrap bg-slate-50 rounded-md p-3 border border-slate-100">
                  {item.cong_thuc_diem_uu_tien}
                </pre>
              </div>
            )}
            {item.mo_ta_quy_dinh && (
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">
                  Mô tả quy định
                </div>
                <p className="mt-1 text-sm whitespace-pre-line">{item.mo_ta_quy_dinh}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-500">
            Chưa có quy định điểm ưu tiên riêng cho phương thức này. Bạn có thể bấm{" "}
            <span className="font-semibold">Thêm quy định</span> để mô tả cách cộng điểm ưu tiên.
          </p>
        )}
      </div>

      <Modal
        open={showModal}
        title={item ? "Cập nhật quy định điểm ưu tiên" : "Thêm quy định điểm ưu tiên"}
        onClose={() => setShowModal(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Ngưỡng điểm áp dụng
              </label>
              <input
                type="number"
                step="0.1"
                className="input w-full"
                value={formData.nguong_diem}
                onChange={(e) =>
                  setFormData({ ...formData, nguong_diem: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Mức cộng cho thí sinh có CCTAQT
              </label>
              <input
                type="number"
                step="0.1"
                className="input w-full"
                value={formData.muc_diem_cong_cctaqt}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    muc_diem_cong_cctaqt: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Công thức điểm ưu tiên
            </label>
            <textarea
              className="input w-full"
              rows={3}
              value={formData.cong_thuc_diem_uu_tien}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cong_thuc_diem_uu_tien: e.target.value,
                })
              }
              placeholder="VD: diem_xet_tuyen = diem_tong + diem_uu_tien + diem_quy_doi_ngoai_ngu..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Mô tả quy định chi tiết
            </label>
            <textarea
              className="input w-full"
              rows={4}
              value={formData.mo_ta_quy_dinh}
              onChange={(e) =>
                setFormData({ ...formData, mo_ta_quy_dinh: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn-outline"
              onClick={() => setShowModal(false)}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              {loading ? "Đang lưu..." : "Lưu quy định"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// --- Direct tab: Xet tuyen thang ---

function MethodDirectTab({ methodId, showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    linh_vuc: "",
    linh_vuc_chuyen_sau: "",
    danh_sach_nganh: "",
    ghi_chu: "",
    thu_tu: "",
  });

  useEffect(() => {
    if (!methodId) return;
    loadItems();
  }, [methodId]);

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      linh_vuc: "",
      linh_vuc_chuyen_sau: "",
      danh_sach_nganh: "",
      ghi_chu: "",
      thu_tu: "",
    });
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.getDirectAdmissions({
        idphuong_thuc_chi_tiet: methodId,
        per_page: 200,
      });
      const list = Array.isArray(res?.data) ? res.data : [];
      setItems(list);
    } catch (e) {
      console.error("Failed to load direct admissions", e);
      setItems([]);
      showToast("Không thể tải cấu hình xét tuyển thẳng", "error");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      linh_vuc: item.linh_vuc || "",
      linh_vuc_chuyen_sau: item.linh_vuc_chuyen_sau || "",
      danh_sach_nganh: item.danh_sach_nganh || "",
      ghi_chu: item.ghi_chu || "",
      thu_tu: item.thu_tu?.toString() || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.linh_vuc.trim()) {
      showToast("Vui lòng nhập Lĩnh vực xét tuyển thẳng", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        idphuong_thuc_chi_tiet: methodId,
        linh_vuc: formData.linh_vuc.trim(),
        linh_vuc_chuyen_sau: formData.linh_vuc_chuyen_sau || null,
        danh_sach_nganh: formData.danh_sach_nganh || null,
        ghi_chu: formData.ghi_chu || null,
        thu_tu: formData.thu_tu ? Number(formData.thu_tu) : 0,
      };

      let res;
      if (editingItem) {
        res = await api.updateDirectAdmission(editingItem.idxet_tuyen_thang, payload);
      } else {
        res = await api.createDirectAdmission(payload);
      }

      if (res?.success) {
        showToast(
          editingItem
            ? "Cập nhật cấu hình xét tuyển thẳng thành công"
            : "Thêm cấu hình xét tuyển thẳng thành công",
          "success"
        );
        setShowModal(false);
        resetForm();
        await loadItems();
      } else {
        showToast(res?.message || "Không thể lưu cấu hình xét tuyển thẳng", "error");
      }
    } catch (e) {
      console.error("Failed to save direct admission", e);
      showToast(e?.message || "Không thể lưu cấu hình xét tuyển thẳng", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (idxet_tuyen_thang) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa cấu hình xét tuyển thẳng này?")) return;
    setLoading(true);
    try {
      const res = await api.deleteDirectAdmission(idxet_tuyen_thang);
      if (res?.success) {
        showToast("Xóa cấu hình xét tuyển thẳng thành công", "success");
        await loadItems();
      } else {
        showToast(res?.message || "Không thể xóa cấu hình xét tuyển thẳng", "error");
      }
    } catch (e) {
      console.error("Failed to delete direct admission", e);
      showToast(e?.message || "Không thể xóa cấu hình xét tuyển thẳng", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold mb-1">Xét tuyển thẳng</h2>
          <p className="text-xs text-slate-500">
            Khai báo các nhóm <strong>Lĩnh vực</strong> và danh sách ngành được xét tuyển thẳng theo
            quy định của phương thức này.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreateModal}>
          + Thêm cấu hình
        </button>
      </div>

      <div className="card p-5 mt-3">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">Tổng: {items.length} cấu hình xét tuyển thẳng</div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left w-52">Lĩnh vực</th>
                  <th className="px-3 py-2 text-left">Lĩnh vực chuyên sâu</th>
                  <th className="px-3 py-2 text-left">Danh sách ngành</th>
                  <th className="px-3 py-2 text-left w-40">Ghi chú</th>
                  <th className="px-3 py-2 text-center w-20">Thứ tự</th>
                  <th className="px-3 py-2 text-center w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.idxet_tuyen_thang} className="border-t">
                    <td className="px-3 py-2 text-xs font-semibold text-slate-800">
                      {item.linh_vuc}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700 whitespace-pre-line">
                      {item.linh_vuc_chuyen_sau || "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700 whitespace-pre-line">
                      {item.danh_sach_nganh || "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600 whitespace-pre-line">
                      {item.ghi_chu || "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-slate-600">
                      {item.thu_tu ?? 0}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded bg-teal-50 text-teal-700 hover:bg-teal-100"
                          onClick={() => openEditModal(item)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100"
                          onClick={() => handleDelete(item.idxet_tuyen_thang)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                      Chưa có cấu hình xét tuyển thẳng cho phương thức này.
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
      </div>

      <Modal
        open={showModal}
        title={editingItem ? "Cập nhật cấu hình xét tuyển thẳng" : "Thêm cấu hình xét tuyển thẳng"}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Lĩnh vực <span className="text-red-500">*</span>
            </label>
            <input
              className="input w-full"
              value={formData.linh_vuc}
              onChange={(e) => setFormData({ ...formData, linh_vuc: e.target.value })}
              placeholder="VD: Khoa học máy tính và công nghệ thông tin"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Lĩnh vực chuyên sâu</label>
            <textarea
              className="input w-full"
              rows={3}
              value={formData.linh_vuc_chuyen_sau}
              onChange={(e) =>
                setFormData({ ...formData, linh_vuc_chuyen_sau: e.target.value })
              }
              placeholder="VD: Trí tuệ nhân tạo, An toàn thông tin..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Danh sách ngành (có thể liệt kê hoặc dạng JSON)
            </label>
            <textarea
              className="input w-full"
              rows={4}
              value={formData.danh_sach_nganh}
              onChange={(e) =>
                setFormData({ ...formData, danh_sach_nganh: e.target.value })
              }
              placeholder="VD: 7480201 - Công nghệ thông tin; 7480202 - An toàn thông tin..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ghi chú</label>
              <input
                className="input w-full"
                value={formData.ghi_chu}
                onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Thứ tự hiển thị</label>
              <input
                type="number"
                className="input w-full"
                value={formData.thu_tu}
                min="0"
                onChange={(e) => setFormData({ ...formData, thu_tu: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
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
            <button type="submit" className="btn-primary">
              {loading ? "Đang lưu..." : editingItem ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// --- Extra tab: Thong tin bo sung phuong thuc ---

function MethodExtraTabInner({ methodId, showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    loai_thong_tin: "SAT_CODE",
    ten_thong_tin: "",
    noi_dung: "",
    thu_tu: "",
  });

  useEffect(() => {
    if (!methodId) return;
    loadItems();
  }, [methodId]);

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      loai_thong_tin: "SAT_CODE",
      ten_thong_tin: "",
      noi_dung: "",
      thu_tu: "",
    });
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.getMethodExtraInfos({
        idphuong_thuc_chi_tiet: methodId,
        per_page: 200,
      });
      const list = Array.isArray(res?.data) ? res.data : [];
      setItems(list);
    } catch (e) {
      console.error("Failed to load extra infos", e);
      setItems([]);
      showToast("Không thể tải thông tin bổ sung", "error");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      loai_thong_tin: item.loai_thong_tin || "SAT_CODE",
      ten_thong_tin: item.ten_thong_tin || "",
      noi_dung: item.noi_dung || "",
      thu_tu: item.thu_tu?.toString() || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ten_thong_tin.trim()) {
      showToast("Vui lòng nhập Tên thông tin", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        idphuong_thuc_chi_tiet: methodId,
        loai_thong_tin: formData.loai_thong_tin,
        ten_thong_tin: formData.ten_thong_tin.trim(),
        noi_dung: formData.noi_dung || null,
        thu_tu: formData.thu_tu ? Number(formData.thu_tu) : 0,
      };

      let res;
      if (editingItem) {
        res = await api.updateMethodExtraInfo(editingItem.idthong_tin_bo_sung, payload);
      } else {
        res = await api.createMethodExtraInfo(payload);
      }

      if (res?.success) {
        showToast(
          editingItem
            ? "Cập nhật thông tin bổ sung thành công"
            : "Thêm thông tin bổ sung thành công",
          "success"
        );
        setShowModal(false);
        resetForm();
        await loadItems();
      } else {
        showToast(res?.message || "Không thể lưu thông tin bổ sung", "error");
      }
    } catch (e) {
      console.error("Failed to save extra info", e);
      showToast(e?.message || "Không thể lưu thông tin bổ sung", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (idthong_tin_bo_sung) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thông tin bổ sung này?")) return;
    setLoading(true);
    try {
      const res = await api.deleteMethodExtraInfo(idthong_tin_bo_sung);
      if (res?.success) {
        showToast("Xóa thông tin bổ sung thành công", "success");
        await loadItems();
      } else {
        showToast(res?.message || "Không thể xóa thông tin bổ sung", "error");
      }
    } catch (e) {
      console.error("Failed to delete extra info", e);
      showToast(e?.message || "Không thể xóa thông tin bổ sung", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderLoaiThongTin = (value) => {
    if (value === "SAT_CODE") return "Mã SAT";
    if (value === "ACT_CODE") return "Mã ACT";
    if (value === "DIEM_TOI_THIEU") return "Điểm tối thiểu";
    if (value === "THOI_HAN_CHUNG_CHI") return "Thời hạn chứng chỉ";
    return value || "Khác";
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold mb-1">Thông tin bổ sung</h2>
          <p className="text-xs text-slate-500">
            Lưu các thông tin đặc biệt cho phương thức này như mã SAT/ACT, điểm tối thiểu, thời hạn
            chứng chỉ...
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreateModal}>
          + Thêm thông tin
        </button>
      </div>

      <div className="card p-5 mt-3">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">Tổng: {items.length} thông tin bổ sung</div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left w-40">Loại thông tin</th>
                  <th className="px-3 py-2 text-left w-64">Tên</th>
                  <th className="px-3 py-2 text-left">Nội dung</th>
                  <th className="px-3 py-2 text-center w-20">Thứ tự</th>
                  <th className="px-3 py-2 text-center w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.idthong_tin_bo_sung} className="border-t">
                    <td className="px-3 py-2 text-xs font-medium text-slate-700">
                      {renderLoaiThongTin(item.loai_thong_tin)}
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold text-slate-800">
                      {item.ten_thong_tin}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700 whitespace-pre-line">
                      {item.noi_dung || "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-slate-600">
                      {item.thu_tu ?? 0}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded bg-teal-50 text-teal-700 hover:bg-teal-100"
                          onClick={() => openEditModal(item)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100"
                          onClick={() => handleDelete(item.idthong_tin_bo_sung)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                      Chưa có thông tin bổ sung cho phương thức này.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                      Đang tải...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        open={showModal}
        title={editingItem ? "Cập nhật thông tin bổ sung" : "Thêm thông tin bổ sung"}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Loại thông tin <span className="text-red-500">*</span>
              </label>
              <select
                className="input w-full"
                value={formData.loai_thong_tin}
                onChange={(e) =>
                  setFormData({ ...formData, loai_thong_tin: e.target.value })
                }
              >
                <option value="SAT_CODE">Mã SAT</option>
                <option value="ACT_CODE">Mã ACT</option>
                <option value="DIEM_TOI_THIEU">Điểm tối thiểu</option>
                <option value="THOI_HAN_CHUNG_CHI">Thời hạn chứng chỉ</option>
                <option value="KHAC">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Thứ tự hiển thị
              </label>
              <input
                type="number"
                className="input w-full"
                value={formData.thu_tu}
                min="0"
                onChange={(e) => setFormData({ ...formData, thu_tu: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tên thông tin <span className="text-red-500">*</span>
            </label>
            <input
              className="input w-full"
              value={formData.ten_thong_tin}
              onChange={(e) =>
                setFormData({ ...formData, ten_thong_tin: e.target.value })
              }
              placeholder="VD: Mã SAT của IUH tại CollegeBoard"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nội dung chi tiết</label>
            <textarea
              className="input w-full"
              rows={4}
              value={formData.noi_dung}
              onChange={(e) =>
                setFormData({ ...formData, noi_dung: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-2">
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
            <button type="submit" className="btn-primary">
              {loading ? "Đang lưu..." : editingItem ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}


