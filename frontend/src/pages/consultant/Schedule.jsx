export default function ConsultantSchedule() {
  const slots = [
    { time: "09:00 - 09:30", status: "Trống" },
    { time: "09:30 - 10:00", status: "Đã đặt" },
    { time: "10:00 - 10:30", status: "Trống" }
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Lịch của tôi</h1>
      <div className="card p-5">
        <table className="w-full text-sm">
          <thead><tr><th className="p-3 text-left">Khung giờ</th><th className="p-3 text-left">Trạng thái</th><th className="p-3">Hành động</th></tr></thead>
          <tbody>
            {slots.map((s,i)=>(
              <tr key={i} className="border-t">
                <td className="p-3">{s.time}</td>
                <td className="p-3">{s.status}</td>
                <td className="p-3 text-center">
                  <button className="px-3 py-1 rounded-full bg-gray-100">Đổi</button>
                  <button className="px-3 py-1 rounded-full bg-red-50 text-red-600 ml-2">Hủy</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
