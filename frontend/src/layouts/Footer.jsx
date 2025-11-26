import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-[#E8F5E8] to-[#F0F8F0] text-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 3 cột */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cột 1 - Giới thiệu */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="/logo.svg" 
                alt="Hoa học trò" 
                className="h-8 w-8 object-contain"
              />
              <h2 className="text-2xl font-bold">Hoa Học Trò</h2>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              Nền tảng tra cứu thông tin tuyển sinh đại học – cao đẳng.
              Cập nhật điểm chuẩn, phương thức xét tuyển và xu hướng ngành học.
            </p>
            {/* Social Media Icons */}
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-all duration-300 hover:scale-110">
                <span className="text-gray-600 text-lg">📘</span>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-all duration-300 hover:scale-110">
                <span className="text-gray-600 text-lg">📧</span>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-all duration-300 hover:scale-110">
                <span className="text-gray-600 text-lg">📺</span>
              </a>
            </div>
          </div>

          {/* Cột 2 - Liên kết nhanh */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Liên kết nhanh</h3>
            <ul className="space-y-2 text-gray-700">
              <li>
                <Link to="/" className="hover:underline hover:text-green-600 transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:underline hover:text-green-600 transition-colors">
                  Tra cứu điểm chuẩn
                </Link>
              </li>
              <li>
                <a href="#" className="hover:underline hover:text-green-600 transition-colors">
                  Phương thức xét tuyển
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline hover:text-green-600 transition-colors">
                  Dự đoán & tư vấn
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline hover:text-green-600 transition-colors">
                  Liên hệ
                </a>
              </li>
            </ul>
          </div>

          {/* Cột 3 - Liên hệ */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Liên hệ</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">📍</span>
                <span>12 Nguyễn Văn Bảo, Gò Vấp, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">📧</span>
                <a href="mailto:contact@hoahoctro.vn" className="hover:underline hover:text-green-600 transition-colors">
                  contact@hoahoctro.vn
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">☎️</span>
                <a href="tel:0909123456" className="hover:underline hover:text-green-600 transition-colors">
                  0909 123 456
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">🌐</span>
                <a href="https://www.hoahoctro.vn" className="hover:underline hover:text-green-600 transition-colors">
                  www.hoahoctro.vn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-300 mt-8 pt-4 text-sm text-gray-600 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Hoa học trò – Tra cứu tuyển sinh</span>
          <nav className="space-x-6">
            <a href="#" className="hover:underline hover:text-green-600 transition-colors">Điều khoản</a>
            <a href="#" className="hover:underline hover:text-green-600 transition-colors">Bảo mật</a>
            <a href="#" className="hover:underline hover:text-green-600 transition-colors">Liên hệ</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}


