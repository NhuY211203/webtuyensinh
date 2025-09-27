import { useState } from "react";

export default function ManagerSettings() {
  const [email, setEmail] = useState("no-reply@yourdomain.vn");
  const [sources, setSources] = useState("MOET, Websites trường");
  const [features, setFeatures] = useState({
    notifyEmail: true,
    aiAdvice: true,
    autoCrawl: false,
  });

  const save = (e) => {
    e.preventDefault();
    alert("Đã lưu cấu hình!");
  };

  return (
    <form onSubmit={save} className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Cấu hình</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div>
          <div className="text-sm font-medium mb-1">Email gửi thông báo</div>
       <input className="input" placeholder="no-reply@yourdomain.vn" />
        </div>

        <div>
          <div className="text-sm font-medium mb-1">Nguồn dữ liệu mặc định</div>
        <input className="input" placeholder="MOET, Websites trường" />

        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={features.notifyEmail}
                   onChange={e=>setFeatures({...features, notifyEmail: e.target.checked})}/>
            Gửi email thông báo
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={features.aiAdvice}
                   onChange={e=>setFeatures({...features, aiAdvice: e.target.checked})}/>
            Bật tư vấn AI
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={features.autoCrawl}
                   onChange={e=>setFeatures({...features, autoCrawl: e.target.checked})}/>
            Tự động crawl dữ liệu
          </label>
        </div>

        <div className="text-right">
          <button className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700">Lưu</button>
        </div>
      </div>
    </form>
  );
}


// export default function ManagerSettings() {
//   return (
//     <div className="max-w-3xl">
//       <h1 className="text-2xl font-bold mb-4">Cấu hình</h1>
//       <div className="card p-5 space-y-4">
//         <label className="block">
//           <span className="label">Email gửi thông báo</span>
//           <input className="input" placeholder="no-reply@yourdomain.vn" />
//         </label>
//         <label className="block">
//           <span className="label">Nguồn dữ liệu mặc định</span>
//           <input className="input" placeholder="MOET, Websites trường" />
//         </label>
//         <div className="flex justify-end">
//           <button className="btn-primary">Lưu</button>
//         </div>
//       </div>
//     </div>
//   );
// }
