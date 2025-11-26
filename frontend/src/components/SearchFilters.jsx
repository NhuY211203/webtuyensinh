import Input from "./Input.jsx";
import Select from "./Select.jsx";
import { useEffect, useMemo, useRef, useState } from "react";

export default function SearchFilters({ filters, setFilters, years, combos, methods, schools }) {
  const set = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  // Grouped suggestions for ngành/nghề
  const [groupedMajors, setGroupedMajors] = useState([]);
  // Store full major data (with manganh) for selected major
  const [majorDataMap, setMajorDataMap] = useState(new Map());

  // Clear major filter when school changes
  const prevSchoolRef = useRef(filters.school);
  useEffect(() => {
    if (prevSchoolRef.current !== filters.school && prevSchoolRef.current !== undefined) {
      // School changed, clear major filter
      setFilters(prev => ({ ...prev, q: "", manganh: "" }));
    }
    prevSchoolRef.current = filters.school;
  }, [filters.school, setFilters]);

  // Load groups/majors from API, filtered by school if selected
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        let url = '/api/nhomnganh?perPage=100';
        if (filters.school) {
          url += `&idtruong=${filters.school}`;
        }
        const res = await fetch(url).catch(() => {
          const fallbackUrl = filters.school 
            ? `http://127.0.0.1:8000/api/nhomnganh?perPage=100&idtruong=${filters.school}`
            : 'http://127.0.0.1:8000/api/nhomnganh?perPage=100';
          return fetch(fallbackUrl);
        });
        if (!alive) return;
        if (res?.ok) {
          const json = await res.json();
          const data = json.data || [];
          const mapped = data.map(g => ({
            group: g.name || g.tennhom,
            items: (g.majors || []).map(m => ({
              name: m.name || m.tennganh,
              code: m.code || m.manganh
            }))
          })).filter(g => g.items.length > 0); // Only keep groups with items
          
          // Build map of major name -> manganh for quick lookup
          const nameToCodeMap = new Map();
          data.forEach(g => {
            (g.majors || []).forEach(m => {
              const name = m.name || m.tennganh;
              const code = m.code || m.manganh;
              if (name && code) {
                nameToCodeMap.set(name, code);
              }
            });
          });
          setMajorDataMap(nameToCodeMap);
          
          setGroupedMajors(mapped);
          console.log('Loaded majors:', mapped.length, 'groups');
        } else {
          console.error('Failed to load majors:', res.status);
        }
      } catch (error) {
        console.error('Error loading majors:', error);
      }
    }
    load();
    return () => { alive = false; };
  }, [filters.school]);

  const [openSuggest, setOpenSuggest] = useState(false);
  const suggestRef = useRef(null);

  // Close dropdown when click outside
  useEffect(() => {
    function handle(e) {
      if (!suggestRef.current) return;
      if (!suggestRef.current.contains(e.target)) setOpenSuggest(false);
    }
    if (openSuggest) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [openSuggest]);

  const filteredGroups = useMemo(() => {
    const keyword = (filters.q || "").toLowerCase().trim();
    if (!keyword) return groupedMajors;
    return groupedMajors
      .map(g => ({
        group: g.group,
        items: g.items.filter(it => {
          const name = typeof it === 'string' ? it : it.name;
          return name.toLowerCase().includes(keyword);
        })
      }))
      .filter(g => g.items.length > 0);
  }, [filters.q, groupedMajors]);

  return (
    <div className="card p-5">
      <div className="grid md:grid-cols-3 gap-4">
        {/* Trường */}
        <Select label="Trường" value={filters.school} onChange={e => set("school", e.target.value)}>
          <option value="">Tất cả</option>
          {schools.map(s => <option key={s.value || s} value={s.value || s}>{s.label || s}</option>)}
        </Select>

        {/* Tên ngành / từ khóa với gợi ý theo nhóm */}
        <div className="relative" ref={suggestRef}>
          <Input
            label="Tên ngành / từ khóa"
            placeholder="Chọn ngành/nhóm ngành"
            value={filters.q}
            onChange={e => { 
              set("q", e.target.value);
              // Clear manganh when user types manually
              if (e.target.value !== filters.q) {
                setFilters(prev => ({ ...prev, manganh: "" }));
              }
            }}
            onFocus={() => setOpenSuggest(true)}
          />
          {openSuggest && (
            <div className="absolute z-20 mt-1 w-full max-h-80 overflow-auto rounded-xl bg-white shadow-lg ring-1 ring-gray-200">
              {filteredGroups.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">
                  {filters.school 
                    ? "Trường này chưa có ngành nào hoặc không có gợi ý phù hợp" 
                    : "Không có gợi ý phù hợp"}
                </div>
              ) : (
                filteredGroups.map(g => (
                  <div key={g.group} className="py-2">
                    <div className="px-4 py-1.5 text-xs font-medium uppercase text-gray-500">{g.group}</div>
                    {g.items.map(item => {
                      const itemName = typeof item === 'string' ? item : item.name;
                      const itemCode = typeof item === 'string' ? null : item.code;
                      return (
                        <button
                          key={itemName}
                          type="button"
                          onClick={() => { 
                            setFilters(prev => ({ 
                              ...prev, 
                              q: itemName,
                              manganh: itemCode || ""
                            }));
                            setOpenSuggest(false); 
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          {itemName}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <Select label="Phương thức" value={filters.method} onChange={e => set("method", e.target.value)}>
          <option value="">Tất cả</option>
          {methods.map(m => <option key={m.value || m} value={m.value || m}>{m.label || m}</option>)}
        </Select>
        <Select label="Tổ hợp" value={filters.combo} onChange={e => set("combo", e.target.value)}>
          <option value="">Tất cả</option>
          {combos.map(c => <option key={c.value || c} value={c.value || c}>{c.label || c}</option>)}
        </Select>
        <Select label="Năm" value={filters.year} onChange={e => set("year", e.target.value)}>
          <option value="">Tất cả</option>
          {years.map(y => <option key={y.value || y} value={y.value || y}>{y.label || y}</option>)}
        </Select>
        <Select label="Khu vực" value={filters.region} onChange={e => set("region", e.target.value)}>
          <option value="">Tất cả</option>
          {["Miền Bắc", "Miền Trung", "Miền Nam"].map(r => <option key={r} value={r}>{r}</option>)}
        </Select>
      </div>
    </div>
  );
}
