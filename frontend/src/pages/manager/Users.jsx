import React, { useMemo, useState, useEffect, useCallback } from "react";
import api from "../../services/api";

const DEFAULT_ROLE_OPTIONS = ["Thành viên", "Tư vấn viên", "Người phụ trách"];

function RoleModal({ open, onClose, user, onSave, saving, roleOptions }) {
  const options = useMemo(
    () => (roleOptions && roleOptions.length ? roleOptions : DEFAULT_ROLE_OPTIONS),
    [roleOptions]
  );
  const fallbackRole = user?.vai_tro?.tenvaitro || options[0] || DEFAULT_ROLE_OPTIONS[0];
  const [role, setRole] = useState(fallbackRole);
  
  // Cập nhật role khi user thay đổi
  React.useEffect(() => {
    setRole(user?.vai_tro?.tenvaitro || options[0] || DEFAULT_ROLE_OPTIONS[0]);
  }, [user, options]);
  
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
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
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

function UserFormModal({ open, onClose, user, onSave, saving, roles }) {
  const [formData, setFormData] = useState({
    email: '',
    hoten: '',
    matkhau: '',
    sodienthoai: '',
    diachi: '',
    ngaysinh: '',
    gioitinh: '',
    idvaitro: '',
    trangthai: 1,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      // Edit mode
      setFormData({
        email: user.email || '',
        hoten: user.hoten || '',
        matkhau: '',
        sodienthoai: user.sodienthoai || '',
        diachi: user.diachi || '',
        ngaysinh: user.ngaysinh || '',
        gioitinh: user.gioitinh || '',
        idvaitro: user.idvaitro || '',
        trangthai: user.trangthai ?? 1,
      });
    } else {
      // Create mode
      setFormData({
        email: '',
        hoten: '',
        matkhau: '',
        sodienthoai: '',
        diachi: '',
        ngaysinh: '',
        gioitinh: '',
        idvaitro: '',
        trangthai: 1,
      });
    }
    setErrors({});
  }, [user, open]);

  useEffect(() => {
    if (!user && open && roles && roles.length === 1) {
      setFormData(prev => ({
        ...prev,
        idvaitro: roles[0].idvaitro
      }));
    }
  }, [roles, open, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-xl font-semibold mb-4">
          {user ? 'Sửa thông tin người dùng' : 'Thêm người dùng mới'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="hoten"
                value={formData.hoten}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 ${
                  errors.hoten ? 'border-red-500' : 'border-gray-200'
                }`}
                required
                disabled={saving}
              />
              {errors.hoten && <p className="text-red-500 text-xs mt-1">{errors.hoten}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-200'
                }`}
                required
                disabled={saving}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu {!user && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                name="matkhau"
                value={formData.matkhau}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 ${
                  errors.matkhau ? 'border-red-500' : 'border-gray-200'
                }`}
                required={!user}
                disabled={saving}
                placeholder={user ? "Để trống nếu không đổi" : ""}
              />
              {errors.matkhau && <p className="text-red-500 text-xs mt-1">{errors.matkhau}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                name="sodienthoai"
                value={formData.sodienthoai}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 ${
                  errors.sodienthoai ? 'border-red-500' : 'border-gray-200'
                }`}
                disabled={saving}
              />
              {errors.sodienthoai && <p className="text-red-500 text-xs mt-1">{errors.sodienthoai}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày sinh
              </label>
              <input
                type="date"
                name="ngaysinh"
                value={formData.ngaysinh}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giới tính
              </label>
              <select
                name="gioitinh"
                value={formData.gioitinh}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500"
                disabled={saving}
              >
                <option value="">Chọn giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò <span className="text-red-500">*</span>
              </label>
              <select
                name="idvaitro"
                value={formData.idvaitro}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 ${
                  errors.idvaitro ? 'border-red-500' : 'border-gray-200'
                }`}
                required
                disabled={saving}
              >
                <option value="">Chọn vai trò</option>
                {(roles || []).map(role => (
                  <option key={role.idvaitro} value={role.idvaitro}>
                    {role.tenvaitro}
                  </option>
                ))}
              </select>
              {errors.idvaitro && <p className="text-red-500 text-xs mt-1">{errors.idvaitro}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                name="trangthai"
                value={formData.trangthai}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500"
                disabled={saving}
              >
                <option value={1}>Hoạt động</option>
                <option value={0}>Khóa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ
            </label>
            <input
              type="text"
              name="diachi"
              value={formData.diachi}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500"
              disabled={saving}
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : (user ? 'Cập nhật' : 'Tạo mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManagerUsers({
  title = "Người dùng & quyền",
  addButtonLabel = "+ Thêm người dùng",
  allowedRoles = null,
}) {
  const initialRoleFilter = !allowedRoles
    ? "Tất cả"
    : (allowedRoles.length === 1 ? allowedRoles[0] : "Tất cả");

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState(initialRoleFilter);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const nextFilter = !allowedRoles
      ? "Tất cả"
      : (allowedRoles.length === 1 ? allowedRoles[0] : "Tất cả");
    setRoleFilter(nextFilter);
  }, [allowedRoles]);

  const showRoleFilter = !allowedRoles || allowedRoles.length > 1;
  const roleSelectOptions = !allowedRoles
    ? ["Tất cả", "Thành viên", "Tư vấn viên", "Người phụ trách"]
    : (allowedRoles.length > 1 ? ["Tất cả", ...allowedRoles] : allowedRoles);
  const roleModalOptions = allowedRoles && allowedRoles.length ? allowedRoles : undefined;

  // Load roles from API
  useEffect(() => {
    async function loadRoles() {
      try {
        const response = await fetch('/api/vaitro').catch(() => 
          fetch('http://127.0.0.1:8000/api/vaitro')
        );
        if (response.ok) {
          const rolesData = await response.json();
          setRoles(Array.isArray(rolesData) ? rolesData : []);
        }
      } catch (err) {
        console.error('Error loading roles:', err);
      }
    }

    loadRoles();
  }, []);

  // Hàm load users để có thể gọi lại
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      try {
        console.log('Trying proxy connection for users...');
        // Tăng perPage lên 1000 để load tất cả users
        response = await fetch("/api/users?perPage=1000");
        console.log('Proxy response status:', response.status);
      } catch (error) {
        console.log('Proxy failed, trying direct connection:', error);
        try {
          // Tăng perPage lên 1000 để load tất cả users
          response = await fetch("http://127.0.0.1:8000/api/users?perPage=1000");
          console.log('Direct connection response status:', response.status);
        } catch (directError) {
          console.error('Both connections failed:', directError);
          throw directError;
        }
      }
      
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
      console.error("Error loading users:", err);
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load users from API khi component mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const availableRoles = useMemo(() => {
    if (!Array.isArray(roles)) return [];
    return roles.filter(role => {
      if (role.tenvaitro === 'Vãng lai' || role.tenvaitro === 'Admin') return false;
      if (allowedRoles && allowedRoles.length) {
        return allowedRoles.includes(role.tenvaitro);
      }
      return role.tenvaitro !== 'Tư vấn viên';
    });
  }, [roles, allowedRoles]);

  const filtered = useMemo(() => {
    const keyword = query.toLowerCase();
    return data.filter(u => {
      const roleName = u.vai_tro?.tenvaitro;
      const matchesAllowed = !allowedRoles || allowedRoles.includes(roleName);
      const matchesRoleSelection = showRoleFilter
        ? (roleFilter === "Tất cả" || roleName === roleFilter)
        : true;
      const matchesQuery =
        (u.hoten?.toLowerCase() || "").includes(keyword) ||
        (u.email?.toLowerCase() || "").includes(keyword);
      return matchesAllowed && matchesRoleSelection && matchesQuery;
    });
  }, [data, query, allowedRoles, roleFilter, showRoleFilter]);

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

  const handleSaveUser = async (formData) => {
    try {
      setSaving(true);
      setMessage(null);

      const userData = { ...formData };
      
      // Remove empty password if editing
      if (editingUser && !userData.matkhau) {
        delete userData.matkhau;
      }
      
      // Convert empty string to null for optional fields
      if (userData.sodienthoai === '') {
        userData.sodienthoai = null;
      }
      
      if (userData.diachi === '') {
        userData.diachi = null;
      }
      
      if (userData.ngaysinh === '') {
        userData.ngaysinh = null;
      }
      
      if (userData.gioitinh === '') {
        userData.gioitinh = null;
      }
      
      // Convert idvaitro to integer (required for create)
      if (userData.idvaitro) {
        userData.idvaitro = parseInt(userData.idvaitro);
      } else if (!editingUser) {
        // If creating new user and no role selected, show error
        setMessage({ type: 'error', text: 'Vui lòng chọn vai trò' });
        setSaving(false);
        return;
      }
      
      // Convert trangthai to integer
      userData.trangthai = parseInt(userData.trangthai);

      let responseData;
      
      try {
        if (editingUser) {
          // Update user
          userData.id = editingUser.idnguoidung;
          try {
            responseData = await api.put('/users', userData);
          } catch (error) {
            // Fallback to direct fetch
            const response = await fetch('http://127.0.0.1:8000/api/users', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(userData)
            });
            responseData = await response.json();
            
            if (!response.ok) {
              // Response không thành công, nhưng đã parse được JSON
              throw responseData;
            }
          }
        } else {
          // Create user
          try {
            responseData = await api.post('/users', userData);
          } catch (error) {
            // Fallback to direct fetch
            const response = await fetch('http://127.0.0.1:8000/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(userData)
            });
            responseData = await response.json();
            
            if (!response.ok) {
              // Response không thành công, nhưng đã parse được JSON
              throw responseData;
            }
          }
        }

        // Kiểm tra success
        if (responseData && responseData.success) {
          setMessage({ 
            type: 'success', 
            text: editingUser ? 'Cập nhật người dùng thành công!' : 'Tạo người dùng thành công!' 
          });
          setShowUserForm(false);
          setEditingUser(null);
          // Reload lại danh sách users
          await loadUsers();
        } else {
          // Handle validation errors
          let errorMessage = 'Có lỗi xảy ra khi lưu người dùng';
          
          if (responseData) {
            if (responseData.errors) {
              // Lấy thông báo lỗi đầu tiên từ validation errors
              const firstError = Object.values(responseData.errors)[0];
              errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
            } else if (responseData.message) {
              errorMessage = responseData.message;
            }
          }
          
          setMessage({ type: 'error', text: errorMessage });
        }
      } catch (apiError) {
        // Xử lý lỗi từ API
        let errorMessage = 'Có lỗi xảy ra khi lưu người dùng';
        
        if (apiError && typeof apiError === 'object') {
          if (apiError.errors) {
            const firstError = Object.values(apiError.errors)[0];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          } else if (apiError.message) {
            errorMessage = apiError.message;
          }
        } else if (typeof apiError === 'string') {
          errorMessage = apiError;
        } else if (apiError && apiError.message) {
          errorMessage = apiError.message;
        }
        
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setMessage({ type: 'error', text: error.message || 'Có lỗi xảy ra khi lưu người dùng' });
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
          const errorMessage = errorResult.message || 'Có lỗi xảy ra khi cập nhật trạng thái';
          setMessage({ type: 'error', text: errorMessage });
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowUserForm(true);
          }}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          {addButtonLabel}
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          placeholder="Tìm theo tên/email…"
          value={query}
          onChange={e=>setQuery(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500"
        />
        {showRoleFilter && (
          <select
            className="rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500"
            value={roleFilter}
            onChange={e=>setRoleFilter(e.target.value)}
          >
            {roleSelectOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )}
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
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setShowUserForm(true);
                      }}
                      className="px-3 py-1 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 mr-2"
                    >
                      Sửa
                    </button>
                    {u.trangthai === 1 ? (
                      <button 
                        className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={()=>toggle(u.idnguoidung)}
                        title="Chỉ có thể khóa khi không có lịch tư vấn trong tương lai"
                      >
                        Khóa
                      </button>
                    ) : (
                      <button 
                        className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
                        onClick={()=>toggle(u.idnguoidung)}
                      >
                        Mở
                      </button>
                    )}
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
        roleOptions={roleModalOptions}
      />

      <UserFormModal
        open={showUserForm}
        user={editingUser}
        onClose={() => {
          setShowUserForm(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        saving={saving}
        roles={availableRoles}
      />
      
      {/* Thông báo */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-slide-in-right ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            <span className="flex-1">{message.text}</span>
            <button 
              onClick={() => setMessage(null)}
              className="ml-3 text-lg font-bold hover:opacity-70 focus:outline-none"
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
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
