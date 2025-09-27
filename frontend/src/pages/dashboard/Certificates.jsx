export default function Certificates() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Chứng chỉ ngoại ngữ</h1>
      <p className="text-gray-600 text-sm mb-6">Tải chứng chỉ IELTS/TOEFL… để xét điều kiện.</p>
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">IELTS</div>
            <div className="text-sm text-gray-500">Chưa tải lên</div>
          </div>
          <label className="btn-primary cursor-pointer">
            Tải lên
            <input type="file" className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}
