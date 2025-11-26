export default function ConsultantCandidates() {
  const rows = [
    { name: "Trần N.", major: "CNTT", school: "ĐH BKHN", status: "Hẹn 14:00 hôm nay", statusType: "today" },
    { name: "Lê Q.", major: "KTPM", school: "ĐH FPT", status: "Hẹn 09:30 ngày mai", statusType: "tomorrow" }
  ];

  const getStatusIcon = (statusType) => {
    switch(statusType) {
      case 'today': return '⏰';
      case 'tomorrow': return '📅';
      case 'completed': return '✅';
      default: return '📋';
    }
  };

  const getStatusColor = (statusType) => {
    switch(statusType) {
      case 'today': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'tomorrow': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header với màu thương hiệu */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Hồ sơ thí sinh</h1>
              <p className="text-gray-600 text-lg">Quản lý thông tin và lịch hẹn với thí sinh</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter và thống kê */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-600">Hôm nay: 1</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-600">Ngày mai: 1</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-600">Hoàn thành: 0</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                📞 Gọi tất cả
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                📧 Gửi nhắc lịch
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng thí sinh */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">Danh sách thí sinh</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Họ tên</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ngành quan tâm</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Trường gợi ý</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Trạng thái</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {r.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {r.major}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{r.school}</td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${getStatusColor(r.statusType)}`}>
                        <span>{getStatusIcon(r.statusType)}</span>
                        <span>{r.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                          📞 Gọi
                        </button>
                        <button className="px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium">
                          👁️ Xem
                        </button>
                        <button className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium">
                          📝 Ghi chú
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
