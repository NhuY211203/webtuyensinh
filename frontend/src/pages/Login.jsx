import Input from "../components/Input.jsx";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12 grid md:grid-cols-2 gap-10 items-center">
      <div className="card p-0 overflow-hidden">
        <div className="h-64 md:h-96 w-full overflow-hidden flex items-center justify-center bg-gray-100">
          <img
            src="https://media.tapchigiaoduc.edu.vn/uploads/2025/02/17/222222-1739762936.jpg"
            alt="University Admission"
            className="object-cover w-full h-full"
          />
        </div>
      </div>
      <div className="card p-8">
        <h2 className="text-xl font-semibold mb-2">Đăng nhập</h2>
        <p className="text-sm text-gray-600 mb-6">Sử dụng email để tiếp tục.</p>
        <form className="space-y-4">
          <Input label="Email" type="email" placeholder="nhapemail@vd.com" />
          <Input label="Mật khẩu" type="password" placeholder="••••••••" />
          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="accent-primary-600" /> Ghi nhớ tôi
            </label>
            <button type="button" className="text-primary-100 hover:underline">Quên mật khẩu?</button>
          </div>
          <button type="submit" className="btn-primary w-full">Đăng nhập</button>
        </form>
        <p className="text-sm text-gray-600 mt-6">
          Chưa có tài khoản? <Link to="/register" className="text-primary-600 font-medium">Đăng ký</Link>
        </p>
      </div>
    </div>
  );
}
