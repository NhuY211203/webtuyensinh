export default function AccountSecurity(){
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Tài khoản & bảo mật</h1>
      <div className="card p-4 mb-4">
        <div className="font-medium mb-2">Đổi mật khẩu</div>
        <div className="grid md:grid-cols-3 gap-3">
          <input type="password" className="input" placeholder="Mật khẩu hiện tại"/>
          <input type="password" className="input" placeholder="Mật khẩu mới"/>
          <input type="password" className="input" placeholder="Nhập lại mật khẩu"/>
        </div>
        <button className="btn-primary mt-3">Cập nhật</button>
      </div>
      <div className="card p-4">
        <div className="font-medium mb-2">Xác thực 2 bước (2FA)</div>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" className="accent-primary-600"/> Bật 2FA
        </label>
      </div>
    </div>
  );
}


