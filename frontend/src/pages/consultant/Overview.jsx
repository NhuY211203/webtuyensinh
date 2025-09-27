export default function ConsultantOverview() {
  const items = [
    { when: "Hôm nay 14:00", who: "Thí sinh Trần N.", topic: "Tư vấn chọn ngành CNTT", channel: "Google Meet" },
    { when: "Ngày mai 09:30", who: "Thí sinh Lê Q.", topic: "Học bổng & học phí", channel: "Zoom" },
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Tổng quan</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map((x,i)=>(
          <div key={i} className="card p-5">
            <div className="text-sm text-gray-500">{x.when} · {x.channel}</div>
            <div className="font-medium mt-1">{x.who}</div>
            <div className="text-sm mt-1">{x.topic}</div>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-1 rounded-full bg-primary-50 text-primary-700">Mở phòng</button>
              <button className="px-3 py-1 rounded-full bg-gray-100">Ghi chú</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
