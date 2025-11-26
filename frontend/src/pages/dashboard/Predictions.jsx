import { useMemo, useState, useRef, useEffect } from "react";

/**
 * Predictions — màn hình Dự đoán & Đánh giá cơ hội
 * Phương thức: dùng dữ liệu cứng ở frontend (tabs cố định)
 * Tổ hợp & Ngành: dùng dữ liệu từ API
 */

// Phương thức cố định (cứng ở FE)
const METHODS = [
  { id: 1, code: "THPT", title: "Điểm thi THPT" },
  { id: 2, code: "HB", title: "Điểm học bạ" },
  { id: 3, code: "DGNL", title: "Điểm ĐGNL HCM" }
];

// ——————————————— Helpers (Mock) ———————————————
function clamp(n, min, max) { return Math.max(min, Math.min(max, Number(n) || 0)); }
const pct = (x) => `${Math.round(x * 100)}%`;

// Thuật toán mô phỏng (thay bằng gọi API thực tế)
function predictTHPT({ m1, m2, m3, tohop }) {
  const score = clamp(m1, 0, 10) + clamp(m2, 0, 10) + clamp(m3, 0, 10);
  const base = score / 30; // chuẩn hoá 0..1
  const bias = tohop === "A00" ? 0.03 : tohop === "A01" ? 0.02 : 0; 
  return base * 0.9 + bias; // ước lượng cơ hội
}
function predictHocBaToHop({ m1, m2, m3, tohop }) {
  // giống THPT nhưng thêm hệ số ổn định GPA lớp 12
  const score = clamp(m1, 0, 10) + clamp(m2, 0, 10) + clamp(m3, 0, 10);
  const base = score / 30;
  const bias = tohop === "A00" ? 0.02 : tohop === "A01" ? 0.01 : 0;
  return base * 0.85 + bias; 
}
function predictHocBaGPA({ gpa10, gpa11, gpa12 }) {
  const avg = (clamp(gpa10, 0, 10) + clamp(gpa11, 0, 10) + clamp(gpa12, 0, 10)) / 3;
  return Math.min(1, Math.max(0, (avg - 5) / 5));
}
function predictDGNL({ dgnl }) {
  // Thang 1200 → quy về 0..1 (ví dụ)
  return Math.min(1, Math.max(0, (clamp(dgnl, 0, 1200) - 600) / 600));
}
function predictKetHop({ gpa12, ielts, giaiThuongLvl }) {
  const gpaTerm = Math.max(0, (clamp(gpa12, 0, 10) - 5.5) / 4.5); // 0..1
  const ieltsTerm = Math.min(1, clamp(ielts, 0, 9) / 9);
  const bonus = giaiThuongLvl === "quocgia" ? 0.15 : giaiThuongLvl === "tinh" ? 0.07 : 0;
  return Math.min(1, gpaTerm * 0.6 + ieltsTerm * 0.3 + bonus);
}

export default function Predictions() {
  const [method, setMethod] = useState(METHODS[0]);
  const [result, setResult] = useState(null); // {prob, explain, payload}
  const [prediction, setPrediction] = useState(null); // { summary, rankings, alternatives? }
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // State cho từng form
  const [thpt, setThpt] = useState({ m1: "", m2: "", m3: "", tohop: "A00", manganh: "" });
  const [hbToHop, setHbToHop] = useState({ m1: "", m2: "", m3: "", tohop: "A00" });
  const [hbMode, setHbMode] = useState('tohop');
  const [hbGpa, setHbGpa] = useState({ gpa10: "", gpa11: "", gpa12: "" });
  const [dgnl, setDgnl] = useState({ dgnl: "" });
  const [kh, setKh] = useState({ gpa12: "", ielts: "", giaiThuongLvl: "" });

  const methodTabs = useMemo(() => METHODS.map(m => ({ key: m.code, label: m.title })), []);
  const methodIdx = useMemo(() => ({ THPT: 1, HB: 2, DGNL: 3, KET_HOP: 4 }), []);
  const currentToHop = (method.code === 'HB') ? (hbToHop.tohop || '') : (thpt.tohop || '');

  // Map rules for delta → probability/verdict/level
  function mapDeltaToProb(delta){
    // Logistic mapping like backend for consistency (k≈1.5)
    const k = 1.5;
    const p = 1 / (1 + Math.exp(-k * (Number(delta)||0)));
    return Math.min(0.99, Math.max(0.02, p));
  }
  function mapDeltaToVerdict(delta){
    if (delta >= 1.5) return 'Rất cao';
    if (delta >= 0.5) return 'Cao';
    if (delta >= -0.5) return 'Cân bằng';
    if (delta >= -1.49) return 'Thấp';
    return 'Rất thấp';
  }
  function mapProbToLevel(prob){
    if (prob >= 0.90) return 'An toàn';
    if (prob >= 0.70) return 'Nên thử';
    if (prob >= 0.40) return 'Cân nhắc';
    return 'Khó';
  }

  // Load tổ hợp & ngành từ BE giống HistoricScores
  const [combos, setCombos] = useState([]); // {code,label}
  const [comboThresholds, setComboThresholds] = useState({}); // code -> diemchuan
  const [majorsAll, setMajorsAll] = useState([]); // {manganh, tennganh}
  const [allowedByCombo, setAllowedByCombo] = useState(new Set());
  useEffect(() => {
    let mounted = true;
    async function loadMeta(){
      try {
        const [combosRes, majorsRes] = await Promise.all([
          fetch('/api/tohop-xettuyen?perPage=200').catch(()=>fetch('http://127.0.0.1:8000/api/tohop-xettuyen?perPage=200')),
          fetch('/api/majors-all').catch(()=>fetch('http://127.0.0.1:8000/api/majors-all')),
        ]);
        if (!mounted) return;
        if (combosRes?.ok){
          const data = await combosRes.json();
          const opts = (data.data||[]).map(c=>({ code: c.ma_to_hop, label: `${c.ma_to_hop} (${c.mo_ta||''})` }));
          setCombos(opts);
          if (opts.length && !thpt.tohop){ setThpt(p=>({ ...p, tohop: opts[0].code })); }
        }
        if (majorsRes?.ok){
          const data = await majorsRes.json();
          setMajorsAll((data.data||[]).map(m=>({ manganh: m.manganh, tennganh: m.tennganh })));
        }
      } catch(_){}
    }
    loadMeta();
    return ()=>{ mounted=false };
  }, []);
  
  // Map phương thức sang idx BE (đã định nghĩa ở trên)

  // Lấy tổ hợp + điểm chuẩn theo ngành/phương thức (API mới)
  useEffect(() => {
    let mounted = true;
    async function loadCombosForMajor(){
      try {
        const selected = majorSelected || majorsAll.find(m=>m.manganh===thpt.manganh);
        const idtruong = selected?.idtruong;
        const manganh = selected?.manganh;
        const idx = methodIdx[method.code];
        if (!idtruong || !manganh || !idx){ return; }

        const path = `/api/majors/${encodeURIComponent(idtruong)}/${encodeURIComponent(manganh)}/methods/${encodeURIComponent(idx)}?nam=2024`;
        const res = await fetch(path).catch(()=>fetch(`http://127.0.0.1:8000${path}`));
        if (!mounted) return;
        if (res?.ok){
          const json = await res.json();
          let list = (json.data?.tohop || json.tohop || []);
          // Nếu API không trả mảng tohop, nhưng có chuỗi tohopmon: "A00;A01;D01"
          if ((!Array.isArray(list) || list.length===0)) {
            const str = json.data?.tohopmon || json.tohopmon || json.data?.to_hop_mon || json.to_hop_mon;
            if (typeof str === 'string' && str.trim()) {
              list = str.split(';').map(s => ({ code: s.trim(), diemchuan: undefined }));
            }
          }

          const opts = (list||[])
            .filter(t => t && t.code)
            .map(t=>({ code: t.code, label: t.diemchuan!=null ? `${t.code} — chuẩn ${Number(t.diemchuan||0).toFixed(2)}` : t.code }));
          const thMap = (list||[]).reduce((acc, t)=>{ if (t?.code) acc[t.code] = Number(t.diemchuan||0); return acc; }, {});
          if (opts.length){
            setCombos(opts);
            setComboThresholds(thMap);
            setThpt(p=>({ ...p, tohop: opts.find(o=>o.code===p.tohop)?.code || opts[0].code }));
            setHbToHop(p=>({ ...p, tohop: opts.find(o=>o.code===p.tohop)?.code || opts[0].code }));
          }
          return;
        }
      } catch(_){ /* fallback below */ }

      // Fallback: giữ luồng cũ
      try {
        const res = await fetch('/api/tohop-xettuyen?perPage=200').catch(()=>fetch('http://127.0.0.1:8000/api/tohop-xettuyen?perPage=200'));
        if (!mounted) return;
        if (res?.ok){
          const data = await res.json();
          const opts = (data.data||[]).map(c=>({ code: c.ma_to_hop, label: `${c.ma_to_hop} (${c.mo_ta||''})` }));
          setCombos(opts);
          setComboThresholds({});
        }
      } catch(_){ }
    }
    loadCombosForMajor();
    return () => { mounted = false };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method.code, thpt.manganh, majorsAll.length]);
  const [majorInput, setMajorInput] = useState("");
  const [majorSelected, setMajorSelected] = useState(null);
  const [openSug, setOpenSug] = useState(false);
  const sugRef = useRef(null);

  // Hàm: lọc ngành theo tổ hợp đã chọn (nếu có)
  function filterMajorsByCombo(allMajors, allowedSet) {
    if (allowedSet && allowedSet.size > 0) {
      return allMajors.filter(m => allowedSet.has(m.manganh));
    }
    return allMajors;
  }
  useEffect(() => {
    const onDocClick = (e) => { if (!sugRef.current || sugRef.current.contains(e.target)) return; setOpenSug(false); };
    document.addEventListener('click', onDocClick); return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Khi đổi phương thức (tab), xoá kết quả dự đoán để tránh hiển thị chồng tab
  useEffect(() => {
    setResult(null);
    setPrediction(null);
  }, [method.code]);
  // Khi đổi tổ hợp: tải danh sách ngành có xét tuyển theo tổ hợp đó
  useEffect(() => {
    let mounted = true;
    async function loadMajorsByCombo(){
      setMajorSelected(null);
      setMajorInput("");
      setThpt(p=>({ ...p, manganh: "" }));
      if (!currentToHop) { setAllowedByCombo(new Set()); return; }
      try {
        // Ưu tiên endpoint chuyên lọc theo tổ hợp
        const res = await fetch(`/api/majors-by-combo?tohop=${encodeURIComponent(currentToHop)}`).catch(()=>fetch(`http://127.0.0.1:8000/api/majors-by-combo?tohop=${encodeURIComponent(currentToHop)}`));
        if (!mounted) return;
        if (res?.ok){
          const json = await res.json();
          const only = new Set((json.data||[]).map(r=>r.manganh).filter(Boolean));
          setAllowedByCombo(only);
        } else {
          setAllowedByCombo(new Set());
        }
      } catch(_){ setAllowedByCombo(new Set()); }
    }
    loadMajorsByCombo();
    return () => { mounted = false };
  }, [currentToHop]);

  const suggestions = useMemo(() => {
    // Nếu đã chọn tổ hợp nhưng chưa có danh sách ngành tương ứng, tạm thời không hiển thị tất cả để tránh hiểu nhầm
    if (currentToHop && allowedByCombo.size === 0) return [];
    const list = filterMajorsByCombo(majorsAll, allowedByCombo);
    const q = removeAccents((majorInput||'').trim().toLowerCase());
    if (!q) return list; // không giới hạn khi chưa nhập — liệt kê toàn bộ để cuộn
    return list.filter(x => (removeAccents(x.tennganh.toLowerCase())+" "+x.manganh.toLowerCase()).includes(q));
  }, [majorInput, majorsAll, allowedByCombo, currentToHop]);
  function onPickMajor(item){ setMajorSelected(item); setMajorInput(`${item.tennganh} — ${item.manganh}`); setOpenSug(false); setThpt(p=>({...p, manganh:item.manganh})); }

  const clear = () => { setResult(null); setErrors({}); };

  const validate = () => {
    const e = {};
    if (method.code === "THPT") {
      ["m1", "m2", "m3"].forEach(k => { if (thpt[k] === "") e[k] = "Bắt buộc"; });
      if (!thpt.manganh) {
        e.manganh = "Vui lòng chọn ngành";
      }
    }
    if (method.code === "HB") {
        ["m1", "m2", "m3"].forEach(k => { if (hbToHop[k] === "") e[`hb_${k}`] = "Bắt buộc"; });
        if (!thpt.manganh) {
          e.manganh = "Vui lòng chọn ngành";
        }
    }
    // Require selected major for all methods that use majors list
    if (method.code === "DGNL") {
      if (dgnl.dgnl === "") e.dgnl = "Bắt buộc";
      // DGNL không bắt buộc chọn ngành
    }
    if (method.code === "KET_HOP") {
      if (kh.gpa12 === "") e.gpa12 = "Bắt buộc";
      if (kh.ielts === "") e.ielts = "Bắt buộc";
      // KET_HOP không bắt buộc chọn ngành
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePredict = async () => {
    if (!validate()) return;
    // Reset ô ngành chỉ khi cần (không áp dụng cho DGNL và KET_HOP)
    if (method.code !== 'DGNL' && method.code !== 'KET_HOP') {
      setMajorSelected(null);
      setMajorInput("");
      setThpt(p=>({ ...p, manganh: "" }));
      setOpenSug(true);
    }
    setLoading(true);
    try {
      // 1) Tính tổng điểm theo phương thức đang chọn (đơn giản, FE mock)
      let totalScore = 0; let note = '';
      if (method.code === 'THPT') {
        totalScore = clamp(thpt.m1,0,10) + clamp(thpt.m2,0,10) + clamp(thpt.m3,0,10);
      } else if (method.code === 'HB') {
        totalScore = clamp(hbToHop.m1,0,10) + clamp(hbToHop.m2,0,10) + clamp(hbToHop.m3,0,10);
      } else if (method.code === 'DGNL') {
        totalScore = clamp(dgnl.dgnl, 0, 1200); // BE có thể quy đổi riêng
      } else if (method.code === 'KET_HOP') {
        // đơn giản hóa ở FE
        totalScore = Math.min(30, clamp(kh.gpa12,0,10) * 3);
      }

      // 2) Gọi API điểm chuẩn theo tổ hợp/phương thức/năm/(ngành nếu chọn)
      const params = new URLSearchParams();
      if (currentToHop) params.append('tohop', currentToHop);
      const idx = methodIdx[method.code];
      if (idx) params.append('idxettuyen', String(idx));
      params.append('perPage', '100');
      params.append('nam', '2024');
      if (thpt.manganh) params.append('manganh', thpt.manganh);

      // Ưu tiên gọi API backend tổng hợp dự đoán
      const predictRes = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idxettuyen: idx,
          tohop: currentToHop,
          nam: 2024,
          manganh: thpt.manganh || undefined,
          scores: method.code==='THPT' ? { m1: thpt.m1, m2: thpt.m2, m3: thpt.m3 }
                 : method.code==='HB' ? { m1: hbToHop.m1, m2: hbToHop.m2, m3: hbToHop.m3 }
                 : method.code==='DGNL' ? { dgnl: dgnl.dgnl } : {},
          bonuses: {},
          weights: []
        })
      }).catch(()=>fetch('http://127.0.0.1:8000/api/predict', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ idxettuyen: idx, tohop: thpt.tohop, nam: 2024, manganh: thpt.manganh || undefined }) }));

      if (predictRes && predictRes.ok){
        const pr = await predictRes.json();
        setPrediction({ summary: pr.summary, rankings: pr.rankings, alternatives: pr.alternatives });
        const probForHeader = (pr.rankings && pr.rankings[0]?.prob) ?? mapDeltaToProb(pr.summary?.delta_vs_median ?? 0);
        const explain = `Tổng ${pr.summary?.total_score ?? 0} | ${pr.summary?.tohop || ''} – ${method.title} | ${pr.summary?.verdict} | Δ ${pr.summary?.delta_vs_median ?? 0}`;
        setResult({ prob: Math.max(0, Math.min(1, probForHeader)), explain, method: method.title, payload: {} });
        return;
      }

      // Fallback: tự tổng hợp từ /diemchuan
      const res = await fetch(`/api/diemchuan?${params}`).catch(()=>fetch(`http://127.0.0.1:8000/api/diemchuan?${params}`));
      const data = res?.ok ? await res.json() : { data: [] };
      const rows = (data.data || []).filter(r => r && (r.diemchuan!=null));

      // 3) Lập bảng xếp hạng
      const rankings = rows.map((r, i) => {
        const threshold = Number(r.diemchuan || 0);
        const delta = (method.code === 'DGNL') ? (totalScore - threshold) : (totalScore - threshold);
        const prob = mapDeltaToProb(delta);
        return {
          rank: i + 1,
          truong: r.tentruong || r.idtruong || '—',
          manganh: r.manganh,
          tennganh: r.tennganh || '—',
          phuongthuc: method.title,
          tohop: currentToHop,
          diemchuan: threshold,
          delta: Number(delta.toFixed(2)),
          prob: Number(prob.toFixed(2)),
          level: mapProbToLevel(prob),
          ghichu: r.ghichu || '',
        };
      }).sort((a,b)=> {
        if (b.prob === a.prob) return b.delta - a.delta; // tie-breaker by delta
        return b.prob - a.prob; // highest probability first
      }).slice(0, 10);

      // 4) Tóm tắt
      const deltas = rankings.map(x => x.delta).filter(n=>!isNaN(n));
      const median = deltas.length ? [...deltas].sort((a,b)=>a-b)[Math.floor(deltas.length/2)] : 0;
      const verdict = mapDeltaToVerdict(median);

      setPrediction({
        summary: {
          idxettuyen: idx,
          tohop: thpt.tohop,
          total_score: Number(totalScore.toFixed(2)),
          bonus: 0,
          note,
          verdict,
          delta_vs_median: Number((median||0).toFixed(2))
        },
        rankings,
      });

      // Giữ lại result cũ (phần trăm đơn giản) cho phần hiển thị cũ
      const probForHeader = rankings[0]?.prob ?? mapDeltaToProb(median);
      const explain = `Tổng ${Number(totalScore.toFixed(2))} | ${currentToHop || ''} – ${method.title} | ${verdict} | Δ ${Number((median||0).toFixed(2))}`;
      setResult({ prob: Math.max(0, Math.min(1, probForHeader)), explain, method: method.title, payload: {} });
      // Sau khi dự đoán: reset ô ngành để người dùng dễ chọn lại ngành khác (chỉ cho THPT và HB)
      if (method.code !== 'DGNL' && method.code !== 'KET_HOP') {
        setMajorSelected(null);
        setMajorInput("");
        setThpt(p=>({ ...p, manganh: "" }));
        setOpenSug(true);
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Dự đoán & Đánh giá cơ hội</h1>
      </header>

      {/* Tabs phương thức */}
      <div className="flex gap-2">
        {METHODS.map(m => (
          <button
            key={m.code}
            onClick={() => { setMethod(m); clear(); }}
            className={`px-4 py-2 rounded-full border transition text-sm ${method.code===m.code ? 'bg-emerald-600 text-white border-emerald-600 shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {m.title}
          </button>
        ))}
      </div>

      {/* Form theo phương thức */}
      <section className="rounded-xl border bg-white p-4 md:p-5 shadow-sm">
        {method.code === "THPT" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:items-end">
              <Input label="Điểm môn 1" value={thpt.m1} onChange={(v)=>setThpt(p=>({...p,m1:v}))} error={errors.m1}/>
              <Input label="Điểm môn 2" value={thpt.m2} onChange={(v)=>setThpt(p=>({...p,m2:v}))} error={errors.m2}/>
              <Input label="Điểm môn 3" value={thpt.m3} onChange={(v)=>setThpt(p=>({...p,m3:v}))} error={errors.m3}/>
              <Select label="Tổ hợp" value={thpt.tohop} onChange={(v)=>setThpt(p=>({...p,tohop:v}))} options={combos}/>
              <div className="relative md:col-span-2" ref={sugRef}>
                <label className="block">
                  <div className="mb-1 text-sm text-gray-600">Ngành học</div>
                  <input value={majorInput} onChange={(e)=>{ setMajorInput(e.target.value); setMajorSelected(null); setOpenSug(true); }} onFocus={()=>setOpenSug(true)} placeholder="Nhập tên hoặc mã ngành…" className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${!majorSelected && majorInput ? 'border-amber-400' : 'border-gray-300'}`} />
                </label>
                {openSug && suggestions.length>0 && (
                  <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {suggestions.map(item => (
                      <li key={item.manganh} onClick={()=>onPickMajor(item)} className="px-3 py-2 cursor-pointer hover:bg-emerald-50" title={`${item.tennganh} — ${item.manganh}`}>
                        <div className="text-sm font-medium text-gray-800 truncate" title={item.tennganh}>{item.tennganh}</div>
                        <div className="text-xs text-gray-500">{item.manganh}</div>
                      </li>
                    ))}
                  </ul>
                )}
                {errors.manganh && (<div className="mt-1 text-xs text-red-600">{errors.manganh}</div>)}
              </div>
            </div>
            
          </div>
        )}

        {method.code === "HB" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:items-end">
                <Input label="Điểm môn 1 (lớp 12)" value={hbToHop.m1} onChange={(v)=>setHbToHop(p=>({...p,m1:v}))} error={errors.hb_m1}/>
                <Input label="Điểm môn 2 (lớp 12)" value={hbToHop.m2} onChange={(v)=>setHbToHop(p=>({...p,m2:v}))} error={errors.hb_m2}/>
                <Input label="Điểm môn 3 (lớp 12)" value={hbToHop.m3} onChange={(v)=>setHbToHop(p=>({...p,m3:v}))} error={errors.hb_m3}/>
              <Select label="Tổ hợp" value={hbToHop.tohop} onChange={(v)=>setHbToHop(p=>({...p,tohop:v}))} options={combos}/>
              <div className="relative md:col-span-2" ref={sugRef}>
                <label className="block">
                  <div className="mb-1 text-sm text-gray-600">Ngành học</div>
                  <input value={majorInput} onChange={(e)=>{ setMajorInput(e.target.value); setMajorSelected(null); setOpenSug(true); }} onFocus={()=>setOpenSug(true)} placeholder="Nhập tên hoặc mã ngành…" className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${!majorSelected && majorInput ? 'border-amber-400' : 'border-gray-300'}`} />
                </label>
                {openSug && suggestions.length>0 && (
                  <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {suggestions.map(item => (
                      <li key={item.manganh} onClick={()=>onPickMajor(item)} className="px-3 py-2 cursor-pointer hover:bg-emerald-50" title={`${item.tennganh} — ${item.manganh}`}>
                        <div className="text-sm font-medium text-gray-800 truncate" title={item.tennganh}>{item.tennganh}</div>
                        <div className="text-xs text-gray-500">{item.manganh}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {method.code === "DGNL" && (
          <div className="grid md:grid-cols-3 gap-3">
            <Input label="Điểm ĐGNL (thang 1200)" value={dgnl.dgnl} onChange={(v)=>setDgnl({ dgnl: v })} error={errors.dgnl}/>
            <div className="md:col-span-2 text-sm text-gray-500 self-center">Nhập điểm ĐGNL của ĐHQG-HCM (0–1200).</div>
          </div>
        )}

        {method.code === "KET_HOP" && (
          <div className="grid md:grid-cols-4 gap-3">
            <Input label="GPA lớp 12" value={kh.gpa12} onChange={(v)=>setKh(p=>({...p,gpa12:v}))} error={errors.gpa12}/>
            <Input label="IELTS (0–9)" value={kh.ielts} onChange={(v)=>setKh(p=>({...p,ielts:v}))} error={errors.ielts}/>
            <Select label="Giải thưởng" value={kh.giaiThuongLvl} onChange={(v)=>setKh(p=>({...p,giaiThuongLvl:v}))} options={[
              {code:"", label:"Không"},
              {code:"tinh", label:"Giải tỉnh/TP"},
              {code:"quocgia", label:"Giải quốc gia"},
            ]}/>
            <div className="text-sm text-gray-500 self-center">Có thể mở rộng: chứng chỉ quốc tế, học sinh giỏi,…</div>
          </div>
        )}

        
        <div className="mt-2 flex items-center gap-3">
          <button onClick={handlePredict} disabled={loading || (method.code !== 'DGNL' && method.code !== 'KET_HOP' && !thpt.manganh)} className={`px-5 py-2.5 rounded-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow ${loading || (method.code !== 'DGNL' && method.code !== 'KET_HOP' && !thpt.manganh) ? 'opacity-60 cursor-not-allowed':''}`}>
            {loading ? 'Đang dự đoán…' : 'Dự đoán'}
          </button>
          <button onClick={clear} className="px-4 py-2 rounded-lg border bg-white hover:bg-slate-50">Làm mới</button>
        </div>
        
      </section>

      {/* Kết quả */}
      {result && (
        <section className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 p-5 border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 rounded-full bg-white grid place-content-center ring-2 ring-emerald-200 shadow-sm">
              <div className="text-2xl font-bold text-emerald-700">{pct(result.prob)}</div>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">{result.method}</span>
              </div>
              <div className="mt-1 text-slate-800 font-medium">{result.explain}</div>
              <div className="mt-2 text-sm text-slate-600 flex items-center gap-2">
                <span>💡</span>
                <span>Giữ NV nếu ≥70%; 40–70% cân nhắc thêm ngành; &lt;40% ưu tiên phương án an toàn.</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Bảng xếp hạng đề xuất theo tổ hợp (Top 10) */}
      {prediction && (
        <section className="rounded-2xl shadow-sm border p-4 bg-white">
          {/* A. Tóm tắt */}
          <div className="mb-4">
            <div className="text-base font-semibold text-slate-800">Tóm tắt</div>
            <div className="mt-1 text-sm text-slate-700">
              Tổng {prediction.summary.total_score} | {prediction.summary.tohop} – {method.title} | {prediction.summary.verdict} | Δ {prediction.summary.delta_vs_median}
              {prediction.summary.note && (<span className="ml-2 text-slate-500">• {prediction.summary.note}</span>)}
            </div>
          </div>

          {/* B. Bảng Top trường/ngành phù hợp */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Trường – Ngành (mã)</th>
                  <th className="py-2 pr-3">Ngưỡng (năm gần nhất)</th>
                  <th className="py-2 pr-3">Δ</th>
                  <th className="py-2 pr-3">Xác suất</th>
                  <th className="py-2 pr-3">Mức độ</th>
                  <th className="py-2 pr-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {(prediction.rankings||[]).map(r => (
                  <tr key={`${r.manganh}-${r.truong}-${r.rank}`} className="border-t border-slate-100">
                    <td className="py-2 pr-3">{r.rank}</td>
                    <td className="py-2 pr-3">
                      <div className="font-medium text-slate-900">{r.truong}</div>
                      <div className="text-slate-700">{r.tennganh} <span className="text-slate-500">({r.manganh})</span></div>
                    </td>
                    <td className="py-2 pr-3">{r.diemchuan}</td>
                    <td className={`py-2 pr-3 font-medium ${r.delta>=0? 'text-emerald-600':'text-rose-600'}`}>{r.delta}</td>
                    <td className="py-2 pr-3 w-[120px]">
                      <div className="text-emerald-700 font-semibold">{pct(r.prob)}</div>
                      <div className="h-1.5 bg-slate-200 rounded mt-1">
                        <div className="h-1.5 rounded bg-emerald-500" style={{width: pct(r.prob)}} />
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${r.prob>=0.9?'bg-emerald-100 text-emerald-700':r.prob>=0.7?'bg-lime-100 text-lime-700':r.prob>=0.4?'bg-amber-100 text-amber-700':'bg-rose-100 text-rose-700'}`}>{r.level}</span>
                    </td>
                    <td className="py-2 pr-3">{r.ghichu || '—'}</td>
                  </tr>
                ))}
                {(!prediction.rankings || prediction.rankings.length===0) && (
                  <tr><td className="py-3 text-slate-500" colSpan={7}>Không tìm thấy gợi ý phù hợp cho tổ hợp hiện tại.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

// ——————————————— UI Primitives ———————————————
function Input({ label, value, onChange, error, type = "number", placeholder }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm text-gray-600">{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e)=>onChange(e.target.value)}
        className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${error? 'border-red-400':'border-gray-300'}`}
      />
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </label>
  );
}

function Select({ label, value, onChange, options = [] }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm text-gray-600">{label}</div>
      <select
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 border-gray-300"
      >
        {options.map(opt => (
          <option key={opt.code} value={opt.code}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}

// Helper: bỏ dấu tiếng Việt để tìm kiếm ngành
function removeAccents(str) {
  try {
    return (str || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  } catch (_) {
    return String(str || "");
  }
}
