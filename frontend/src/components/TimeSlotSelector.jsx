export default function TimeSlotSelector({ timeSlots, selectedSlots, onSlotToggle }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-semibold mb-4">Chọn Khung Giờ</h3>
      
      <div className="space-y-3">
        {timeSlots.map(slot => {
          const isSelected = selectedSlots.includes(slot.id);
          
          return (
            <div key={slot.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`slot-${slot.id}`}
                  checked={isSelected}
                  onChange={() => onSlotToggle(slot.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label 
                  htmlFor={`slot-${slot.id}`}
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {slot.name} ({slot.label})
                </label>
              </div>
              
              {/* Toggle Switch */}
              <div className="flex items-center">
                <button
                  onClick={() => onSlotToggle(slot.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isSelected ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isSelected ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Thông tin nghỉ trưa */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          <span className="text-sm text-yellow-800 font-medium">
            Nghỉ trưa: 11:00 - 13:00
          </span>
        </div>
        <p className="text-xs text-yellow-700 mt-1">
          Tổng cộng: 5 ca dạy/ngày
        </p>
      </div>
      
      {/* Tóm tắt đã chọn */}
      {selectedSlots.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Đã chọn {selectedSlots.length} ca:
          </h4>
          <div className="space-y-1">
            {selectedSlots.map(slotId => {
              const slot = timeSlots.find(s => s.id === slotId);
              return (
                <div key={slotId} className="text-xs text-blue-700">
                  • {slot.name}: {slot.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
