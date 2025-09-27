// src/pages/admin/ManagePrograms.jsx
import { useMemo, useState } from "react";
import { useData } from "../../context/DataContext.jsx";
import Modal from "../../components/Modal.jsx";
import Input from "../../components/Input.jsx";
import Select from "../../components/Select.jsx";
import Button from "../../components/Button.jsx";

/** ============ Danh mục dùng cho form ============ */
const REGIONS = ["Miền Bắc", "Miền Trung", "Miền Nam"];
const PROVINCES = [
  { name: "Hà Nội", region: "Miền Bắc" },
  { name: "Hải Phòng", region: "Miền Bắc" },
  { name: "Quảng Ninh", region: "Miền Bắc" },
  { name: "Nghệ An", region: "Miền Trung" },
  { name: "Thanh Hóa", region: "Miền Trung" },
  { name: "Thừa Thiên Huế", region: "Miền Trung" },
  { name: "Đà Nẵng", region: "Miền Trung" },
  { name: "Khánh Hòa", region: "Miền Trung" },
  { name: "TP. Hồ Chí Minh", region: "Miền Nam" },
  { name: "Bình Dương", region: "Miền Nam" },
  { name: "Đồng Nai", region: "Miền Nam" },
  { name: "Cần Thơ", region: "Miền Nam" },
];
const METHODS = [
  "Thi THPT",
  "Học bạ",
  "Đánh giá năng lực (ĐGNL)",
  "Đánh giá tư duy (ĐGTD)",
  "Xét chứng chỉ quốc tế",
  "Tuyển thẳng/Ưu tiên",
];
const COMBOS = ["A00", "A01", "D01", "D07", "B00", "C00"];
const DEGREES = ["Đại học chính quy", "Cao đẳng", "Liên thông"];
const MODES = ["Toàn thời gian", "Vừa làm vừa học"];

/** ============ Mặc định form (giữ key cũ để tương thích) ============ */
const defaultForm = {
  // các key cũ (đang dùng bảng/list)
  id: "",
  school: "",
  major: "",
  method: "Thi THPT",
  combo: "A00",
  year: new Date().getFullYear(),
  score: "",
  tuition: "",
  region: "Miền Bắc",

  // các key mới
  province: "",
  campus: "",
  majorCodeMoet: "",
  programCode: "",
  degree: "Đại học chính quy",
  mode: "Toàn thời gian",
  quota: "",
  englishReq: "",
  otherReq: "",
  address: "",
  sourceUrl: "",
  verifiedAt: new Date().toISOString().slice(0, 10),
  published: true,
  note: "",
};

export default function ManagePrograms() {
  const { programs, setPrograms } = useData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const isEdit = Boolean(editing);

  const openAdd = () => {
    setEditing(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p.id);
    // gộp giá trị cũ + các field mới nếu chưa có
    setForm({ ...defaultForm, ...p });
    setOpen(true);
  };

  const remove = (id) =>
    setPrograms((list) => list.filter((p) => p.id !== id));

  const submit = (e) => {
    e.preventDefault();
    // ép kiểu số cho các trường số
    const data = {
      ...form,
      year: Number(form.year),
      score: form.score === "" ? "" : Number(form.score),
      tuition: form.tuition === "" ? "" : Number(form.tuition),
      quota: form.quota === "" ? "" : Number(form.quota),
    };
    if (isEdit) {
      setPrograms((list) => list.map((p) => (p.id === editing ? data : p)));
    } else {
      data.id = crypto.randomUUID();
      setPrograms((list) => [data, ...list]);
    }
    setOpen(false);
  };

  // tự động gợi ý "region" theo "province" (có thể sửa tay)
  const autoRegion = useMemo(() => {
    const p = PROVINCES.find((x) => x.name === form.province);
    return p?.region || "";
  }, [form.province]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý chương trình/điểm chuẩn</h1>
          <p className="text-gray-600 text-sm">
            Thêm, sửa, ẩn/xóa bản ghi tuyển sinh (đầy đủ: Tỉnh/TP, mã ngành MOET, chỉ tiêu,
            học phí/kỳ, yêu cầu tiếng Anh, URL nguồn, ngày xác thực…)
          </p>
        </div>
        <Button onClick={openAdd}>+ Thêm bản ghi</Button>
      </div>

      {/* BẢNG HIỂN THỊ */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <Th>Trường</Th>
              <Th>Ngành</Th>
              <Th>Tỉnh/TP</Th>
              <Th>PT</Th>
              <Th>Tổ hợp</Th>
              <Th>Năm</Th>
              <Th>Điểm</Th>
              <Th>Chỉ tiêu</Th>
              <Th>Học phí/kỳ</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right pr-4">Hành động</Th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p) => (
              <tr key={p.id} className="border-t">
                <Td>
                  <div className="font-medium">{p.school}</div>
                  {p.campus && (
                    <div className="text-xs text-gray-500">Campus: {p.campus}</div>
                  )}
                </Td>
                <Td>
                  <div className="font-medium">{p.major}</div>
                  <div className="text-xs text-gray-500">
                    MOET: {p.majorCodeMoet || "-"} • Mã CT: {p.programCode || "-"}
                  </div>
                </Td>
                <Td>
                  <div>{p.province || "-"}</div>
                  <div className="text-xs text-gray-500">{p.region}</div>
                </Td>
                <Td className="text-center">{p.method}</Td>
                <Td className="text-center">{p.combo}</Td>
                <Td className="text-center">{p.year}</Td>
                <Td className="text-center">{p.score}</Td>
                <Td className="text-center">{p.quota ? p.quota.toLocaleString("vi-VN") : "-"}</Td>
                <Td className="text-center">
                  {p.tuition !== "" ? `${(p.tuition / 1e6).toFixed(1)}tr` : "-"}
                </Td>
                <Td className="text-center">
                  {p.published ? (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700">
                      Đang hiển thị
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                      Đã ẩn
                    </span>
                  )}
                </Td>
                <Td className="text-right">
                  <button
                    onClick={() => openEdit(p)}
                    className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 mr-2 hover:bg-primary-100"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="px-3 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    Xóa
                  </button>
                </Td>
              </tr>
            ))}
            {programs.length === 0 && (
              <tr>
                <td colSpan="11" className="p-6 text-center text-gray-500">
                  Chưa có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? "Sửa bản ghi" : "Thêm bản ghi"}
      >
        <form
          className="grid md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-2"
          onSubmit={submit}
        >
          {/* Trường & campus */}
          <Input
            label="Trường *"
            value={form.school}
            onChange={(e) => setField("school", e.target.value)}
            required
          />
          <Input
            label="Cơ sở/Campus"
            value={form.campus}
            onChange={(e) => setField("campus", e.target.value)}
          />

          {/* Tỉnh/TP - Miền - Địa chỉ */}
          <Select
            label="Tỉnh/TP *"
            value={form.province}
            onChange={(e) => setField("province", e.target.value)}
            required
          >
            <option value="">-- Chọn --</option>
            {PROVINCES.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select
            label="Miền/Vùng"
            value={form.region || autoRegion}
            onChange={(e) => setField("region", e.target.value)}
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          <div className="md:col-span-2">
            <Input
              label="Địa chỉ chi tiết"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
            />
          </div>

          {/* Ngành + mã */}
          <Input
            label="Ngành/Chương trình *"
            value={form.major}
            onChange={(e) => setField("major", e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mã ngành MOET *"
              value={form.majorCodeMoet}
              onChange={(e) => setField("majorCodeMoet", e.target.value)}
              required
            />
            <Input
              label="Mã chương trình"
              value={form.programCode}
              onChange={(e) => setField("programCode", e.target.value)}
            />
          </div>

          {/* Bậc & Hình thức & Năm */}
          <Select
            label="Bậc đào tạo"
            value={form.degree}
            onChange={(e) => setField("degree", e.target.value)}
          >
            {DEGREES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </Select>
          <Select
            label="Hình thức đào tạo"
            value={form.mode}
            onChange={(e) => setField("mode", e.target.value)}
          >
            {MODES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </Select>
          <Input
            label="Năm *"
            type="number"
            value={form.year}
            onChange={(e) => setField("year", e.target.value)}
            required
          />

          {/* Phương thức - Tổ hợp - Điểm */}
          <Select
            label="Phương thức *"
            value={form.method}
            onChange={(e) => setField("method", e.target.value)}
          >
            {METHODS.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </Select>
          <Select
            label="Tổ hợp *"
            value={form.combo}
            onChange={(e) => setField("combo", e.target.value)}
          >
            {COMBOS.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </Select>
          <Input
            label="Điểm chuẩn"
            type="number"
            step="0.01"
            value={form.score}
            onChange={(e) => setField("score", e.target.value)}
          />

          {/* Chỉ tiêu - Học phí - Ngày xác thực */}
          <Input
            label="Chỉ tiêu (người)"
            type="number"
            value={form.quota}
            onChange={(e) => setField("quota", e.target.value)}
          />
          <Input
            label="Học phí/kỳ (đồng)"
            type="number"
            value={form.tuition}
            onChange={(e) => setField("tuition", e.target.value)}
          />
          <Input
            label="Ngày xác thực dữ liệu"
            type="date"
            value={form.verifiedAt}
            onChange={(e) => setField("verifiedAt", e.target.value)}
          />

          {/* Yêu cầu tiếng Anh & điều kiện khác */}
          <Input
            label="Yêu cầu tiếng Anh"
            value={form.englishReq}
            onChange={(e) => setField("englishReq", e.target.value)}
          />
          <Input
            label="Điều kiện khác"
            value={form.otherReq}
            onChange={(e) => setField("otherReq", e.target.value)}
          />

          {/* URL nguồn & Ghi chú */}
          <Input
            label="URL nguồn dữ liệu"
            value={form.sourceUrl}
            onChange={(e) => setField("sourceUrl", e.target.value)}
          />
          <Input
            label="Ghi chú"
            value={form.note}
            onChange={(e) => setField("note", e.target.value)}
          />

          {/* Trạng thái hiển thị */}
          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setField("published", e.target.checked)}
              />
              <span>Hiển thị công khai</span>
            </label>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              {isEdit ? "Lưu thay đổi" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* --------- ô tiêu đề & ô dữ liệu bảng ---------- */
function Th({ children, className = "" }) {
  return <th className={`text-left p-3 font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`p-3 align-top ${className}`}>{children}</td>;
}


// import { useState } from "react";
// import { useData } from "../../context/DataContext.jsx";
// import Modal from "../../components/Modal.jsx";
// import Input from "../../components/Input.jsx";
// import Select from "../../components/Select.jsx";
// import Button from "../../components/Button.jsx";

// const emptyForm = {
//   id: "", school: "", major: "", method: "Thi THPT", combo: "A00",
//   year: 2024, score: "", tuition: "", region: "Miền Bắc"
// };

// export default function ManagePrograms() {
//   const { programs, setPrograms } = useData();
//   const [open, setOpen] = useState(false);
//   const [editing, setEditing] = useState(null);
//   const [form, setForm] = useState(emptyForm);
//   const isEdit = Boolean(editing);

//   const openAdd = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
//   const openEdit = (p) => { setEditing(p.id); setForm({...p}); setOpen(true); };
//   const remove = (id) => setPrograms(list => list.filter(p => p.id !== id));

//   const save = (e) => {
//     e.preventDefault();
//     const data = { ...form, year: Number(form.year), score: Number(form.score), tuition: Number(form.tuition) };
//     if (isEdit) {
//       setPrograms(list => list.map(p => p.id === editing ? data : p));
//     } else {
//       data.id = crypto.randomUUID();
//       setPrograms(list => [data, ...list]);
//     }
//     setOpen(false);
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h1 className="text-2xl font-bold">Quản lý chương trình/điểm chuẩn</h1>
//           <p className="text-gray-600 text-sm">Thêm, sửa, ẩn/xóa bản ghi (mock dữ liệu trong bộ nhớ).</p>
//         </div>
//         <Button onClick={openAdd}>+ Thêm bản ghi</Button>
//       </div>

//       <div className="card overflow-hidden">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-50 text-gray-600">
//             <tr>
//               <th className="text-left p-3">Trường</th>
//               <th className="text-left p-3">Ngành</th>
//               <th className="p-3">PT</th>
//               <th className="p-3">Tổ hợp</th>
//               <th className="p-3">Năm</th>
//               <th className="p-3">Điểm</th>
//               <th className="p-3">Học phí/kỳ</th>
//               <th className="p-3">KV</th>
//               <th className="p-3">Hành động</th>
//             </tr>
//           </thead>
//           <tbody>
//             {programs.map(p => (
//               <tr key={p.id} className="border-t">
//                 <td className="p-3">{p.school}</td>
//                 <td className="p-3">{p.major}</td>
//                 <td className="p-3 text-center">{p.method}</td>
//                 <td className="p-3 text-center">{p.combo}</td>
//                 <td className="p-3 text-center">{p.year}</td>
//                 <td className="p-3 text-center">{p.score}</td>
//                 <td className="p-3 text-center">{(p.tuition/1e6).toFixed(1)}tr</td>
//                 <td className="p-3 text-center">{p.region}</td>
//                 <td className="p-3 text-center">
//                   <button onClick={() => openEdit(p)} className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 mr-2">Sửa</button>
//                   <button onClick={() => remove(p.id)} className="px-3 py-1 rounded-full bg-red-50 text-red-600">Xóa</button>
//                 </td>
//               </tr>
//             ))}
//             {programs.length === 0 && (
//               <tr><td colSpan="9" className="p-6 text-center text-gray-500">Chưa có dữ liệu</td></tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       <Modal open={open} onClose={() => setOpen(false)} title={isEdit ? "Sửa bản ghi" : "Thêm bản ghi"}>
//         <form className="grid md:grid-cols-2 gap-4" onSubmit={save}>
//           <Input label="Trường" value={form.school} onChange={e=>setForm(f=>({...f, school: e.target.value}))} required />
//           <Input label="Ngành" value={form.major} onChange={e=>setForm(f=>({...f, major: e.target.value}))} required />
//           <Select label="Phương thức" value={form.method} onChange={e=>setForm(f=>({...f, method: e.target.value}))}>
//             {["Thi THPT","Học bạ","ĐGNL","Khác"].map(x=><option key={x} value={x}>{x}</option>)}
//           </Select>
//           <Select label="Tổ hợp" value={form.combo} onChange={e=>setForm(f=>({...f, combo: e.target.value}))}>
//             {["A00","A01","B00","C00","D01"].map(x=><option key={x} value={x}>{x}</option>)}
//           </Select>
//           <Input label="Năm" type="number" value={form.year} onChange={e=>setForm(f=>({...f, year: e.target.value}))} required />
//           <Input label="Điểm" type="number" step="0.1" value={form.score} onChange={e=>setForm(f=>({...f, score: e.target.value}))} required />
//           <Input label="Học phí/kỳ (đồng)" type="number" value={form.tuition} onChange={e=>setForm(f=>({...f, tuition: e.target.value}))} required />
//           <Select label="Khu vực" value={form.region} onChange={e=>setForm(f=>({...f, region: e.target.value}))}>
//             {["Miền Bắc","Miền Trung","Miền Nam"].map(x=><option key={x} value={x}>{x}</option>)}
//           </Select>
//           <div className="md:col-span-2 flex justify-end gap-3 mt-2">
//             <button type="button" onClick={()=>setOpen(false)} className="px-4 py-2 rounded-full bg-gray-100">Hủy</button>
//             <button type="submit" className="btn-primary">{isEdit ? "Lưu thay đổi" : "Thêm mới"}</button>
//           </div>
//         </form>
//       </Modal>
//     </div>
//   );
// }
