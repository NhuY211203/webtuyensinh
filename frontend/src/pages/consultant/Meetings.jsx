export default function ConsultantMeetings() {
  const rooms = [
    { id: "MEET-001", link: "https://meet.example/abc", with: "Trần N.", at: "14:00 hôm nay" },
    { id: "ZOOM-002", link: "https://zoom.example/xyz", with: "Lê Q.", at: "09:30 ngày mai" }
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Phòng họp / Link</h1>
      <div className="grid gap-3">
        {rooms.map(r => (
          <div key={r.id} className="card p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.id}</div>
              <div className="text-sm text-gray-500">{r.with} · {r.at}</div>
              <div className="text-sm mt-1">{r.link}</div>
            </div>
            <button className="btn-primary">Mở</button>
          </div>
        ))}
      </div>
    </div>
  );
}
