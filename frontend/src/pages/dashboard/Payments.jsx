export default function Payments() {
  const rows = [
    { id: "P2024-001", date: "20/06/2024", amount: 120000, status: "Thành công" },
    { id: "P2024-002", date: "25/06/2024", amount: 120000, status: "Chờ" }
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Lịch sử thanh toán</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3">Mã giao dịch</th>
              <th className="text-left p-3">Ngày</th>
              <th className="text-right p-3">Số tiền (đ)</th>
              <th className="text-center p-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.id}</td>
                <td className="p-3">{r.date}</td>
                <td className="p-3 text-right">{r.amount.toLocaleString()}</td>
                <td className="p-3 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs ${r.status==='Thành công'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
