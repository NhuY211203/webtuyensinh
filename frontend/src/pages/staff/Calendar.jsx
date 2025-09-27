import { useState } from "react";

const MOCK = {
  4: [{ time: "09:00", title: "Tư vấn CNTT - REQ-001" }],
  13:[{ time: "14:00", title: "Học bổng - REQ-002"}],
  21:[{ time: "10:30", title: "ĐGNL - REQ-003"}],
};

export default function StaffCalendar() {
  const days = ["T2","T3","T4","T5","T6","T7","CN"];
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Lịch hệ thống</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-7 gap-2 text-center mb-2">
          {days.map(d => <div key={d} className="text-sm text-gray-500">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(28)].map((_,i)=>(
            <button
              key={i}
              onClick={()=>setSelected(i+1)}
              className={`h-20 rounded-xl border flex items-center justify-center
              ${MOCK[i+1] ? "border-teal-300 bg-teal-50 text-teal-700" : "border-gray-200 bg-white text-gray-700"}
              hover:bg-teal-700/10`}
            >
              {i+1}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Sự kiện ngày {selected}</h3>
            <button onClick={()=>setSelected(null)} className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200">Đóng</button>
          </div>
          <div className="mt-3 space-y-2">
            {(MOCK[selected] || []).map((ev,idx)=>(
              <div key={idx} className="p-3 rounded-xl border border-gray-200 flex items-center justify-between">
                <div><span className="font-medium">{ev.time}</span> — {ev.title}</div>
                <div className="space-x-2">
                  <button className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200">Đổi lịch</button>
                  <button className="px-3 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100">Huỷ</button>
                </div>
              </div>
            ))}
            {!(MOCK[selected]?.length) && <div className="text-gray-500">Không có lịch.</div>}
          </div>
        </div>
      )}
    </div>
  );
}


// export default function StaffCalendar() {
//   const days = ["T2","T3","T4","T5","T6","T7","CN"];
//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-4">Lịch hệ thống</h1>
//       <div className="card p-5">
//         <div className="grid grid-cols-7 gap-2 text-center">
//           {days.map(d => <div key={d} className="text-sm text-gray-500">{d}</div>)}
//           {[...Array(28)].map((_,i)=>(
//             <div key={i} className="h-20 rounded-xl bg-gray-50 border flex items-center justify-center text-gray-500">{i+1}</div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
