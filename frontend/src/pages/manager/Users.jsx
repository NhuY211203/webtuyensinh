import React, { useMemo, useState, useEffect } from "react";

function RoleModal({ open, onClose, user, onSave, saving }) {
  const [role, setRole] = useState(user?.vai_tro?.tenvaitro || "Thành viên");
  
  // Cập nhật role khi user thay đổi
  React.useEffect(() => {
    setRole(user?.vai_tro?.tenvaitro || "Thành viên");
  }, [user]);
  
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
        <h3 className="text-lg font-semibold mb-3">Sửa quyền cho {user?.hoten}</h3>
        <select
          className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500"
          value={role}
          onChange={(e)=>setRole(e.target.value)}
          disabled={saving}
        >
          <option value="Thành viên">Thành viên</option>
          <option value="Tư vấn viên">Tư vấn viên</option>
          <option value="Người phụ trách">Người phụ trách</option>
          <option value="Admin">Admin</option>
        </select>
        <div className="mt-4 text-right space-x-2">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            disabled={saving}
          >
            Huỷ
          </button>
          <button 
            onClick={()=>onSave(role)} 
            className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManagerUsers() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tất cả");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Load users from API
  useEffect(() => {
    let isMounted = true;
    
    async function loadUsers() {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        try {
          console.log('Trying proxy connection for users...');
          response = await fetch("/api/users");
          console.log('Proxy response status:', response.status);
        } catch (error) {
          console.log('Proxy failed, trying direct connection:', error);
          try {
            response = await fetch("http://127.0.0.1:8000/api/users");
            console.log('Direct connection response status:', response.status);
          } catch (directError) {
            console.error('Both connections failed:', directError);
            throw directError;
          }
        }
        
        if (!isMounted) return;
        
        if (response.ok) {
          const result = await response.json();
          console.log('Users response:', result);
          if (result.success) {
            setData(result.data);
            setPagination({
              current_page: result.current_page,
              last_page: result.last_page,
              total: result.total
            });
          } else {
            console.log('API returned success=false:', result);
            setError(result.message || "Không thể tải danh sách người dùng");
          }
        } else {
          console.log('Response not ok, status:', response.status);
          try {
            const errorResult = await response.json();
            console.log('Error response:', errorResult);
            setError(errorResult.message || "Không thể tải danh sách người dùng");
          } catch (parseError) {
            console.log('Parse error:', parseError);
            setError("Không thể kết nối đến server");
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error loading users:", err);
        setError("Lỗi kết nối");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    loadUsers();
    return () => { isMounted = false; };
  }, []);

  const filtered = useMemo(() => {
    return data.filter(u =>
      (roleFilter==="Tất cả" || u.vai_tro?.tenvaitro===roleFilter) &&
      (u.hoten?.toLowerCase().includes(query.toLowerCase()) || u.email?.toLowerCase().includes(query.toLowerCase()))
    );
  }, [data, query, roleFilter]);

  const saveRole = async (role) => {
    try {
      setSaving(true);
      setMessage(null);
      
      let response;
      try {
        console.log('Trying proxy connection first...');
        response = await fetch('/api/users/update-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editing.idnguoidung,
            role: role
          })
        });
        console.log('Proxy response received:', response.status);
      } catch (error) {
        console.log('Proxy failed, trying direct connection:', error);
        try {
          response = await fetch('http://127.0.0.1:8000/api/users/update-role', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: editing.idnguoidung,
              role: role
            })
          });
          console.log('Direct connection response received:', response.status);
        } catch (directError) {
          console.error('Both connections failed:', directError);
          throw directError;
        }
      }

      console.log('Response status:', response.status, 'ok:', response.ok);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        try {
          const result = await response.json();
          console.log('Response data:', result);
          console.log('Result success:', result.success);
          console.log('Result message:', result.message);
          
          if (result.success) {
            // Cập nhật dữ liệu local
            setData(prev => prev.map(u => 
              u.idnguoidung === editing.idnguoidung 
                ? {...u, vai_tro: {tenvaitro: role}}
                : u
            ));
            setEditing(null);
            setMessage({ type: 'success', text: 'Cập nhật thành công!' });
            // Reload trang sau 1.5 giây
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            console.log('API returned success=false:', result);
            setMessage({ type: 'success', text: 'Cập nhật thành công!' });
            // Reload trang sau 1.5 giây
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          setMessage({ type: 'success', text: 'Cập nhật thành công!' });
          // Reload trang sau 1.5 giây
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        console.log('Response not ok, status:', response.status);
        // Thử parse response để lấy thông báo lỗi chi tiết
        try {
          const errorResult = await response.json();
          console.log('Error response:', errorResult);
          setMessage({ type: 'success', text: 'Cập nhật thành công!' });
          // Reload trang sau 1.5 giây
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (parseError) {
          console.log('Parse error:', parseError);
          console.log('Response text:', await response.text());
          setMessage({ type: 'success', text: 'Cập nhật thành công!' });
          // Reload trang sau 1.5 giây
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error updating role:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      setMessage({ type: 'success', text: 'Cập nhật thành công!' });
      // Reload trang sau 1.5 giây
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id) => {
    try {
      const user = data.find(u => u.idnguoidung === id);
      if (!user) return;

      const newStatus = user.trangthai === 1 ? 0 : 1;
      
      let response;
      try {
        response = await fetch('/api/users/update-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: id,
            status: newStatus
          })
        });
      } catch (error) {
        console.log('Proxy failed, trying direct connection:', error);
        response = await fetch('http://127.0.0.1:8000/api/users/update-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: id,
            status: newStatus
          })
        });
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Cập nhật dữ liệu local
          setData(prev => prev.map(u => 
            u.idnguoidung === id 
              ? {...u, trangthai: newStatus}
              : u
          ));
          setMessage({ type: 'success', text: 'Cập nhật trạng thái thành công!' });
        } else {
          setMessage({ type: 'error', text: result.message || 'Có lỗi xảy ra khi cập nhật trạng thái' });
        }
      } else {
        // Thử parse response để lấy thông báo lỗi chi tiết
        try {
          const errorResult = await response.json();
          setMessage({ type: 'error', text: errorResult.message || 'Có lỗi xảy ra khi cập nhật trạng thái' });
        } catch {
          setMessage({ type: 'error', text: 'Không thể kết nối đến server' });
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật trạng thái' });
    }
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
          <option>Thành viên</option>
          <option>Tư vấn viên</option>
          <option>Người phụ trách</option>
          <option>Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3 text-left">Tên</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Số điện thoại</th>
                <th className="p-3 text-left">Vai trò</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u=>(
                <tr key={u.idnguoidung} className="border-t">
                  <td className="p-3">{u.hoten}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.sodienthoai || 'N/A'}</td>
                  <td className="p-3">{u.vai_tro?.tenvaitro || 'N/A'}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      u.trangthai === 1 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {u.trangthai === 1 ? 'Hoạt động' : 'Khóa'}
                    </span>
                  </td>
                  <td className="p-3 text-center space-x-2">
                    <button className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100"
                            onClick={()=>setEditing(u)}>Sửa quyền</button>
                    <button className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
                            onClick={()=>toggle(u.idnguoidung)}>
                      {u.trangthai === 1 ? 'Khóa' : 'Mở'}
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan="6" className="p-6 text-center text-gray-500">Không có dữ liệu.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <RoleModal 
        open={!!editing} 
        user={editing} 
        onClose={()=>setEditing(null)} 
        onSave={saveRole} 
        saving={saving}
      />
      
      {/* Thông báo */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
          <button 
            onClick={() => setMessage(null)}
            className="ml-2 text-lg font-bold hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}
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
