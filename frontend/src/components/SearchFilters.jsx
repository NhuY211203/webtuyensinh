import Input from "./Input.jsx";
import Select from "./Select.jsx";

export default function SearchFilters({ filters, setFilters, years, combos, methods, schools }) {
  const set = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  return (
    <div className="card p-5">
      <div className="grid md:grid-cols-3 gap-4">
        <Input
          label="Tên ngành / từ khóa"
          placeholder="Ví dụ: Công nghệ thông tin"
          value={filters.q}
          onChange={e => set("q", e.target.value)}
        />
        <Select label="Trường" value={filters.school} onChange={e => set("school", e.target.value)}>
          <option value="">Tất cả</option>
          {schools.map(s => <option key={s.value || s} value={s.value || s}>{s.label || s}</option>)}
        </Select>
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
