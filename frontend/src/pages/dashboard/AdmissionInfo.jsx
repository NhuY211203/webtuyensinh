import { useEffect, useMemo, useState } from "react";

// Trang tra cứu thông tin tuyển sinh (dữ liệu cứng)
export default function AdmissionInfo() {
  const [schools, setSchools] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [schoolCode, setSchoolCode] = useState("");
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const methodTitles = useMemo(() => ({
    1: "Điểm thi THPT",
    2: "Điểm học bạ",
    3: "Đánh giá năng lực/Kỳ thi khác",
    4: "Xét tuyển kết hợp",
  }), []);
  const [methodMajors, setMethodMajors] = useState({ 1: [], 2: [], 3: [], 4: [] });
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);

  // Load years from API
  useEffect(() => {
    let ignore = false;
    async function loadYears() {
      try {
        const res = await fetch("http://localhost:8000/api/years").catch(() =>
          fetch("/api/years")
        );
        const json = await res.json();
        const yearsList = Array.isArray(json?.data) ? json.data : [];
        if (!ignore) {
          setYears(yearsList);
          // Set default year to the first (latest) year
          if (yearsList.length > 0 && !selectedYear) {
            setSelectedYear(yearsList[0].value);
          }
        }
      } catch (e) {
        console.error("Error loading years:", e);
        // Fallback to hardcoded years
        const fallback = [2024, 2023, 2022, 2021, 2020].map(y => ({ value: String(y), label: String(y) }));
        if (!ignore) {
          setYears(fallback);
          if (!selectedYear) {
            setSelectedYear("2024");
          }
        }
      }
    }
    loadYears();
    return () => { ignore = true; };
  }, []);

  // Load all schools (for reference)
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("http://localhost:8000/api/truongdaihoc?perPage=200").catch(() =>
          fetch("/api/truongdaihoc?perPage=200")
        );
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        const mapped = rows.map((r) => ({
          id: r.idtruong,
          code: r.matruong || String(r.idtruong),
          name: r.tentruong,
          website: r.lienhe || "",
          image: "/logo.png",
          address: r.diachi || "",
        }));
        if (!ignore) {
          setSchools(mapped);
        }
      } catch (e) {
        console.error("Error loading schools:", e);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  // Filter schools by selected year
  useEffect(() => {
    let ignore = false;
    async function filterSchoolsByYear() {
      if (!selectedYear) {
        setFilteredSchools(schools);
        if (schools.length && !schoolCode) {
          setSchoolCode(schools[0].code);
        }
        return;
      }

      setLoadingSchools(true);
      try {
        // Get schools that have data for the selected year from nganh_truong table
        const res = await fetch(`http://localhost:8000/api/nganh-truong?nam=${selectedYear}&perPage=1000`).catch(() =>
          fetch(`/api/nganh-truong?nam=${selectedYear}&perPage=1000`)
        );
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        
        // Get unique school IDs from the results
        const schoolIds = new Set(rows.map(r => r.idtruong).filter(Boolean));
        
        // Filter schools that have data for this year
        const filtered = schools.filter(s => schoolIds.has(s.id));
        
        if (!ignore) {
          setFilteredSchools(filtered);
          // Reset school selection if current school is not in filtered list
          if (schoolCode && !filtered.find(s => s.code === schoolCode)) {
            if (filtered.length > 0) {
              setSchoolCode(filtered[0].code);
            } else {
              setSchoolCode("");
            }
          } else if (!schoolCode && filtered.length > 0) {
            setSchoolCode(filtered[0].code);
          }
        }
      } catch (e) {
        console.error("Error filtering schools by year:", e);
        if (!ignore) {
          setFilteredSchools(schools);
        }
      } finally {
        if (!ignore) {
          setLoadingSchools(false);
        }
      }
    }
    
    if (schools.length > 0) {
      filterSchoolsByYear();
    }
    return () => { ignore = true; };
  }, [selectedYear, schools]);

  const school = useMemo(
    () => filteredSchools.find((s) => s.code === schoolCode),
    [filteredSchools, schoolCode]
  );

  // Fetch majors from nganh_truong table and group by hinhthuc (1..4)
  useEffect(() => {
    async function loadMajors() {
      if (!school || !selectedYear) return;
      setLoadingMethods(true);
      try {
        const url = `http://localhost:8000/api/nganh-truong?idtruong=${encodeURIComponent(school.id ?? '')}&nam=${selectedYear}&perPage=1000`;
        const res = await fetch(url).catch(() =>
          fetch(`/api/nganh-truong?idtruong=${encodeURIComponent(school.id ?? '')}&nam=${selectedYear}&perPage=1000`)
        );
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : (Array.isArray(json?.pagination?.data) ? json.pagination.data : []);

        const group = { 1: [], 2: [], 3: [], 4: [] };
        const maps = { 1: new Map(), 2: new Map(), 3: new Map(), 4: new Map() };

        rows.forEach((r) => {
          // hinhthuc trong nganh_truong tương ứng với idxettuyen (1..4)
          const idx = Number(r.hinhthuc || 0);
          if (![1,2,3,4].includes(idx)) return;
          const key = r.manganh;
          const name = r.tennganh || r.manganh;
          // Lấy tổ hợp từ cột tohop_xettuyen_truong thay vì tohopmon
          const combos = String(r.tohop_xettuyen_truong || "").split(";").map((s) => s.trim()).filter(Boolean);
          const map = maps[idx];
          if (!map.has(key)) {
            map.set(key, { 
              code: key, 
              name, 
              combos: new Set(combos), 
              names: new Set(),
              thoiluong_nam: r.thoiluong_nam || null,
              mota_tomtat: r.mota_tomtat || null
            });
          } else {
            const entry = map.get(key);
            combos.forEach((c) => entry.combos.add(c));
            // Lưu thoiluong_nam và mota_tomtat nếu chưa có
            if (!entry.thoiluong_nam && r.thoiluong_nam) {
              entry.thoiluong_nam = r.thoiluong_nam;
            }
            if (!entry.mota_tomtat && r.mota_tomtat) {
              entry.mota_tomtat = r.mota_tomtat;
            }
          }
        });

        [1,2,3,4].forEach((idx) => {
          const list = Array.from(maps[idx].values()).map((m, i) => ({
            stt: i + 1,
            code: m.code,
            name: m.name,
            combos: Array.from(m.combos).join("; "),
            thoiluong_nam: m.thoiluong_nam,
            mota_tomtat: m.mota_tomtat,
          }));
          group[idx] = list;
        });

        setMethodMajors(group);
      } catch (e) {
        console.error("Error loading majors:", e);
        // keep defaults if fail
      } finally {
        setLoadingMethods(false);
      }
    }
    loadMajors();
  }, [school, selectedYear]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Tra cứu thông tin tuyển sinh</h1>

        {/* Chọn năm và trường */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Chọn năm */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Chọn năm</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              disabled={years.length === 0}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {years.length === 0 ? (
                <option value="">Đang tải...</option>
              ) : (
                years.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Chọn trường */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Chọn trường
              {loadingSchools && <span className="ml-2 text-xs text-gray-400">(Đang tải...)</span>}
            </label>
            <select
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              disabled={loadingSchools || filteredSchools.length === 0}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {filteredSchools.length === 0 ? (
                <option value="">Không có trường nào có dữ liệu cho năm {selectedYear}</option>
              ) : (
                filteredSchools.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {school && <SchoolInfoCard school={school} />}

        <div className="grid grid-cols-1 gap-6">
          <MethodBlock method={{ title: methodTitles[1], rules: [], majors: methodMajors[1] }} loading={loadingMethods} />
          <MethodBlock method={{ title: methodTitles[2], rules: [], majors: methodMajors[2] }} loading={loadingMethods} />
          <MethodBlock method={{ title: methodTitles[3], rules: [], majors: methodMajors[3] }} loading={loadingMethods} />
          <MethodBlock method={{ title: methodTitles[4], rules: [], majors: methodMajors[4] }} loading={loadingMethods} />
        </div>
      </div>
    </div>
  );
}

function SchoolInfoCard({ school }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="flex flex-col md:flex-row items-start gap-4 p-4">
        <img src={school.image} alt={school.name} className="h-20 w-20 object-contain" />
        <div className="flex-1">
          <div className="text-sm text-teal-700 font-semibold">GIỚI THIỆU TRƯỜNG</div>
          <div className="mt-1 font-semibold">Tên trường: {school.name}</div>
          <div className="text-sm text-gray-600">Tên tiếng Anh: {school.alias}</div>
          <div className="text-sm text-gray-600">Mã trường: {school.code}</div>
          <div className="text-sm text-gray-600">Website: <a className="text-teal-600 underline" href={school.website} target="_blank" rel="noreferrer">{school.website}</a></div>
          <div className="text-sm text-gray-600">Địa chỉ: {school.address}</div>
        </div>
      </div>
    </div>
  );
}

function MethodBlock({ method, hideTable = false, loading = false }) {
  const [displayCount, setDisplayCount] = useState(5);
  const itemsPerPage = 5;
  const allMajors = method.majors || [];
  const displayedMajors = allMajors.slice(0, displayCount);
  const hasMore = allMajors.length > displayCount;

  // Reset displayCount khi danh sách majors thay đổi (ví dụ khi chọn trường khác)
  useEffect(() => {
    setDisplayCount(5);
  }, [allMajors.length]);

  const handleShowMore = () => {
    setDisplayCount(prev => Math.min(prev + itemsPerPage, allMajors.length));
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold">i</span>
          <h2 className="text-lg font-semibold">{method.title}</h2>
        </div>
        {method.description && (
          <p className="text-sm text-gray-600 mt-2">{method.description}</p>
        )}
        {method.rules && method.rules.length > 0 && (
          <ul className="list-disc pl-6 text-sm text-gray-700 mt-2 space-y-1">
            {method.rules.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      {!hideTable && (
        <div className="p-4">
          <div className="text-sm font-semibold mb-2">Danh sách ngành đào tạo theo phương thức {method.title.toLowerCase()}</div>
          <div className="border rounded-lg overflow-hidden">
            {loading && (
              <div className="p-4 text-sm text-gray-500">Đang tải...</div>
            )}
            {!loading && (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-gray-600">
                        <th className="px-3 py-2 w-16">STT</th>
                        <th className="px-3 py-2 w-32">Mã ngành</th>
                        <th className="px-3 py-2">Tên ngành</th>
                        <th className="px-3 py-2 w-48">Tổ hợp</th>
                        <th className="px-3 py-2 w-24">Thời lượng (năm)</th>
                        <th className="px-3 py-2">Mô tả tóm tắt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedMajors.map((m) => (
                        <tr key={m.stt} className="odd:bg-white even:bg-gray-50">
                          <td className="px-3 py-2">{m.stt}</td>
                          <td className="px-3 py-2">{m.code}</td>
                          <td className="px-3 py-2">{m.name}</td>
                          <td className="px-3 py-2">{m.combos}</td>
                          <td className="px-3 py-2">{m.thoiluong_nam || "-"}</td>
                          <td className="px-3 py-2">{m.mota_tomtat || "-"}</td>
                        </tr>
                      ))}
                      {displayedMajors.length === 0 && (
                        <tr>
                          <td className="px-3 py-3 text-gray-500" colSpan={6}>Chưa có dữ liệu</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {hasMore && (
                  <div 
                    className="p-2 text-center text-sm text-teal-700 cursor-pointer select-none hover:text-teal-800 hover:bg-teal-50 transition-colors"
                    onClick={handleShowMore}
                  >
                    Xem thêm ({allMajors.length - displayCount} ngành còn lại)
                  </div>
                )}
                {!hasMore && displayedMajors.length > 0 && (
                  <div className="p-2 text-center text-sm text-gray-500">
                    Đã hiển thị tất cả ({allMajors.length} ngành)
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}



