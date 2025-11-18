import { useEffect, useState } from "react";
import Toast from "../../components/Toast";


const emptyNewRecord = {
  idtruong: "",
  manganh: "",
  idxettuyen: 1,
  tohopmon: "",
  diemchuan: "",
  namxettuyen: 2024,
  ghichu: ""
};

export default function DataManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Filters
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterUniversity, setFilterUniversity] = useState("");
  const [filterMajor, setFilterMajor] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterMethod, setFilterMethod] = useState("");

  // New record form state
  const [newRecord, setNewRecord] = useState(emptyNewRecord);
  const [showNewForm, setShowNewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  
  // Universities list for dropdown
  const [universities, setUniversities] = useState([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  
  // Majors list for dropdown
  const [majors, setMajors] = useState([]);
  const [loadingMajors, setLoadingMajors] = useState(false);

  const onChangeNewRecord = (e) => setNewRecord({ ...newRecord, [e.target.name]: e.target.value });

  const fetchUniversities = async () => {
    setLoadingUniversities(true);
    try {
      const response = await fetch('http://localhost:8000/api/truongdaihoc?perPage=1000&page=1');
      const data = await response.json();
      
      if (data.data) {
        setUniversities(data.data);
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
    } finally {
      setLoadingUniversities(false);
    }
  };

  const fetchMajors = async () => {
    setLoadingMajors(true);
    try {
      const response = await fetch('http://localhost:8000/api/nganhhoc?perPage=1000&page=1');
      const data = await response.json();
      
      if (data.data) {
        setMajors(data.data);
      }
    } catch (error) {
      console.error('Error fetching majors:', error);
    } finally {
      setLoadingMajors(false);
    }
  };

  const fetchData = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("perPage", "20");
      params.set("page", String(p));
      if (filterUniversity) params.set("idtruong", String(filterUniversity));
      if (filterMajor) params.set("manganh", String(filterMajor));
      if (filterYear) params.set("nam", String(filterYear));
      if (filterMethod) params.set("idxettuyen", String(filterMethod));
      if (filterKeyword) params.set("keyword", filterKeyword.trim());

      const url = `http://localhost:8000/api/diemchuan?${params.toString()}`;
      console.log("Fetching:", url);
      
      const res = await fetch(url);
      console.log("Response status:", res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("API Response:", data);
      console.log("API Response data property:", data.data);
      console.log("API Response data length:", data.data?.length);
      console.log("API Response current_page:", data.current_page);
      console.log("API Response total:", data.total);

      // Laravel pagination structure - check actual response format
      let list = [];
      let currentPage = 1;
      let totalPages = 1;
      let totalItems = 0;

      if (data.data) {
        // Standard Laravel pagination
        list = data.data;
        currentPage = data.current_page || 1;
        totalPages = data.last_page || 1;
        totalItems = data.total || 0;
      } else if (Array.isArray(data)) {
        // Direct array response
        list = data;
        totalItems = data.length;
      } else {
        console.warn("Unexpected response format:", data);
      }

      console.log("Parsed data:", { list, currentPage, totalPages, totalItems });
      console.log("First item in list:", list[0]);
      console.log("Setting rows with:", list.length, "items");

      setRows(list);
      setPage(currentPage);
      setLastPage(totalPages);
      setTotal(totalItems);
    } catch (e) {
      console.error("Fetch diemchuan failed", e);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchUniversities();
    fetchMajors();
  }, []);

  // Auto search when filters change
  useEffect(() => {
    // Debounce for keyword input to avoid too many requests
    const timeoutId = setTimeout(() => {
      fetchData(1);
    }, filterKeyword ? 500 : 0); // 500ms delay for keyword, immediate for dropdowns
    
    return () => clearTimeout(timeoutId);
  }, [filterUniversity, filterMajor, filterYear, filterMethod, filterKeyword]);

  const submitNewRecord = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage("");
    
    try {
      const response = await fetch('http://localhost:8000/api/diemchuan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRecord)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubmitMessage("✅ " + data.message);
        setNewRecord(emptyNewRecord);
        setShowNewForm(false);
        // Refresh the data table
        fetchData(1);
      } else {
        setSubmitMessage("❌ " + (data.message || "Có lỗi xảy ra"));
      }
    } catch (error) {
      setSubmitMessage("❌ Lỗi kết nối: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Toast helper
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý dữ liệu tuyển sinh</h1>


      {/* New Data Entry Section */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Thêm dữ liệu mới</h2>
          <div className="flex gap-2">
            <label className="btn-outline cursor-pointer">
              📥 Nhập CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const form = new FormData();
                    form.append('file', file);
                    const res = await fetch('http://localhost:8000/api/diemchuan/import', { method: 'POST', body: form });
                    const data = await res.json();
                    if (data.success) {
                      const s = data.summary || {};
                      showToast(`Nhập CSV thành công: thêm ${s.created||0}, cập nhật ${s.updated||0}, lỗi ${s.failed||0}`,'success');
                      fetchData(1);
                    } else {
                      const msg = data.message || 'Nhập CSV thất bại';
                      showToast(msg + (Array.isArray(data.errors) && data.errors.length? `: ${data.errors.slice(0,2).join('; ')}`:''), 'error');
                    }
                  } catch (err) {
                    showToast('Lỗi kết nối khi nhập CSV', 'error');
                  } finally {
                    e.target.value = '';
                  }
                }}
              />
            </label>
            <button
              type="button"
              className="btn-outline"
              onClick={async ()=>{
                try {
                  const params = new URLSearchParams();
                  if (filterUniversity) params.set('idtruong', String(filterUniversity));
                  if (filterMajor) params.set('manganh', String(filterMajor));
                  if (filterYear) params.set('nam', String(filterYear));
                  if (filterMethod) params.set('idxettuyen', String(filterMethod));
                  if (filterKeyword) params.set('keyword', filterKeyword.trim());
                  const res = await fetch(`http://localhost:8000/api/diemchuan/export?${params.toString()}`);
                  const data = await res.json();
                  if (data.success) {
                    // Convert to CSV
                    const headers = ['Trường','Ngành','Năm','PT','Tổ hợp','Điểm','Ghi chú'];
                    const rows = (data.data||[]).map(r=>[
                      r.tentruong||r.idtruong,
                      r.tennganh||r.manganh,
                      r.namxettuyen,
                      r.idxettuyen,
                      r.tohopmon,
                      r.diemchuan,
                      r.ghichu||''
                    ]);
                    const csv = [headers, ...rows].map(row => row.map(f=>`"${String(f).replace(/"/g,'""')}"`).join(',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'diemchuan.csv';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    showToast('Xuất CSV thành công','success');
                  } else {
                    showToast(data.message || 'Xuất CSV thất bại','error');
                  }
                } catch(e) {
                  showToast('Lỗi kết nối khi xuất CSV', 'error');
                }
              }}
            >
              📤 Xuất CSV
            </button>
            <button 
              onClick={() => setShowNewForm(!showNewForm)} 
              className="btn-primary"
            >
              {showNewForm ? "Ẩn form" : "Thêm bản ghi mới"}
            </button>
          </div>
        </div>

        {showNewForm && (
          <form onSubmit={submitNewRecord} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Trường đại học *</label>
                <select 
                  name="idtruong" 
                  value={newRecord.idtruong} 
                  onChange={onChangeNewRecord} 
                  className="input" 
                  required
                  disabled={loadingUniversities}
                >
                  <option value="">{loadingUniversities ? "Đang tải..." : "Chọn trường đại học"}</option>
                  {universities.map((university) => (
                    <option key={university.idtruong} value={university.idtruong}>
                      {university.tentruong} (ID: {university.idtruong})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ngành học *</label>
                <select 
                  name="manganh" 
                  value={newRecord.manganh} 
                  onChange={onChangeNewRecord} 
                  className="input" 
                  required
                  disabled={loadingMajors}
                >
                  <option value="">{loadingMajors ? "Đang tải..." : "Chọn ngành học"}</option>
                  {majors.map((major) => (
                    <option key={major.manganh} value={major.manganh}>
                      {major.tennganh} ({major.manganh})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phương thức xét tuyển *</label>
                <select 
                  name="idxettuyen" 
                  value={newRecord.idxettuyen} 
                  onChange={onChangeNewRecord} 
                  className="input"
                  required
                >
                  <option value={1}>1 - Thi THPT</option>
                  <option value={2}>2 - Học bạ</option>
                  <option value={3}>3 - ĐGNL</option>
                  <option value={4}>4 - ĐGTD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tổ hợp môn *</label>
                <input 
                  name="tohopmon" 
                  value={newRecord.tohopmon} 
                  onChange={onChangeNewRecord} 
                  className="input" 
                  placeholder="Ví dụ: A00;A01;D01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Điểm chuẩn *</label>
                <input 
                  name="diemchuan" 
                  type="number" 
                  step="0.01"
                  min="0"
                  max="30"
                  value={newRecord.diemchuan} 
                  onChange={onChangeNewRecord} 
                  className="input" 
                  placeholder="Ví dụ: 25.50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Năm xét tuyển *</label>
                <select 
                  name="namxettuyen" 
                  value={newRecord.namxettuyen} 
                  onChange={onChangeNewRecord} 
                  className="input"
                  required
                >
                  <option value={2024}>2024</option>
                  <option value={2023}>2023</option>
                  <option value={2022}>2022</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Ghi chú</label>
              <textarea 
                name="ghichu" 
                value={newRecord.ghichu} 
                onChange={onChangeNewRecord} 
                className="input" 
                rows="3"
                placeholder="Ghi chú thêm về phương thức xét tuyển..."
              />
            </div>
            
            {submitMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                submitMessage.includes("✅") 
                  ? "bg-green-50 text-green-800 border border-green-200" 
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}>
                {submitMessage}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => {
                  setNewRecord(emptyNewRecord);
                  setShowNewForm(false);
                  setSubmitMessage("");
                }} 
                className="btn-outline"
              >
                Hủy
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? "Đang thêm..." : "Thêm dữ liệu"}
              </button>
          </div>
        </form>
        )}
      </div>

      <div className="card p-5">
        {/* Filters */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="grid md:grid-cols-5 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Trường</label>
              <select className="input" value={filterUniversity} onChange={(e)=>setFilterUniversity(e.target.value)}>
                <option value="">Tất cả</option>
                {universities.map(u=> (
                  <option key={u.idtruong} value={u.idtruong}>{u.tentruong}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngành</label>
              <select className="input" value={filterMajor} onChange={(e)=>setFilterMajor(e.target.value)}>
                <option value="">Tất cả</option>
                {majors.map(m=> (
                  <option key={m.manganh} value={m.manganh}>{m.tennganh}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Năm</label>
              <select className="input" value={filterYear} onChange={(e)=>setFilterYear(e.target.value)}>
                <option value="">Tất cả</option>
                {[2025,2024,2023,2022,2021,2020].map(y=> <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">PT</label>
              <select className="input" value={filterMethod} onChange={(e)=>setFilterMethod(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="1">1 - Thi THPT</option>
                <option value="2">2 - Học bạ</option>
                <option value="3">3 - ĐGNL</option>
                <option value="4">4 - ĐGTD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Từ khóa</label>
              <input className="input" placeholder="Tên trường/ngành/tổ hợp" value={filterKeyword} onChange={(e)=>setFilterKeyword(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button 
              className="btn-outline" 
              onClick={()=>{ 
                setFilterUniversity(""); 
                setFilterMajor(""); 
                setFilterYear(""); 
                setFilterMethod(""); 
                setFilterKeyword(""); 
                fetchData(1);
              }}
            >
              🔄 Làm mới
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Bảng dữ liệu</h2>
          <div className="text-sm text-gray-500">Tổng: {total} | Trang: {page}/{lastPage} | Rows: {rows.length}</div>
        </div>
        {total === 0 && !loading && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Lưu ý:</strong> Hiện tại cơ sở dữ liệu chỉ có dữ liệu cho năm 2024. 
              Vui lòng chọn năm 2024 để xem dữ liệu tuyển sinh.
            </p>
          </div>
        )}
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Trường</th>
                  <th className="px-3 py-2 text-left">Ngành</th>
                  <th className="px-3 py-2">Năm</th>
                  <th className="px-3 py-2">PT</th>
                  <th className="px-3 py-2">Tổ hợp</th>
                  <th className="px-3 py-2">Điểm</th>
                  <th className="px-3 py-2">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.iddiemchuan}-${r.idtruong}-${r.manganh}`} className="border-t">
                    <td className="px-3 py-2">{r.tentruong ?? r.idtruong}</td>
                    <td className="px-3 py-2">{r.tennganh ?? r.manganh}</td>
                    <td className="px-3 py-2 text-center">{r.namxettuyen}</td>
                    <td className="px-3 py-2 text-center">{r.idxettuyen}</td>
                    <td className="px-3 py-2 text-center">{r.tohopmon}</td>
                    <td className="px-3 py-2 text-center">{r.diemchuan}</td>
                    <td className="px-3 py-2">{r.ghichu ?? ""}</td>
                  </tr>
                ))}
                {rows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                      Chưa có dữ liệu. Hãy thêm bản ghi hoặc nhập từ CSV.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-gray-500">Đang tải...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {lastPage > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <button className="btn-outline" disabled={page===1} onClick={()=>fetchData(page-1)}>Trước</button>
            {Array.from({length:lastPage},(_,i)=>i+1).slice(Math.max(0,page-3), Math.max(0,page-3)+5).map(p=> (
              <button key={p} className={`px-3 py-1 rounded ${p===page?"bg-teal-600 text-white":"bg-gray-200"}`} onClick={()=>fetchData(p)}>{p}</button>
            ))}
            <button className="btn-outline" disabled={page===lastPage} onClick={()=>fetchData(page+1)}>Sau</button>
          </div>
        )}
      </div>
      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: "", type: "success" })}
      />
    </div>
  );
}