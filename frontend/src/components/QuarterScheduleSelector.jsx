import { useState, useEffect } from 'react';
import CalendarGrid from './CalendarGrid';
import TimeSlotSelector from './TimeSlotSelector';
import RepeatOptions from './RepeatOptions';
import { useToast } from './Toast';

export default function QuarterScheduleSelector() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedDates, setSelectedDates] = useState([]);
  // Map ngày -> danh sách slotId đã chọn cho ngày đó (đồng bộ từ CalendarGrid)
  const [selectedSlotsByDateMap, setSelectedSlotsByDateMap] = useState({});
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [repeatOptions, setRepeatOptions] = useState({
    applyToAllSelected: false,
    repeatByWeekday: false,
    weekdays: []
  });
  const [scheduleDetails, setScheduleDetails] = useState({
    meeting_platform: '',
    meeting_link: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [existingSchedules, setExistingSchedules] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  
  const toast = useToast();

  // Fetch existing schedules
  const fetchExistingSchedules = async () => {
    try {
      const months = getQuarterMonths(selectedQuarter);
      const schedules = {};
      
      for (const month of months) {
        // Gọi API lấy lịch theo tháng; yêu cầu trả về cả trạng thái duyệt (duyetlich)
        const response = await fetch(`/api/consultation-schedules?year=${currentYear}&month=${month}`);
        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
          list.forEach(schedule => {
            const dateStr = schedule.ngayhen || schedule.date;
            if (!dateStr) return;

            // Chuẩn hoá danh sách khung giờ để luôn có duyetlich cho mỗi ca
            const rawSlots = schedule.khunggio
              ? (() => { try { return JSON.parse(schedule.khunggio); } catch { return []; } })()
              : (schedule.timeSlots || []);

            const normalizedSlots = (rawSlots || []).map((slot) => {
              // slot có thể là {start, end} hoặc có thêm duyetlich
              const start = slot.start || slot.giobatdau || slot.start_time;
              const end = slot.end || slot.gioketthuc || slot.end_time;
              const approvalStatus =
                slot.duyetlich ?? schedule.duyetlich ?? slot.approvalStatus ?? null; // 1: Chưa duyệt, 2: Đã duyệt, 3: Từ chối (tuỳ hệ thống)
              return { start, end, duyetlich: approvalStatus };
            });

            // Một số API trả về mỗi bản ghi là 1 ca; khi đó giobatdau/gioketthuc nằm ở cấp schedule
            if (normalizedSlots.length === 0 && (schedule.giobatdau || schedule.start_time)) {
              const start = schedule.giobatdau || schedule.start_time;
              const end = schedule.gioketthuc || schedule.end_time;
              normalizedSlots.push({ start, end, duyetlich: schedule.duyetlich ?? null });
            }

            // Gộp các bản ghi theo ngày
            const existing = schedules[dateStr];
            schedules[dateStr] = {
              hasSchedule: true,
              status: schedule.trangthai || schedule.status,
              // Gộp timeSlots giữa các bản ghi cùng ngày và loại bỏ ca trùng lặp theo start-end
              timeSlots: (() => {
                const merged = [
                  ...(existing?.timeSlots || []),
                  ...normalizedSlots,
                ];
                const uniqueByKey = new Map();
                merged.forEach((s) => {
                  const key = `${s.start}-${s.end}`;
                  // Ưu tiên lấy duyetlich khác null nếu có nhiều nguồn
                  if (!uniqueByKey.has(key) || (s?.duyetlich ?? null) != null) {
                    uniqueByKey.set(key, s);
                  }
                });
                return Array.from(uniqueByKey.values());
              })(),
            };
          });
        }
      }
      
      setExistingSchedules(schedules);
    } catch (error) {
      console.error('Error fetching existing schedules:', error);
    }
  };

  // Fetch schedules khi quý hoặc năm thay đổi
  useEffect(() => {
    fetchExistingSchedules();
  }, [selectedQuarter, currentYear]);

  // Định nghĩa các ca học
  const timeSlots = [
    { id: 1, name: 'Ca 1', start: '07:00', end: '09:00', label: '07:00 - 09:00' },
    { id: 2, name: 'Ca 2', start: '09:05', end: '11:05', label: '09:05 - 11:05' },
    { id: 3, name: 'Ca 3', start: '13:05', end: '15:05', label: '13:05 - 15:05' },
    { id: 4, name: 'Ca 4', start: '15:10', end: '17:10', label: '15:10 - 17:10' },
    { id: 5, name: 'Ca 5', start: '17:15', end: '19:15', label: '17:15 - 19:15' }
  ];

  // Lấy các tháng trong quý
  const getQuarterMonths = (quarter) => {
    const monthMap = {
      1: [1, 2, 3],   // Q1: Tháng 1, 2, 3
      2: [4, 5, 6],   // Q2: Tháng 4, 5, 6
      3: [7, 8, 9],   // Q3: Tháng 7, 8, 9
      4: [10, 11, 12] // Q4: Tháng 10, 11, 12
    };
    return monthMap[quarter] || [1, 2, 3];
  };

  // Lấy tên quý
  const getQuarterName = (quarter) => {
    const quarterNames = {
      1: 'Quý 1 (Tháng 1-3)',
      2: 'Quý 2 (Tháng 4-6)',
      3: 'Quý 3 (Tháng 7-9)',
      4: 'Quý 4 (Tháng 10-12)'
    };
    return quarterNames[quarter] || 'Quý 1';
  };

  // Xử lý chọn ngày - bây giờ được gọi để toggle ngày
  const handleDateSelect = (date) => {
    console.log('handleDateSelect called with:', date);
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDates(prev => {
      console.log('Current selectedDates:', prev);
      // Toggle ngày: thêm nếu chưa có, xóa nếu đã có
      const newDates = prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr];
      console.log('New selectedDates:', newDates);
      return newDates;
    });
    
    // Tự động bỏ chọn các ca đã có khi chọn ngày mới
    const bookedSlots = getBookedTimeSlots();
    setSelectedSlotsByDateMap(prev => {
      const newMap = { ...prev };
      Object.keys(newMap).forEach(dateStr => {
        newMap[dateStr] = newMap[dateStr].filter(slotId => !bookedSlots.includes(slotId));
        if (newMap[dateStr].length === 0) {
          delete newMap[dateStr];
        }
      });
      return newMap;
    });
  };

  // Kiểm tra ca đã được đăng ký cho ngày đã chọn
  const getBookedTimeSlots = () => {
    const bookedSlots = new Set();
    selectedDates.forEach(dateStr => {
      // Lấy thông tin lịch hiện có cho ngày này
      const existingSchedule = existingSchedules[dateStr];
      if (existingSchedule && existingSchedule.timeSlots) {
        existingSchedule.timeSlots.forEach(slot => {
          // Tìm ca tương ứng với thời gian này
          const matchingSlot = timeSlots.find(ts => 
            ts.start === slot.start && ts.end === slot.end
          );
          if (matchingSlot) {
            bookedSlots.add(matchingSlot.id);
          }
        });
      }
    });
    
    // Debug log để kiểm tra
    if (selectedDates.length > 0) {
      console.log('Selected dates:', selectedDates);
      console.log('Existing schedules:', existingSchedules);
      console.log('Booked slots:', Array.from(bookedSlots));
    }
    
    return Array.from(bookedSlots);
  };

  // Xử lý chọn ca học
  const handleTimeSlotToggle = (slotId) => {
    const bookedSlots = getBookedTimeSlots();
    
    // Không cho phép chọn ca đã được đăng ký
    if (bookedSlots.includes(slotId)) {
      console.log('Blocked slot:', slotId, 'Booked slots:', bookedSlots);
      toast.push({ 
        type: 'warning', 
        title: 'Ca này đã được đăng ký', 
        message: 'Vui lòng chọn ca khác' 
      });
      return;
    }

    setSelectedTimeSlots(prev => {
      if (prev.includes(slotId)) {
        return prev.filter(id => id !== slotId);
      } else {
        return [...prev, slotId];
      }
    });
  };

  // Xử lý hiển thị modal xác nhận
  const handleShowConfirmModal = () => {
    if (selectedDates.length === 0) {
      toast.push({ type: 'error', title: 'Vui lòng chọn ít nhất một ngày' });
      return;
    }

    const totalSelectedSlots = Object.values(selectedSlotsByDateMap).flat().length;
    if (totalSelectedSlots === 0) {
      toast.push({ type: 'error', title: 'Vui lòng chọn ít nhất một ca học' });
      return;
    }

    // Kiểm tra ràng buộc dữ liệu
    if (!scheduleDetails.meeting_platform) {
      toast.push({ type: 'error', title: 'Vui lòng chọn nền tảng họp' });
      return;
    }

    if (!scheduleDetails.meeting_link) {
      toast.push({ type: 'error', title: 'Vui lòng nhập link phòng họp' });
      return;
    }

    setShowConfirmModal(true);
  };

  // Đóng modal xác nhận
  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
  };

  // Xử lý đăng ký lịch trống
  const handleSubmit = async () => {
    if (selectedDates.length === 0) {
      toast.push({ type: 'error', title: 'Vui lòng chọn ít nhất một ngày' });
      return;
    }

    const totalSelectedSlots = Object.values(selectedSlotsByDateMap).flat().length;
    if (totalSelectedSlots === 0) {
      toast.push({ type: 'error', title: 'Vui lòng chọn ít nhất một ca học' });
      return;
    }

    // Kiểm tra ràng buộc dữ liệu
    if (!scheduleDetails.meeting_platform) {
      toast.push({ type: 'error', title: 'Vui lòng chọn nền tảng họp' });
      return;
    }

    if (!scheduleDetails.meeting_link) {
      toast.push({ type: 'error', title: 'Vui lòng nhập link phòng họp' });
      return;
    }

    setSubmitting(true);

    try {
      const currentUserId = localStorage.getItem('userId') || '5';
      
      // Tạo dữ liệu để gửi lên server
      const schedules = [];
      // Helper: tìm slot theo id (hỗ trợ cả 'slot1' và số 1)
      const resolveSlot = (slotId) => {
        if (typeof slotId === 'string' && slotId.startsWith('slot')) {
          const idx = parseInt(slotId.replace('slot', ''), 10);
          return timeSlots.find(s => s.id === idx);
        }
        return timeSlots.find(s => s.id === slotId);
      };
      
      Object.entries(selectedSlotsByDateMap).forEach(([dateStr, slotIds]) => {
        slotIds.forEach(slotId => {
          const slot = resolveSlot(slotId);
          if (slot) {
          schedules.push({
              consultant_id: currentUserId,
              date: dateStr,
            start_time: slot.start,
            end_time: slot.end,
            meeting_platform: scheduleDetails.meeting_platform,
            meeting_link: scheduleDetails.meeting_link,
            notes: scheduleDetails.notes || `Lịch tư vấn trống - ${getQuarterName(selectedQuarter)} ${currentYear} (${slot.start}-${slot.end})`
          });
          }
        });
      });

      // Gửi từng lịch lên server
      let successCount = 0;
      let errorCount = 0;
      const failedItems = [];

      for (const schedule of schedules) {
        try {
          console.log('Submitting schedule payload:', schedule);
          const response = await fetch('http://localhost:8000/api/consultation-schedules', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(schedule)
          });

          const data = await response.json();
          
          if (response.ok && data.success) {
            successCount++;
          } else {
            errorCount++;
            console.error('Error creating schedule:', data.message, data.errors);
            // Show first validation error if present
            const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : data?.message;
            if (firstError) {
              toast.push({ type: 'error', title: firstError });
            }
            failedItems.push({
              date: schedule.date,
              start: schedule.start_time,
              end: schedule.end_time,
              reason: response.status === 409 
                ? `Lịch đăng kí đã trùng với khung giờ khác`
                : (firstError || `Lỗi ${response.status}`)
            });
            if (response.status === 409) {
              toast.push({ 
                type: 'warning', 
                title: `Lịch đăng kí đã trùng với ${schedule.date} ${schedule.start_time}-${schedule.end_time}`
              });
            }
          }
        } catch (error) {
          errorCount++;
          console.error('Network error:', error);
          failedItems.push({
            date: schedule.date,
            start: schedule.start_time,
            end: schedule.end_time,
            reason: 'Lỗi mạng'
          });
        }
      }

      if (successCount > 0 && errorCount === 0) {
        toast.push({ type: 'success', title: 'Đăng kí lịch tư vấn thành công' });
        setShowSuccessNotification(true);
        
        // Tự động ẩn thông báo sau 5 giây
        setTimeout(() => {
          setShowSuccessNotification(false);
        }, 5000);
        
        // Refresh existing schedules
        await fetchExistingSchedules();
        
        // Reset form
        setSelectedDates([]);
        setSelectedTimeSlots([]);
        setSelectedSlotsByDateMap({});
        setScheduleDetails({
          meeting_platform: '',
          meeting_link: '',
          notes: ''
        });
      } else if (successCount > 0 && errorCount > 0) {
        toast.push({ type: 'success', title: `Đăng ký thành công ${successCount} lịch trống` });
        setShowSuccessNotification(true);
        
        // Tự động ẩn thông báo sau 5 giây
        setTimeout(() => {
          setShowSuccessNotification(false);
        }, 5000);
        
        // Refresh existing schedules
        await fetchExistingSchedules();
        
        // Reset form
        setSelectedDates([]);
        setSelectedTimeSlots([]);
        setSelectedSlotsByDateMap({});
        setScheduleDetails({
          meeting_platform: '',
          meeting_link: '',
          notes: ''
        });
      }

      // Đóng modal sau khi hoàn thành
      setShowConfirmModal(false);

      if (errorCount > 0 && successCount === 0) {
        toast.push({ type: 'error', title: 'Chưa thành công' });
      }

      if (errorCount > 0) {
        const preview = failedItems.slice(0, 3).map(i => `• ${i.date} ${i.start}-${i.end}: ${i.reason}`).join('\n');
        toast.push({ 
          type: 'warning', 
          title: `${errorCount} lịch không thể đăng ký`,
          message: preview || undefined
        });
      }

    } catch (error) {
      console.error('Error:', error);
      toast.push({ type: 'error', title: 'Có lỗi xảy ra khi đăng ký lịch' });
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setSelectedDates([]);
    setSelectedTimeSlots([]);
    setRepeatOptions({
      applyToAllSelected: false,
      repeatByWeekday: false,
      weekdays: []
    });
    setScheduleDetails({
      meeting_platform: '',
      meeting_link: '',
      notes: ''
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header đơn giản */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📅</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Đăng Ký Lịch Trống Theo Quý</h1>
                <p className="text-sm text-gray-600">Đăng ký lịch trống cho cả quý với các ca học cố định</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <button 
                  onClick={() => setCurrentYear(currentYear - 1)} 
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← {currentYear - 1}
                </button>
                <span className="text-orange-500 font-semibold text-lg px-2">{currentYear}</span>
                <button 
                  onClick={() => setCurrentYear(currentYear + 1)} 
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  {currentYear + 1} →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quarter Selection đơn giản */}
      <div className="max-w-[1800px] mx-auto px-8 py-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Chọn Quý</h2>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map(quarter => (
              <button
                key={quarter}
                onClick={() => setSelectedQuarter(quarter)}
                className={`px-4 py-3 rounded-lg border transition-all duration-200 font-medium ${
                  selectedQuarter === quarter
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {getQuarterName(quarter)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Clean Layout */}
      <div className="max-w-[1800px] mx-auto px-8 pb-8 space-y-6">
        
        
        {/* Calendar Grid */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Lịch Theo Quý</h3>
            <div className="text-sm text-gray-600">
              💡 <strong>Tip:</strong> Click vào ngày để chọn, ngày được chọn sẽ có màu cam
            </div>
          </div>
          <CalendarGrid
            year={currentYear}
            months={getQuarterMonths(selectedQuarter)}
            selectedDates={selectedDates}
            onDateSelect={handleDateSelect}
            existingSchedules={existingSchedules}
            onSlotToggle={({ selectedSlotsByDateMap: newSelectedSlotsByDateMap }) => {
              console.log('Slot toggle received:', { newSelectedSlotsByDateMap });
              setSelectedSlotsByDateMap(newSelectedSlotsByDateMap);
              
              // Tự động cập nhật selectedDates dựa trên selectedSlotsByDateMap
              const datesWithSlots = Object.keys(newSelectedSlotsByDateMap).filter(dateStr => 
                newSelectedSlotsByDateMap[dateStr] && newSelectedSlotsByDateMap[dateStr].length > 0
              );
              setSelectedDates(datesWithSlots);
            }}
          />
        </div>

        {/* Time Slots - removed. Slots are selected directly on the calendar now. */}

        {/* Repeat Options removed */}

        {/* Schedule Details & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Schedule Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Thông Tin Chi Tiết</h3>
              <div className="text-sm text-gray-600">
                ⚠️ <strong>Bắt buộc:</strong> Nền tảng và Link phòng họp
              </div>
            </div>
            
            {/* Summary */}
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tóm tắt đăng ký</h4>
              {selectedDates.length > 0 ? (
                <div className="text-sm text-gray-600 space-y-1">
                  {(() => {
                    const totalSlots = Object.values(selectedSlotsByDateMap).flat().length;
                    return (
                      <div>
                        📅 <strong>{selectedDates.length} ngày</strong> × 🕐 <strong>{totalSlots} ca</strong>
                        {scheduleDetails.notes && (
                          <div className="mt-1 text-xs text-blue-600">
                            📝 <strong>Ghi chú:</strong> {scheduleDetails.notes.length > 50 ? scheduleDetails.notes.substring(0, 50) + '...' : scheduleDetails.notes}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {selectedDates.map(dateStr => {
                    const slotIds = selectedSlotsByDateMap[dateStr] || [];
                    if (slotIds.length === 0) return null;
                    const dateObj = new Date(dateStr);
                    const formattedDate = dateObj.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
                    return (
                      <div key={dateStr}>• Ngày {formattedDate}: {slotIds.length} ca</div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Chưa chọn ngày hoặc ca</div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Nền tảng <span className="text-red-500">*</span>
                </label>
                <select
                  value={scheduleDetails.meeting_platform}
                  onChange={(e) => setScheduleDetails({
                    ...scheduleDetails,
                    meeting_platform: e.target.value
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    !scheduleDetails.meeting_platform ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Chọn nền tảng</option>
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom">Zoom</option>
                  <option value="Microsoft Teams">Microsoft Teams</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Link phòng họp <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={scheduleDetails.meeting_link}
                  onChange={(e) => setScheduleDetails({
                    ...scheduleDetails,
                    meeting_link: e.target.value
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    !scheduleDetails.meeting_link ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="https://..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Ghi chú <span className="text-gray-400 text-xs">(Tùy chọn)</span>
                </label>
                <textarea
                  value={scheduleDetails.notes}
                  onChange={(e) => setScheduleDetails({
                    ...scheduleDetails,
                    notes: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  rows="4"
                  placeholder="Nhập ghi chú về lịch trống (ví dụ: Lịch tư vấn chuyên sâu về ngành Công nghệ thông tin, ưu tiên học sinh có điểm thi cao...)"
                  maxLength="500"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    💡 Ghi chú sẽ được áp dụng cho tất cả lịch đã chọn
                  </span>
                  <span className="text-xs text-gray-400">
                    {scheduleDetails.notes.length}/500 ký tự
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Hành Động</h3>
              <div className="text-sm text-gray-600">
                {(() => {
                  const totalSlots = Object.values(selectedSlotsByDateMap).flat().length;
                  const ready = selectedDates.length > 0 && totalSlots > 0 && scheduleDetails.meeting_platform && scheduleDetails.meeting_link;
                  return (
                    <>
                      ✅ <strong>Sẵn sàng:</strong> {ready ? 'Có thể đăng ký' : 'Chưa đủ thông tin'}
                    </>
                  );
                })()}
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleShowConfirmModal}
                disabled={(() => { const ts = Object.values(selectedSlotsByDateMap).flat().length; return submitting || selectedDates.length === 0 || ts === 0 || !scheduleDetails.meeting_platform || !scheduleDetails.meeting_link; })()}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${(() => { const ts = Object.values(selectedSlotsByDateMap).flat().length; return submitting || selectedDates.length === 0 || ts === 0 || !scheduleDetails.meeting_platform || !scheduleDetails.meeting_link; })()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-500 text-white hover:bg-orange-600'}`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang đăng ký...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>📝</span>
                    Đăng Ký Lịch Trống
                  </div>
                )}
              </button>

              <button
                onClick={handleReset}
                className="w-full py-2 px-4 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Đặt Lại
              </button>

              <button className="w-full py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                Hủy Đăng Ký
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal xác nhận đăng ký */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">⚠️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận đăng ký lịch trống</h3>
                <p className="text-sm text-gray-600">Bạn có chắc chắn muốn đăng ký lịch trống này?</p>
              </div>
            </div>

            {/* Thông tin tóm tắt */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Thông tin đăng ký:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>📅 <strong>{selectedDates.length} ngày</strong> đã chọn</div>
                <div>🕐 <strong>{Object.values(selectedSlotsByDateMap).flat().length} ca học</strong> đã chọn</div>
                <div>💻 <strong>Nền tảng:</strong> {scheduleDetails.meeting_platform}</div>
                <div>🔗 <strong>Link phòng họp:</strong> {scheduleDetails.meeting_link}</div>
                {scheduleDetails.notes && (
                  <div>📝 <strong>Ghi chú:</strong> {scheduleDetails.notes.length > 50 ? scheduleDetails.notes.substring(0, 50) + '...' : scheduleDetails.notes}</div>
                )}
              </div>
            </div>

            {/* Chi tiết ngày và ca */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Chi tiết lịch:</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {selectedDates.map(dateStr => {
                  const slotIds = selectedSlotsByDateMap[dateStr] || [];
                  if (slotIds.length === 0) return null;
                  const dateObj = new Date(dateStr);
                  const formattedDate = dateObj.toLocaleDateString('vi-VN', { 
                    day: 'numeric', 
                    month: 'numeric', 
                    year: 'numeric' 
                  });
                  return (
                    <div key={dateStr} className="text-xs text-gray-600 bg-white border border-gray-200 rounded p-2">
                      <div className="font-medium">📅 {formattedDate}</div>
                      <div className="text-gray-500">
                        {slotIds.map(slotId => {
                          const slot = timeSlots.find(s => s.id === slotId);
                          return slot ? (
                            <span key={slotId} className="inline-block bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs mr-1 mb-1">
                              {slot.start}-{slot.end}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseConfirmModal}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmit();
                }}
                className="flex-1 py-2 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                Xác nhận đăng ký
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thông báo thành công popup */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-80">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">✅</span>
            </div>
            <div className="flex-1">
              <div className="font-semibold">Đăng ký lịch tư vấn thành công!</div>
              <div className="text-sm text-green-100 mt-1">
                Lịch trống đã được đăng ký thành công. Bạn có thể kiểm tra trong lịch của mình.
              </div>
            </div>
            <button
              onClick={() => setShowSuccessNotification(false)}
              className="text-green-200 hover:text-white transition-colors ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
