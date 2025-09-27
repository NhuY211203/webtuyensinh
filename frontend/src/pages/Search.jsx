import { useMemo, useState } from "react";
import { useData } from "../context/DataContext.jsx";
import ProgramCard from "../components/ProgramCard.jsx";
import SearchFilters from "../components/SearchFilters.jsx";

export default function Search() {
  const { programs } = useData();
  const [filters, setFilters] = useState({
    q: "", school: "", method: "", combo: "", year: "", region: ""
  });

  const schools = useMemo(() => [...new Set(programs.map(p => p.school))], [programs]);
  const methods = useMemo(() => [...new Set(programs.map(p => p.method))], [programs]);
  const combos  = useMemo(() => [...new Set(programs.map(p => p.combo))], [programs]);
  const years   = useMemo(() => [...new Set(programs.map(p => p.year))].sort((a,b)=>b-a), [programs]);

  const filtered = programs.filter(p => {
    const q = filters.q.toLowerCase();
    const okQ = !q || [p.major, p.school, p.method, p.combo].join(" ").toLowerCase().includes(q);
    const okSchool = !filters.school || p.school === filters.school;
    const okMethod = !filters.method || p.method === filters.method;
    const okCombo  = !filters.combo  || p.combo  === filters.combo;
    const okYear   = !filters.year   || String(p.year) === String(filters.year);
    const okRegion = !filters.region || p.region === filters.region;
    return okQ && okSchool && okMethod && okCombo && okYear && okRegion;
  });

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
          <div className="text-sm text-gray-600">Tìm thấy <b>{filtered.length}</b> chương trình</div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(item => <ProgramCard key={item.id} item={item} />)}
        </div>
      </section>
    </div>
  );
}
