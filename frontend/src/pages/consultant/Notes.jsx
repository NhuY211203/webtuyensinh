export default function ConsultantNotes() {
  const notes = [
    { who: "Trần N.", content: "Ưu tiên CNTT, điểm dự kiến 25, cần chứng chỉ IELTS 5.5", date: "Hôm nay" },
  ];
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Ghi chú sau buổi</h1>
      <div className="space-y-3">
        {notes.map((n,i)=>(
          <div key={i} className="card p-4">
            <div className="text-sm text-gray-500">{n.date} — {n.who}</div>
            <div className="mt-1">{n.content}</div>
          </div>
        ))}
      </div>
      <div className="card p-4 mt-4">
        <textarea className="input" rows="4" placeholder="Nhập ghi chú mới..." />
        <div className="flex justify-end mt-3">
          <button className="btn-primary">Lưu</button>
        </div>
      </div>
    </div>
  );
}
