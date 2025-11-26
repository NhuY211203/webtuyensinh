import { useEffect, useMemo, useRef, useState } from "react";
import apiService from "../../services/api";

export default function ConsultantMeetings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Chat states
  const [contacts, setContacts] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);
  // Floating chat bubble
  const [showChat, setShowChat] = useState(false);
  const [unread, setUnread] = useState(0);
  const [mobileTab, setMobileTab] = useState('list'); // 'list' | 'chat'
  const listEndRef = useRef(null);
  const inputRef = useRef(null);
  const currentUser = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const consultantId = currentUser.idnguoidung || currentUser.id;
  const getInitial = (name) => (name ? name.trim().charAt(0).toUpperCase() : '?');
  const formatDateTime = (isoLike) => isoLike ? new Date(isoLike).toLocaleString('vi-VN') : '';
  const formatYMD = (d) => {
    if (!(d instanceof Date)) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  // Calendar states
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => formatYMD(new Date()));
  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth()+1, 0);
  const startWeekDay = (monthStart.getDay()+6)%7; // Mon=0
  const daysInMonth = monthEnd.getDate();
  const daysArray = Array.from({length: startWeekDay + daysInMonth}, (_,i)=>{
    const dayNum = i - startWeekDay + 1;
    if (dayNum < 1) return null;
    const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), dayNum);
    return d;
  });
  const eventsByDate = useMemo(()=>{
    const map = {};
    (items||[]).forEach(ev=>{
      const key = ev.date;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  },[items]);
  const todayYMD = formatYMD(new Date());

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        // Lấy các ca đã đặt (trangthai = 2) và đã hoàn thành (trangthai = 4)
        const [resScheduled, resCompleted] = await Promise.all([
          apiService.get("/consultation-schedules", {
            consultant_id: consultantId,
            status: 2, // Đã đặt
            format: "simple",
          }),
          apiService.get("/consultation-schedules", {
            consultant_id: consultantId,
            status: 4, // Đã hoàn thành
            format: "simple",
          })
        ]);
        
        const scheduled = Array.isArray(resScheduled?.data) ? resScheduled.data.map(item => ({ ...item, status: 2 })) : [];
        const completed = Array.isArray(resCompleted?.data) ? resCompleted.data.map(item => ({ ...item, status: 4 })) : [];
        setItems([...scheduled, ...completed]);
        // Lấy danh sách người đã đặt để chat (contacts)
        const contactsRes = await apiService.getChatContacts(consultantId);
        const contactList = Array.isArray(contactsRes?.data) ? contactsRes.data : [];
        console.log('Contacts loaded:', contactList);
        setContacts(contactList);
        if (contactList.length && !activeUserId) {
          setActiveUserId(contactList[0].userId);
          setActiveRoomId(contactList[0].roomId);
        } else if (contactList.length === 0) {
          console.log('No contacts found. Consultant ID:', consultantId);
        }
      } catch (e) {
        setError(e.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }
    if (consultantId) load();
  }, []);

  // Load messages when active user changes
  useEffect(() => {
    async function loadMessages() {
      if (!activeRoomId) return;
      const res = await apiService.getChatMessagesByRoom(activeRoomId, { limit: 50 });
      const rows = Array.isArray(res?.data) ? res.data : [];
      // Parse file/ảnh từ noi_dung
      const parsedRows = rows.map(r => {
        let text = r.noi_dung || '';
        let file = null;
        
        const imageMatch = text.match(/\[IMAGE:([^\]]+)\]/);
        const fileMatch = text.match(/\[FILE:([^\]]+):([^\]]+)\]/);
        
        if (imageMatch) {
          file = { url: imageMatch[1], filename: null };
        } else if (fileMatch) {
          file = { url: fileMatch[1], filename: fileMatch[2] };
        }
        
        return { ...r, file };
      });
      setMessages(parsedRows);
      // scroll to bottom
      setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
    loadMessages();
  }, [activeRoomId]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const newHeight = Math.min(inputRef.current.scrollHeight, 120);
      inputRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  // Polling đơn giản mỗi 3s khi đang chọn phòng
  useEffect(() => {
    if (!activeRoomId) return;
    const timer = setInterval(async () => {
      try {
        const res = await apiService.getChatMessagesByRoom(activeRoomId, { limit: 50 });
        const rows = Array.isArray(res?.data) ? res.data : [];
        // Parse file/ảnh từ noi_dung
        const parsedRows = rows.map(r => {
          let text = r.noi_dung || '';
          let file = null;
          
          const imageMatch = text.match(/\[IMAGE:([^\]]+)\]/);
          const fileMatch = text.match(/\[FILE:([^\]]+):([^\]]+)\]/);
          
          if (imageMatch) {
            file = { url: imageMatch[1], filename: null };
          } else if (fileMatch) {
            file = { url: fileMatch[1], filename: fileMatch[2] };
          }
          
          return { ...r, file };
        });
        
        // Chỉ update nếu số lượng hoặc id cuối thay đổi
        const lastId = messages[messages.length - 1]?.idtinnhan;
        const newLastId = parsedRows[parsedRows.length - 1]?.idtinnhan;
        if (parsedRows.length !== messages.length || lastId !== newLastId) {
          setMessages(parsedRows);
          const last = parsedRows[parsedRows.length - 1];
          if (last && last.idnguoigui !== consultantId && !showChat) {
            setUnread((u) => u + 1);
          }
          setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(timer);
  }, [activeRoomId, messages]);

  const uploadFile = async (file) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/chat-support/upload-file', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          url: data.data.url,
          filename: data.data.original_filename || file.name
        };
      } else {
        alert(data.message || 'Không thể upload file');
        return null;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Lỗi kết nối khi upload file: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra kích thước (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File quá lớn. Kích thước tối đa là 10MB');
      return;
    }

    // Kiểm tra loại file
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      alert('Loại file không được hỗ trợ. Chỉ chấp nhận: ảnh (JPEG, PNG, GIF, WebP) và tài liệu (PDF, DOC, DOCX, XLS, XLSX, TXT, CSV)');
      return;
    }

    const fileResult = await uploadFile(file);
    if (fileResult && fileResult.url) {
      setAttachedFile({
        url: fileResult.url,
        filename: fileResult.filename || file.name
      });
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  async function handleSend() {
    if ((!input.trim() && !attachedFile) || sending || !activeUserId || uploading) return;
    
    // Tạo nội dung tin nhắn
    let content = input.trim();
    if (attachedFile) {
      const fileUrl = attachedFile.url;
      const fileName = attachedFile.filename || 'file';
      // Nếu là ảnh, thêm vào content với format đặc biệt
      if (fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        content = content ? `${content}\n[IMAGE:${fileUrl}]` : `[IMAGE:${fileUrl}]`;
      } else {
        content = content ? `${content}\n[FILE:${fileUrl}:${fileName}]` : `[FILE:${fileUrl}:${fileName}]`;
      }
    }
    
    const fileToSend = attachedFile;
    setInput("");
    setAttachedFile(null);
    
    try {
      setSending(true);
      const senderId = consultantId; // tư vấn viên gửi
      const res = await apiService.sendChatMessageByRoom({ roomId: activeRoomId, senderId, content });
      const newMsg = res?.data;
      if (newMsg) {
        const msgWithFile = {
          ...newMsg,
          file: fileToSend ? { url: fileToSend.url, filename: fileToSend.filename } : null,
        };
        setMessages((prev) => [...prev, msgWithFile]);
      }
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = '40px';
      }
      setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    } catch (e) {
      console.error('Send error:', e);
      setInput(content.replace(/\[(IMAGE|FILE):[^\]]+\]/g, '').trim());
      setAttachedFile(fileToSend);
    } finally {
      setSending(false);
    }
  }

  // CSS variables for brand colors - Green theme
  const brandColors = {
    '--brand-700': '#15803d', // Dark green
    '--brand-600': '#16a34a', // Green
    '--brand-500': '#22c55e', // Light green
    '--brand-100': '#dcfce7', // Very light green
    '--brand-50': '#f0fdf4'   // Lightest green
  };

  // Tính toán thống kê
  const stats = useMemo(() => {
    const today = formatYMD(new Date());
    const todayEvents = eventsByDate[today] || [];
    
    // Lịch trong tuần này
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Thứ 2
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Chủ nhật
    
    const weekEvents = items.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= weekStart && itemDate <= weekEnd;
    });
    
    const completed = items.filter(item => item.status === 4).length;
    const scheduled = items.filter(item => item.status === 2).length;
    
    return {
      total: items.length,
      today: todayEvents.length,
      thisWeek: weekEvents.length,
      upcoming: items.filter(item => new Date(item.date) > new Date() && item.status === 2).length,
      completed: completed,
      scheduled: scheduled
    };
  }, [items, eventsByDate]);

  // Icon cho phương thức
  const getMethodIcon = (method) => {
    if (!method) return '📅';
    const methodLower = method.toLowerCase();
    if (methodLower.includes('zoom')) return '💻';
    if (methodLower.includes('meet') || methodLower.includes('google')) return '🎥';
    if (methodLower.includes('teams')) return '👥';
    if (methodLower.includes('phone') || methodLower.includes('điện thoại')) return '📞';
    return '📅';
  };

  return (
    <div className="mx-auto px-6 max-w-[1280px] py-6 space-y-6" style={brandColors}>
      {/* Header với Statistics */}
      <div className="space-y-4">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[24px] leading-8 font-bold text-gray-900">Phòng họp / Link</h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý lịch tư vấn và liên kết phòng họp</p>
          </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
              className="h-10 px-4 text-[14px] rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-[var(--brand-500)] transition-all shadow-sm hover:shadow-md focus:ring-2 focus:ring-[var(--brand-100)] focus:border-[var(--brand-600)]"
          >
              ← Tháng trước
          </button>
          <button
              className="h-10 px-5 text-[14px] rounded-xl border-2 border-[var(--brand-500)] bg-gradient-to-r from-[var(--brand-100)] to-[var(--brand-50)] text-[var(--brand-700)] font-semibold min-w-[160px] truncate shadow-sm"
          >
              📅 {calendarMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
          </button>
          <button
            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
              className="h-10 px-4 text-[14px] rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-[var(--brand-500)] transition-all shadow-sm hover:shadow-md focus:ring-2 focus:ring-[var(--brand-100)] focus:border-[var(--brand-600)]"
          >
              Tháng sau →
          </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-[var(--brand-600)] to-[var(--brand-700)] rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Tổng số lịch</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Lịch hôm nay</p>
                <p className="text-2xl font-bold mt-1">{stats.today}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl">📌</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Tuần này</p>
                <p className="text-2xl font-bold mt-1">{stats.thisWeek}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl">📆</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Sắp tới</p>
                <p className="text-2xl font-bold mt-1">{stats.upcoming}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl">⏰</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Đã hoàn thành</p>
                <p className="text-2xl font-bold mt-1">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Khu vực Chat cũ đã ẩn vì dùng bong bóng chat */}
      <div className="hidden">
        {/* Sidebar liên hệ */}
        <div className="col-span-4 card p-0 overflow-hidden">
          <div className="p-3 font-semibold border-b bg-gradient-to-r from-teal-50 to-cyan-50">Người đã đặt</div>
          <div className="max-h-[520px] overflow-y-auto">
            {contacts.map(c => (
              <button
                key={c.userId}
                onClick={() => { setActiveUserId(c.userId); setActiveRoomId(c.roomId); }}
                className={`w-full text-left px-3 py-2 border-b hover:bg-teal-50 transition flex items-center gap-3 ${activeUserId===c.userId? 'bg-teal-50 border-l-4 border-teal-600' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-bold">
                  {getInitial(c.name)}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  {c.lastMessage && <div className="text-xs text-gray-500 truncate">{c.lastMessage}</div>}
                </div>
              </button>
            ))}
            {contacts.length===0 && <div className="p-3 text-gray-500">Chưa có người đặt nào.</div>}
          </div>
        </div>
        {/* Khung chat */}
        <div className="col-span-8 card p-0 overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between bg-white/70">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
                {getInitial(contacts.find(c=>c.userId===activeUserId)?.name)}
              </div>
              <div className="font-medium">{contacts.find(c=>c.userId===activeUserId)?.name || 'Chọn người để chat'}</div>
            </div>
          </div>
          <div className="h-[420px] overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
            {messages.map(m => {
              const mine = m.idnguoigui===consultantId;
              return (
                <div key={m.idtinnhan || m.ngay_tao + m.idnguoigui} className={`relative max-w-[70%] ${mine? 'ml-auto text-right' : ''}`}>
                  <div className={`relative inline-block px-4 py-2 rounded-3xl shadow-md ${mine? 'bg-emerald-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                    {m.noi_dung || m.content}
                    {/* Tail bubble */}
                    <span className={`absolute -bottom-1 w-3 h-3 rotate-45 ${mine? 'right-3 bg-emerald-600' : 'left-3 bg-white border-l border-t border-gray-200'}`}></span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">{formatDateTime(m.ngay_tao)}</div>
                </div>
              );
            })}
            <div ref={listEndRef} />
          </div>
          <div className="p-3 border-t flex gap-2 bg-white">
            <input
              value={input}
              onChange={(e)=>setInput(e.target.value)}
              onKeyDown={(e)=>{ if(e.key==='Enter') handleSend(); }}
              className="flex-1 px-4 py-2 rounded-full border focus:ring-2 focus:ring-emerald-400 outline-none"
              placeholder="Nhập tin nhắn..."
            />
            <button onClick={handleSend} disabled={sending || !activeUserId || !input.trim()} className="px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
              Gửi
            </button>
          </div>
        </div>
      </div>

      {/* Lịch tháng */}
      <section className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.06)] p-4 md:p-5 border border-gray-100">
        {/* Hàng tiêu đề thứ */}
        <div className="grid grid-cols-7 gap-3 md:gap-4 border-b-2 border-gray-200 pb-3 mb-3">
          {['Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'CN'].map((day, idx) => (
            <div key={idx} className="text-[13px] font-semibold text-gray-700 text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Lưới ngày */}
        <div className="grid grid-cols-3 md:grid-cols-7 gap-3 md:gap-4">
          {daysArray.map((d, idx) => {
            const isToday = d && formatYMD(d) === todayYMD;
            const isSelected = d && formatYMD(d) === selectedDate;
            const hasEvents = d && eventsByDate[formatYMD(d)];
            const eventCount = hasEvents ? eventsByDate[formatYMD(d)].length : 0;

            return (
              <button
                key={idx}
                onClick={() => d && setSelectedDate(formatYMD(d))}
                disabled={!d}
                className={`
                  min-h-[100px] sm:min-h-[110px] md:min-h-[120px] lg:min-h-[130px]
                  rounded-xl border-2 p-2 md:p-3 text-left
                  transition-all duration-200
                  ${!d ? 'border-transparent bg-transparent cursor-default' : ''}
                  ${isSelected 
                    ? 'border-[var(--brand-600)] bg-gradient-to-br from-[var(--brand-100)] to-[var(--brand-50)] shadow-md scale-[1.02]' 
                    : 'border-gray-200 bg-white hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)] hover:shadow-sm'
                  }
                  ${isToday && !isSelected ? 'ring-2 ring-[var(--brand-500)] ring-offset-2 bg-[var(--brand-50)]/30' : ''}
                `}
              >
                {d ? (
                  <>
                    <span className={`
                      inline-flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold transition-all
                      ${isSelected 
                        ? 'bg-[var(--brand-600)] text-white shadow-md' 
                        : isToday && !isSelected
                        ? 'bg-[var(--brand-500)] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}>
                      {d.getDate()}
                    </span>
                    {eventCount > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {eventsByDate[formatYMD(d)].slice(0, 2).map((ev, i) => {
                          const isCompleted = ev.status === 4;
                          return (
                            <div 
                              key={i} 
                              className="group relative"
                            >
                              <div className={`flex items-start gap-1.5 rounded-lg p-1.5 border transition-all ${
                                isCompleted 
                                  ? 'bg-gray-50/80 border-gray-300 hover:bg-gray-100' 
                                  : 'bg-white/60 border-[var(--brand-200)] hover:bg-white hover:shadow-sm'
                              }`}>
                                <div className="relative flex-shrink-0 mt-1">
                                  {isCompleted ? (
                                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400 flex items-center justify-center">
                                      <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  ) : (
                                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand-600)] flex-shrink-0 shadow-sm"></span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-[10px] font-bold truncate leading-tight flex items-center gap-1 ${
                                    isCompleted ? 'text-gray-600 line-through' : 'text-gray-900'
                                  }`}>
                                    {ev.bookerName || 'Người đặt'}
                                    {isCompleted && (
                                      <span className="text-[8px] px-1 py-0.5 rounded bg-gray-200 text-gray-600 font-normal">
                                        Đã xong
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className={`text-[9px] font-semibold ${
                                      isCompleted ? 'text-gray-500' : 'text-[var(--brand-700)]'
                                    }`}>
                                      {ev.start} - {ev.end}
                                    </span>
                                  </div>
                                  {ev.method && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className="text-[9px]">{getMethodIcon(ev.method)}</span>
                                      <span className={`text-[9px] truncate font-medium ${
                                        isCompleted ? 'text-gray-500' : 'text-gray-600'
                                      }`}>
                                        {ev.method}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            {/* Tooltip on hover với thông tin đầy đủ */}
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                              <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                                <div className="font-semibold flex items-center gap-2">
                                  {ev.bookerName || 'Người đặt ẩn danh'}
                                  {isCompleted && (
                                    <span className="px-1.5 py-0.5 rounded bg-green-600 text-white text-[10px]">
                                      ✓ Hoàn thành
                                    </span>
                                  )}
                                </div>
                                <div className="text-gray-300">{ev.start} - {ev.end}</div>
                                {ev.method && <div className="text-gray-400">{ev.method}</div>}
                                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </div>
                          );
                        })}
                        {eventCount > 2 && (
                          <div className="text-[10px] text-gray-500 font-medium mt-1 pl-3.5">
                            +{eventCount - 2} lịch khác
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Chi tiết ngày chọn */}
        <div className="mt-6 pt-4 border-t-2 border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-gradient-to-b from-[var(--brand-600)] to-[var(--brand-500)] rounded-full"></div>
            <h3 className="text-[16px] font-bold text-gray-900">
            Chi tiết ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
            </h3>
            {(eventsByDate[selectedDate] || []).length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--brand-100)] text-[var(--brand-700)] text-xs font-semibold">
                {(eventsByDate[selectedDate] || []).length} lịch
              </span>
            )}
          </div>
          <div className="space-y-3">
            {(eventsByDate[selectedDate] || []).map(ev => {
              const isCompleted = ev.status === 4;
              return (
              <div key={ev.id} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                isCompleted 
                  ? 'border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:border-gray-400' 
                  : 'border-gray-200 bg-gradient-to-r from-white to-[var(--brand-50)]/30 hover:border-[var(--brand-400)] hover:shadow-md'
              }`}>
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg shadow-md flex-shrink-0 ${
                    isCompleted 
                      ? 'bg-gradient-to-br from-gray-400 to-gray-500' 
                      : 'bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-600)]'
                  }`}>
                    {isCompleted ? '✓' : getMethodIcon(ev.method)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[15px] font-bold mb-1 flex items-center gap-2 ${
                      isCompleted ? 'text-gray-600 line-through' : 'text-gray-900'
                    }`}>
                      {ev.bookerName || 'Người đặt ẩn danh'}
                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-semibold">
                          ✓ Đã hoàn thành
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold ${
                        isCompleted 
                          ? 'bg-gray-200 text-gray-600' 
                          : 'bg-[var(--brand-100)] text-[var(--brand-700)]'
                      }`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {ev.start} - {ev.end}
                      </span>
                      {ev.method && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium ${
                          isCompleted 
                            ? 'bg-gray-200 text-gray-600' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          <span>{getMethodIcon(ev.method)}</span>
                          {ev.method}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!isCompleted && ev.joinLink ? (
                  <a 
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] text-white hover:from-[var(--brand-700)] hover:to-[var(--brand-800)] text-[14px] font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 flex-shrink-0" 
                    href={ev.joinLink} 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Tham gia
                  </a>
                ) : !isCompleted ? (
                  <button 
                    className="px-4 py-2.5 rounded-xl border-2 border-[var(--brand-500)] bg-white text-[var(--brand-700)] hover:bg-[var(--brand-100)] hover:border-[var(--brand-600)] text-[14px] font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2 flex-shrink-0" 
                    onClick={async () => { 
                      // Tìm hoặc tạo room chat
                      const existingContact = contacts.find(c => c.userId === ev.bookerId);
                      if (existingContact) {
                        setActiveUserId(ev.bookerId);
                        setActiveRoomId(existingContact.roomId);
                      } else {
                        // Nếu chưa có room, tạo mới
                        try {
                          const user = JSON.parse(localStorage.getItem('user') || '{}');
                          const userId = user.idnguoidung || user.id;
                          const roomRes = await apiService.getOrCreateChatRoom(consultantId, ev.bookerId, ev.id);
                          if (roomRes?.data?.roomId) {
                      setActiveUserId(ev.bookerId); 
                            setActiveRoomId(roomRes.data.roomId);
                            // Reload contacts để có room mới
                            const contactsRes = await apiService.getChatContacts(consultantId);
                            const contactList = Array.isArray(contactsRes?.data) ? contactsRes.data : [];
                            setContacts(contactList);
                          }
                        } catch (e) {
                          console.error('Error creating chat room:', e);
                        }
                      }
                      // Mở modal chat
                      setShowChat(true);
                      setMobileTab('chat');
                      setUnread(0);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat
                  </button>
                ) : (
                  <div className="px-4 py-2.5 rounded-xl bg-gray-200 text-gray-600 text-[14px] font-semibold flex items-center gap-2 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Đã hoàn thành
                  </div>
                )}
              </div>
              );
            })}
            {(!eventsByDate[selectedDate] || eventsByDate[selectedDate].length === 0) && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-[15px] font-medium text-gray-700 mb-1">Không có lịch trong ngày này</p>
                <p className="text-[13px] text-gray-500">Chọn ngày khác để xem lịch tư vấn</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Floating chat bubble */}
      <button
        aria-label="Mở chat"
        onClick={() => { 
          console.log('Chat button clicked. Contacts:', contacts.length);
          setShowChat(true); 
          setUnread(0); 
          setMobileTab('list');
          // Nếu có contacts nhưng chưa chọn, chọn contact đầu tiên
          if (contacts.length > 0 && !activeUserId) {
            setActiveUserId(contacts[0].userId);
            setActiveRoomId(contacts[0].roomId);
            setMobileTab('chat');
          }
        }}
        className="fixed z-40 bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-[var(--brand-600)] to-[var(--brand-700)] text-white shadow-xl hover:shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 group"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[22px] h-6 px-1.5 rounded-full bg-red-500 text-white text-[12px] font-bold flex items-center justify-center shadow-lg animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-300"></div>
      </button>

      {showChat && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50" style={brandColors}>
          {/* Modal Container - dùng clamp để tránh tràn */}
          <section 
            className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col
                       w-[clamp(320px,90vw,1120px)]
                       h-[clamp(560px,80vh,760px)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Tabs (chỉ hiện trên mobile) */}
            <div className="md:hidden flex border-b border-gray-200 shrink-0">
              <button
                onClick={() => setMobileTab('list')}
                className={`flex-1 h-14 text-[14px] font-medium transition-colors ${
                  mobileTab === 'list'
                    ? 'bg-[var(--brand-100)] text-[var(--brand-700)] border-b-2 border-[var(--brand-600)]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Danh sách
              </button>
              <button
                onClick={() => setMobileTab('chat')}
                className={`flex-1 h-14 text-[14px] font-medium transition-colors ${
                  mobileTab === 'chat'
                    ? 'bg-[var(--brand-100)] text-[var(--brand-700)] border-b-2 border-[var(--brand-600)]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Tin nhắn
              </button>
            </div>

            {/* Bố cục 2 cột (Desktop) hoặc 1 cột (Mobile) */}
            <div className="grid h-full grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] flex-1 overflow-hidden">
              {/* Panel trái - Danh sách người đã đặt */}
              <aside className={`
                ${mobileTab === 'list' ? 'flex' : 'hidden'} md:flex
                flex-col
                border-r border-gray-200
                min-w-0
              `}
              >
                {/* Header trái */}
                <div className="h-12 px-4 md:px-6 border-b border-gray-200 flex items-center shrink-0">
                  <h3 className="text-[14px] font-medium text-gray-600">Người đã đặt</h3>
                </div>
                
                {/* Danh sách - Scrollable */}
                <div 
                  className="flex-1 overflow-y-auto divide-y scrollbar-hide"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  <style>{`
                    .scrollbar-hide::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  {contacts.map(c => {
                    const isActive = activeUserId === c.userId;
                    return (
                      <button
                        key={c.userId}
                        onClick={() => { 
                          setActiveUserId(c.userId); 
                          setActiveRoomId(c.roomId);
                          setMobileTab('chat');
                        }}
                        className={`
                          w-full h-16 px-4 md:px-6
                          flex items-center gap-3
                          transition-colors
                          ${isActive 
                            ? 'bg-[var(--brand-100)] border-l-4 border-[var(--brand-600)]' 
                            : 'hover:bg-gray-50'
                          }
                        `}
                      >
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-600)] text-white text-[13px] font-semibold flex-shrink-0 shadow-sm">
                          {getInitial(c.name)}
                        </span>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-[14px] font-semibold text-gray-900 truncate">{c.name}</div>
                          {c.lastMessage && (
                            <div className="text-[12px] text-gray-500 truncate mt-0.5 line-clamp-1">{c.lastMessage.length > 40 ? c.lastMessage.substring(0, 40) + '...' : c.lastMessage}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {contacts.length === 0 && (
                    <div className="p-4 text-[14px] text-gray-500 text-center">
                      <p>Chưa có người đặt nào.</p>
                      <p className="text-xs mt-2 text-gray-400">Chat sẽ xuất hiện khi có người đặt lịch tư vấn với bạn.</p>
                    </div>
                  )}
                </div>
              </aside>

              {/* Panel phải - Khung chat */}
              <main className={`
                ${mobileTab === 'chat' ? 'flex' : 'hidden'} md:flex
                flex-col
                min-w-0
              `}>
                {/* Header phải */}
                <div className="h-12 px-4 md:px-6 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {activeUserId && (
                      <>
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-600)] text-white text-[13px] font-semibold flex-shrink-0 shadow-sm">
                          {getInitial(contacts.find(c => c.userId === activeUserId)?.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[15px] font-semibold text-gray-900 truncate">
                            {contacts.find(c => c.userId === activeUserId)?.name || 'Chọn người để chat'}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-[12px] text-gray-500">Đang hoạt động</span>
                          </div>
                        </div>
                      </>
                    )}
                    {!activeUserId && (
                      <div className="text-[14px] font-semibold text-gray-900">Chọn người để chat</div>
                    )}
                  </div>
                  <button
                    onClick={() => { setShowChat(false); setMobileTab('list'); }}
                    className="h-9 w-9 rounded-full hover:bg-gray-100 grid place-items-center text-gray-600 transition-colors focus:ring-2 focus:ring-[var(--brand-100)] shrink-0"
                  >
                    ✕
                  </button>
                </div>

                {/* Vùng tin nhắn - cuộn dọc, KHÔNG cuộn ngang */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-3 bg-gradient-to-b from-[var(--brand-50)] via-white to-white">
                  {messages.length === 0 && activeUserId && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 rounded-full bg-[var(--brand-100)] flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-[var(--brand-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="text-[16px] font-medium text-gray-700 mb-1">Bắt đầu trò chuyện</div>
                      <div className="text-[14px] text-gray-500">Gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện</div>
                    </div>
                  )}
                  {messages.map(m => {
                    const mine = m.idnguoigui === consultantId;
                    
                    // Parse file/ảnh từ text
                    let displayText = m.noi_dung || m.content || '';
                    let imageUrl = null;
                    let fileInfo = null;
                    
                    // Tìm [IMAGE:url] hoặc [FILE:url:filename]
                    const imageMatch = displayText.match(/\[IMAGE:([^\]]+)\]/);
                    const fileMatch = displayText.match(/\[FILE:([^\]]+):([^\]]+)\]/);
                    
                    if (imageMatch) {
                      imageUrl = imageMatch[1];
                      displayText = displayText.replace(/\[IMAGE:[^\]]+\]/g, '').trim();
                    }
                    if (fileMatch) {
                      fileInfo = { url: fileMatch[1], filename: fileMatch[2] };
                      displayText = displayText.replace(/\[FILE:[^\]]+\]/g, '').trim();
                    }
                    
                    // Ưu tiên file từ object nếu có
                    if (m.file) {
                      if (m.file.url && m.file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                        imageUrl = m.file.url;
                      } else {
                        fileInfo = m.file;
                      }
                    }
                    
                    return (
                      <div 
                        key={m.idtinnhan || m.ngay_tao + m.idnguoigui} 
                        className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${mine ? 'ml-auto' : ''}`}>
                          <div className={`
                            rounded-2xl px-4 py-2.5 text-[14px] leading-[20px] break-words shadow-sm
                            ${mine 
                              ? 'bg-[var(--brand-600)] text-white' 
                              : 'bg-white text-gray-900 border border-gray-200'
                            }
                          `}>
                            {displayText && <div className="whitespace-pre-wrap">{displayText}</div>}
                            
                            {/* Hiển thị ảnh */}
                            {imageUrl && (
                              <div className="mt-2 -mx-1">
                                <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden">
                                  <img
                                    src={imageUrl}
                                    alt="Hình ảnh đính kèm"
                                    className="max-w-full max-h-64 w-auto rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                                  />
                                </a>
                              </div>
                            )}
                            
                            {/* Hiển thị file */}
                            {fileInfo && !imageUrl && (
                              <div className="mt-2">
                                <a
                                  href={`http://localhost:8000/api/chat-support/download-file?url=${encodeURIComponent(fileInfo.url)}&filename=${encodeURIComponent(fileInfo.filename || 'file')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                                    mine
                                      ? 'bg-[var(--brand-700)] text-white hover:bg-[var(--brand-700)]/90'
                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200'
                                  }`}
                                >
                                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-sm font-medium truncate max-w-[200px]">{fileInfo.filename || 'Tải file đính kèm'}</span>
                                </a>
                              </div>
                            )}
                          </div>
                          <div className={`text-[11px] text-gray-500 mt-1.5 ${mine ? 'text-right' : 'text-left'}`}>
                            {formatDateTime(m.ngay_tao)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={listEndRef} />
                </div>

                {/* Input composer - không absolute, là phần tử cuối */}
                <div className="border-t border-gray-200 px-4 md:px-6 bg-white shrink-0">
                  {/* Hiển thị file đã chọn */}
                  {attachedFile && (
                    <div className="py-3 flex items-center gap-3 bg-[var(--brand-50)] rounded-xl px-3 mb-2 border border-[var(--brand-100)]">
                      {attachedFile.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img src={attachedFile.url} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-sm" />
                      ) : (
                        <div className="w-14 h-14 bg-[var(--brand-100)] rounded-lg flex items-center justify-center border border-[var(--brand-200)]">
                          <svg className="w-7 h-7 text-[var(--brand-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {attachedFile.filename || 'File đã chọn'}
                        </p>
                        <p className="text-xs text-gray-500">Sẵn sàng để gửi</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedFile(null)}
                        className="h-8 w-8 rounded-full bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center border border-gray-200"
                        title="Xóa file"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="h-14 flex items-center gap-2 py-2"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="h-10 w-10 rounded-xl bg-[var(--brand-100)] text-[var(--brand-700)] hover:bg-[var(--brand-200)] transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center shrink-0 border border-[var(--brand-200)]"
                      title="Đính kèm file"
                    >
                      {uploading ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a2 2 0 00-2.828-2.828L9 10.172 7.586 8.586a2 2 0 10-2.828 2.828l1.414 1.414a4 4 0 105.657 5.657l6.414-6.414a4 4 0 00-5.657-5.657L9 10.172l-1.414-1.414a4 4 0 10-5.657 5.657l1.414 1.414" />
                        </svg>
                      )}
                    </button>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={1}
                      className="flex-1 h-10 max-h-[120px] px-4 py-2.5 rounded-xl bg-gray-50 resize-none border border-gray-200
                               text-[14px] leading-[20px]
                               overflow-y-auto
                                 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)]
                                 placeholder:text-gray-400 disabled:bg-gray-100 transition-all"
                      placeholder={attachedFile ? "Nhập tin nhắn (tùy chọn)..." : "Nhập tin nhắn..."}
                      disabled={uploading}
                  />
                  <button
                      type="submit"
                      disabled={(!input.trim() && !attachedFile) || sending || uploading || !activeUserId}
                      className="h-10 px-5 rounded-xl bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-offset-2 shrink-0 font-semibold text-[14px] shadow-sm hover:shadow-md"
                    >
                      {sending || uploading ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Gửi
                        </span>
                      )}
                  </button>
                  </form>
                </div>
              </main>
            </div>
          </section>
        </div>
      )}

      {/* Loading and Error States */}
      {loading && (
        <div className="text-[14px] text-gray-500">Đang tải lịch...</div>
      )}
      {error && (
        <div className="text-[14px] text-red-600">{error}</div>
      )}
    </div>
  );
}
