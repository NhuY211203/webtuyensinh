import { useState } from "react";

export default function StaffNotifications() {
  const [title, setTitle] = useState("");
  const [body, setBody]   = useState("");
  const [mode, setMode]   = useState("now"); // now | schedule
  const [time, setTime]   = useState("");

  const submit = (e) => {
    e.preventDefault();
    alert(
      mode === "now"
        ? `Đã gửi: ${title}`
        : `Đã lên lịch ${time}: ${title}`
    );
    setTitle(""); setBody(""); setTime("");
  };

  return (
    <form onSubmit={submit} className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Gửi thông báo / nhắc lịch</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <input className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500"
               placeholder="Tiêu đề" value={title} onChange={e=>setTitle(e.target.value)} />
        <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500"
                  rows="4" placeholder="Nội dung..." value={body} onChange={e=>setBody(e.target.value)} />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="now" checked={mode==="now"} onChange={()=>setMode("now")} />
            Gửi ngay
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="schedule" checked={mode==="schedule"} onChange={()=>setMode("schedule")} />
            Lên lịch
          </label>
          {mode==="schedule" && (
            <input type="datetime-local" value={time} onChange={e=>setTime(e.target.value)}
                   className="border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500" />
          )}
        </div>
        <div className="text-right">
          <button type="submit" className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700">Gửi</button>
        </div>
      </div>
    </form>
  );
}


// export default function StaffNotifications() {
//   return (
//     <div className="max-w-3xl">
//       <h1 className="text-2xl font-bold mb-4">Gửi thông báo / nhắc lịch</h1>
//       <div className="card p-5 space-y-4">
//         <input className="input" placeholder="Tiêu đề" />
//         <textarea className="input" rows="4" placeholder="Nội dung..." />
//         <div className="flex justify-end">
//           <button className="btn-primary">Gửi</button>
//         </div>
//       </div>
//     </div>
//   );
// }
