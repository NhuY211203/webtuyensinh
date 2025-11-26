import { useState, useEffect } from 'react';

export default function CalendarGrid({ year, months, selectedDates, onDateSelect, existingSchedules: propExistingSchedules, onSlotToggle }) {
  const [existingSchedules, setExistingSchedules] = useState(propExistingSchedules || {});
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [selectedSlotsByDate, setSelectedSlotsByDate] = useState({});

  // Cập nhật existingSchedules khi prop thay đổi
  useEffect(() => {
    if (propExistingSchedules) {
      setExistingSchedules(propExistingSchedules);
    }
  }, [propExistingSchedules]);

  // Lấy tên tháng tiếng Việt
  const getMonthName = (month) => {
    const monthNames = [
      '', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    return monthNames[month] || '';
  };

  // Lấy số ngày trong tháng
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  // Lấy ngày đầu tiên của tháng là thứ mấy (0 = Chủ nhật, 1 = Thứ 2, ...)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month - 1, 1).getDay();
  };

  // Kiểm tra ngày có lịch hiện có không
  const hasExistingSchedule = (dateStr) => {
    return existingSchedules[dateStr]?.hasSchedule || false;
  };

  // Lấy thông tin chi tiết về lịch của ngày
  const getScheduleInfo = (dateStr) => {
    return existingSchedules[dateStr] || null;
  };

  // Kiểm tra ngày có được chọn không
  const isDateSelected = (dateStr) => {
    return selectedDates.some(date => {
      if (date instanceof Date) {
        return date.toISOString().split('T')[0] === dateStr;
      } else if (typeof date === 'string') {
        return date === dateStr;
      }
      return false;
    });
  };

  // Kiểm tra ngày có thể chọn không (không phải ngày quá khứ)
  const isDateSelectable = (dateStr) => {
    const today = new Date();
    const date = new Date(dateStr);
    return date >= today;
  };

  // Xử lý click vào ngày
  const handleDateClick = (dateStr, day) => {
    if (isDateSelectable(dateStr)) {
      onDateSelect(new Date(dateStr));
      
      // Không hiển thị modal nữa, chỉ chọn ngày
      // Logic ngăn chặn ca sẽ được xử lý trong QuarterScheduleSelector
    }
  };

  // Danh sách 5 ca mặc định trong ngày
  const defaultTimeSlots = [
    { id: 'slot1', start: '07:00', end: '09:00', name: 'Ca 1' },
    { id: 'slot2', start: '09:05', end: '11:05', name: 'Ca 2' },
    { id: 'slot3', start: '13:05', end: '15:05', name: 'Ca 3' },
    { id: 'slot4', start: '15:10', end: '17:10', name: 'Ca 4' },
    { id: 'slot5', start: '17:15', end: '19:15', name: 'Ca 5' },
  ];

  // Toggle chọn ca theo ngày
  const handleSlotToggle = (dateStr, slotId) => {
    if (!isDateSelectable(dateStr)) return;
    
    console.log('handleSlotToggle called:', { dateStr, slotId });
    
    setSelectedSlotsByDate(prev => {
      const prevForDate = new Set(prev[dateStr] || []);
      if (prevForDate.has(slotId)) {
        prevForDate.delete(slotId);
      } else {
        prevForDate.add(slotId);
      }
      const next = { ...prev, [dateStr]: Array.from(prevForDate) };
      
      // Gọi callback ngay lập tức
      if (typeof onSlotToggle === 'function') {
        onSlotToggle({ selectedSlotsByDateMap: next });
      }
      
      return next;
    });
  };

  // Tạo mảng ngày trong tháng
  const generateDaysForMonth = (year, month) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Thêm các ngày trống ở đầu tháng
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Thêm các ngày trong tháng
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      days.push({
        day,
        dateStr,
        isSelectable: isDateSelectable(dateStr),
        isSelected: isDateSelected(dateStr),
        hasExistingSchedule: hasExistingSchedule(dateStr)
      });
    }

    return days;
  };

  // Tải lịch hiện có
  useEffect(() => {
    const fetchExistingSchedules = async () => {
      try {
        const currentUserId = localStorage.getItem('userId') || '5';
        console.log('Fetching schedules for consultant:', currentUserId);
        
        const response = await fetch(`http://localhost:8000/api/consultation-schedules?consultant_id=${currentUserId}`);
        const data = await response.json();
        
        console.log('API Response:', data);
        
          if (data.success && data.data) {
          const schedulesMap = {};
          data.data.forEach(schedule => {
            // Xử lý định dạng ngày từ API
            let dateStr;
            if (schedule.ngayhen) {
              // Nếu ngayhen là string, chuyển thành Date rồi format
              if (typeof schedule.ngayhen === 'string') {
                dateStr = schedule.ngayhen.split('T')[0];
              } else {
                // Nếu là Date object
                dateStr = new Date(schedule.ngayhen).toISOString().split('T')[0];
              }
              schedulesMap[dateStr] = {
                hasSchedule: true,
                status: schedule.trangthai,
                timeSlots: schedulesMap[dateStr]?.timeSlots || []
              };
              
              // Thêm thông tin ca học
              if (schedule.giobatdau && schedule.ketthuc) {
                const slot = {
                  start: schedule.giobatdau,
                  end: schedule.ketthuc,
                  duyetlich: schedule.duyetlich ?? null,
                };
                // Tránh trùng lặp theo start-end
                const exists = (schedulesMap[dateStr].timeSlots || []).some(s => s.start === slot.start && s.end === slot.end);
                if (!exists) {
                  schedulesMap[dateStr].timeSlots.push(slot);
                }
              }
            }
          });
          
          console.log('Processed schedules map:', schedulesMap);
          setExistingSchedules(schedulesMap);
        } else {
          console.log('No schedules found or API error');
          setExistingSchedules({});
        }
      } catch (error) {
        console.error('Error fetching existing schedules:', error);
        setExistingSchedules({});
      }
    };

    fetchExistingSchedules();
  }, [year, months]); // Chỉ fetch khi year hoặc months thay đổi

  return (
    <div className="space-y-6">
      {/* Calendar Navigation */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => setCurrentMonthIndex(Math.max(0, currentMonthIndex - 1))}
          className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
        >
          ← {getMonthName(months[Math.max(0, currentMonthIndex - 1)] || months[0])}
        </button>
        
        <h2 className="text-orange-500 font-bold text-xl">
          {getMonthName(months[currentMonthIndex])} {year}
        </h2>
        
        <button 
          onClick={() => setCurrentMonthIndex(Math.min(months.length - 1, currentMonthIndex + 1))}
          className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
        >
          {getMonthName(months[Math.min(months.length - 1, currentMonthIndex + 1)] || months[months.length - 1])} →
        </button>
      </div>
      
              {/* Legend */}
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Chú thích màu sắc:</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-400 border-2 border-orange-600 rounded"></div>
                    <span>Ngày được chọn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-200 border-2 border-green-400 rounded"></div>
                    <span>Ca đã duyệt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
                    <span>Ca chờ duyệt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
                    <span>Ca bị từ chối</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  💡 <strong>Lưu ý:</strong> Các ca học chỉ hiển thị cho ngày hiện tại và tương lai
                </div>
              </div>

              {/* Single Month Calendar */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
        {(() => {
          const currentMonth = months[currentMonthIndex];
          const days = generateDaysForMonth(year, currentMonth);
          
          return (
            <>
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, index) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-3" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {days.map((dayData, index) => {
                  if (!dayData) {
                    return <div key={index} className="h-64 border-2 border-orange-300"></div>;
                  }
                  
                  const { day, dateStr, isSelectable, isSelected, hasExistingSchedule } = dayData;
                  const scheduleInfo = getScheduleInfo(dateStr);
                  
                  // Kiểm tra ngày Chủ nhật
                  const dayOfWeek = new Date(dateStr).getDay();
                  const isSunday = dayOfWeek === 0;
                  
                  let textColor = 'text-gray-700';
                  let bgColor = 'bg-white';
                  let borderColor = 'border-orange-300';
                  
                  // Ưu tiên cao nhất: Ngày được chọn
                  if (isSelected) {
                    bgColor = 'bg-orange-400';
                    textColor = 'text-white';
                    borderColor = 'border-orange-600';
                  } else if (hasExistingSchedule) {
                    const status = scheduleInfo?.status;
                    if (status === '1') { // Lịch trống
                      bgColor = 'bg-green-200';
                      textColor = 'text-green-900';
                    } else if (status === '2') { // Đã đăng ký
                      bgColor = 'bg-blue-200';
                      textColor = 'text-blue-900';
                    } else if (status === '4') { // Hoàn thành
                      bgColor = 'bg-gray-200';
                      textColor = 'text-gray-800';
                    }
                  } else if (!isSelectable) {
                    textColor = 'text-gray-400';
                  }
                  
                  // Màu đỏ cho Chủ nhật
                  if (isSunday) {
                    textColor = 'text-red-600';
                  }
                  
                  const isDisabledDay = !isSelectable;
                  return (
                    <div
                      key={index}
                      className={`h-64 border-2 ${borderColor} ${bgColor} p-3 cursor-${
                        isDisabledDay ? 'not-allowed' : 'pointer'
                      } hover:bg-gray-50 transition-colors ${
                        isSelected ? 'shadow-lg ring-2 ring-orange-300' : ''
                      } ${isDisabledDay ? 'opacity-90' : ''}`}
                      // onClick={() => handleDateClick(dateStr, day)} // Vô hiệu hóa click vào ngày
                      aria-disabled={isDisabledDay}
                    >
                      <div className={`text-sm font-medium ${textColor}`}>
                        {day}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {/* Chỉ hiển thị các ca cho ngày có thể chọn được */}
                        {isSelectable ? defaultTimeSlots.map(slot => {
                          const selectedForDate = selectedSlotsByDate[dateStr] || [];
                          const isChecked = selectedForDate.includes(slot.id);
                          const disabled = isDisabledDay;
                          
                          // Kiểm tra xem ca này đã có trong lịch hiện tại chưa
                          const existingSlot = scheduleInfo?.timeSlots?.find(existingSlot => 
                            existingSlot.start === slot.start && existingSlot.end === slot.end
                          );
                          
                          if (hasExistingSchedule && existingSlot) {
                            // Màu hiển thị theo duyetlich: 1=chờ, 2=đã duyệt, 3=từ chối
                            const approval = String(existingSlot.duyetlich ?? '');
                            let slotClasses = 'border rounded text-center ';
                            let textClasses = 'text-[10px] font-medium ';
                            if (approval === '2') {
                              slotClasses += 'border-green-400 bg-green-100';
                              textClasses += 'text-green-800';
                            } else if (approval === '1') {
                              slotClasses += 'border-yellow-300 bg-yellow-100';
                              textClasses += 'text-yellow-800';
                            } else if (approval === '3') {
                              slotClasses += 'border-red-300 bg-red-100';
                              textClasses += 'text-red-700';
                            } else {
                              slotClasses += 'border-gray-300 bg-gray-100';
                              textClasses += 'text-gray-700';
                            }
                            return (
                              <div key={slot.id} className={`w-full p-1 ${slotClasses}`}>
                                <span className={textClasses}>
                                  {slot.start} - {slot.end}
                                </span>
                              </div>
                            );
                          } else {
                            // Hiển thị ca trống với khung có thể click
                            return (
                              <div 
                                key={slot.id} 
                                className={`w-full p-1 border rounded text-center transition-all duration-200 ${
                                  isChecked 
                                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' 
                                    : 'border-gray-300 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                                } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!disabled) {
                                    handleSlotToggle(dateStr, slot.id);
                                  }
                                }}
                              >
                                <span className="text-[10px] font-medium">
                                  {slot.start} - {slot.end}
                                </span>
                              </div>
                            );
                          }
                        }) : (
                          // Hiển thị thông báo cho ngày đã qua
                          <div className="text-center">
                            <div className="text-[10px] text-gray-400 italic">
                              {isDisabledDay ? 'Ngày đã qua' : 'Không khả dụng'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
