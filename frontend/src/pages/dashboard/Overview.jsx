export default function Overview() {
  const items = [
    {
      title: "Nhập & quản lý phiếu đăng ký",
      range: "10/04 – 31/12",
      bullets: ["Nhập/sửa phiếu đăng ký online", "Tra cứu thông tin đăng ký", "Báo sai sót thông tin"],
      color: "bg-blue-50 border-blue-200"
    },
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
      <h1 className="text-2xl font-bold mb-4">Lộ trình dự kiến</h1>
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
    </div>
  );
}
