export default function ManagerReports() {
  const download = (name) => {
    const blob = new Blob([`Báo cáo giả lập: ${name}`], {type:"text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${name}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const items = [
    { title: "Báo cáo hồ sơ tháng 6", date: "30/06/2024" },
    { title: "Tổng hợp giao dịch Q2", date: "01/07/2024" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Báo cáo</h1>
      <div className="space-y-4">
        {items.map((r,i)=>(
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.title}</div>
              <div className="text-sm text-gray-500">{r.date}</div>
            </div>
            <button onClick={()=>download(r.title)} className="px-5 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700">Tải</button>
          </div>
        ))}
      </div>
    </div>
  );
}


// export default function ManagerReports() {
//   const rows = [
//     { name: "Báo cáo hồ sơ tháng 6", date: "30/06/2024", link: "#" },
//     { name: "Tổng hợp giao dịch Q2", date: "01/07/2024", link: "#" }
//   ];
//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-4">Báo cáo</h1>
//       <div className="grid gap-3">
//         {rows.map((r,i)=>(
//           <div key={i} className="card p-4 flex items-center justify-between">
//             <div>
//               <div className="font-medium">{r.name}</div>
//               <div className="text-sm text-gray-500">{r.date}</div>
//             </div>
//             <a className="btn-primary" href={r.link}>Tải</a>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
