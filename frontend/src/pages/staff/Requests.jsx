
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

export default function StaffRequests() {
  const [rows, setRows] = useState([
    { id: "REQ-001", user: "Trần N.", topic: "Chọn ngành CNTT", preferred: "Chiều nay", status: "Chờ xử lý" },
    { id: "REQ-002", user: "Lê Q.", topic: "Học bổng", preferred: "Sáng mai", status: "Đã phân công" }
  ]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [resOpen, setResOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [expert, setExpert] = useState("Chuyên gia A");
  const [slot, setSlot] = useState("10:00 22/06");

  const openAssign = (r) => { setCurrent(r); setAssignOpen(true); };
  const openReschedule = (r) => { setCurrent(r); setResOpen(true); };

  const confirmAssign = () => {
    setRows(prev => prev.map(r => r.id === current.id ? { ...r, status: `Đã phân công (${expert})` } : r));
    setAssignOpen(false);
  };

  const confirmReschedule = () => {
    setRows(prev => prev.map(r => r.id === current.id ? { ...r, preferred: slot } : r));
    setResOpen(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Yêu cầu tư vấn</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3 text-left">Mã</th>
              <th className="p-3 text-left">Người yêu cầu</th>
              <th className="p-3 text-left">Chủ đề</th>
              <th className="p-3 text-left">Ưu tiên</th>
              <th className="p-3 text-center">Trạng thái</th>
              <th className="p-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.id}</td>
                <td className="p-3">{r.user}</td>
                <td className="p-3">{r.topic}</td>
                <td className="p-3">{r.preferred}</td>
                <td className="p-3 text-center">{r.status}</td>
                <td className="p-3 text-center space-x-2">
                  <button
                    onClick={() => openAssign(r)}
                    className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100"
                  >
                    Phân công
                  </button>
                  <button
                    onClick={() => openReschedule(r)}
                    className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    Đổi lịch
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal phân công */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)}>
        <h3 className="text-lg font-semibold mb-3">Phân công chuyên gia cho {current?.id}</h3>
        <div className="space-y-3">
          <label className="block text-sm">Chọn chuyên gia</label>
          <select value={expert} onChange={e=>setExpert(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500">
            <option>Chuyên gia A (CNTT)</option>
            <option>Chuyên gia B (Kinh tế)</option>
            <option>Chuyên gia C (Học bổng)</option>
          </select>
        </div>
        <div className="mt-4 text-right">
          <button onClick={confirmAssign} className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700">Xác nhận</button>
        </div>
      </Modal>

      {/* Modal đổi lịch */}
      <Modal open={resOpen} onClose={() => setResOpen(false)}>
        <h3 className="text-lg font-semibold mb-3">Đổi lịch cho {current?.id}</h3>
        <input
          value={slot}
          onChange={e=>setSlot(e.target.value)}
          placeholder="VD: 09:00 24/06"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500"
        />
        <div className="mt-4 text-right">
          <button onClick={confirmReschedule} className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700">Lưu</button>
        </div>
      </Modal>
    </div>
  );
}

// export default function StaffRequests() {
//   const requests = [
//     { id: "REQ-001", user: "Trần N.", topic: "Chọn ngành CNTT", preferred: "Chiều nay", status: "Chờ xử lý" },
//     { id: "REQ-002", user: "Lê Q.", topic: "Học bổng", preferred: "Sáng mai", status: "Đã phân công" }
//   ];
//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-4">Yêu cầu tư vấn</h1>
//       <div className="card overflow-hidden">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-50 text-gray-600">
//             <tr><th className="p-3 text-left">Mã</th><th className="p-3 text-left">Người yêu cầu</th><th className="p-3 text-left">Chủ đề</th><th className="p-3 text-left">Ưu tiên</th><th className="p-3 text-center">Trạng thái</th><th className="p-3 text-center">Hành động</th></tr>
//           </thead>
//           <tbody>
//             {requests.map(r => (
//               <tr key={r.id} className="border-t">
//                 <td className="p-3">{r.id}</td>
//                 <td className="p-3">{r.user}</td>
//                 <td className="p-3">{r.topic}</td>
//                 <td className="p-3">{r.preferred}</td>
//                 <td className="p-3 text-center">{r.status}</td>
//                 <td className="p-3 text-center">
//                   <button className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 mr-2">Phân công</button>
//                   <button className="px-3 py-1 rounded-full bg-gray-100">Đổi lịch</button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
