import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";

const TABS = [
  { key: "info", label: "Thông tin chung" },
  { key: "sections", label: "Sections" },
  { key: "questions", label: "Câu hỏi" },
  { key: "statistics", label: "Thống kê & Kết quả" },
];

export default function DGNLExamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const examId = Number(id);
  const activeTab = searchParams.get("tab") || "info";

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    if (!examId) return;
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    setLoading(true);
    try {
      const res = await api.getDGNLExamDetail(examId);
      if (res?.success) {
        setExam(res.data);
      } else {
        showToast("Không tìm thấy kỳ thi", "error");
        navigate("/analyst/dgnl-exams");
      }
    } catch (e) {
      console.error("Failed to load exam", e);
      showToast("Không thể tải thông tin kỳ thi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", key);
    setSearchParams(next);
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  if (loading && !exam) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  if (!exam) {
    return <div className="text-center py-12">Không tìm thấy kỳ thi</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="text-xs sm:text-sm text-slate-600 hover:text-teal-600"
            onClick={() => navigate("/analyst/dgnl-exams")}
          >
            ← Quay lại danh sách kỳ thi
          </button>
          <h1 className="text-xl sm:text-2xl font-bold mt-2 break-words">{exam.tenkythi}</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 break-words">
            Mã: {exam.makythi} {exam.to_chuc && `• ${exam.to_chuc}`}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            className="btn-outline w-full sm:w-auto text-xs sm:text-sm"
            onClick={async () => {
              try {
                await api.exportDGNLExam(examId);
                showToast("Đã xuất file Excel thành công", "success");
              } catch (e) {
                showToast("Không thể xuất file", "error");
              }
            }}
          >
            📥 Xuất Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="-mb-px flex flex-nowrap gap-2 sm:gap-3 min-w-max">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleChangeTab(tab.key)}
                className={`whitespace-nowrap px-3 py-2 text-xs sm:text-sm border-b-2 transition-colors ${
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
      {activeTab === "info" && (
        <ExamInfoTab exam={exam} onUpdate={loadExam} showToast={showToast} />
      )}

      {activeTab === "sections" && (
        <SectionsTab examId={examId} exam={exam} onUpdate={loadExam} showToast={showToast} />
      )}

      {activeTab === "questions" && (
        <QuestionsTab examId={examId} exam={exam} showToast={showToast} />
      )}

      {activeTab === "statistics" && (
        <StatisticsTab examId={examId} exam={exam} />
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

// Tab 1: Thông tin chung
function ExamInfoTab({ exam, onUpdate, showToast }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    makythi: exam.makythi || "",
    tenkythi: exam.tenkythi || "",
    to_chuc: exam.to_chuc || "",
    so_cau: exam.so_cau?.toString() || "",
    thoi_luong_phut: exam.thoi_luong_phut?.toString() || "",
    hinh_thuc: exam.hinh_thuc || "",
    mo_ta_tong_quat: exam.mo_ta_tong_quat || "",
    ghi_chu: exam.ghi_chu || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      const res = await api.updateDGNLExam(exam.idkythi, payload);
      if (res?.success) {
        showToast("Cập nhật thông tin thành công", "success");
        setShowModal(false);
        onUpdate();
      } else {
        showToast(res?.message || "Không thể cập nhật", "error");
      }
    } catch (e) {
      showToast(e?.message || "Không thể cập nhật", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="card p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="font-semibold">Thông tin kỳ thi</h2>
          <button
            type="button"
            className="btn-primary w-full sm:w-auto"
            onClick={() => setShowModal(true)}
          >
            ✏️ Chỉnh sửa
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="text-sm text-gray-500">Mã kỳ thi</label>
          <p className="font-medium mt-1">{exam.makythi}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Tên kỳ thi</label>
          <p className="font-medium mt-1">{exam.tenkythi}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Tổ chức</label>
          <p className="font-medium mt-1">{exam.to_chuc || "—"}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Số câu</label>
          <p className="font-medium mt-1">{exam.so_cau || "—"}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Thời lượng</label>
          <p className="font-medium mt-1">
            {exam.thoi_luong_phut ? `${exam.thoi_luong_phut} phút` : "—"}
          </p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Hình thức</label>
          <p className="font-medium mt-1">{exam.hinh_thuc || "—"}</p>
        </div>
      </div>

      {exam.mo_ta_tong_quat && (
        <div className="mt-4">
          <label className="text-sm text-gray-500">Mô tả tổng quan</label>
          <p className="mt-1 whitespace-pre-line">{exam.mo_ta_tong_quat}</p>
        </div>
      )}

      {exam.ghi_chu && (
        <div className="mt-4">
          <label className="text-sm text-gray-500">Ghi chú</label>
          <p className="mt-1 whitespace-pre-line">{exam.ghi_chu}</p>
        </div>
      )}

      <Modal
        open={showModal}
        title="Chỉnh sửa thông tin kỳ thi"
        onClose={() => setShowModal(false)}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mã kỳ thi</label>
              <input
                className="input w-full"
                value={formData.makythi}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Tên kỳ thi <span className="text-red-500">*</span>
              </label>
              <input
                className="input w-full"
                value={formData.tenkythi}
                onChange={(e) => setFormData({ ...formData, tenkythi: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tổ chức</label>
              <input
                className="input w-full"
                value={formData.to_chuc}
                onChange={(e) => setFormData({ ...formData, to_chuc: e.target.value })}
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
              onClick={() => setShowModal(false)}
            >
              Hủy
            </button>
            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
              {loading ? "Đang lưu..." : "Cập nhật"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Tab 2: Sections
function SectionsTab({ examId, exam, onUpdate, showToast }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    ma_section: "",
    ten_section: "",
    nhom_nang_luc: "",
    so_cau: "",
    thoi_luong_phut: "",
    thu_tu: "",
    mo_ta: "",
  });

  useEffect(() => {
    loadSections();
  }, [examId]);

  const loadSections = async () => {
    setLoading(true);
    try {
      const res = await api.getDGNLSections(examId);
      if (res?.success) {
        setSections(res.data || []);
      }
    } catch (e) {
      console.error("Failed to load sections", e);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      ma_section: "",
      ten_section: "",
      nhom_nang_luc: "",
      so_cau: "",
      thoi_luong_phut: "",
      thu_tu: "",
      mo_ta: "",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      ma_section: item.ma_section || "",
      ten_section: item.ten_section || "",
      nhom_nang_luc: item.nhom_nang_luc || "",
      so_cau: item.so_cau?.toString() || "",
      thoi_luong_phut: item.thoi_luong_phut?.toString() || "",
      thu_tu: item.thu_tu?.toString() || "",
      mo_ta: item.mo_ta || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ma_section: formData.ma_section.trim(),
        ten_section: formData.ten_section.trim(),
        nhom_nang_luc: formData.nhom_nang_luc || null,
        so_cau: formData.so_cau ? Number(formData.so_cau) : null,
        thoi_luong_phut: formData.thoi_luong_phut ? Number(formData.thoi_luong_phut) : null,
        thu_tu: formData.thu_tu ? Number(formData.thu_tu) : 0,
        mo_ta: formData.mo_ta || null,
      };

      let res;
      if (editingItem) {
        res = await api.updateDGNLSection(editingItem.idsection, payload);
      } else {
        res = await api.createDGNLSection(examId, payload);
      }

      if (res?.success) {
        showToast(
          editingItem ? "Cập nhật section thành công" : "Tạo section thành công",
          "success"
        );
        setShowModal(false);
        resetForm();
        await loadSections();
        onUpdate();
      } else {
        showToast(res?.message || "Không thể lưu section", "error");
      }
    } catch (e) {
      showToast(e?.message || "Không thể lưu section", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa section này?")) return;
    setLoading(true);
    try {
      const res = await api.deleteDGNLSection(id);
      if (res?.success) {
        showToast("Xóa section thành công", "success");
        await loadSections();
        onUpdate();
      } else {
        showToast(res?.message || "Không thể xóa section", "error");
      }
    } catch (e) {
      showToast(e?.message || "Không thể xóa section", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-semibold mb-1">Danh sách Sections</h2>
          <p className="text-xs text-slate-500">
            Quản lý các phần thi trong kỳ thi này
          </p>
        </div>
        <button type="button" className="btn-primary w-full sm:w-auto" onClick={openCreateModal}>
          + Thêm section
        </button>
      </div>

      <div className="card p-3 sm:p-5 mt-3">
        <div className="space-y-3">
          {sections.map((section) => (
            <div
              key={section.idsection}
              className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold break-words">{section.ten_section}</h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded whitespace-nowrap">
                      {section.ma_section}
                    </span>
                  </div>
                  {section.nhom_nang_luc && (
                    <p className="text-sm text-gray-600 mt-1 break-words">
                      Nhóm năng lực: {section.nhom_nang_luc}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 sm:gap-4 mt-2 text-sm text-gray-500">
                    <span>
                      Số câu: {section.so_cau ? `${section.so_cau_hoi || 0}/${section.so_cau}` : (section.so_cau_hoi || 0)}
                    </span>
                    {section.thoi_luong_phut && (
                      <span>Thời lượng: {section.thoi_luong_phut} phút</span>
                    )}
                  </div>
                  {section.mo_ta && (
                    <p className="text-sm text-gray-600 mt-2 break-words">{section.mo_ta}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs rounded bg-teal-50 text-teal-700 hover:bg-teal-100 whitespace-nowrap"
                    onClick={() => openEditModal(section)}
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100 whitespace-nowrap"
                    onClick={() => handleDelete(section.idsection)}
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
          {sections.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              Chưa có section nào. Hãy thêm section mới.
            </div>
          )}
        </div>
      </div>

      <Modal
        open={showModal}
        title={editingItem ? "Cập nhật section" : "Thêm section mới"}
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
                Mã section <span className="text-red-500">*</span>
              </label>
              <input
                className="input w-full"
                value={formData.ma_section}
                onChange={(e) => setFormData({ ...formData, ma_section: e.target.value })}
                placeholder="VD: TD_DL, TD_DT"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Tên section <span className="text-red-500">*</span>
              </label>
              <input
                className="input w-full"
                value={formData.ten_section}
                onChange={(e) => setFormData({ ...formData, ten_section: e.target.value })}
                placeholder="VD: Tư duy định lượng"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nhóm năng lực</label>
            <input
              className="input w-full"
              value={formData.nhom_nang_luc}
              onChange={(e) => setFormData({ ...formData, nhom_nang_luc: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
            <div>
              <label className="block text-sm font-medium mb-1">Thứ tự</label>
              <input
                type="number"
                className="input w-full"
                value={formData.thu_tu}
                onChange={(e) => setFormData({ ...formData, thu_tu: e.target.value })}
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              className="input w-full"
              rows={3}
              value={formData.mo_ta}
              onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
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
    </>
  );
}

// Tab 3: Questions
function QuestionsTab({ examId, exam, showToast }) {
  const [questions, setQuestions] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedSection, setSelectedSection] = useState("");
  const [fileInput, setFileInput] = useState(null);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [formData, setFormData] = useState({
    idsection: "",
    noi_dung: "",
    loai_cau: "single_choice",
    thu_tu: "",
    do_kho: "medium",
    diem_mac_dinh: "1",
    options: [
      { noi_dung: "", loi_giai: "" },
      { noi_dung: "", loi_giai: "" },
      { noi_dung: "", loi_giai: "" },
      { noi_dung: "", loi_giai: "" },
    ],
  });

  useEffect(() => {
    loadSections();
  }, [examId]);

  useEffect(() => {
    loadQuestions();
  }, [examId, selectedSection]);

  const loadSections = async () => {
    try {
      const res = await api.getDGNLSections(examId);
      if (res?.success) {
        setSections(res.data || []);
      }
    } catch (e) {
      console.error("Failed to load sections", e);
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const params = selectedSection ? { idsection: selectedSection } : {};
      const res = await api.getDGNLQuestions(examId, params);
      if (res?.success) {
        setQuestions(res.data || []);
      }
    } catch (e) {
      console.error("Failed to load questions", e);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setCorrectIndex(null);
    setFormData({
      idsection: selectedSection || "",
      noi_dung: "",
      loai_cau: "single_choice",
      thu_tu: "",
      do_kho: "medium",
      diem_mac_dinh: "1",
      options: [
        { noi_dung: "", loi_giai: "" },
        { noi_dung: "", loi_giai: "" },
        { noi_dung: "", loi_giai: "" },
        { noi_dung: "", loi_giai: "" },
      ],
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = async (item) => {
    try {
      const res = await api.getDGNLQuestionDetail(item.idquestion);
      if (res?.success) {
        const question = res.data;
        setEditingItem(question);

        const correctOptIndex = (question.options || []).findIndex(opt => !!opt.is_correct);
        setCorrectIndex(correctOptIndex >= 0 ? correctOptIndex : null);

        setFormData({
          idsection: question.idsection,
          noi_dung: question.noi_dung || "",
          loai_cau: question.loai_cau || "single_choice",
          thu_tu: question.thu_tu?.toString() || "",
          do_kho: question.do_kho || "medium",
          diem_mac_dinh: (question.diem_mac_dinh != null ? String(question.diem_mac_dinh) : ""),
          options: (question.options || []).map((opt) => ({
            noi_dung: opt.noi_dung || "",
            loi_giai: opt.loi_giai || "",
          })),
        });
        setShowModal(true);
      }
    } catch (e) {
      showToast("Không thể tải chi tiết câu hỏi", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Chuẩn hóa danh sách phương án: chỉ giữ phương án có nội dung
    const compact = (opts) =>
      (opts || [])
        .map(o => ({ noi_dung: (o.noi_dung||'').trim(), is_correct: !!o.is_correct, loi_giai: o.loi_giai || null }))
        .filter(o => o.noi_dung);

    const currentOptions = compact(formData.options);

    // Validate: nếu có options thì phải hợp lệ
    if (currentOptions.length < 2) {
      showToast("Phải có ít nhất 2 phương án", "error");
      return;
    }
    if (!currentOptions.some(o => o.is_correct)) {
      showToast("Phải có ít nhất 1 đáp án đúng", "error");
      return;
    }

    // Payload cho phần cơ bản
    const diemStr = (formData.diem_mac_dinh ?? "").toString().replace(",", ".");
    const diemNum = diemStr === "" ? undefined : parseFloat(diemStr);
    const basicPayload = {
      idsection: Number(formData.idsection),
      noi_dung: formData.noi_dung.trim(),
      loai_cau: 'single_choice',
      do_kho: formData.do_kho,
      thu_tu: formData.thu_tu ? Number(formData.thu_tu) : 0,
      ...(Number.isFinite(diemNum) ? { diem_mac_dinh: diemNum } : {}),
    };

    setLoading(true);
    try {
      if (editingItem) {
        // Update BASIC trước
        await api.updateDGNLQuestionBasic(editingItem.idquestion, basicPayload);

        // So sánh options để quyết định có update OPTIONS hay không
        const original = compact(editingItem.options || []);
        const optionsChanged =
          original.length !== currentOptions.length ||
          JSON.stringify(original) !== JSON.stringify(currentOptions);

        if (optionsChanged) {
          const optionsPayload = currentOptions.map((o, idx) => ({ ...o, thu_tu: idx + 1 }));
          await api.updateDGNLQuestionOptions(editingItem.idquestion, optionsPayload);
        }
        showToast("Cập nhật câu hỏi thành công", "success");
      } else {
        // Tạo mới: gửi kèm options
        const createPayload = {
          ...basicPayload,
          options: currentOptions.map((o, idx) => ({ ...o, thu_tu: idx + 1 }))
        };
        const res = await api.createDGNLQuestion(examId, createPayload);
        if (!res?.success) {
          showToast(res?.message || "Không thể tạo câu hỏi", "error");
          return;
        }
        showToast("Tạo câu hỏi thành công", "success");
      }

      setShowModal(false);
      resetForm();
      await loadQuestions();
    } catch (err) {
      showToast(err?.message || "Không thể lưu câu hỏi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) return;
    setLoading(true);
    try {
      const res = await api.deleteDGNLQuestion(id);
      if (res?.success) {
        showToast("Xóa câu hỏi thành công", "success");
        await loadQuestions();
      } else {
        showToast(res?.message || "Không thể xóa câu hỏi", "error");
      }
    } catch (e) {
      showToast(e?.message || "Không thể xóa câu hỏi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!fileInput?.files[0]) {
      showToast("Vui lòng chọn file", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.importDGNLExam(examId, fileInput.files[0]);
      if (res?.success) {
        showToast(`Import thành công ${res.data.imported} câu hỏi`, "success");
        setShowImportModal(false);
        setFileInput(null);
        await loadQuestions();
      } else {
        showToast(res?.message || "Import thất bại", "error");
      }
    } catch (e) {
      showToast(e?.message || "Không thể import file", "error");
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { noi_dung: "", is_correct: false, loi_giai: "" }],
    });
  };

  const removeOption = (index) => {
    if (formData.options.length <= 2) {
      showToast("Phải có ít nhất 2 phương án", "error");
      return;
    }
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-semibold mb-1">Danh sách câu hỏi</h2>
          <p className="text-xs text-slate-500">
            Quản lý câu hỏi và đáp án cho kỳ thi này
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            className="btn-outline w-full sm:w-auto"
            onClick={() => setShowImportModal(true)}
          >
            📥 Import từ Excel
          </button>
          <button type="button" className="btn-primary w-full sm:w-auto" onClick={openCreateModal}>
            + Thêm câu hỏi
          </button>
        </div>
      </div>

      {/* Filter by section */}
      <div className="card p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <label className="text-sm font-medium whitespace-nowrap">Lọc theo section:</label>
          <select
            className="input flex-1"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="">Tất cả sections</option>
            {sections.map((section) => (
              <option key={section.idsection} value={section.idsection}>
                {section.ten_section} ({section.ma_section})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card p-3 sm:p-5 mt-3">
        <div className="space-y-3 sm:space-y-4">
          {questions.map((question) => (
            <div
              key={question.idquestion}
              className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 rounded whitespace-nowrap">
                      Câu {question.thu_tu || "—"}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded truncate max-w-[200px]">
                      {question.section?.ten_section || "—"}
                    </span>
                    <span className="text-xs px-2 py-1 bg-purple-100 rounded whitespace-nowrap">
                      {question.do_kho || "—"}
                    </span>
                  </div>
                  <p className="font-medium mb-2 break-words">{question.noi_dung}</p>
                  <div className="space-y-1">
                    {question.options?.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`text-sm p-2 rounded ${
                          opt.is_correct
                            ? "bg-green-50 border border-green-200"
                            : "bg-gray-50"
                        }`}
                      >
                        <span className={opt.is_correct ? "font-semibold text-green-700" : ""}>
                          {String.fromCharCode(65 + idx)}. {opt.noi_dung}
                          {opt.is_correct && " ✓"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 sm:ml-4 flex-shrink-0">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs rounded bg-teal-50 text-teal-700 hover:bg-teal-100 whitespace-nowrap"
                    onClick={() => openEditModal(question)}
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100 whitespace-nowrap"
                    onClick={() => handleDelete(question.idquestion)}
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
          {questions.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              Chưa có câu hỏi nào. Hãy thêm câu hỏi mới hoặc import từ file Excel.
            </div>
          )}
          {loading && (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          )}
        </div>
      </div>

      {/* Add/Edit Question Modal */}
      <Modal
        open={showModal}
        title={editingItem ? "Cập nhật câu hỏi" : "Thêm câu hỏi mới"}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Section <span className="text-red-500">*</span>
            </label>
            <select
              className="input w-full"
              value={formData.idsection}
              onChange={(e) => setFormData({ ...formData, idsection: e.target.value })}
              required
            >
              <option value="">Chọn section</option>
              {sections.map((section) => (
                <option key={section.idsection} value={section.idsection}>
                  {section.ten_section} ({section.ma_section})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Nội dung câu hỏi <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input w-full"
              rows={3}
              value={formData.noi_dung}
              onChange={(e) => setFormData({ ...formData, noi_dung: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Loại câu</label>
              <select
                className="input w-full"
                value={formData.loai_cau}
                disabled
                onChange={() => {}}
                title="Chỉ hỗ trợ Trắc nghiệm (single_choice)"
              >
                <option value="single_choice">Trắc nghiệm</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Độ khó</label>
              <select
                className="input w-full"
                value={formData.do_kho}
                onChange={(e) => setFormData({ ...formData, do_kho: e.target.value })}
              >
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Điểm</label>
              <input
                type="number"
                step="0.1"
                className="input w-full"
                value={formData.diem_mac_dinh}
                onChange={(e) => setFormData({ ...formData, diem_mac_dinh: e.target.value })}
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Thứ tự</label>
            <input
              type="number"
              className="input w-full"
              value={formData.thu_tu}
              onChange={(e) => setFormData({ ...formData, thu_tu: e.target.value })}
              min="0"
            />
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <label className="block text-sm font-medium">
                Phương án trả lời <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                className="text-xs btn-outline self-start sm:self-auto"
                onClick={addOption}
              >
                + Thêm phương án
              </button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {formData.options.map((option, index) => (
                <div key={index} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <input
                      type="radio"
                      name={`correctOption-${editingItem?.idquestion || 'new'}`}
                      checked={correctIndex === index}
                      onChange={() => setCorrectIndex(index)}
                      className="mt-1.5 flex-shrink-0"
                      title="Đánh dấu đáp án đúng"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-gray-600 flex-shrink-0">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <input
                          className="input w-full text-sm"
                          placeholder={`Nhập nội dung phương án ${String.fromCharCode(65 + index)}`}
                          value={option.noi_dung}
                          onChange={(e) => {
                            const newOptions = [...formData.options];
                            newOptions[index].noi_dung = e.target.value;
                            setFormData({ ...formData, options: newOptions });
                          }}
                        />
                      </div>
                      <textarea
                        className="input w-full text-xs resize-none"
                        rows={2}
                        placeholder="Lời giải (tùy chọn)"
                        value={option.loi_giai}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[index].loi_giai = e.target.value;
                          setFormData({ ...formData, options: newOptions });
                        }}
                      />
                    </div>
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 flex-shrink-0 p-1 text-lg leading-none"
                        onClick={() => removeOption(index)}
                        title="Xóa phương án"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
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

      {/* Import Modal */}
      <Modal
        open={showImportModal}
        title="Import câu hỏi từ Excel"
        onClose={() => {
          setShowImportModal(false);
          setFileInput(null);
        }}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Chọn file Excel</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              ref={(el) => setFileInput(el)}
              className="input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Chỉ chấp nhận file .xlsx hoặc .xls. Vui lòng tải template để xem format.
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              className="btn-outline w-full sm:w-auto"
              onClick={() => {
                setShowImportModal(false);
                setFileInput(null);
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn-primary w-full sm:w-auto"
              onClick={handleImport}
              disabled={loading}
            >
              {loading ? "Đang import..." : "Import"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// Tab 4: Statistics
function StatisticsTab({ examId, exam }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, [examId]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const res = await api.getDGNLExamStatistics(examId);
      if (res?.success) {
        setStats(res.data);
      }
    } catch (e) {
      console.error("Failed to load statistics", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải thống kê...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12">Không có dữ liệu thống kê</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="card p-4 sm:p-5">
          <div className="text-sm text-gray-500">Tổng số sections</div>
          <div className="text-2xl sm:text-3xl font-bold mt-2">{stats.tong_so_section}</div>
        </div>
        <div className="card p-4 sm:p-5">
          <div className="text-sm text-gray-500">Tổng số câu hỏi</div>
          <div className="text-2xl sm:text-3xl font-bold mt-2">{stats.tong_so_cau_hoi}</div>
        </div>
        <div className="card p-4 sm:p-5">
          <div className="text-sm text-gray-500">Tổng lượt làm bài</div>
          <div className="text-2xl sm:text-3xl font-bold mt-2">{stats.tong_so_luot_lam}</div>
        </div>
      </div>

      <div className="card p-3 sm:p-5">
        <h3 className="font-semibold mb-4">Số lượng câu hỏi theo section</h3>
        <div className="space-y-2">
          {stats.sections.map((section) => (
            <div key={section.idsection} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded">
              <span className="font-medium break-words">{section.ten_section}</span>
              <span className="text-lg font-bold whitespace-nowrap">{section.so_cau_hoi} câu</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

