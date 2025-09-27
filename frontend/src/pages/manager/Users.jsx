import { useMemo, useState } from "react";

function RoleModal({ open, onClose, user, onSave }) {
  const [role, setRole] = useState(user?.role || "User");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
        <h3 className="text-lg font-semibold mb-3">Sửa quyền cho {user.name}</h3>
        <select
          className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500"
          value={role}
          onChange={(e)=>setRole(e.target.value)}
        >
          <option>User</option>
          <option>Consultant</option>
          <option>Staff</option>
          <option>Manager</option>
        </select>
        <div className="mt-4 text-right space-x-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Huỷ</button>
          <button onClick={()=>onSave(role)} className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700">Lưu</button>
        </div>
      </div>
    </div>
  );
}

export default function ManagerUsers() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tất cả");
  const [data, setData] = useState([
    { id:1, name:"Nguyễn Quốc Bảo", email:"bao@example.com", role:"User", status:"Hoạt động" },
    { id:2, name:"Chuyên gia A", email:"a@example.com", role:"Consultant", status:"Hoạt động" },
    { id:3, name:"Điều phối B", email:"staff@example.com", role:"Staff", status:"Hoạt động" },
  ]);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    return data.filter(u =>
      (roleFilter==="Tất cả" || u.role===roleFilter) &&
      (u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))
    );
  }, [data, query, roleFilter]);

  const saveRole = (role) => {
    setData(prev => prev.map(u => u.id===editing.id ? ({...u, role}) : u));
    setEditing(null);
  };

  const toggle = (id) => {
    setData(prev => prev.map(u => u.id===id
      ? ({...u, status: u.status==="Hoạt động" ? "Khoá" : "Hoạt động"})
      : u));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Người dùng & quyền</h1>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          placeholder="Tìm theo tên/email…"
          value={query}
          onChange={e=>setQuery(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500"
        />
        <select
          className="rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500"
          value={roleFilter}
          onChange={e=>setRoleFilter(e.target.value)}
        >
          <option>Tất cả</option>
          <option>User</option>
          <option>Consultant</option>
          <option>Staff</option>
          <option>Manager</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3 text-left">Tên</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Vai trò</th>
              <th className="p-3 text-center">Trạng thái</th>
              <th className="p-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u=>(
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3 text-center">{u.status}</td>
                <td className="p-3 text-center space-x-2">
                  <button className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100"
                          onClick={()=>setEditing(u)}>Sửa quyền</button>
                  <button className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
                          onClick={()=>toggle(u.id)}>Khoá/Mở</button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan="5" className="p-6 text-center text-gray-500">Không có dữ liệu.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <RoleModal open={!!editing} user={editing} onClose={()=>setEditing(null)} onSave={saveRole} />
    </div>
  );
}


// export default function ManagerUsers() {
//   const rows = [
//     { name: "Nguyễn Quốc Bảo", role: "User", status: "Hoạt động" },
//     { name: "Chuyên gia A", role: "Consultant", status: "Hoạt động" },
//     { name: "Điều phối B", role: "Staff", status: "Hoạt động" }
//   ];
//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-4">Người dùng & phân quyền</h1>
//       <div className="card overflow-hidden">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-50 text-gray-600">
//             <tr><th className="p-3 text-left">Tên</th><th className="p-3 text-left">Vai trò</th><th className="p-3 text-center">Trạng thái</th><th className="p-3 text-center">Hành động</th></tr>
//           </thead>
//           <tbody>
//             {rows.map((r,i)=>(
//               <tr key={i} className="border-t">
//                 <td className="p-3">{r.name}</td>
//                 <td className="p-3">{r.role}</td>
//                 <td className="p-3 text-center">{r.status}</td>
//                 <td className="p-3 text-center">
//                   <button className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 mr-2">Sửa quyền</button>
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
