export default function ManagerOverview() {
  const cards = [
    { title: "Tổng user", value: "12,340" },
    { title: "Hồ sơ/tuần", value: "420" },
    { title: "Tỷ lệ thành công", value: "78%" },
    { title: "Giao dịch thành công", value: "1,205" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Tổng quan hệ thống</h1>
      <div className="grid md:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="text-2xl font-semibold text-teal-700">{c.value}</div>
            <div className="text-gray-500">{c.title}</div>
            <div className="mt-3 h-2 rounded bg-teal-50">
              <div className="h-2 rounded bg-teal-500" style={{width: `${(i+1)*20}%`}}/>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="font-semibold mb-2">Xu hướng điểm chuẩn 5 năm</div>
          <div className="h-48 rounded-xl bg-gradient-to-r from-teal-50 to-white border border-dashed border-teal-200 flex items-center justify-center text-gray-500">
            (Chèn chart thật sau)
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="font-semibold mb-2">Tải hệ thống gần đây</div>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>10:30 – Cập nhật dữ liệu ĐH BK</li>
            <li>10:12 – User đăng nhập</li>
            <li>09:50 – Cron crawl dữ liệu</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
