export default function Notifications() {
  const Row = ({label,desc}) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-gray-500">{desc}</div>
      </div>
      <label className="inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer"/>
        <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-primary-500 relative after:content-[''] after:absolute after:h-5 after:w-5 after:bg-white after:rounded-full after:top-0.5 after:left-0.5 after:transition-all peer-checked:after:translate-x-5"></div>
      </label>
    </div>
  );
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Nhận thông báo</h1>
      <p className="text-gray-600 text-sm mb-6">Chọn kênh và loại nội dung muốn theo dõi.</p>
      <div className="space-y-3">
        <Row label="Tin tức tuyển sinh" desc="Thông báo, lịch tuyển sinh, điểm sàn" />
        <Row label="Cập nhật dữ liệu trường/ngành" desc="Khi có thay đổi học phí, phương thức, điểm chuẩn" />
        <Row label="Nhắc hạn nộp hồ sơ" desc="Trước deadline 3 ngày & 24 giờ" />
      </div>
    </div>
  );
}
