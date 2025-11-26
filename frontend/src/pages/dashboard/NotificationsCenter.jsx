export default function NotificationsCenter(){
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Thông báo</h1>
      <div className="grid md:grid-cols-3 gap-3 mb-3">
        <select className="input"><option>Tất cả loại</option><option>Hệ thống</option><option>Thanh toán</option><option>Kết quả</option><option>Tư vấn</option></select>
        <select className="input"><option>Thời gian</option><option>7 ngày</option><option>30 ngày</option></select>
        <input className="input" placeholder="Tìm kiếm" />
      </div>
      <div className="space-y-2">
        <div className="card p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">Chưa có thông báo</div>
            <div className="text-sm text-gray-500">Khi có thông báo, nội dung sẽ hiển thị tại đây.</div>
          </div>
        </div>
      </div>
    </div>
  );
}


