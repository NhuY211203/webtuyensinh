export default function ProgramCard({ item }) {
  return (
    <div className="card p-5 hover:shadow-lg transition">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-800">{item.major}</h3>
        <span className="px-3 py-1 text-xs rounded-full bg-primary-50 text-primary-700">
          {item.method} · {item.combo}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{item.school}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded-lg bg-gray-50">
          <div className="text-gray-500">Năm</div>
          <div className="font-medium">{item.year}</div>
        </div>
        <div className="p-3 rounded-lg bg-gray-50">
          <div className="text-gray-500">Điểm</div>
          <div className="font-medium">{item.score}</div>
        </div>
        <div className="p-3 rounded-lg bg-gray-50">
          <div className="text-gray-500">Học phí/kỳ</div>
          <div className="font-medium">{(item.tuition/1000000).toFixed(1)} triệu</div>
        </div>
        <div className="p-3 rounded-lg bg-gray-50">
          <div className="text-gray-500">Khu vực</div>
          <div className="font-medium">{item.region}</div>
        </div>
      </div>
    </div>
  );
}
