import Input from "../components/Input.jsx";
import { Link } from "react-router-dom";

export default function Register() {
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
        <p className="text-sm text-gray-600 mb-6">Điền thông tin để tạo tài khoản.</p>
        <form className="space-y-4">
          <Input label="Email" type="email" placeholder="nhapemail@vd.com" />
          <Input label="Họ và tên" placeholder="Nguyễn Văn A" />
          <Input label="Mật khẩu" type="password" placeholder="••••••••" />
          <button type="submit" className="btn-primary w-full">Tạo tài khoản</button>
        </form>
        <p className="text-sm text-gray-600 mt-6">
          Đã có tài khoản? <Link to="/login" className="text-primary-600 font-medium">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
