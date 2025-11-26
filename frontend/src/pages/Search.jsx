import { useEffect, useState } from "react";
import ProgramCard from "../components/ProgramCard.jsx";
import SearchFilters from "../components/SearchFilters.jsx";

export default function Search() {
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
        const schoolsRes = await fetch("/api/truongdaihoc?perPage=100").catch(() => 
          fetch("http://127.0.0.1:8000/api/truongdaihoc?perPage=100")
        );
        
        if (!isMounted) return;
        
        if (schoolsRes.ok) {
          const schoolsData = await schoolsRes.json();
          setSchools(schoolsData.data.map(s => ({ value: s.idtruong, label: s.tentruong })));
        }
        
        // Load methods from API
        try {
          const methodsRes = await fetch("/api/phuong-thuc?perPage=100").catch(() =>
            fetch("http://127.0.0.1:8000/api/phuong-thuc?perPage=100")
          );
          if (methodsRes?.ok) {
            const methodsData = await methodsRes.json();
            setMethods((methodsData.data || []).map(m => ({ value: m.idxettuyen, label: m.tenptxt })));
          }
        } catch {}
        
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
      } catch (error) {
        if (!isMounted) return;
        console.error("Error loading filters:", error);
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
        
        if (res.ok) {
          const data = await res.json();
          setPrograms(data.data || []);
          setPagination({
            current_page: data.current_page || 1,
            last_page: data.last_page || 1,
            total: data.total || 0
          });
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error loading programs:", error);
        setError("Không thể tải dữ liệu chương trình");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPrograms();
    return () => { isMounted = false; };
  }, [filters]);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Lỗi tải dữ liệu</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10">
          <h1 className="text-3xl md:text-4xl font-bold">Tìm kiếm ngành & chương trình</h1>
          <p className="mt-2 text-white/90">Lọc theo trường, năm, phương thức, tổ hợp, khu vực…</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 lg:px-6 -mt-8 pb-14 space-y-6">
        <SearchFilters
          filters={filters}
          setFilters={setFilters}
          years={years}
          combos={combos}
          methods={methods}
          schools={schools}
        />

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Tìm thấy <b>{pagination.total}</b> chương trình
            {loading && <span className="ml-2 text-blue-600">Đang tải...</span>}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.length > 0 ? (
            programs.map(item => <ProgramCard key={item.iddiemchuan} item={item} />)
          ) : (
            !loading && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">Không tìm thấy chương trình nào</p>
                <p className="text-sm text-gray-400 mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            )
          )}
        </div>

        {pagination.last_page > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <button 
                disabled={pagination.current_page === 1}
                onClick={() => setFilters(prev => ({ ...prev, page: pagination.current_page - 1 }))}
                className="px-3 py-2 border rounded disabled:opacity-50"
              >
                Trước
              </button>
              <span className="px-3 py-2">
                {pagination.current_page} / {pagination.last_page}
              </span>
              <button 
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => setFilters(prev => ({ ...prev, page: pagination.current_page + 1 }))}
                className="px-3 py-2 border rounded disabled:opacity-50"
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
