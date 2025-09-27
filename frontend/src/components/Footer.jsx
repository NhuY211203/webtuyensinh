export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 text-sm text-gray-600 flex items-center justify-between">
        <div>© {new Date().getFullYear()} Tuyển Sinh</div>
        <div className="space-x-4">
          <a className="hover:text-primary-600" href="#">Điều khoản</a>
          <a className="hover:text-primary-600" href="#">Bảo mật</a>
        </div>
      </div>
    </footer>
  );
}
