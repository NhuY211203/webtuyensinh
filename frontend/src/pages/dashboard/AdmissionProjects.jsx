import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

const PAGE_SIZE = 6;

const formatDate = (value, withTime = false) => {
  if (!value) return "Đang cập nhật";
  const date = new Date(value);
  return date.toLocaleString("vi-VN", withTime
    ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "2-digit", year: "numeric" }
  );
};

const splitText = (text) => {
  if (!text) return [];
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
};

export default function AdmissionProjects() {
  const createDefaultFilters = () => ({
    keyword: "",
    idtruong: "",
    nam_tuyen_sinh: "",
    trang_thai: "1",
  });

  const [schools, setSchools] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [filters, setFilters] = useState(() => createDefaultFilters());
  const [searchText, setSearchText] = useState("");
  const [plans, setPlans] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [schoolIntro, setSchoolIntro] = useState(null);
  const [introLoading, setIntroLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load dropdown data once
  useEffect(() => {
    loadSchools();
    loadYears();
  }, []);

  // Load plans when filters change
  useEffect(() => {
    loadPlans(1);
  }, [filters.idtruong, filters.nam_tuyen_sinh, filters.trang_thai, filters.keyword]);

  // Load detail when selection changes
  useEffect(() => {
    if (selectedPlanId) {
      loadPlanDetail(selectedPlanId);
    } else {
      setSelectedPlan(null);
    }
  }, [selectedPlanId]);

  const loadSchools = async () => {
    try {
      const res = await api.getSchools({ perPage: 200 });
      const rows = Array.isArray(res?.data) ? res.data : [];
      const mapped = rows.map((row) => ({
        id: row.idtruong,
        code: row.matruong,
        name: row.tentruong,
      }));
      setSchools(mapped);
    } catch (error) {
      console.error("Không thể tải danh sách trường:", error);
    }
  };

  const loadYears = async () => {
    try {
      const res = await api.get("/years");
      const rows = Array.isArray(res?.data) ? res.data : [];
      setYearOptions(rows);
    } catch (error) {
      console.error("Không thể tải danh sách năm:", error);
      setYearOptions([
        { value: "2026", label: "2026" },
        { value: "2025", label: "2025" },
        { value: "2024", label: "2024" },
      ]);
    }
  };

  const buildQueryParams = (page) => {
    const params = {
      page,
      per_page: PAGE_SIZE,
    };
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.idtruong) params.idtruong = filters.idtruong;
    if (filters.nam_tuyen_sinh) params.nam_tuyen_sinh = filters.nam_tuyen_sinh;
    if (filters.trang_thai !== "" && filters.trang_thai !== null) {
      params.trang_thai = filters.trang_thai;
    }
    return params;
  };

  const loadPlans = async (page = 1) => {
    setLoadingPlans(true);
    setErrorMessage("");
    try {
      const params = buildQueryParams(page);
      const res = await api.getAdmissionProjects(params);
      const items = Array.isArray(res?.data) ? res.data : [];
      setPlans(items);
      setPagination(res?.pagination ?? null);

      if (items.length === 0) {
        setViewMode('list');
        setSelectedPlanId(null);
        setSelectedPlan(null);
        setSchoolIntro(null);
      } else if (viewMode === 'detail' && selectedPlanId) {
        const exists = items.some((item) => item.idde_an === selectedPlanId);
        if (!exists) {
          setViewMode('list');
          setSelectedPlanId(null);
          setSelectedPlan(null);
          setSchoolIntro(null);
        }
      }
    } catch (error) {
      console.error("Lỗi tải đề án:", error);
      setPlans([]);
      setPagination(null);
      setErrorMessage(error?.message || "Không thể tải dữ liệu đề án.");
    } finally {
      setLoadingPlans(false);
    }
  };

  const loadPlanDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await api.getAdmissionProjectDetail(id);
      if (res?.success) {
        setSelectedPlan(res.data);
        const schoolId = res.data?.idtruong ?? res.data?.truong?.idtruong;
        if (schoolId) {
          await loadSchoolIntroduction(schoolId);
        } else {
          setSchoolIntro(null);
        }
      } else {
        setSelectedPlan(null);
        setSchoolIntro(null);
      }
    } catch (error) {
      console.error("Lỗi tải chi tiết đề án:", error);
      setSelectedPlan(null);
      setSchoolIntro(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const loadSchoolIntroduction = async (idtruong) => {
    setIntroLoading(true);
    try {
      const res = await api.getSchoolIntroduction({ idtruong });
      const intro = Array.isArray(res?.data) ? res.data[0] : null;
      setSchoolIntro(intro);
    } catch (error) {
      console.error("Lỗi tải giới thiệu trường:", error);
      setSchoolIntro(null);
    } finally {
      setIntroLoading(false);
    }
  };

  const handleViewDetail = (plan) => {
    setSearchText("");
    setFilters(createDefaultFilters());
    setSelectedPlanId(plan.idde_an);
    setSelectedPlan(null);
    setSchoolIntro(null);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedPlanId(null);
    setSelectedPlan(null);
    setSchoolIntro(null);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setFilters((prev) => ({
      ...prev,
      keyword: searchText.trim(),
    }));
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setSearchText("");
    setFilters(createDefaultFilters());
  };

  const plansMeta = useMemo(() => {
    return {
      total: pagination?.total ?? plans.length,
    };
  }, [pagination, plans.length]);

  return (
    <div className="space-y-6">
      <header className="bg-gradient-to-r from-emerald-100 via-white to-cyan-100 border border-emerald-200 rounded-3xl p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Tra cứu đề án tuyển sinh</p>
        <h1 className="text-3xl font-bold text-slate-900 mt-2 mb-3">
          Đề án tuyển sinh các trường đại học
        </h1>
        <p className="text-slate-600 max-w-3xl text-sm leading-relaxed">
          Theo dõi nhanh đề án tuyển sinh, phương thức xét tuyển, quy định ưu tiên và yêu cầu hồ sơ của từng trường.
          Giao diện tham khảo từ Tuyển sinh 247 giúp bạn dễ dàng so sánh và cập nhật thông tin mới nhất.
        </p>
      </header>

      {viewMode === 'list' && (
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 lg:p-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[220px]">
            <label className="block text-sm font-medium text-slate-600 mb-1">Tìm kiếm đề án</label>
            <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-300">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Nhập tên đề án, trường hoặc từ khóa..."
                className="flex-1 px-4 py-2 text-sm outline-none"
              />
              <button
                type="submit"
                className="px-4 bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          <div className="w-full md:w-56">
            <label className="block text-sm font-medium text-slate-600 mb-1">Theo trường</label>
            <select
              value={filters.idtruong}
              onChange={(e) => handleFilterChange("idtruong", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Tất cả</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name} {school.code ? `(${school.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-40">
            <label className="block text-sm font-medium text-slate-600 mb-1">Năm tuyển sinh</label>
            <select
              value={filters.nam_tuyen_sinh}
              onChange={(e) => handleFilterChange("nam_tuyen_sinh", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Tất cả</option>
              {yearOptions.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-52">
            <label className="block text-sm font-medium text-slate-600 mb-1">Trạng thái</label>
            <select
              value={filters.trang_thai}
              onChange={(e) => handleFilterChange("trang_thai", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
            >
              <option value="1">Đang áp dụng</option>
              <option value="0">Ngưng áp dụng</option>
              <option value="">Tất cả</option>
            </select>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="h-10 px-4 text-sm font-medium rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            Xóa lọc
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          <StatBadge label="Tổng số đề án" value={plansMeta.total} />
          {filters.nam_tuyen_sinh && (
            <StatBadge label="Năm đang chọn" value={filters.nam_tuyen_sinh} />
          )}
          {filters.idtruong && (
            <StatBadge
              label="Trường đang chọn"
              value={schools.find((s) => String(s.id) === String(filters.idtruong))?.name || "Không xác định"}
            />
          )}
        </div>
      </section>
      )}

      {viewMode === 'list' ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-[0.3em]">Danh sách</p>
              <h2 className="text-lg font-semibold text-slate-900">Đề án tuyển sinh theo trường</h2>
            </div>
            {pagination && (
              <span className="text-xs text-slate-500">
                Trang {pagination.current_page}/{pagination.last_page}
              </span>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm">
              {errorMessage}
            </div>
          )}

          {loadingPlans ? (
            <PlanSkeletonList />
          ) : plans.length === 0 ? (
            <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center text-slate-500 text-sm">
              Không có đề án nào phù hợp bộ lọc hiện tại.
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <PlanListCard
                  key={plan.idde_an}
                  plan={plan}
                  onViewDetail={() => handleViewDetail(plan)}
                />
              ))}
            </div>
          )}

          {pagination && pagination.last_page > 1 && (
            <Pagination
              pagination={pagination}
              onChange={(page) => loadPlans(page)}
            />
          )}
        </section>
      ) : (
        <section className="bg-gradient-to-br from-white via-slate-50 to-white border border-slate-200 rounded-3xl shadow-md p-6 space-y-4">
          <button
            type="button"
            onClick={handleBackToList}
            className="text-sm font-semibold text-slate-600 hover:text-emerald-600"
          >
            Trở về danh sách đề án
          </button>

          <DetailPanel
            plan={selectedPlan}
            loading={detailLoading}
            schoolIntro={schoolIntro}
            introLoading={introLoading}
          />
        </section>
      )}
    </div>
  );
}

function StatBadge({ label, value }) {
  return (
    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
      <span className="font-semibold text-slate-900 mr-2">{value}</span>
      <span className="text-slate-500">{label}</span>
    </div>
  );
}

function PlanListCard({ plan, onViewDetail }) {
  const school = plan?.truong || {};
  const logo =
    school.anh_dai_dien ||
    school.logo_url ||
    school.logo ||
    "/logo.png";

  const summary = (plan?.thong_tin_tom_tat || "").trim();
  const methodCount = plan?.phuong_thuc_chi_tiet_count ?? plan?.so_phuong_thuc;

  return (
    <div className="flex items-center gap-4 border border-slate-200 rounded-2xl p-4 bg-white shadow-sm">
      <div className="w-24 h-20 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
        <img
          src={logo}
          alt={school.tentruong || "logo trường"}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = "/logo.png"; }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          {school.matruong && <span className="text-emerald-600">{school.matruong}</span>}
          <span>{school.tentruong || "Trường chưa xác định"}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {school.diachi || "Địa chỉ đang cập nhật"}
        </p>
        <p className="text-sm text-slate-600 mt-2">
          Năm {plan.nam_tuyen_sinh || "Đang cập nhật"} • {methodCount ?? "Chưa rõ"} phương thức tuyển sinh
        </p>
        <p className="text-xs text-slate-500 line-clamp-1">
          {summary || "Thông tin tóm tắt đang cập nhật."}
        </p>
        <button
          type="button"
          onClick={onViewDetail}
          className="mt-2 text-sm font-semibold text-emerald-600 hover:underline"
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}

function PlanSkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((idx) => (
        <div key={idx} className="border border-slate-200 rounded-2xl p-4 animate-pulse space-y-3 bg-slate-50">
          <div className="h-3 bg-slate-200 rounded" />
          <div className="h-4 bg-slate-200 rounded w-4/5" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

function Pagination({ pagination, onChange }) {
  const canPrev = pagination.current_page > 1;
  const canNext = pagination.current_page < pagination.last_page;

  return (
    <div className="flex items-center justify-between text-sm text-slate-600 mt-2">
      <button
        type="button"
        disabled={!canPrev}
        onClick={() => onChange(pagination.current_page - 1)}
        className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Trước
      </button>
      <span>Trang {pagination.current_page} / {pagination.last_page}</span>
      <button
        type="button"
        disabled={!canNext}
        onClick={() => onChange(pagination.current_page + 1)}
        className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Sau
      </button>
    </div>
  );
}

function DetailPanel({ plan, loading, schoolIntro, introLoading }) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-2/3" />
        <div className="h-4 bg-slate-100 rounded" />
        <div className="h-4 bg-slate-100 rounded w-3/4" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center text-slate-500 text-sm py-16">
        Vui lòng chọn một đề án ở danh sách bên trái để xem chi tiết.
      </div>
    );
  }

  const methods = plan?.phuongThucChiTiet || plan?.phuong_thuc_chi_tiet || [];
  const files = plan?.files || [];
  const school = plan?.truong;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white via-emerald-50 to-white border border-emerald-100 rounded-3xl p-5 shadow-sm">
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">
          Đề án tuyển sinh
        </p>
        <h2 className="text-2xl font-bold text-slate-900 mt-2">
          {plan.tieu_de}
        </h2>
        {school && (
          <p className="text-sm text-slate-600 mt-1">
            {school.tentruong} {school.matruong ? `(${school.matruong})` : ""}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-semibold rounded-full">Năm {plan.nam_tuyen_sinh}</span>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-semibold rounded-full">
            {methods.length} phương thức xét tuyển
          </span>
          {plan.trang_thai === 1 ? (
            <span className="px-3 py-1 bg-teal-600 text-white font-semibold rounded-full">Đang áp dụng</span>
          ) : (
            <span className="px-3 py-1 bg-slate-200 text-slate-700 font-semibold rounded-full">Ngưng áp dụng</span>
          )}
        </div>
        {plan.file_pdf_url && (
          <a
            href={plan.file_pdf_url}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm text-emerald-700 font-semibold mt-3"
          >
            Tải đề án PDF
          </a>
        )}
      </div>

      <SchoolIntroCard
        loading={introLoading}
        intro={schoolIntro}
        school={school}
      />

      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-sm text-slate-600 leading-relaxed shadow-sm">
        {splitText(plan.thong_tin_tom_tat).map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
        {!plan.thong_tin_tom_tat && (
          <p>Thông tin tóm tắt đang cập nhật.</p>
        )}
      </div>

      {files.length > 0 && (
        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Tài liệu đính kèm</h3>
          <ul className="space-y-2 text-sm">
            {files.map((file) => (
              <li key={file.idfile} className="flex items-center justify-between gap-3 border border-slate-100 rounded-2xl px-4 py-3 bg-slate-50">
                <div>
                  <p className="font-medium text-slate-800">
                    {formatFileName(file.ten_file, file.duong_dan)}
                  </p>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{file.loai_file}</p>
                </div>
                <a
                  href={file.duong_dan}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 text-sm font-semibold"
                >
                  Xem
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Tổng quan</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Phương thức tuyển sinh</h3>
          </div>
          <span className="text-xs text-slate-500">{methods.length} phương thức</span>
        </div>
        <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl text-sm font-semibold text-blue-700 uppercase tracking-wide">
          PHƯƠNG THỨC XÉT TUYỂN NĂM {plan.nam_tuyen_sinh}
        </div>

        {methods.length === 0 ? (
          <div className="p-4 border border-dashed border-slate-200 rounded-2xl text-sm text-slate-500 text-center">
            Chưa có dữ liệu phương thức tuyển sinh cho đề án này.
          </div>
        ) : (
          <div className="space-y-4">
            {methods.map((method, idx) => (
              <MethodCard
                key={method.idphuong_thuc_chi_tiet}
                index={idx + 1}
                method={method}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MethodCard({ method, index }) {
  const majors = method?.nganhTheoPhuongThuc || method?.nganh_theo_phuong_thuc || [];
  const files = method?.bangQuyDoi || method?.bang_quy_doi || [];
  const hoSo = method?.hoSoXetTuyen || method?.ho_so_xet_tuyen || [];
  const thongTinBoSung = method?.thongTinBoSung || method?.thong_tin_bo_sung || [];
  const xetTuyenThang = method?.xetTuyenThang || method?.xet_tuyen_thang || [];
  const quyDinh = method?.quyDinhDiemUuTien || method?.quy_dinh_diem_uu_tien;

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <div className="w-full flex items-start gap-3 p-4 bg-slate-50 border-b border-slate-200">
        <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center">
          {index}
        </span>
        <div className="flex-1">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Phương thức</p>
          <h4 className="text-lg font-bold text-slate-900 uppercase">{method.ten_phuong_thuc}</h4>
          <p className="text-xs text-slate-500 mt-1">
            {method.ma_phuong_thuc} • {method.doi_tuong ? "Có đối tượng riêng" : "Áp dụng rộng rãi"}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4 text-sm text-slate-600 leading-relaxed">
        {method.doi_tuong && (
          <TextSection title="Đối tượng áp dụng" content={method.doi_tuong} />
        )}
        {method.dieu_kien_xet_tuyen && (
          <TextSection title="Điều kiện xét tuyển" content={method.dieu_kien_xet_tuyen} />
        )}
        {method.cong_thuc_tinh_diem && (
          <TextSection title="Công thức tính điểm" content={method.cong_thuc_tinh_diem} />
        )}
        {method.mo_ta_quy_che && (
          <TextSection title="Quy chế chi tiết" content={method.mo_ta_quy_che} />
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoBlock label="Thời gian mở" value={formatDate(method.thoi_gian_bat_dau, true)} />
          <InfoBlock label="Thời gian kết thúc" value={formatDate(method.thoi_gian_ket_thuc, true)} />
        </div>

        {method.ghi_chu && (
          <TextSection title="Ghi chú" content={method.ghi_chu} />
        )}

        {majors.length > 0 && (
          <div className="border border-slate-200 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-semibold text-slate-900 text-sm uppercase">Ngành áp dụng ({majors.length})</h5>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {majors.map((major) => (
                <div
                  key={major.idnganh_phuong_thuc}
                  className="rounded-xl bg-white border border-slate-100 p-3 shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {major.nganhTruong?.tennganh || `Ngành ${major.nganhTruong?.manganh || ""}`}
                  </p>
                  {major.to_hop_mon && (
                    <p className="text-xs text-slate-500 mt-1">Tổ hợp: {major.to_hop_mon}</p>
                  )}
                  {major.ghi_chu && (
                    <p className="text-xs text-slate-500 mt-1">Ghi chú: {major.ghi_chu}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div>
            <h5 className="font-semibold text-slate-900 text-sm mb-2 uppercase">Quy đổi điểm ngoại ngữ</h5>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-slate-700">Chứng chỉ</th>
                    <th className="px-3 py-2 font-semibold text-slate-700">Điểm tối thiểu</th>
                    <th className="px-3 py-2 font-semibold text-slate-700">Điểm tối đa</th>
                    <th className="px-3 py-2 font-semibold text-slate-700">Điểm quy đổi</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((item) => (
                    <tr key={item.idquy_doi} className="border-t border-slate-100">
                      <td className="px-3 py-2">{item.loai_chung_chi}</td>
                      <td className="px-3 py-2">{item.muc_diem_min ?? item.ielts_min ?? "-"}</td>
                      <td className="px-3 py-2">{item.muc_diem_max ?? item.ielts_max ?? "-"}</td>
                      <td className="px-3 py-2 font-semibold text-slate-900">{item.diem_quy_doi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {quyDinh && (
          <div className="border border-amber-200 bg-amber-50 rounded-2xl p-3 text-sm text-amber-900">
            <h5 className="font-semibold mb-1 uppercase">Quy định điểm ưu tiên</h5>
            {quyDinh.cong_thuc_diem_uu_tien && (
              <p className="text-sm">{quyDinh.cong_thuc_diem_uu_tien}</p>
            )}
            {quyDinh.mo_ta_quy_dinh && (
              <p className="text-xs mt-1">{quyDinh.mo_ta_quy_dinh}</p>
            )}
          </div>
        )}

        {hoSo.length > 0 && (
          <div>
            <h5 className="font-semibold text-slate-900 text-sm mb-2 uppercase">Hồ sơ cần chuẩn bị</h5>
            <ul className="space-y-2 text-sm">
              {hoSo.map((item) => (
                <li key={item.idho_so} className="flex gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>{item.noi_dung}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {thongTinBoSung.length > 0 && (
          <div>
            <h5 className="font-semibold text-slate-900 text-sm mb-2 uppercase">Thông tin bổ sung</h5>
            <ul className="space-y-2 text-sm">
              {thongTinBoSung.map((item) => (
                <li key={item.idthong_tin_bo_sung} className="flex flex-col">
                  <span className="font-semibold text-slate-800">{item.ten_thong_tin}</span>
                  <span className="text-slate-600">{item.noi_dung}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {xetTuyenThang.length > 0 && (
          <div>
            <h5 className="font-semibold text-slate-900 text-sm mb-2 uppercase">Xét tuyển thẳng</h5>
            <div className="space-y-3">
              {xetTuyenThang.map((item) => (
                <div key={item.idxet_tuyen_thang} className="border border-slate-200 rounded-xl p-3">
                  <p className="font-semibold text-slate-900">{item.linh_vuc}</p>
                  {item.linh_vuc_chuyen_sau && (
                    <p className="text-xs text-slate-500 mt-1">{item.linh_vuc_chuyen_sau}</p>
                  )}
                  {item.danh_sach_nganh && (
                    <p className="text-sm text-slate-600 mt-2">
                      Ngành áp dụng: {item.danh_sach_nganh}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SchoolIntroCard({ loading, intro, school }) {
  if (loading) {
    return (
      <div className="mt-4 border border-slate-200 rounded-2xl p-4 animate-pulse space-y-3">
        <div className="h-4 w-1/3 bg-slate-200 rounded" />
        <div className="h-6 w-2/3 bg-slate-200 rounded" />
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-4/5 bg-slate-100 rounded" />
      </div>
    );
  }

  if (!intro && !school) {
    return null;
  }

  const logoUrl = intro?.anh_dai_dien || school?.anh_dai_dien || school?.logo_url || school?.logo || "/logo.png";

  const infoItems = [
    { label: "Tên tiếng Anh", value: intro?.ten_tieng_anh },
    { label: "Tên viết tắt", value: intro?.ten_viet_tat },
    { label: "Mã trường", value: intro?.ma_truong || school?.matruong },
    { label: "Website", value: intro?.website || school?.lienhe, isLink: true },
    { label: "Địa chỉ", value: intro?.dia_chi_day_du || school?.diachi },
  ];

  const richSections = [
    { title: "Lịch sử phát triển", content: intro?.lich_su },
    { title: "Sứ mệnh", content: intro?.su_menh },
    { title: "Tầm nhìn", content: intro?.tam_nhin },
    { title: "Thành tựu nổi bật", content: intro?.thanh_tuu },
    { title: "Quan hệ quốc tế", content: intro?.quan_he_quoc_te },
  ];

  return (
    <div className="border border-slate-200 rounded-3xl p-5 bg-gradient-to-br from-white via-blue-50 to-white shadow-sm space-y-4">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-[0.3em]">
          Giới thiệu trường
        </p>
        <div className="flex flex-wrap gap-3 items-start justify-between">
          <div className="flex items-start gap-4">
            {logoUrl && (
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt={school?.tentruong || "Logo trường"}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {school?.tentruong || "Thông tin trường"}
              </h3>
              {intro?.ten_tieng_anh && (
                <p className="text-sm text-slate-500">{intro.ten_tieng_anh}</p>
              )}
            </div>
          </div>
          {(intro?.ma_truong || school?.matruong) && (
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
              Mã trường: {intro?.ma_truong || school?.matruong}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {infoItems.map((item) => {
          if (!item.value) return null;
          let displayValue = item.value;
          if (item.isLink) {
            const href = /^https?:\/\//i.test(item.value) ? item.value : `https://${item.value}`;
            displayValue = (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 underline"
              >
                {item.value}
              </a>
            );
          }
          return (
            <InfoBlock key={item.label} label={item.label} value={displayValue} />
          );
        })}
      </div>

      {richSections.some((section) => section.content) && (
        <div className="space-y-4 border-t border-slate-100 pt-4">
          {richSections.map((section) =>
            section.content ? (
              <TextSection key={section.title} title={section.title} content={section.content} />
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

function TextSection({ title, content }) {
  const lines = splitText(content);
  return (
    <div>
      <h5 className="font-semibold text-slate-900 text-sm mb-1">{title}</h5>
      <div className="space-y-1 text-sm text-slate-600">
        {lines.length > 0
          ? lines.map((line, idx) => <p key={idx}>{line}</p>)
          : <p>{content}</p>}
      </div>
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function formatFileName(name, path) {
  if (name && !/^https?:\/\//i.test(name)) {
    return name;
  }
  const source = name || path;
  if (!source) return "Tài liệu";
  try {
    const url = new URL(source);
    return url.pathname.split('/').filter(Boolean).pop() || source;
  } catch (e) {
    return source.split('/').filter(Boolean).pop() || source;
  }
}

