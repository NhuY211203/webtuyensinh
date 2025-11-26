export default function Overview() {
  const items = [
    {
      title: "Truy cập hệ thống",
      range: "10/04 – 31/12",
      bullets: ["Đăng nhập bằng Email/SĐT", "Cập nhật thông tin cá nhân"],
      color: "bg-orange-50 border-orange-200"
    },
    {
      title: "Thí sinh tra cứu thông tin tuyển sinh",
      range: "10/04 – 31/12",
      bullets: ["Điểm chuẩn nhiều năm", "Yêu cầu chứng chỉ/tiếng Anh", "Học phí & địa chỉ"],
      color: "bg-purple-50 border-purple-200"
    }
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Tổng quan</h1>

      {/* Lộ trình dự kiến */}
      <h2 className="text-lg font-semibold mb-2">Lộ trình dự kiến</h2>
      <div className="grid gap-4">
        {items.map((it, i) => (
          <div key={i} className={`card border ${it.color} p-5 flex items-start gap-4`}>
            <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 grid place-items-center font-bold">{i+1}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{it.title}</h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100">{it.range}</span>
              </div>
              <ul className="list-disc pl-5 text-sm text-gray-700 mt-2">
                {it.bullets.map(b => <li key={b}>{b}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Thẻ trạng thái hồ sơ + thanh toán + thông báo + lối tắt */}
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="card p-4">
          <div className="font-semibold mb-2">Trạng thái hồ sơ</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Thiếu thông tin</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="font-semibold mb-2">Thanh toán</div>
          <div className="text-sm text-gray-600">Số NV: 0 • Phí cần nộp: 0đ</div>
          <button className="btn-primary mt-3">Thanh toán</button>
        </div>
        <div className="card p-4">
          <div className="font-semibold mb-2">Thông báo mới</div>
          <ul className="text-sm text-gray-700 list-disc pl-4">
            <li>Chưa có thông báo</li>
          </ul>
          <a className="text-primary-600 text-sm mt-2 inline-block" href="/dashboard/notifications-center">Xem tất cả</a>
        </div>
      </div>

      <div className="card p-4 mt-4">
        <div className="font-semibold mb-2">Lối tắt</div>
        <div className="flex flex-wrap gap-2">
          <a className="btn-secondary" href="/dashboard/profile">Cập nhật hồ sơ</a>
          <a className="btn-secondary" href="/dashboard/predictions">Dự đoán theo điểm</a>
          <a className="btn-secondary" href="/dashboard/advising">Đặt lịch tư vấn</a>
        </div>
      </div>
    </div>
  );
}
