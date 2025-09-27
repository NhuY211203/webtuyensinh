import { useState } from "react";

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5">
        {children}
        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffAssign() {
  const experts = [
    { name: "Chuyên gia A", skills: "CNTT, ĐGNL", load: 2 },
    { name: "Chuyên gia B", skills: "Kinh tế, Học bổng", load: 3 },
  ];

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(experts[0].name);
  const [reqId, setReqId] = useState("REQ-001");

  const confirm = () => {
    console.log("Giao", reqId, "cho", selected);
    setOpen(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Phân công chuyên gia</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {experts.map((e,i)=>(
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{e.name}</div>
              <div className="text-sm text-gray-500">{e.skills}</div>
              <div className="text-sm mt-1">{e.load} lịch</div>
            </div>
            <button onClick={()=>{setSelected(e.name); setOpen(true);}}
                    className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700">
              Giao việc
            </button>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={()=>setOpen(false)}>
        <h3 className="text-lg font-semibold mb-3">Giao việc cho {selected}</h3>
        <div className="space-y-3">
          <label className="block text-sm">Chọn yêu cầu</label>
          <select value={reqId} onChange={e=>setReqId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500">
            <option>REQ-001 — Chọn ngành CNTT</option>
            <option>REQ-002 — Học bổng</option>
          </select>
        </div>
        <div className="mt-4 text-right">
          <button onClick={confirm} className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700">Xác nhận</button>
        </div>
      </Modal>
    </div>
  );
}


// export default function StaffAssign() {
//   const experts = [
//     { name: "Chuyên gia A", skills: "CNTT, ĐGNL", load: "2 lịch" },
//     { name: "Chuyên gia B", skills: "Kinh tế, Học bổng", load: "3 lịch" }
//   ];
//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-4">Phân công chuyên gia</h1>
//       <div className="grid md:grid-cols-2 gap-4">
//         {experts.map((e,i)=>(
//           <div key={i} className="card p-4 flex items-center justify-between">
//             <div>
//               <div className="font-medium">{e.name}</div>
//               <div className="text-sm text-gray-500">{e.skills}</div>
//               <div className="text-sm mt-1">{e.load}</div>
//             </div>
//             <button className="btn-primary">Giao việc</button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
