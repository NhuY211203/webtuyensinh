import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SearchFilters from "../../components/SearchFilters.jsx";

export default function HistoricScores() {
  const [filters, setFilters] = useState({
    q: "", school: "", method: "", combo: "", year: "", region: "", manganh: "", page: 1
  });
  const [programs, setPrograms] = useState([]);
  const [schools, setSchools] = useState([]);
  const [methods, setMethods] = useState([]);
  const [combos, setCombos] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Load filter options (schools, methods, years - static)
  useEffect(() => {
    let isMounted = true;
    async function loadFilters() {
      try {
        const [schoolsRes, methodsRes] = await Promise.all([
          fetch("/api/truongdaihoc?perPage=100").catch(() =>
            fetch("http://127.0.0.1:8000/api/truongdaihoc?perPage=100")
          ),
          fetch("/api/phuong-thuc?perPage=100").catch(() =>
            fetch("http://127.0.0.1:8000/api/phuong-thuc?perPage=100")
          )
        ]);

        if (!isMounted) return;

        if (schoolsRes?.ok) {
          const schoolsData = await schoolsRes.json();
          setSchools(schoolsData.data.map(s => ({ value: s.idtruong, label: s.tentruong })));
        }

        // Methods
        if (methodsRes?.ok) {
          const mData = await methodsRes.json();
          setMethods((mData.data || []).map(m => ({ value: m.idxettuyen, label: m.tenptxt })));
        }
        // Load years from API
        try {
          const yearsRes = await fetch("/api/years").catch(() =>
            fetch("http://127.0.0.1:8000/api/years")
          );
          if (yearsRes?.ok) {
            const yearsData = await yearsRes.json();
            setYears((yearsData.data || []).map(y => ({ value: y.value || y, label: y.label || y })));
          } else {
            // Fallback to hardcoded years
            setYears([2024, 2023, 2022, 2021, 2020].map(y => ({ value: y, label: y })));
          }
        } catch {
          // Fallback to hardcoded years
          setYears([2024, 2023, 2022, 2021, 2020].map(y => ({ value: y, label: y })));
        }
      } catch (e) {
        if (!isMounted) return;
        console.error("Error loading filters:", e);
        setError("Không thể tải dữ liệu bộ lọc");
      }
    }
    loadFilters();
    return () => { isMounted = false; };
  }, []);

  // Load combos based on selected major (manganh)
  useEffect(() => {
    let isMounted = true;
    async function loadCombos() {
      try {
        let url = '/api/tohop-xettuyen';
        const params = new URLSearchParams();
        
        // If manganh is selected, filter combos by major
        if (filters.manganh) {
          params.append('manganh', filters.manganh);
          // Optional: also filter by school and method if selected
          if (filters.school) params.append('idtruong', filters.school);
          if (filters.method) params.append('idxettuyen', filters.method);
          if (filters.year) params.append('nam', filters.year);
          url += '?' + params.toString();
        } else {
          // Load all combos if no major selected
          params.append('perPage', '100');
          url += '?' + params.toString();
        }
        
        const combosRes = await fetch(url).catch(() => 
          fetch(`http://127.0.0.1:8000${url}`)
        );
        
        if (!isMounted) return;
        
        if (combosRes.ok) {
          const combosData = await combosRes.json();
          // Handle both paginated and non-paginated responses
          const combosList = combosData.data || [];
          setCombos(combosList.map(c => ({ 
            value: c.ma_to_hop || c.code, 
            label: c.mo_ta ? `${c.ma_to_hop || c.code} - ${c.mo_ta}` : (c.label || c.ma_to_hop || c.code)
          })));
          
          // Clear combo selection if current combo is not in the new list
          if (filters.combo) {
            const comboExists = combosList.some(c => 
              (c.ma_to_hop || c.code) === filters.combo
            );
            if (!comboExists) {
              setFilters(prev => ({ ...prev, combo: "" }));
            }
          }
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error loading combos:", error);
      }
    }
    loadCombos();
    return () => { isMounted = false; };
  }, [filters.manganh, filters.school, filters.method, filters.year]);

  // Load programs based on filters
  useEffect(() => {
    let isMounted = true;
    async function loadPrograms() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        // If manganh is set (from dropdown selection), use it for precise filtering
        // Otherwise, use keyword for text search
        if (filters.manganh) {
          params.append('manganh', filters.manganh);
        } else if (filters.q) {
          params.append('keyword', filters.q);
        }
        if (filters.school) params.append('idtruong', filters.school);
        if (filters.combo) params.append('tohop', filters.combo);
        if (filters.year) params.append('nam', filters.year);
        if (filters.method && filters.method !== '') {
          params.append('idxettuyen', String(filters.method));
        }
        params.append('perPage', '20');
        params.append('page', filters.page);

        const res = await fetch(`/api/diemchuan?${params}`).catch(() =>
          fetch(`http://127.0.0.1:8000/api/diemchuan?${params}`)
        );

        if (!isMounted) return;

        if (res?.ok) {
          const data = await res.json();
          setPrograms(data.data || []);
          setPagination({
            current_page: data.current_page || 1,
            last_page: data.last_page || 1,
            total: data.total || 0
          });
        }
      } catch (e) {
        if (!isMounted) return;
        console.error("Error loading programs:", e);
        setError("Không thể tải dữ liệu điểm chuẩn");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPrograms();
    return () => { isMounted = false; };
  }, [filters]);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-3">Lỗi tải dữ liệu</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Header hero: teal gradient + stronger typography */}
      <section className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          <h1 className="text-3xl font-bold">Tra cứu điểm chuẩn nhiều năm</h1>
          <p className="opacity-90 text-sm md:text-base mt-2">Lọc nhanh theo trường, tổ hợp, phương thức, năm…</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 lg:px-6 -mt-6 space-y-8">
        {/* Filters card: elevated white panel */}
        <div className="rounded-2xl bg-white shadow-md ring-1 ring-emerald-500/15 px-4 sm:px-5 py-5">
          <SearchFilters
            filters={filters}
            setFilters={setFilters}
            years={years}
            combos={combos}
            methods={methods}
            schools={schools}
          />
        </div>

        {/* Info row + dynamic summary */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Tìm thấy <b className="text-emerald-700">{pagination.total}</b> chương trình
            {loading && <span className="ml-2 text-primary-600 animate-pulse">Đang tải…</span>}
          </div>
        </div>

        {/* Storytelling summary */}
        {(() => {
          if (!programs || programs.length === 0) return null;
          const best = [...programs].sort((a,b) => (parseFloat(b?.diemchuan ?? 0) - parseFloat(a?.diemchuan ?? 0)))[0];
          if (!best) return null;
          return (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
              <span className="mr-1">📌</span>
              {`Có ${pagination.total} chương trình phù hợp. Ngành có điểm chuẩn cao nhất là `}
              <b className="text-slate-900">{best.tennganh || '—'}</b>
              {` (${best.diemchuan || '—'}) tại `}
              <b className="text-slate-900">{best.tentruong || '—'}</b>.
            </div>
          );
        })()}

        {/* Cards grid: spacious with hover/elevation */}
        <div className="grid gap-6 sm:gap-7 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {programs.length > 0 ? (
            programs.map(item => {
              const display = {
                id: item.iddiemchuan,
                major: item.tennganh || 'N/A',
                school: item.tentruong || 'N/A',
                method: item.phuongthuc || 'N/A',
                combo: item.tohopmon || 'N/A',
                year: item.namxettuyen || 'N/A',
                score: item.diemchuan || 'N/A',
                tuition: item.hocphi || 0,
                region: item.khuvuc || 'N/A',
                note: item.ghichu || ''
              };
              // Highlight highest score card in current grid
              const maxScoreInGrid = Math.max(...programs.map(p => parseFloat(p?.diemchuan ?? 0)).filter(n => !isNaN(n)), 0);
              const isTop = parseFloat(display.score || 0) === maxScoreInGrid && maxScoreInGrid > 0;
              return (
                <div
                  key={display.id}
                  className={`relative rounded-2xl bg-white p-5 shadow-sm border ${isTop ? 'border-emerald-300 ring-2 ring-emerald-200' : 'border-slate-200'} hover:shadow-md transition`}
                >
                  {/* Combo badge */}
                  <span className="absolute top-4 right-4 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full">
                    {display.combo || '—'}
                  </span>

                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-800 leading-tight">{display.major}</h3>
                    {isTop && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">🔥 Cao nhất</span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 mt-1">{display.school}</p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-slate-50">
                      <div className="text-slate-500">Năm</div>
                      <div className="font-medium">{display.year}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50">
                      <div className="text-slate-500">Điểm chuẩn</div>
                      <div className="text-xl font-bold text-indigo-600">{display.score}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50">
                      <div className="text-slate-500">Học phí/kỳ</div>
                      <div className="font-medium">
                        {display.tuition > 0 ? `${(display.tuition / 1_000_000).toFixed(1)} triệu` : 'N/A'}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50">
                      <div className="text-slate-500">Khu vực</div>
                      <div className="font-medium">{display.region}</div>
                    </div>
                  </div>

                  {display.note && (
                    <div className="mt-3 p-2.5 bg-amber-50 rounded-md text-xs text-amber-700 ring-1 ring-amber-100">
                      <strong>Ghi chú:</strong> {display.note}
                    </div>
                  )}

                  <div className="mt-5">
                    <Link
                      to={`/dashboard/historic-scores/${display.id}`}
                      className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            !loading && (
              <div className="col-span-full text-center py-14">
                <p className="text-gray-600">Không tìm thấy chương trình nào</p>
                <p className="text-sm text-gray-400 mt-1.5">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            )
          )}
        </div>

        {/* Pagination: đồng bộ màu + spacing lớn hơn */}
        {pagination.last_page > 1 && (
          <div className="flex justify-center pt-4">
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => setFilters(prev => ({ ...prev, page: pagination.current_page - 1 }))}
                className="px-3 py-2 rounded-md border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50"
              >
                Trước
              </button>
              <span className="px-3 py-2 text-sm text-gray-600">
                {pagination.current_page} / {pagination.last_page}
              </span>
              <button
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => setFilters(prev => ({ ...prev, page: pagination.current_page + 1 }))}
                className="px-3 py-2 rounded-md border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
