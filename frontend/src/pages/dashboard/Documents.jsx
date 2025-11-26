export default function Documents(){
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Minh chứng & hồ sơ đính kèm</h1>
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <input type="file" className="input" />
          <button className="btn-primary">Tải lên</button>
        </div>
        <div className="text-gray-500 text-sm">[Danh sách file đã tải lên]</div>
      </div>
    </div>
  );
}


