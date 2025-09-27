export default function ConsultantCandidates() {
  const rows = [
    { name: "Trần N.", major: "CNTT", school: "ĐH BKHN", status: "Hẹn 14:00 hôm nay" },
    { name: "Lê Q.", major: "KTPM", school: "ĐH FPT", status: "Hẹn 09:30 ngày mai" }
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Hồ sơ thí sinh</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3 text-left">Họ tên</th>
              <th className="p-3 text-left">Ngành quan tâm</th>
              <th className="p-3 text-left">Trường gợi ý</th>
              <th className="p-3 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} className="border-t">
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.major}</td>
                <td className="p-3">{r.school}</td>
                <td className="p-3 text-center">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
