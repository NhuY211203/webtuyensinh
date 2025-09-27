import { useMemo, useState } from "react";

export default function ManagerLogs() {
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [logs] = useState([
    { time:"2024-06-20T10:30", text:"Cập nhật dữ liệu ngành", actor:"staff@example.com" },
    { time:"2024-06-20T10:12", text:"User đăng nhập", actor:"bao@example.com" },
  ]);

  const filtered = useMemo(()=>{
    return logs.filter(l=>{
      const okQ = l.text.toLowerCase().includes(query.toLowerCase()) || l.actor.toLowerCase().includes(query.toLowerCase());
      const t = new Date(l.time).getTime();
      const okFrom = from ? t >= new Date(from).getTime() : true;
      const okTo   = to   ? t <= new Date(to).getTime()   : true;
      return okQ && okFrom && okTo;
    });
  }, [logs, query, from, to]);

  const exportCSV = () => {
    const header = "time,text,actor\n";
    const body = filtered.map(l=>`${l.time},${l.text},${l.actor}`).join("\n");
    const blob = new Blob([header+body], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "logs.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Nhật ký hệ thống</h1>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input className="rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500"
               placeholder="Tìm nội dung/người thực hiện…" value={query} onChange={e=>setQuery(e.target.value)} />
        <input type="datetime-local" value={from} onChange={e=>setFrom(e.target.value)}
               className="rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500" />
        <input type="datetime-local" value={to} onChange={e=>setTo(e.target.value)}
               className="rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500" />
        <button onClick={exportCSV} className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700">Xuất CSV</button>
      </div>

      <div className="space-y-3">
        {filtered.map((l, idx)=>(
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{l.text}</div>
              <div className="text-sm text-gray-500">{new Date(l.time).toLocaleString()} • {l.actor}</div>
            </div>
          </div>
        ))}
        {!filtered.length && <div className="text-gray-500">Không có bản ghi.</div>}
      </div>
    </div>
  );
}


// export default function ManagerLogs() {
//   const logs = [
//     { time: "10:12 20/06", action: "User đăng nhập", by: "bao@example.com" },
//     { time: "10:30 20/06", action: "Cập nhật dữ liệu ngành", by: "staff@example.com" }
//   ];
//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-4">Nhật ký hệ thống</h1>
//       <div className="card">
//         <ul className="divide-y">
//           {logs.map((l,i)=>(
//             <li key={i} className="p-4 flex items-center justify-between">
//               <div>
//                 <div className="font-medium">{l.action}</div>
//                 <div className="text-sm text-gray-500">{l.time}</div>
//               </div>
//               <div className="text-sm text-gray-600">{l.by}</div>
//             </li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// }
