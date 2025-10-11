import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input.jsx";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    hoten: "",
    matkhau: "",
    sodienthoai: "",
    diachi: "",
    ngaysinh: "",
    gioitinh: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField = (name, value) => {
    const errors = { ...fieldErrors };
    
    switch (name) {
      case 'email':
        if (!value) {
          errors.email = "Email là bắt buộc";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = "Email không đúng định dạng";
        } else {
          delete errors.email;
        }
        break;
        
      case 'hoten':
        if (!value.trim()) {
          errors.hoten = "Họ và tên là bắt buộc";
        } else if (value.length > 255) {
          errors.hoten = "Họ và tên không được quá 255 ký tự";
        } else {
          delete errors.hoten;
        }
        break;
        
      case 'matkhau':
        if (!value) {
          errors.matkhau = "Mật khẩu là bắt buộc";
        } else if (value.length < 6) {
          errors.matkhau = "Mật khẩu phải có ít nhất 6 ký tự";
        } else if (value.length > 255) {
          errors.matkhau = "Mật khẩu không được quá 255 ký tự";
        } else {
          delete errors.matkhau;
        }
        break;
        
      case 'sodienthoai':
        if (value && !/^[0-9]{10,11}$/.test(value)) {
          errors.sodienthoai = "Số điện thoại phải có 10-11 chữ số";
        } else {
          delete errors.sodienthoai;
        }
        break;
        
      case 'ngaysinh':
        if (value && new Date(value) >= new Date()) {
          errors.ngaysinh = "Ngày sinh phải trước ngày hiện tại";
        } else {
          delete errors.ngaysinh;
        }
        break;
        
      default:
        break;
    }
    
    setFieldErrors(errors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Validate field in real-time
    validateField(name, value);
  };

  const validateForm = () => {
    const errors = [];
    
    // Validate email
    if (!formData.email) {
      errors.push("Email là bắt buộc");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Email không đúng định dạng");
    }
    
    // Validate họ tên
    if (!formData.hoten.trim()) {
      errors.push("Họ và tên là bắt buộc");
    } else if (formData.hoten.length > 255) {
      errors.push("Họ và tên không được quá 255 ký tự");
    }
    
    // Validate mật khẩu
    if (!formData.matkhau) {
      errors.push("Mật khẩu là bắt buộc");
    } else if (formData.matkhau.length < 6) {
      errors.push("Mật khẩu phải có ít nhất 6 ký tự");
    } else if (formData.matkhau.length > 255) {
      errors.push("Mật khẩu không được quá 255 ký tự");
    }
    
    // Validate số điện thoại (nếu có)
    if (formData.sodienthoai && !/^[0-9]{10,11}$/.test(formData.sodienthoai)) {
      errors.push("Số điện thoại phải có 10-11 chữ số");
    }
    
    // Validate ngày sinh (nếu có)
    if (formData.ngaysinh && new Date(formData.ngaysinh) >= new Date()) {
      errors.push("Ngày sinh phải trước ngày hiện tại");
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate form trước khi gửi
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(". "));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData)
      }).catch(() => 
        fetch("http://127.0.0.1:8000/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData)
        })
      );

      const data = await res.json();

      if (data.success) {
        setSuccess("Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(data.message || "Có lỗi xảy ra khi đăng ký");
      }
    } catch (err) {
      setError("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12 grid md:grid-cols-2 gap-10 items-center">
      <div className="card p-0 overflow-hidden">
        <div className="h-64 md:h-96 w-full overflow-hidden flex items-center justify-center bg-gray-100">
          <img
            src="https://png.pngtree.com/element_our/20190528/ourlarge/pngtree-cute-cartoon-search-icon-image_1129613.jpg"
            alt="University Admission"
            className="object-cover w-full h-full"
          />
        </div>
      </div>
      <div className="card p-8">
        <h2 className="text-xl font-semibold mb-2">Đăng ký</h2>
        <p className="text-sm text-gray-600 mb-6">Điền thông tin để tạo tài khoản với vai trò thành viên .</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input 
              label="Email *" 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="nhapemail@vd.com" 
              required
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
            )}
          </div>
          
          <div>
            <Input 
              label="Họ và tên *" 
              name="hoten"
              value={formData.hoten}
              onChange={handleChange}
              placeholder="Nguyễn Văn A" 
              required
            />
            {fieldErrors.hoten && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.hoten}</p>
            )}
          </div>
          
          <div>
            <Input 
              label="Mật khẩu *" 
              type="password" 
              name="matkhau"
              value={formData.matkhau}
              onChange={handleChange}
              placeholder="••••••••" 
              required
            />
            {fieldErrors.matkhau && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.matkhau}</p>
            )}
          </div>
          
          <div>
            <Input 
              label="Số điện thoại" 
              type="tel" 
              name="sodienthoai"
              value={formData.sodienthoai}
              onChange={handleChange}
              placeholder="0901234567" 
            />
            {fieldErrors.sodienthoai && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.sodienthoai}</p>
            )}
          </div>
          
          <Input 
            label="Địa chỉ" 
            name="diachi"
            value={formData.diachi}
            onChange={handleChange}
            placeholder="TP. Hồ Chí Minh" 
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input 
                label="Ngày sinh" 
                type="date" 
                name="ngaysinh"
                value={formData.ngaysinh}
                onChange={handleChange}
              />
              {fieldErrors.ngaysinh && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.ngaysinh}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
              <select 
                name="gioitinh"
                value={formData.gioitinh}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Chọn giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || Object.keys(fieldErrors).length > 0 || !formData.email || !formData.hoten || !formData.matkhau}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>
        </form>
        
        <p className="text-sm text-gray-600 mt-6">
          Đã có tài khoản? <Link to="/login" className="text-primary-600 font-medium">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
