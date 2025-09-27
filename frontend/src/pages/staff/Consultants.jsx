import { useState } from "react";

function EditModal({ open, onClose, expert, onSave }) {
  const [form, setForm] = useState(expert || { name:"", email:"", skills:"", status:"Hoạt động" });
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5">
        <h3 className="text-lg font-semibold mb-3">Sửa chuyên gia</h3>
        <div className="space-y-3">
          <input className="w-full border border-gray-200 rounded-xl px-3 py-2" placeholder="Họ tên"
                 value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
          <input className="w-full border border-gray-200 rounded-xl px-3 py-2" placeholder="Email"
                 value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
          <input className="w-full border border-gray-200 rounded-xl px-3 py-2" placeholder="Kỹ năng/Chuyên môn"
                 value={form.skills||""} onChange={e=>setForm({...form, skills:e.target.value})}/>
        </div>
        <div className="mt-4 text-right space-x-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Huỷ</button>
          <button onClick={()=>onSave(form)} className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700">Lưu</button>
        </div>
      </div>
    </div>
  );
}

export default function StaffExperts() {
  const [list, setList] = useState([
    { id:1, name: "Chuyên gia A", email: "a@example.com", skills:"CNTT, ĐGNL", status: "Hoạt động" },
    { id:2, name: "Chuyên gia B", email: "b@example.com", skills:"Kinh tế, Học bổng", status: "Tạm dừng" }
  ]);
  const [editing, setEditing] = useState(null);

  const toggle = (id) => {
    setList(prev => prev.map(it => it.id===id
      ? { ...it, status: it.status==="Hoạt động" ? "Tạm dừng" : "Hoạt động" }
      : it));
  };

  const save = (payload) => {
    setList(prev => prev.map(it => it.id===editing.id ? { ...it, ...payload } : it));
    setEditing(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Quản lý chuyên gia</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3 text-left">Tên</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Kỹ năng</th>
              <th className="p-3 text-center">Trạng thái</th>
              <th className="p-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {list.map(e=>(
              <tr key={e.id} className="border-t">
                <td className="p-3">{e.name}</td>
                <td className="p-3">{e.email}</td>
                <td className="p-3">{e.skills}</td>
                <td className="p-3 text-center">{e.status}</td>
                <td className="p-3 text-center space-x-2">
                  <button onClick={()=>setEditing(e)}
                          className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100">Sửa</button>
                  <button onClick={()=>toggle(e.id)}
                          className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200">Khóa/Mở</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditModal open={!!editing} expert={editing} onClose={()=>setEditing(null)} onSave={save} />
    </div>
  );
}


// export default function StaffExperts() {
//   const experts = [
//     { name: "Chuyên gia A", email: "a@example.com", status: "Hoạt động" },
//     { name: "Chuyên gia B", email: "b@example.com", status: "Tạm dừng" }
//   ];
//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-4">Quản lý chuyên gia</h1>
//       <div className="card overflow-hidden">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-50 text-gray-600">
//             <tr><th className="p-3 text-left">Tên</th><th className="p-3 text-left">Email</th><th className="p-3 text-center">Trạng thái</th><th className="p-3 text-center">Hành động</th></tr>
//           </thead>
//           <tbody>
//             {experts.map((e,i)=>(
//               <tr key={i} className="border-t">
//                 <td className="p-3">{e.name}</td>
//                 <td className="p-3">{e.email}</td>
//                 <td className="p-3 text-center">{e.status}</td>
//                 <td className="p-3 text-center">
//                   <button className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 mr-2">Sửa</button>
//                   <button className="px-3 py-1 rounded-full bg-gray-100">Khóa/Mở</button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
