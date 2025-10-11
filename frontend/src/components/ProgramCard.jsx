export default function ProgramCard({ item }) {
  // Map API data to display format
  const displayData = {
    major: item.tennganh || 'N/A',
    school: item.tentruong || 'N/A', 
    method: item.phuongthuc || 'N/A',
    combo: item.tohopmon || 'N/A',
    year: item.namxettuyen || 'N/A',
    score: item.diemchuan || 'N/A',
    tuition: item.hocphi || 0,
    region: item.khuvuc || 'N/A',
    note: item.ghichu || ''
  };

  return (
    <div className="card p-5 hover:shadow-lg transition">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-800">{displayData.major}</h3>
        <span className="px-3 py-1 text-xs rounded-full bg-primary-50 text-primary-700">
          {displayData.method} · {displayData.combo}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{displayData.school}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded-lg bg-gray-50">
          <div className="text-gray-500">Năm</div>
          <div className="font-medium">{displayData.year}</div>
        </div>
        <div className="p-3 rounded-lg bg-gray-50">
          <div className="text-gray-500">Điểm chuẩn</div>
          <div className="font-medium">{displayData.score}</div>
        </div>
        <div className="p-3 rounded-lg bg-gray-50">
          <div className="text-gray-500">Học phí/kỳ</div>
          <div className="font-medium">
            {displayData.tuition > 0 ? `${(displayData.tuition/1000000).toFixed(1)} triệu` : 'N/A'}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-gray-50">
          <div className="text-gray-500">Khu vực</div>
          <div className="font-medium">{displayData.region}</div>
        </div>
      </div>
      {displayData.note && (
        <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-gray-600">
          <strong>Ghi chú:</strong> {displayData.note}
        </div>
      )}
    </div>
  );
}


