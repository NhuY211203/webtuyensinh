import Input from "../../components/Input.jsx";
import Select from "../../components/Select.jsx";
import Button from "../../components/Button.jsx";
import { useState } from "react";

export default function ApplicationForm() {
  const [form, setForm] = useState({
    fullName: "", cccd: "", method: "Thi THPT", combo: "A00", major: "", school: "", note: ""
  });
  const set = (k,v)=>setForm(f=>({...f,[k]:v}));
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Phiếu đăng ký xét tuyển</h1>
      <p className="text-gray-600 text-sm mb-6">Điền thông tin cơ bản. Bạn có thể lưu nháp và bổ sung sau.</p>
      <div className="card p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Họ và tên" value={form.fullName} onChange={e=>set('fullName', e.target.value)} />
          <Input label="CCCD" value={form.cccd} onChange={e=>set('cccd', e.target.value)} />
          <Input label="Trường" value={form.school} onChange={e=>set('school', e.target.value)} />
          <Input label="Ngành" value={form.major} onChange={e=>set('major', e.target.value)} />
          <Select label="Phương thức" value={form.method} onChange={e=>set('method', e.target.value)}>
            {["Thi THPT","Học bạ","ĐGNL"].map(x=><option key={x} value={x}>{x}</option>)}
          </Select>
          <Select label="Tổ hợp" value={form.combo} onChange={e=>set('combo', e.target.value)}>
            {["A00","A01","B00","C00","D01"].map(x=><option key={x} value={x}>{x}</option>)}
          </Select>
        </div>
        <label className="block">
          <span className="label">Ghi chú</span>
          <textarea className="input" rows="4" value={form.note} onChange={e=>set('note', e.target.value)} />
        </label>
        <div className="flex gap-3 justify-end">
          <button className="px-4 py-2 rounded-full bg-gray-100">Lưu nháp</button>
          <Button>Nộp hồ sơ</Button>
        </div>
      </div>
    </div>
  );
}
