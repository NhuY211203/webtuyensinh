import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";

export default function MajorManagement() {
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [groups, setGroups] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupForm, setGroupForm] = useState({ manhom: "", tennhom: "", mota: "" });
  const [groupErrors, setGroupErrors] = useState({});

  const [formData, setFormData] = useState({
    idnhomnganh: "",
    manganh: "",
    tennganh: "",
    capdo: "Đại học",
    bangcap: "",
    motanganh: "",
    mucluong: "",
    xuhuong: ""
  });
  const [formErrors, setFormErrors] = useState({});

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  const trendOptions = [
    "Nhu cầu cao",
    "Tăng mạnh",
    "Rất cao",
    "Ổn định",
    "Rất nóng",
    "Tăng nhanh",
    "Luôn cao",
    "Cao",
  ];

  const loadMajors = async (p = 1, search = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p.toString(), per_page: "20", ...(search && { search }) });
      const res = await fetch(`http://localhost:8000/api/admin/nganhhoc?${params}`);
      const data = await res.json();
      if (data.success) {
        setMajors(data.data);
        setPage(data.pagination.current_page);
        setTotalPages(data.pagination.last_page);
        setTotalRecords(data.pagination.total);
      } else {
        showToast("Lỗi khi tải dữ liệu", "error");
      }
    } catch (e) {
      showToast("Lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMajors(page, searchTerm); }, []);

  // Load nhóm ngành for dropdown
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/nhomnganh`);
        const data = await res.json();
        if (data && (data.success === true || Array.isArray(data))) {
          const list = data.success ? data.data : data; // shape: {id, code, name}
          setGroups(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        // silent; dropdown will be empty
      }
    })();
  }, []);

  const validate = () => {
    const errors = {};
    if (!formData.idnhomnganh) errors.idnhomnganh = "Nhóm ngành bắt buộc";
    if (!formData.manganh.trim()) errors.manganh = "Mã ngành bắt buộc";
    if (!formData.tennganh.trim()) errors.tennganh = "Tên ngành bắt buộc";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ idnhomnganh: "", manganh: "", tennganh: "", capdo: "Đại học", bangcap: "", motanganh: "", mucluong: "", xuhuong: "" });
    setFormErrors({});
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { showToast("Vui lòng kiểm tra lại thông tin", "error"); return; }
    setLoading(true);
    try {
      const payload = {
        idnhomnganh: parseInt(formData.idnhomnganh),
        manganh: formData.manganh.trim(),
        tennganh: formData.tennganh.trim(),
        capdo: formData.capdo || null,
        bangcap: formData.bangcap || null,
        motanganh: formData.motanganh || null,
        mucluong: formData.mucluong || null,
        xuhuong: formData.xuhuong || null,
      };
      const url = editing ? `http://localhost:8000/api/admin/nganhhoc/${editing.idnganh}` : `http://localhost:8000/api/admin/nganhhoc`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        showToast(editing ? "Cập nhật ngành học thành công" : "Thêm ngành học thành công", "success");
        setTimeout(() => { setShowModal(false); resetForm(); loadMajors(page, searchTerm); }, 100);
      } else {
        if (data.errors) setFormErrors(Object.fromEntries(Object.entries(data.errors).map(([k,v])=>[k, Array.isArray(v)?v[0]:v])));
        showToast(data.message || "Có lỗi xảy ra", "error");
      }
    } catch (e) {
      showToast("Lỗi kết nối: " + e.message, "error");
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa ngành học này?")) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/admin/nganhhoc/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { showToast("Xóa thành công", "success"); loadMajors(page, searchTerm); }
      else showToast(data.message || "Có lỗi xảy ra", "error");
    } catch (e) { showToast("Lỗi kết nối", "error"); }
    finally { setLoading(false); }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) { showToast("Chọn ít nhất một ngành", "error"); return; }
    if (!window.confirm(`Xóa ${selectedIds.length} ngành học?`)) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/admin/nganhhoc/bulk", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: selectedIds }) });
      const data = await res.json();
      if (data.success) { showToast(data.message || "Xóa thành công", "success"); setSelectedIds([]); loadMajors(page, searchTerm); }
      else showToast(data.message || "Có lỗi xảy ra", "error");
    } catch (e) { showToast("Lỗi kết nối", "error"); }
    finally { setLoading(false); }
  };

  const selectAll = (checked) => { setSelectedIds(checked ? majors.map(m => m.idnganh) : []); };
  const selectOne = (id, checked) => { setSelectedIds(checked ? [...selectedIds, id] : selectedIds.filter(i => i !== id)); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý ngành học</h1>
      </div>

      <div className="card p-5">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <form onSubmit={(e)=>{e.preventDefault(); loadMajors(1, searchTerm);}} className="flex-1 w-full md:w-auto">
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Tìm theo tên, mã ngành..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
              <button type="submit" className="btn-primary">Tìm</button>
              {searchTerm && <button type="button" className="btn-outline" onClick={()=>{setSearchTerm(""); loadMajors(1, "");}}>Xóa</button>}
            </div>
          </form>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={()=>{ resetForm(); setShowModal(true); }}>+ Thêm mới</button>
            <label className="btn-outline cursor-pointer">
              📥 Nhập CSV
              <input type="file" accept=".csv" className="hidden" onChange={async (e)=>{
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const formData = new FormData();
                  formData.append('file', file);
                  const res = await fetch('http://localhost:8000/api/admin/nganhhoc/import', { method:'POST', body: formData });
                  const data = await res.json();
                  if (data.success) {
                    const s = data.summary || {}; 
                    showToast(`Nhập CSV thành công: thêm ${s.created||0}, cập nhật ${s.updated||0}, lỗi ${s.failed||0}`, 'success');
                    loadMajors(1, searchTerm);
                  } else {
                    showToast(data.message || 'Nhập CSV thất bại', 'error');
                  }
                } catch (err) {
                  showToast('Lỗi kết nối khi nhập CSV', 'error');
                } finally {
                  e.target.value = '';
                }
              }} />
            </label>
            <button className="btn-outline" onClick={()=>{ setGroupForm({ manhom:"", tennhom:"", mota:"" }); setGroupErrors({}); setShowGroupModal(true); }}>+ Thêm nhóm ngành</button>
            {selectedIds.length>0 && (
              <button className="btn-outline bg-red-50 text-red-600 hover:bg-red-100" onClick={handleBulkDelete} disabled={loading}>🗑️ Xóa ({selectedIds.length})</button>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Danh sách ngành học</h2>
          <div className="text-sm text-gray-500">Tổng: {totalRecords} | Trang: {page}/{totalPages}</div>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 w-12 text-left"><input type="checkbox" checked={selectedIds.length===majors.length && majors.length>0} onChange={(e)=>selectAll(e.target.checked)} /></th>
                  <th className="px-4 py-2 text-left">Mã ngành</th>
                  <th className="px-4 py-2 text-left">Tên ngành</th>
                  <th className="px-4 py-2 text-left">Cấp độ</th>
                  <th className="px-4 py-2 text-left">Bằng cấp</th>
                  <th className="px-4 py-2 text-left">Mức lương</th>
                  <th className="px-4 py-2 text-left">Xu hướng</th>
                  <th className="px-4 py-2 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {majors.map(m => (
                  <tr key={m.idnganh} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2"><input type="checkbox" checked={selectedIds.includes(m.idnganh)} onChange={(e)=>selectOne(m.idnganh, e.target.checked)} /></td>
                    <td className="px-4 py-2">{m.manganh}</td>
                    <td className="px-4 py-2">{m.tennganh}</td>
                    <td className="px-4 py-2">{m.capdo || '-'}</td>
                    <td className="px-4 py-2">{m.bangcap || '-'}</td>
                    <td className="px-4 py-2">{m.mucluong || '-'}</td>
                    <td className="px-4 py-2">{m.xuhuong || '-'}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-center gap-2">
                        <button className="px-3 py-1 text-sm bg-teal-50 text-teal-600 rounded hover:bg-teal-100" onClick={()=>{ setEditing(m); setFormData({ idnhomnganh: (m.idnhomnganh||"").toString(), manganh: m.manganh||"", tennganh: m.tennganh||"", capdo: m.capdo||"", bangcap: m.bangcap||"", motanganh: m.motanganh||"", mucluong: m.mucluong||"", xuhuong: m.xuhuong||"" }); setShowModal(true); }}>✏️</button>
                        <button className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100" onClick={()=>handleDelete(m.idnganh)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {majors.length===0 && !loading && (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">Không có dữ liệu</td></tr>
                )}
                {loading && (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">Đang tải...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages>1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button className="btn-outline" disabled={page===1} onClick={()=>loadMajors(page-1, searchTerm)}>Trước</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page-3), Math.max(0, page-3)+5).map(p => (
              <button key={p} className={`px-3 py-1 rounded ${p===page?"bg-teal-600 text-white":"bg-gray-200"}`} onClick={()=>loadMajors(p, searchTerm)}>{p}</button>
            ))}
            <button className="btn-outline" disabled={page===totalPages} onClick={()=>loadMajors(page+1, searchTerm)}>Sau</button>
          </div>
        )}
      </div>

      <Modal open={showModal} title={editing?"Cập nhật ngành học":"Thêm ngành học"} onClose={()=>{ setShowModal(false); resetForm(); }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nhóm ngành <span className="text-red-500">*</span></label>
              <select className={`input w-full ${formErrors.idnhomnganh?'border-red-500':''}`} value={formData.idnhomnganh} onChange={(e)=>{ setFormData({...formData, idnhomnganh: e.target.value}); if(formErrors.idnhomnganh) setFormErrors({...formErrors, idnhomnganh:''}); }}>
                <option value="">Chọn nhóm ngành</option>
                {groups.map((g, idx) => (
                  <option key={g.id ?? idx} value={g.id}>{g.name || (g.tennhom ?? `ID: ${g.id}`)}</option>
                ))}
              </select>
              {formErrors.idnhomnganh && <p className="text-red-500 text-xs mt-1">{formErrors.idnhomnganh}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mã ngành <span className="text-red-500">*</span></label>
              <input type="text" className={`input w-full ${formErrors.manganh?'border-red-500':''}`} value={formData.manganh} onChange={(e)=>{ setFormData({...formData, manganh: e.target.value}); if(formErrors.manganh) setFormErrors({...formErrors, manganh:''}); }} maxLength={20} />
              {formErrors.manganh && <p className="text-red-500 text-xs mt-1">{formErrors.manganh}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tên ngành <span className="text-red-500">*</span></label>
            <input type="text" className={`input w-full ${formErrors.tennganh?'border-red-500':''}`} value={formData.tennganh} onChange={(e)=>{ setFormData({...formData, tennganh: e.target.value}); if(formErrors.tennganh) setFormErrors({...formErrors, tennganh:''}); }} maxLength={255} />
            {formErrors.tennganh && <p className="text-red-500 text-xs mt-1">{formErrors.tennganh}</p>}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cấp độ</label>
              <input type="text" className="input w-full" value={formData.capdo} onChange={(e)=>setFormData({...formData, capdo: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bằng cấp</label>
              <input type="text" className="input w-full" value={formData.bangcap} onChange={(e)=>setFormData({...formData, bangcap: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea className="input w-full" rows="3" value={formData.motanganh} onChange={(e)=>setFormData({...formData, motanganh: e.target.value})} maxLength={1000} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mức lương</label>
              <input type="text" className="input w-full" value={formData.mucluong} onChange={(e)=>setFormData({...formData, mucluong: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Xu hướng</label>
              <select className="input w-full" value={formData.xuhuong} onChange={(e)=>setFormData({...formData, xuhuong: e.target.value})}>
                <option value="">Chọn xu hướng</option>
                {trendOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn-outline" onClick={()=>{ setShowModal(false); resetForm(); }}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading?"Đang xử lý...": editing?"Cập nhật":"Thêm mới"}</button>
          </div>
        </form>
      </Modal>

      {/* Group Add Modal */}
      <Modal open={showGroupModal} title="Thêm nhóm ngành" onClose={()=>setShowGroupModal(false)}>
        <form onSubmit={async (e)=>{
          e.preventDefault();
          const errs = {};
          if (!groupForm.manhom.trim()) errs.manhom = 'Mã nhóm bắt buộc';
          if (!groupForm.tennhom.trim()) errs.tennhom = 'Tên nhóm bắt buộc';
          setGroupErrors(errs);
          if (Object.keys(errs).length>0) return;
          try {
            const res = await fetch('http://localhost:8000/api/admin/nhomnganh', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(groupForm) });
            const data = await res.json();
            if (data.success) {
              showToast('Thêm nhóm ngành thành công','success');
              setShowGroupModal(false);
              // reload groups and select new one
              const r = await fetch('http://localhost:8000/api/nhomnganh');
              const d = await r.json();
              const list = d.success ? d.data : d;
              setGroups(Array.isArray(list)?list:[]);
              const newId = data.data?.idnhomnganh ?? data.data?.id;
              if (newId) setFormData(prev=>({ ...prev, idnhomnganh: newId.toString() }));
            } else {
              showToast(data.message || 'Có lỗi xảy ra','error');
            }
          } catch (e) {
            showToast('Lỗi kết nối','error');
          }
        }} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mã nhóm <span className="text-red-500">*</span></label>
              <input className={`input w-full ${groupErrors.manhom?'border-red-500':''}`} value={groupForm.manhom} onChange={(e)=>{ setGroupForm({ ...groupForm, manhom: e.target.value }); if(groupErrors.manhom) setGroupErrors({ ...groupErrors, manhom:''}); }} />
              {groupErrors.manhom && <p className="text-red-500 text-xs mt-1">{groupErrors.manhom}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tên nhóm <span className="text-red-500">*</span></label>
              <input className={`input w-full ${groupErrors.tennhom?'border-red-500':''}`} value={groupForm.tennhom} onChange={(e)=>{ setGroupForm({ ...groupForm, tennhom: e.target.value }); if(groupErrors.tennhom) setGroupErrors({ ...groupErrors, tennhom:''}); }} />
              {groupErrors.tennhom && <p className="text-red-500 text-xs mt-1">{groupErrors.tennhom}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea className="input w-full" rows="3" value={groupForm.mota} onChange={(e)=>setGroupForm({ ...groupForm, mota: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn-outline" onClick={()=>setShowGroupModal(false)}>Hủy</button>
            <button type="submit" className="btn-primary">Thêm</button>
          </div>
        </form>
      </Modal>

      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={()=>setToast({ show:false, message:"", type:"success" })} />
    </div>
  );
}


