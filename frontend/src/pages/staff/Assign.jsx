import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../services/api";

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 border border-gray-200">
        {children}
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function Drawer({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl p-6 overflow-y-auto border-l border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Chi tiết slot</h3>
          <button onClick={onClose} className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors">
            ✕ Đóng
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const statusMeta = {
  1: { label: "Chờ duyệt", color: "bg-amber-100 text-amber-700" }, // 1 = chờ duyệt
  2: { label: "Đã duyệt", color: "bg-green-100 text-green-700" }, // 2 = đã duyệt
  3: { label: "Từ chối", color: "bg-red-100 text-red-700" }, // 3 = từ chối
};

const methods = ["Google Meet", "Zoom", "Trực tiếp"];

const quarters = [
  { q: "Q1", months: [0, 1, 2] }, // Jan, Feb, Mar (0-indexed for JS Date)
  { q: "Q2", months: [3, 4, 5] }, // Apr, May, Jun
  { q: "Q3", months: [6, 7, 8] }, // Jul, Aug, Sep
  { q: "Q4", months: [9, 10, 11] }, // Oct, Nov, Dec
];

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export default function StaffAssign() {
  // Reference data from API
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState("");

  const [consultantsGrouped, setConsultantsGrouped] = useState([]);
  const [consultantsLoading, setConsultantsLoading] = useState(false);
  const [consultantsError, setConsultantsError] = useState("");

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  // Filters (must be declared before effects using it)
  const thisYear = new Date().getFullYear();
  const currentQuarter = "Q" + (Math.floor(new Date().getMonth() / 3) + 1);
  const [filter, setFilter] = useState({
    quarter: currentQuarter,
    year: thisYear,
    month: "",
    groupId: "",
    advisorId: "",
    status: "",
    method: "",
    onlyValid: false,
    view: "list", // list | calendar
    search: "",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setGroupsLoading(true);
        const res = await api.getMajorGroups(); // GET /api/nhomnganh
        const items = Array.isArray(res?.data) ? res.data : res; // backend returns {success, data: []}
        const mapped = (items || []).map((g) => ({ id: g.id ?? g.idnhomnganh, name: g.name ?? g.tennhom }));
        if (mounted) setGroups(mapped);
      } catch (e) {
        if (mounted) setGroupsError("Không tải được nhóm ngành");
      } finally {
        if (mounted) setGroupsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Khi đổi quý, nếu tháng hiện tại không thuộc quý mới thì reset tháng
  useEffect(() => {
    const months = (quarters.find((q) => q.q === filter.quarter)?.months ?? [0,1,2,3,4,5,6,7,8,9,10,11]).map((m) => m + 1);
    if (filter.month && !months.includes(Number(filter.month))) {
      setFilter((f) => ({ ...f, month: "" }));
    }
  }, [filter.quarter]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setConsultantsLoading(true);
        const res = await api.getConsultantsGroupedByMajor(); // GET /api/consultants-grouped
        const items = Array.isArray(res?.data) ? res.data : res; // backend returns {success, data: []}
        if (mounted) setConsultantsGrouped(items || []);
      } catch (e) {
        if (mounted) setConsultantsError("Không tải được tư vấn viên");
      } finally {
        if (mounted) setConsultantsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch schedules when filters change
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setSlotsLoading(true);
        const params = {
          // Không gửi quarter lên API để tránh backend chỉ trả về 1 tháng;
          // ta sẽ lọc theo quý ở client
          year: filter.year || undefined,
          month: filter.month || undefined,
          groupId: filter.groupId || undefined,
          advisorId: filter.advisorId || undefined,
          status: filter.status || undefined,
          method: filter.method || undefined,
          onlyValid: filter.onlyValid,
          search: filter.search || undefined,
        };
        
        // Clean undefined values
        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== undefined)
        );
        
        // Luôn gọi một lần; lọc theo quý sẽ thực hiện phía client
        const res = await api.getConsultationSchedulesForApproval(cleanParams);
        const items = Array.isArray(res?.data) ? res.data : res; // backend returns {success, data: []}
        // Normalize fields for consistent types used by UI
        const normalized = (items || []).map((s) => {
          const id = Number(s.id ?? s.idlichtuvan ?? s.slotId ?? s.lichtuvan_id);
          const advisorId = Number(s.advisorId ?? s.idnguoidung ?? s.tuvanvien_id ?? s.tuvanvien);
          const advisorName = s.advisorName ?? s.tuvanvienName ?? s.tuvanvien?.hoten ?? s.nguoiDung?.hoten ?? s.ten_tvv;
          const groupId = Number(s.groupId ?? s.nhomNganhId ?? s.idnhomnganh);
          const groupName = s.groupName ?? s.nhomNganhName ?? s.tennhom ?? s.group?.name;
          const date = (s.date ?? s.ngayhen ?? '').toString().slice(0, 10);
          const start = s.start ?? s.giobatdau ?? s.start_time;
          const end = s.end ?? s.ketthuc ?? s.end_time;
          const method = s.method ?? s.molavande ?? s.hinhthuc ?? s.hinh_thuc;
          const note = s.note ?? s.noidung ?? s.ghichu;
          const approverId = Number(s.approverId ?? s.idnguoiduyet ?? s.nguoi_duyet_id);
          const approverName = s.approverName ?? s.nguoiDuyet?.hoten ?? s.ten_nguoi_duyet;
          const approvedAt = s.approvedAt ?? s.ngayduyet ?? s.approved_at;
          return {
            ...s,
            id,
            advisorId,
            advisorName,
            groupId,
            groupName,
            date,
            start,
            end,
            method,
            note,
            approverId,
            approverName,
            approvedAt,
            duyetlich: Number(s.duyetlich ?? s.status ?? 1),
          };
        });
        // Loại bỏ trùng theo id
        const byId = new Map();
        normalized.forEach((it) => { if (!byId.has(it.id)) byId.set(it.id, it); });
        const unique = Array.from(byId.values());
        console.log('Loaded slots:', unique);
        if (mounted) setSlots(unique);
      } catch (e) {
        console.error('Error fetching consultation schedules:', e);
        console.error('Error details:', e.message, e.stack);
        if (mounted) setSlotsError("Không tải được lịch tư vấn: " + e.message);
      } finally {
        if (mounted) setSlotsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [filter]);

  // Build a flat index advisorId -> groupId to validate selection
  const advisorIdToGroupId = useMemo(() => {
    const map = new Map();
    consultantsGrouped.forEach((grp) => {
      grp.consultants.forEach((c) => map.set(String(c.id), c.groupId));
    });
    return map;
  }, [consultantsGrouped]);

  // When group changes, if current advisor doesn't belong, reset advisor
  useEffect(() => {
    if (!filter.advisorId) return;
    const g = advisorIdToGroupId.get(String(filter.advisorId));
    if (filter.groupId && g && Number(filter.groupId) !== Number(g)) {
      setFilter((f) => ({ ...f, advisorId: "" }));
    }
  }, [filter.groupId, filter.advisorId, advisorIdToGroupId]);

  // Consultants filtered by selected group (keep optgroups for readability)
  const consultantsGroupedFiltered = useMemo(() => {
    if (!filter.groupId) return consultantsGrouped;
    const target = Number(filter.groupId);
    return consultantsGrouped
      .map((grp) => ({
        groupName: grp.groupName,
        consultants: grp.consultants.filter((c) => Number(c.groupId) === target),
      }))
      .filter((grp) => grp.consultants.length > 0);
  }, [consultantsGrouped, filter.groupId]);

  // Selection for bulk approve
  const [selectedIds, setSelectedIds] = useState([]);

  // Drawer state
  const [openDrawer, setOpenDrawer] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);

  // Approve/Reject modal
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'approve'|'reject', ids: number[] }
  const [rejectNote, setRejectNote] = useState("");

  // Simple toast
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Loading state for bulk operations
  const [bulkLoading, setBulkLoading] = useState(false);

  // Undo queue (id -> timeout id and prev state)
  const undoMapRef = useRef(new Map());

  const quarterMonths = useMemo(() => {
    if (!filter.quarter) return [0,1,2,3,4,5,6,7,8,9,10,11];
    return quarters.find((q) => q.q === filter.quarter)?.months || [];
  }, [filter.quarter]);

  function parseDateTime(dateStr, timeStr) {
    const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
    const [hh, mm] = timeStr.split(":").map((n) => parseInt(n, 10));
    return new Date(y, m - 1, d, hh, mm);
  }

  // Compute conflicts map by advisor within approved slots (status 2)
  const conflictInfo = useMemo(() => {
    const byAdvisor = new Map();
    slots.forEach((s) => {
      const key = s.advisorId + "|" + s.date;
      if (!byAdvisor.has(key)) byAdvisor.set(key, []);
      byAdvisor.get(key).push(s);
    });
    const slotIdToConflicts = new Map();
    byAdvisor.forEach((arr) => {
      arr
        .slice()
        .sort((a, b) => (a.start < b.start ? -1 : 1))
        .forEach((s, i) => {
          const sStart = parseDateTime(s.date, s.start);
          const sEnd = parseDateTime(s.date, s.end);
          for (let j = 0; j < arr.length; j++) {
            if (i === j) continue;
            const o = arr[j];
            if (o.duyetlich !== 2 && s.duyetlich !== 2) continue; // conflicts checked against approved and target
            const oStart = parseDateTime(o.date, o.start);
            const oEnd = parseDateTime(o.date, o.end);
            if (overlaps(sStart, sEnd, oStart, oEnd)) {
              if (!slotIdToConflicts.has(s.id)) slotIdToConflicts.set(s.id, []);
              slotIdToConflicts.get(s.id).push(o.id);
            }
          }
        });
    });
    return slotIdToConflicts; // Map<slotId, number[]>
  }, [slots]);

  // Filtering
  const filtered = useMemo(() => {
    const now = new Date();
    const result = slots.filter((s) => {
      const d = new Date(s.date);
      if (filter.year && d.getFullYear() !== Number(filter.year)) return false;
      if (filter.quarter && !quarterMonths.includes(d.getMonth())) return false; // quarterMonths đã bao phủ 12 tháng khi để trống
      if (filter.month && (d.getMonth() + 1) !== Number(filter.month)) return false;
      if (filter.groupId && Number(filter.groupId) !== s.groupId) return false;
      if (filter.advisorId && Number(filter.advisorId) !== s.advisorId) return false;
      if (filter.status !== "" && Number(filter.status) !== s.duyetlich) return false;
      if (filter.method && filter.method !== s.method) return false;
      if (filter.onlyValid) {
        const end = parseDateTime(s.date, s.end);
        if (end < now) return false;
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const hay = `${s.advisorName} ${s.groupName} ${s.method} ${s.note}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return result;
  }, [slots, filter, quarterMonths]);

  const stats = useMemo(() => {
    const counters = { pending: 0, approved: 0, rejected: 0 };
    filtered.forEach((s) => {
      if (s.duyetlich === 1) {
        counters.pending++;
      } else if (s.duyetlich === 2) {
        counters.approved++;
      } else if (s.duyetlich === 3) {
        counters.rejected++;
      }
    });
    const conflicts = filtered.reduce((acc, s) => acc + (conflictInfo.get(s.id)?.length ? 1 : 0), 0);
    return { ...counters, conflicts };
  }, [filtered, conflictInfo]);

  function toggleSelected(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSelectAll(ids) {
    const allSelected = ids.every((id) => selectedIds.includes(id));
    if (allSelected) setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    else setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
  }

  function canApprove(slot) {
    console.log('canApprove checking slot:', { id: slot.id, duyetlich: slot.duyetlich, date: slot.date, end: slot.end });
    
    // Check if slot is pending approval (duyetlich = 1 means pending, 2 means approved, 3 means rejected)
    const status = Number(slot.duyetlich);
    if (status !== 1) {
      const statusText = status === 2 ? 'đã duyệt' : status === 3 ? 'đã từ chối' : 'không xác định';
      return { ok: false, reason: `Slot đã được xử lý (${statusText})` };
    }
    
    // Check if not expired
    const now = new Date();
    const end = parseDateTime(slot.date, slot.end);
    if (end < now) return { ok: false, reason: "Slot đã hết hạn" };
    
    // Check for conflicts
    const conflicts = conflictInfo.get(slot.id) || [];
    if (conflicts.length > 0) return { ok: false, reason: `Xung đột với slot #${conflicts.join(",")}` };
    
    return { ok: true };
  }

  async function approveSlots(ids, note = "") {
    console.log('approveSlots called with:', { ids, note });
    
    const admin = { id: 1, name: "Admin" };
    const updates = [];
    const skipped = [];
    const validIds = [];
    
    ids.forEach((id) => {
      const slot = slots.find((s) => s.id === id);
      console.log('Checking slot:', { id, slot });
      if (!slot) {
        console.log('Slot not found for id:', id);
        return;
      }
      const check = canApprove(slot);
      console.log('Can approve check:', { id, check, slotStatus: slot.duyetlich });
      if (!check.ok) {
        console.log('Slot cannot be approved:', { id, reason: check.reason });
        skipped.push({ id, reason: check.reason });
        return;
      }
      const prev = { ...slot };
      updates.push({ id, prev });
      validIds.push(id);
      console.log('Slot added to valid list:', id);
    });

    if (updates.length === 0) {
      console.log('No valid slots to approve');
      return { updated: 0, skipped };
    }

    // Call API to approve schedules
    setBulkLoading(true);
    console.log('Approving schedules:', { validIds, note });
    
    try {
      console.log('Calling API...', { validIds, action: 'approve', note });
      const res = await api.approveConsultationSchedule(validIds, 'approve', note);
      console.log('API response:', res);
      
        if (res.success) {
        console.log('API success, updating local state');
          // Update local state
          setSlots((prev) => prev.map((s) => (
            validIds.includes(s.id)
              ? {
                  ...s,
                  duyetlich: 2,
                  approverId: admin.id,
                  approverName: admin.name,
                  approvedAt: new Date().toISOString(),
                  approveNote: note || s.approveNote,
                }
              : s
          )));

          // Schedule undo
          updates.forEach(({ id, prev }) => {
            if (undoMapRef.current.has(id)) clearTimeout(undoMapRef.current.get(id).timer);
            const timer = setTimeout(() => undoMapRef.current.delete(id), 5 * 60 * 1000);
            undoMapRef.current.set(id, { prev, timer });
          });

        setToast({ 
          type: "success", 
          msg: `✅ Duyệt ${updates.length} slot thành công${skipped.length > 0 ? `, bỏ qua ${skipped.length} slot` : ''}` 
        });
      } else {
        console.error('API returned error:', res);
        setToast({ type: "error", msg: `❌ Lỗi từ server: ${res.message || 'Không xác định'}` });
      }
    } catch (e) {
      console.error('API error:', e);
        setToast({ type: "error", msg: `❌ Lỗi khi duyệt: ${e.message}` });
    } finally {
      setBulkLoading(false);
    }

    return { updated: updates.length, skipped };
  }

  async function rejectSlots(ids, note) {
    const admin = { id: 1, name: "Admin" };
    const updates = [];
    ids.forEach((id) => {
      const slot = slots.find((s) => s.id === id);
      if (!slot) return;
      const prev = { ...slot };
      updates.push({ id, prev });
    });

    if (updates.length === 0) return { updated: 0 };

    // Call API to reject schedules
    setBulkLoading(true);
    console.log('Rejecting schedules:', { ids, note });
    
    try {
      const res = await api.approveConsultationSchedule(ids, 'reject', note);
      console.log('Reject API response:', res);
      
        if (res.success) {
          // Update local state
          setSlots((prev) =>
            prev.map((s) => {
              if (ids.includes(s.id)) {
                return {
                  ...s,
                  duyetlich: 3, // 3 = từ chối
                  approverId: admin.id,
                  approverName: admin.name,
                  approvedAt: new Date().toISOString(),
                  approveNote: note || s.approveNote,
                };
              }
              return s;
            })
          );

          updates.forEach(({ id, prev }) => {
            if (undoMapRef.current.has(id)) clearTimeout(undoMapRef.current.get(id).timer);
            const timer = setTimeout(() => undoMapRef.current.delete(id), 5 * 60 * 1000);
            undoMapRef.current.set(id, { prev, timer });
          });

          setToast({ type: "error", msg: `❌ Đã từ chối ${updates.length} slot` });
      } else {
        setToast({ type: "error", msg: `❌ Lỗi từ server: ${res.message || 'Không xác định'}` });
        }
    } catch (e) {
      console.error('Reject API error:', e);
        setToast({ type: "error", msg: `❌ Lỗi khi từ chối: ${e.message}` });
    } finally {
      setBulkLoading(false);
    }

    return { updated: updates.length };
  }

  function undo(id) {
    const record = undoMapRef.current.get(id);
    if (!record) return;
    clearTimeout(record.timer);
    setSlots((prev) => prev.map((s) => (s.id === id ? record.prev : s)));
    undoMapRef.current.delete(id);
    setToast({ type: "info", msg: `⤺ Đã hoàn tác slot #${id}` });
  }

  function openDetails(slot) {
    setActiveSlot(slot);
    setOpenDrawer(true);
  }

  // Calendar helpers (ưu tiên tháng đã chọn; nếu không có thì lấy tháng đầu của quý hoặc tháng hiện tại)
  const calendarMonthIndex = (filter.month ? Number(filter.month) - 1 : (quarterMonths[0] ?? new Date().getMonth()));
  const firstDay = new Date(filter.year, calendarMonthIndex, 1);
  const daysInMonth = new Date(filter.year, calendarMonthIndex + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => new Date(filter.year, calendarMonthIndex, i + 1));

  const filteredIds = filtered.map((s) => s.id);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[14px] leading-[20px]">
      <style>{`
        /* Design System Variables - Updated to match n.md */
        :root { 
          --brand-600: #147A7E;
          --brand-500: #17979C;
          --brand-100: #DFF6F7;
          --primary-600: #147A7E;
          --primary-700: #0F6A6D;
          --accent-500: #FFB74D;
          --success: #16A34A;
          --warning: #D97706;
          --danger: #DC2626;
          --info: #2563EB;
          --neutral-900: #111827;
          --neutral-600: #6B7280;
          --neutral-200: #E5E7EB;
          --neutral-50: #F9FAFB;
        }
        
        /* Custom dropdown styling */
        select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
        }
        
        select option {
          padding: 8px 12px;
          font-size: 14px;
          color: #444;
        }
        
        select option:hover {
          background-color: #f5f5ff;
        }
        
        select optgroup {
          font-weight: 600;
          font-size: 13px;
          color: var(--primary-700);
          padding: 8px 0 4px 0;
          margin-top: 8px;
          border-top: 1px solid #eee;
        }
        
        select optgroup:first-child {
          border-top: none;
          margin-top: 0;
        }
        
        select option[class*="pl-6"] {
          padding-left: 24px;
        }
        
        /* Custom scrollbar for long dropdowns */
        select {
          max-height: 400px;
          overflow-y: auto;
        }
        
        select::-webkit-scrollbar {
          width: 6px;
        }
        
        select::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        select::-webkit-scrollbar-thumb {
          background: #c7c9e5;
          border-radius: 3px;
        }
        
        select::-webkit-scrollbar-thumb:hover {
          background: #a8aad1;
        }
        
        /* Sticky table header */
        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        /* Zebra striping */
        .zebra-row:nth-child(even) {
          background-color: var(--gray-50);
        }
        
        /* Badge color system */
        .badge-pending {
          background-color: #fef3c7;
          color: #92400e;
        }
        
        .badge-approved {
          background-color: #d1fae5;
          color: #065f46;
        }
        
        .badge-rejected {
          background-color: #fee2e2;
          color: #991b1b;
        }
        
        .badge-conflict {
          background-color: #dbeafe;
          color: #1e3a8a;
        }
        
        .chip-google-meet {
          background-color: #e0f2fe;
          color: #075985;
        }
        
        .chip-zoom {
          background-color: #e0e7ff;
          color: #3730a3;
        }
      `}</style>
      <div className="container mx-auto px-6 max-w-[640px] sm:max-w-[768px] md:max-w-[1024px] lg:max-w-[1280px] xl:max-w-[1280px] 2xl:max-w-[1280px] pt-6 pb-10 space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : toast.type === "error" ? "bg-red-50 text-red-800 border border-red-200" : "bg-blue-50 text-blue-800 border border-blue-200"}`}>
          {toast.msg}
        </div>
      )}

      {/* Filter Bar - Redesigned with responsive grid */}
      <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-gray-200 p-4">
        {/* Row 1: Time & Group Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Quý */}
          <div>
            <label className="block text-[12px] text-gray-600 mb-1">Quý</label>
            <select
              value={filter.quarter}
              onChange={(e) => setFilter((f) => ({ ...f, quarter: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-[14px] focus:ring-2 focus:ring-brand-100 focus:border-[var(--brand-600)] bg-white hover:bg-gray-50 transition-colors"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 8px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px',
                paddingRight: '32px'
              }}
            >
              <option value="">Tất cả</option>
              {quarters.map((q) => (
                <option key={q.q} value={q.q} className="py-2">{q.q}</option>
              ))}
            </select>
          </div>

          {/* Tháng trong quý */}
          <div>
            <label className="block text-[12px] text-gray-600 mb-1">Tháng</label>
            <select
              value={filter.month}
              onChange={(e) => setFilter((f) => ({ ...f, month: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-[14px] focus:ring-2 focus:ring-brand-100 focus:border-[var(--brand-600)] bg-white hover:bg-gray-50 transition-colors"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 8px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px',
                paddingRight: '32px'
              }}
            >
              <option value="">Tất cả</option>
              {(() => {
                const months = (quarters.find((q) => q.q === filter.quarter)?.months ?? [0,1,2,3,4,5,6,7,8,9,10,11]).map(m => m + 1);
                return months.map((m) => (
                  <option key={m} value={m}>{`Tháng ${m}`}</option>
                ));
              })()}
            </select>
          </div>
          
          {/* Năm */}
          <div>
            <label className="block text-[12px] text-gray-600 mb-1">Năm</label>
            <input
              type="number"
              value={filter.year}
              onChange={(e) => setFilter((f) => ({ ...f, year: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-[14px] focus:ring-2 focus:ring-brand-100 focus:border-[var(--brand-600)]"
            />
          </div>
          
          {/* Nhóm ngành */}
          <div>
            <label className="block text-[12px] text-gray-600 mb-1">Nhóm ngành</label>
            <select
              value={filter.groupId}
              onChange={(e) => setFilter((f) => ({ ...f, groupId: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-[14px] focus:ring-2 focus:ring-brand-100 focus:border-[var(--brand-600)] bg-white hover:bg-gray-50 transition-colors"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 8px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px',
                paddingRight: '32px'
              }}
            >
              <option value="">Tất cả</option>
              {groupsLoading && <option value="" disabled>Đang tải...</option>}
              {groupsError && <option value="" disabled>{groupsError}</option>}
              {groups.map((g) => (
                <option key={g.id} value={g.id} className="py-2">{g.name}</option>
              ))}
            </select>
          </div>
          
          {/* Tư vấn viên */}
          <div>
            <label className="block text-[12px] text-gray-600 mb-1">Tư vấn viên</label>
            <select
              value={filter.advisorId}
              onChange={(e) => setFilter((f) => ({ ...f, advisorId: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-[14px] focus:ring-2 focus:ring-brand-100 focus:border-[var(--brand-600)] bg-white hover:bg-gray-50 transition-colors"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 8px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px',
                paddingRight: '32px'
              }}
            >
              <option value="">Tất cả</option>
              {consultantsLoading && <option value="" disabled>Đang tải...</option>}
              {consultantsError && <option value="" disabled>{consultantsError}</option>}
              {consultantsGroupedFiltered.map((group) => (
                <optgroup key={group.groupName} label={group.groupName} className="font-semibold text-[#241e4e] text-[13px]">
                  {group.consultants.map((consultant) => (
                    <option key={consultant.id} value={consultant.id} className="text-[#444] text-[12.5px] py-2 pl-6 hover:bg-[#f5f5ff]">
                      👤 {consultant.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          
          {/* Nút Chế độ xem + Làm mới */}
          <div className="flex items-end">
            <div className="flex gap-2 w-full justify-end">
              <button
                onClick={() => setFilter((f) => ({ ...f, view: "list" }))}
                className={`h-10 px-4 rounded-lg text-[14px] font-medium transition-colors ${filter.view === "list" ? "bg-[var(--brand-600)] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                📋 Danh sách
              </button>
              <button
                onClick={() => setFilter((f) => ({ ...f, view: "calendar" }))}
                className={`h-10 px-4 rounded-lg text-[14px] font-medium transition-colors ${filter.view === "calendar" ? "bg-[var(--brand-600)] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                📅 Lịch
              </button>
              <button
                onClick={() => window.location.reload()}
                className="h-10 px-4 rounded-lg text-[14px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                title="Làm mới dữ liệu"
              >
                🔄
              </button>
            </div>
          </div>
        </div>
        
        {/* Row 2: Status, Method, Search & Checkbox */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
          {/* Trạng thái */}
          <div>
            <label className="block text-[12px] text-gray-600 mb-1">Trạng thái</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-[14px] focus:ring-2 focus:ring-brand-100 focus:border-[var(--brand-600)] bg-white hover:bg-gray-50 transition-colors"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 8px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px',
                paddingRight: '32px'
              }}
            >
              <option value="">Tất cả</option>
              <option value="1" className="py-2">⏰ Chờ duyệt</option>
              <option value="2" className="py-2">✅ Đã duyệt</option>
              <option value="3" className="py-2">❌ Từ chối</option>
            </select>
          </div>
          
          {/* Hình thức */}
          <div>
            <label className="block text-[12px] text-gray-600 mb-1">Hình thức</label>
            <select
              value={filter.method}
              onChange={(e) => setFilter((f) => ({ ...f, method: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-[14px] focus:ring-2 focus:ring-brand-100 focus:border-[var(--brand-600)] bg-white hover:bg-gray-50 transition-colors"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 8px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px',
                paddingRight: '32px'
              }}
            >
              <option value="">Tất cả</option>
              {methods.map((m) => (
                <option key={m} value={m} className="py-2">
                  {m === 'Google Meet' ? '📹 ' : m === 'Zoom' ? '💻 ' : '🤝 '}{m}
                </option>
              ))}
            </select>
          </div>
          
          {/* Tìm kiếm */}
          <div>
            <label className="block text-[12px] text-gray-600 mb-1">Tìm kiếm</label>
            <input
              placeholder="Tìm theo tên TVV, nhóm ngành..."
              value={filter.search}
              onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-[14px] focus:ring-2 focus:ring-brand-100 focus:border-[var(--brand-600)]"
            />
          </div>
          
          {/* Checkbox */}
          <div className="flex items-end">
            <div className="flex items-center space-x-2 h-10">
              <input
                id="onlyValid"
                type="checkbox"
                checked={filter.onlyValid}
                onChange={(e) => setFilter((f) => ({ ...f, onlyValid: e.target.checked }))}
                className="h-4 w-4 text-[var(--brand-600)] focus:ring-brand-500 border-gray-300 rounded"
              />
              <label htmlFor="onlyValid" className="text-[14px] font-medium text-gray-700">Chỉ hiển thị còn hiệu lực</label>
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary Bar - KPI Cards */}
      <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-gray-200 p-4 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="rounded-2xl p-4 h-[84px] min-w-[240px] hover:shadow transition-shadow bg-amber-50 text-amber-700 border border-amber-200">
            <div className="flex items-center justify-between h-full">
              <div>
                <p className="text-[12px] text-amber-600 mb-1">Chờ duyệt</p>
                <p className="text-[22px] leading-7 font-semibold text-amber-700">{stats.pending}</p>
                <p className="text-[12px] text-gray-500 mt-1">Slot đang chờ</p>
              </div>
              <div className="text-[20px]">⏰</div>
            </div>
          </div>

          <div className="rounded-2xl p-4 h-[84px] min-w-[240px] hover:shadow transition-shadow bg-green-50 text-green-700 border border-green-200">
            <div className="flex items-center justify-between h-full">
              <div>
                <p className="text-[12px] text-green-600 mb-1">Đã duyệt</p>
                <p className="text-[22px] leading-7 font-semibold text-green-700">{stats.approved}</p>
                <p className="text-[12px] text-gray-500 mt-1">Slot đã xác nhận</p>
              </div>
              <div className="text-[20px]">✅</div>
            </div>
          </div>
          
          <div className="rounded-2xl p-4 h-[84px] min-w-[240px] hover:shadow transition-shadow bg-red-50 text-red-700 border border-red-200">
            <div className="flex items-center justify-between h-full">
              <div>
                <p className="text-[12px] text-red-600 mb-1">Từ chối</p>
                <p className="text-[22px] leading-7 font-semibold text-red-700">{stats.rejected}</p>
                <p className="text-[12px] text-gray-500 mt-1">Slot bị từ chối</p>
              </div>
              <div className="text-[20px]">❌</div>
            </div>
          </div>
          
          <div className={`rounded-2xl p-4 h-[84px] min-w-[240px] hover:shadow transition-shadow ${stats.conflicts > 0 ? 'bg-[var(--brand-100)] text-[var(--brand-600)] border border-[var(--brand-200)]' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-center justify-between h-full">
              <div>
                <p className={`text-[12px] ${stats.conflicts > 0 ? 'text-[var(--brand-600)]' : 'text-gray-600'} mb-1`}>Xung đột</p>
                <p className={`text-[22px] leading-7 font-semibold ${stats.conflicts > 0 ? 'text-[var(--brand-600)]' : 'text-gray-700'}`}>{stats.conflicts}</p>
                <p className="text-[12px] text-gray-500 mt-1">Slot trùng giờ</p>
              </div>
              <div className="text-[20px]">⚠️</div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const allPendingIds = filtered.filter(s => s.duyetlich === 1).map(s => s.id);
                setSelectedIds(allPendingIds);
              }}
              disabled={stats.pending === 0}
              className="h-10 px-4 rounded-lg bg-[var(--brand-100)] text-[var(--brand-600)] hover:bg-[var(--brand-200)] font-medium text-[14px] disabled:opacity-50 transition-colors"
            >
              📋 Chọn tất cả chờ duyệt
            </button>
            <button
              onClick={() => setSelectedIds([])}
              disabled={selectedIds.length === 0}
              className="h-10 px-4 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium text-[14px] disabled:opacity-50 transition-colors"
            >
              🗑️ Bỏ chọn
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const idsToReject = selectedIds.filter((id) => filteredIds.includes(id));
                setConfirmAction({ type: "reject", ids: idsToReject });
              }}
              disabled={selectedIds.filter((id) => filteredIds.includes(id)).length === 0 || bulkLoading}
              className="h-10 px-6 rounded-lg bg-red-600 text-white disabled:opacity-50 hover:bg-red-700 font-semibold text-[14px] shadow-sm transition-all"
            >
              {bulkLoading ? "⏳ Đang xử lý..." : `❌ Từ chối hàng loạt (${selectedIds.filter((id) => filteredIds.includes(id)).length})`}
            </button>
            <button
              onClick={() => {
                const idsToApprove = selectedIds.filter((id) => filteredIds.includes(id));
                setConfirmAction({ type: "approve", ids: idsToApprove });
              }}
              disabled={selectedIds.filter((id) => filteredIds.includes(id)).length === 0 || bulkLoading}
              className="h-10 px-6 rounded-lg bg-[var(--brand-600)] text-white disabled:opacity-50 hover:bg-[var(--brand-700)] font-semibold text-[14px] shadow-sm transition-all"
            >
              {bulkLoading ? "⏳ Đang xử lý..." : `✅ Duyệt hàng loạt (${selectedIds.filter((id) => filteredIds.includes(id)).length})`}
            </button>
          </div>
        </div>
        
        {/* Selection Info */}
        {selectedIds.filter((id) => filteredIds.includes(id)).length > 0 && (
          <div className="mt-4 p-4 bg-[var(--brand-100)] border border-[var(--brand-200)] rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[var(--brand-600)] rounded-full"></div>
              <span className="text-[14px] font-medium text-[var(--brand-600)]">
                Đã chọn <strong>{selectedIds.filter((id) => filteredIds.includes(id)).length}</strong> slot để duyệt
              </span>
            </div>
          </div>
        )}
      </div>

      {filter.view === "list" ? (
        <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-gray-200 p-0 overflow-x-auto">
          {slotsLoading && (
            <div className="p-8 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2">Đang tải dữ liệu...</p>
            </div>
          )}
          {slotsError && (
            <div className="p-8 text-center text-red-500">
              <div className="text-4xl mb-2">⚠️</div>
              <p>{slotsError}</p>
            </div>
          )}
          {!slotsLoading && !slotsError && (
            <div>
              {/* Desktop/Tablet: Table view */}
              <div className="hidden md:block">
                <table className="w-full table-fixed text-[14px] leading-[20px]">
                  <colgroup>
                    <col style={{ width: '3%', minWidth: '40px' }} />
                    <col style={{ width: '20%', minWidth: '220px' }} />
                    <col style={{ width: '10%', minWidth: '110px' }} />
                    <col style={{ width: '10%', minWidth: '110px' }} />
                    <col style={{ width: '12%', minWidth: '130px' }} />
                    <col style={{ width: '26%', minWidth: '260px' }} />
                    <col style={{ width: '19%', minWidth: '130px' }} />
                  </colgroup>
                  <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                    <tr className="h-11">
                      <th className="w-[3%] min-w-[40px] px-4 text-center">
                      <input 
                        type="checkbox" 
                        onChange={() => toggleSelectAll(filtered.map((s) => s.id))} 
                        checked={filtered.length > 0 && filtered.every((s) => selectedIds.includes(s.id))}
                          className="h-4 w-4 text-[var(--brand-600)] focus:ring-brand-500 border-gray-300 rounded"
                      />
                    </th>
                      <th className="w-[18%] min-w-[220px] px-4 text-left text-[12px] uppercase tracking-wide text-gray-600 font-medium leading-[18px]">Tư vấn viên</th>
                      <th className="hidden xl:table-cell w-[9%] min-w-[110px] px-4 text-left text-[12px] uppercase tracking-wide text-gray-600 font-medium leading-[18px]">Ngày</th>
                      <th className="hidden xl:table-cell w-[9%] min-w-[110px] px-4 text-left text-[12px] uppercase tracking-wide text-gray-600 font-medium leading-[18px]">Giờ</th>
                      <th className="hidden lg:table-cell xl:hidden w-[18%] min-w-[220px] px-4 text-left text-[12px] uppercase tracking-wide text-gray-600 font-medium leading-[18px]">Thời gian</th>
                      <th className="w-[11%] min-w-[130px] px-4 text-left text-[12px] uppercase tracking-wide text-gray-600 font-medium leading-[18px]">Hình thức</th>
                      <th className="w-[24%] min-w-[260px] px-4 text-left text-[12px] uppercase tracking-wide text-gray-600 font-medium leading-[18px]">Ghi chú</th>
                      <th className="w-[19%] min-w-[130px] px-4 text-center text-[12px] uppercase tracking-wide text-gray-600 font-medium leading-[18px]">Trạng thái</th>
                  </tr>
                </thead>
                  <tbody className="bg-white divide-y divide-gray-200 [&>tr]:h-12 [&>tr:hover]:bg-gray-50">
                  {filtered.map((s, index) => {
                    const badge = statusMeta[s.duyetlich];
                    const conflicts = conflictInfo.get(s.id) || [];
                    return (
                        <tr 
                          key={s.id} 
                          onClick={() => openDetails(s)}
                          className={`cursor-pointer align-middle ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          <td className="px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(s.id)} 
                            onChange={() => toggleSelected(s.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 text-[var(--brand-600)] focus:ring-brand-500 border-gray-300 rounded"
                          />
                        </td>
                          <td className="px-4 whitespace-nowrap">
                          <div className="flex items-center">
                              <div className="flex-shrink-0 h-6 w-6">
                                <div className="h-6 w-6 rounded-full bg-[var(--brand-100)] flex items-center justify-center">
                                  <span className="text-[10px] font-medium text-[var(--brand-600)]">
                                  {s.advisorName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                              <div className="ml-3">
                                <div className="text-[14px] leading-[20px] font-medium text-gray-900">{s.advisorName}</div>
                                <div className="text-[14px] leading-[20px] text-gray-500">{s.groupName}</div>
                            </div>
                          </div>
                        </td>
                          <td className="hidden xl:table-cell px-4 whitespace-nowrap text-left">
                            <div className="text-[14px] leading-[20px] text-gray-900">{s.date}</div>
                        </td>
                          <td className="hidden xl:table-cell px-4 whitespace-nowrap text-left">
                            <div className="text-[14px] leading-[20px] font-medium text-gray-900">{s.start} – {s.end}</div>
                        </td>
                          <td className="hidden lg:table-cell xl:hidden px-4 whitespace-nowrap text-left">
                            <div className="text-[14px] leading-[20px] text-gray-900">{s.date} · {s.start}–{s.end}</div>
                          </td>
                          <td className="px-4 whitespace-nowrap text-left">
                            <span className={`inline-flex items-center h-6 px-2 rounded-full text-[12px] font-medium ${
                              s.method === 'Google Meet' ? 'bg-emerald-100 text-emerald-700' : 
                              s.method === 'Zoom' ? 'bg-sky-100 text-sky-700' : 
                              'bg-indigo-100 text-indigo-700'
                          }`}>
                            {s.method}
                          </span>
                        </td>
                          <td className="px-4 text-left">
                            <div className="text-[14px] leading-[20px] text-gray-900 truncate" title={s.note}>
                            {s.note || '—'}
                          </div>
                        </td>
                          <td className="px-4 whitespace-nowrap text-center align-middle" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                            {s.duyetlich === 1 && (
                                <button
                                  onClick={() => setConfirmAction({ type: "approve", ids: [s.id] })}
                                  className="inline-flex items-center justify-center h-7 w-7 rounded-md text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                                  title="Duyệt"
                                >
                                  ✓
                                </button>
                              )}
                              <span className={`inline-flex items-center justify-center h-6 px-2 rounded-full text-[12px] font-medium ${badge.color}`}>
                                {badge.label}
                              </span>
                            {undoMapRef.current.has(s.id) && (
                              <button 
                                onClick={() => undo(s.id)} 
                                  className="inline-flex items-center justify-center h-7 w-7 rounded-md text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                                title="Hoàn tác"
                              >
                                ↶
                              </button>
                            )}
                          </div>
                          </td>
                      </tr>
                    );
                  })}
                    {filtered.length === 0 && !slotsLoading && !slotsError && (
                      <tr>
                        <td className="px-4 py-8 text-center text-gray-500" colSpan={7}>
                          <div className="text-4xl mb-2">📋</div>
                          <p className="text-[14px]">Không có dữ liệu phù hợp</p>
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
              </div>

              {/* Mobile: Card list view */}
              <div className="md:hidden divide-y">
                {filtered.length === 0 && !slotsLoading && !slotsError ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-[14px]">Không có dữ liệu phù hợp</p>
                  </div>
                ) : (
                  filtered.map((s) => {
                    const badge = statusMeta[s.duyetlich];
                    const conflicts = conflictInfo.get(s.id) || [];
                    return (
                      <div
                        key={s.id}
                        onClick={() => openDetails(s)}
                        className="border rounded-xl p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-[var(--brand-100)] flex items-center justify-center">
                              <span className="text-[10px] font-medium text-[var(--brand-600)]">
                                {s.advisorName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-[14px] font-medium text-gray-900">{s.advisorName}</div>
                              <div className="text-[12px] text-gray-500">{s.groupName}</div>
                            </div>
                          </div>
                          <span className={`inline-flex items-center justify-center h-6 px-2 rounded-full text-[12px] font-medium ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[14px] text-gray-900">{s.date} · {s.start}–{s.end}</span>
                          <span className={`inline-flex items-center h-6 px-2 rounded-full text-[12px] font-medium ${
                            s.method === 'Google Meet' ? 'bg-emerald-100 text-emerald-700' : 
                            s.method === 'Zoom' ? 'bg-sky-100 text-sky-700' : 
                            'bg-indigo-100 text-indigo-700'
                          }`}>
                            {s.method}
                          </span>
                        </div>
                        <div className="text-[14px] text-gray-900 mb-2 line-clamp-2" title={s.note}>
                          {s.note || '—'}
                        </div>
                        <div className="flex items-center gap-2">
                          {s.duyetlich === 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmAction({ type: "approve", ids: [s.id] });
                              }}
                              className="h-10 px-4 rounded-lg text-[14px] font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                            >
                              ✅ Duyệt
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-gray-200 p-6">
          <div className="grid grid-cols-7 gap-2">
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
              <div key={d} className="text-sm font-medium text-gray-500 text-center py-2">{d}</div>
            ))}
            {(() => {
              const blanks = Array(new Date(filter.year, calendarMonthIndex, 1).getDay()).fill(0);
              const days = calendarDays;
              return (
                <>
                  {blanks.map((_, i) => (
                    <div key={`b-${i}`} />
                  ))}
                  {days.map((dateObj) => {
                    const dateStr = dateObj.toISOString().slice(0, 10);
                    const daySlots = filtered.filter((s) => s.date === dateStr);
                    return (
                      <div key={dateStr} className="min-h-[160px] border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="text-sm font-medium text-gray-900 mb-2">{dateObj.getDate()}</div>
                        <div className="space-y-1">
                          {daySlots.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => openDetails(s)}
                              className={`w-full text-left px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                                s.duyetlich === 2 ? "bg-green-100 text-green-800 hover:bg-green-200" : 
                                s.duyetlich === 3 ? "bg-red-100 text-red-800 hover:bg-red-200" :
                                s.duyetlich === 1 ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                              title={`Đăng bởi ${s.advisorName} • ${s.method} • ${
                                s.duyetlich === 2 ? "Đã duyệt" : 
                                s.duyetlich === 3 ? "Từ chối" :
                                s.duyetlich === 1 ? "Chờ duyệt" : "Không xác định"
                              }`}
                            >
                              <div className="font-medium">{s.start}-{s.end}</div>
                              <div className="text-xs opacity-75">{s.advisorName}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Drawer details */}
      <Drawer open={openDrawer} onClose={() => setOpenDrawer(false)}>
        {activeSlot && (
          <div className="space-y-6">
            {/* Advisor Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-500 mb-1">Tư vấn viên</div>
              <div className="text-lg font-semibold text-gray-900">{activeSlot.advisorName}</div>
              <div className="text-sm text-gray-600">{activeSlot.groupName}</div>
            </div>
            
            {/* Time & Method */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 mb-1">Ngày – Giờ</div>
                <div className="text-lg font-semibold text-gray-900">{activeSlot.date}</div>
                <div className="text-sm text-gray-600">{activeSlot.start} – {activeSlot.end}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 mb-1">Hình thức</div>
                <div className="text-lg font-semibold text-gray-900">{activeSlot.method}</div>
              </div>
            </div>
            
            {/* Description */}
            <div>
              <div className="text-sm font-medium text-gray-500 mb-2">Mô tả</div>
              <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{activeSlot.note || "—"}</div>
            </div>
            
            {/* Approval History */}
            <div>
              <div className="text-sm font-medium text-gray-500 mb-2">Lịch sử duyệt</div>
              <div className="text-sm">
                    {activeSlot.approverName ? (
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="font-medium text-green-800">{activeSlot.approverName}</div>
                    <div className="text-green-600 text-xs">{new Date(activeSlot.approvedAt).toLocaleString()}</div>
                    {activeSlot.approveNote && (
                      <div className="text-green-700 text-xs mt-1">Ghi chú: {activeSlot.approveNote}</div>
                    )}
                        {activeSlot.duyetlich === 3 && (
                      <div className="text-red-600 font-medium text-sm mt-1">Trạng thái: Từ chối</div>
                        )}
                  </div>
                    ) : (
                  <div className="text-gray-400 bg-gray-50 rounded-lg p-3">Chưa có</div>
                    )}
              </div>
            </div>
            
            {/* Conflict Warning */}
            <div>
              <div className="text-sm font-medium text-gray-500 mb-2">Cảnh báo</div>
              <div className="text-sm">
                {(conflictInfo.get(activeSlot.id)?.length || 0) > 0 ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="text-orange-800 font-medium">⚠️ Có xung đột</div>
                    <div className="text-orange-700 text-xs mt-1">Trùng giờ với slot #{(conflictInfo.get(activeSlot.id) || []).join(", ")}</div>
                  </div>
                ) : (
                  <div className="text-gray-400 bg-gray-50 rounded-lg p-3">Không có xung đột</div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              {activeSlot.duyetlich === 1 && (
                <>
                  <button
                    onClick={() => setConfirmAction({ type: "approve", ids: [activeSlot.id] })}
                    className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium transition-colors"
                  >
                    ✅ Duyệt
                  </button>
                  <button
                    onClick={() => setConfirmAction({ type: "reject", ids: [activeSlot.id] })}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition-colors"
                  >
                    ❌ Từ chối
                  </button>
                </>
              )}
              {activeSlot.duyetlich === 2 && (
                <div className="flex-1 text-center px-4 py-2 rounded-lg bg-green-100 text-green-800 font-medium">
                  ✅ Đã duyệt
                </div>
              )}
              {activeSlot.duyetlich === 3 && (
                <div className="flex-1 text-center px-4 py-2 rounded-lg bg-red-100 text-red-800 font-medium">
                  ❌ Đã từ chối
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Confirm approve/reject modal */}
      <Modal open={!!confirmAction} onClose={() => { setConfirmAction(null); setRejectNote(""); }}>
        {confirmAction && (
          <div>
            <div className="flex items-center mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mr-4 ${
                confirmAction.type === "approve" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              }`}>
                {confirmAction.type === "approve" ? "✅" : "❌"}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
              {confirmAction.type === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
            </h3>
                <p className="text-sm text-gray-500">
                  {confirmAction.type === "approve" ? "Duyệt các slot đã chọn" : "Từ chối các slot đã chọn"}
                </p>
              </div>
            </div>
            
            {/* Show summary of slots to be processed */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Sẽ {confirmAction.type === "approve" ? "duyệt" : "từ chối"} <strong className="text-teal-600">{confirmAction.ids.length} slot</strong>
              </div>
              <div className="text-xs text-gray-500">
                Bao gồm: {confirmAction.ids.slice(0, 3).map(id => {
                  const slot = slots.find(s => s.id === id);
                  return slot ? `${slot.advisorName} (${slot.date})` : '';
                }).filter(Boolean).join(', ')}
                {confirmAction.ids.length > 3 && ` và ${confirmAction.ids.length - 3} slot khác`}
              </div>
            </div>

            {confirmAction.type === "reject" && (
              <div className="space-y-3 mb-6">
                <label className="block text-sm font-medium text-gray-700">Nhập lý do từ chối *</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                  rows={3} 
                  value={rejectNote} 
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Nhập lý do từ chối..."
                />
              </div>
            )}

            {confirmAction.type === "approve" && (
              <div className="space-y-3 mb-6">
                <label className="block text-sm font-medium text-gray-700">Ghi chú duyệt (tùy chọn)</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                  rows={2} 
                  value={rejectNote} 
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Nhập ghi chú duyệt..."
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setConfirmAction(null); setRejectNote(""); }} 
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  const ids = confirmAction.ids;
                  console.log('Modal confirm clicked - ids:', ids);
                  console.log('Modal confirm clicked - action:', confirmAction.type);
                  if (confirmAction.type === "approve") {
                    const { skipped } = await approveSlots(ids, rejectNote);
                    if (skipped.length) {
                      setToast({ type: "info", msg: `Bỏ qua: ${skipped.map((s) => `#${s.id}(${s.reason})`).join(", ")}` });
                    }
                  } else {
                    await rejectSlots(ids, rejectNote || "Không nêu lý do");
                  }
                  setConfirmAction(null);
                  setRejectNote("");
                  setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
                }}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  confirmAction.type === "approve" 
                    ? "bg-green-600 text-white hover:bg-green-700 shadow-md" 
                    : "bg-red-600 text-white hover:bg-red-700 shadow-md"
                }`}
              >
                {confirmAction.type === "approve" ? "✅ Xác nhận duyệt" : "❌ Xác nhận từ chối"}
              </button>
        </div>
        </div>
        )}
      </Modal>
      </div>
    </div>
  );
}
