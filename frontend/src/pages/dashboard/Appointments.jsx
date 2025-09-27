export default function Appointments() {
  const items = [
    { when: "14:00 25/06/2024", with: "Chuyên gia A", channel: "Google Meet", note: "Tư vấn ngành CNTT" },
    { when: "09:30 30/06/2024", with: "Chuyên gia B", channel: "Zoom", note: "Học bổng & học phí" }
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Lịch tư vấn</h1>
      <div className="grid gap-3">
        {items.map((x,i)=>(
          <div key={i} className="card p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{x.when}</div>
              <div className="text-sm text-gray-500">{x.with} · {x.channel}</div>
              <div className="text-sm mt-1">{x.note}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded-full bg-gray-100">Đổi lịch</button>
              <button className="px-3 py-1 rounded-full bg-red-50 text-red-600">Hủy</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
