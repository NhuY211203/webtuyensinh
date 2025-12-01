import { useEffect, useMemo, useState } from "react";

const STATUS_BADGES = {
  1: { label: "Trống", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  2: { label: "Đã đặt", color: "bg-blue-100 text-blue-800 border-blue-200" },
  3: { label: "Đã hủy", color: "bg-rose-100 text-rose-800 border-rose-200" },
  4: { label: "Hoàn thành", color: "bg-gray-200 text-gray-700 border-gray-300" },
};

const defaultBadge = { label: "Khác", color: "bg-slate-100 text-slate-700 border-slate-200" };

const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

const formatDate = (date) => date.toISOString().split("T")[0];

export default function ConsultantCalendar() {
  const [consultants, setConsultants] = useState([]);
  const [selectedConsultant, setSelectedConsultant] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [scheduleMap, setScheduleMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detailDay, setDetailDay] = useState(null);

  // load consultants
  useEffect(() => {
    async function loadConsultants() {
      try {
        const res = await fetch("http://localhost:8000/api/staff/consultants?perPage=1000&page=1");
        const json = await res.json();
        if (json.success) {
          const list = Array.isArray(json.data) ? json.data : (json.data?.data || []);
          setConsultants(list);
          if (list.length && !selectedConsultant) {
            setSelectedConsultant(String(list[0].idnguoidung || list[0].id || list[0].idConsultant));
          }
        }
      } catch (err) {
        console.error("Failed to load consultants", err);
      }
    }
    loadConsultants();
  }, [selectedConsultant]);

  // load schedules
  useEffect(() => {
    async function loadSchedules() {
      if (!selectedConsultant) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          consultant_id: selectedConsultant,
          per_page: 500,
          page: 1,
          date_from: formatDate(currentMonth),
          date_to: formatDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)),
        });
        const res = await fetch(`http://localhost:8000/api/consultation-schedules/all?${params.toString()}`);
        const json = await res.json();
         if (json.success) {
           const map = {};
           (json.data || []).forEach((item) => {
             const dateStr = (item.ngayhen || item.date)?.split("T")[0];
             if (!dateStr) return;
             if (!map[dateStr]) map[dateStr] = [];

             const studentInfo = item.nguoiDat || {};

             map[dateStr].push({
               time: `${item.giobatdau?.slice(0, 5) || "--:--"} - ${item.ketthuc?.slice(0, 5) || "--:--"}`,
               status: item.trangthai || item.status,
               note: item.tieude || item.noidung || item.tieu_de || "",
               student: studentInfo.hoten || "",
               studentEmail: studentInfo.email || "",
               // hiện tại API không trả số điện thoại người đặt trong getAllConsultationSchedules
               studentPhone: "",
             });
           });
           setScheduleMap(map);
        } else {
          setScheduleMap({});
          setError(json.message || "Không tải được dữ liệu lịch tư vấn");
        }
      } catch (err) {
        console.error(err);
        setError("Lỗi kết nối máy chủ");
        setScheduleMap({});
      } finally {
        setLoading(false);
      }
    }
    loadSchedules();
  }, [selectedConsultant, currentMonth]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = [];
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // filler for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        dateStr: formatDate(date),
        schedules: scheduleMap[formatDate(date)] || [],
      });
    }
    return days;
  }, [currentMonth, scheduleMap]);

  const gotoPrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const gotoNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const renderDayCell = (dayData, idx) => {
    if (!dayData) {
      return <div key={`empty-${idx}`} className="rounded-2xl bg-slate-50 border border-slate-100" />;
    }
    const labelClass = dayData.date.getDay() === 0 ? "text-rose-600" : "text-slate-700";
    return (
      <div
        key={dayData.dateStr}
        className="rounded-2xl border border-slate-200 bg-white p-3 flex flex-col gap-2 min-h-[150px]"
        onClick={() => dayData.schedules.length && setDetailDay(dayData)}
        role="button"
        tabIndex={0}
      >
        <div className={`text-sm font-semibold ${labelClass}`}>{dayData.date.getDate()}</div>
        {dayData.schedules.length === 0 ? (
          <div className="text-xs text-slate-400">Không có lịch</div>
        ) : (
          <div className="space-y-2 overflow-y-auto">
            {dayData.schedules.map((slot, index) => {
              const badge = STATUS_BADGES[slot.status] || defaultBadge;
              return (
                <div
                  key={`${dayData.dateStr}-${index}`}
                  className={`rounded-xl border px-2 py-1 text-xs ${badge.color}`}
                >
                  <div className="font-semibold">{slot.time}</div>
                  {slot.student && <div>{slot.student}</div>}
                  {slot.note && <div className="italic text-[11px] opacity-80">{slot.note}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-sm font-medium text-slate-500 block mb-1">Chọn chuyên gia</label>
          <select
            value={selectedConsultant}
            onChange={(e) => setSelectedConsultant(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2 min-w-[220px] focus:ring-2 focus:ring-teal-500"
          >
            {consultants.map((consultant) => (
              <option
                key={consultant.idnguoidung || consultant.id}
                value={consultant.idnguoidung || consultant.id}
              >
                {consultant.hoten || consultant.name || consultant.email}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 items-center ml-auto">
          <button
            onClick={gotoPrevMonth}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            ← Tháng trước
          </button>
          <div className="font-semibold">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          <button
            onClick={gotoNextMonth}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            Tháng sau →
          </button>
        </div>
      </div>

      <div className="flex gap-4 text-xs">
        {Object.entries(STATUS_BADGES).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded border ${value.color.split(" ").slice(-1)}`} />
            <span>{value.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">
          Đang tải lịch tư vấn...
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {dayNames.map((name) => (
            <div key={name} className="text-center text-xs font-semibold text-slate-500">
              {name}
            </div>
          ))}
          {daysInMonth.map((day, idx) => renderDayCell(day, idx))}
        </div>
      )}

      {detailDay && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500">Chi tiết lịch tư vấn</p>
                <h3 className="text-xl font-semibold text-slate-900">
                  {detailDay.dateStr} • {detailDay.schedules.length} ca
                </h3>
              </div>
              <button
                onClick={() => setDetailDay(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold"
              >
                Đóng
              </button>
            </div>
            <div className="space-y-3">
              {detailDay.schedules.map((slot, index) => {
                const badge = STATUS_BADGES[slot.status] || defaultBadge;
                return (
                  <div
                    key={`${detailDay.dateStr}-detail-${index}`}
                    className={`border rounded-2xl px-4 py-3 ${badge.color} flex flex-col gap-1`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{slot.time}</span>
                      <span className="text-xs uppercase tracking-wide">{badge.label}</span>
                    </div>
                     {slot.student && (
                       <div className="text-sm">
                         <span className="font-medium">Thí sinh:</span> {slot.student}
                       </div>
                     )}
                     {slot.studentEmail && (
                       <div className="text-xs opacity-80">
                         Email: {slot.studentEmail}
                       </div>
                     )}
                     {slot.studentPhone && (
                       <div className="text-xs opacity-80">
                         Điện thoại: {slot.studentPhone}
                       </div>
                     )}
                     {slot.note && (
                       <div className="text-sm">
                         <span className="font-medium">Nội dung:</span> {slot.note}
                       </div>
                     )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

