export default function RepeatOptions({ options, onOptionsChange }) {
  const weekdays = [
    { id: 1, name: 'T2', label: 'Thứ 2' },
    { id: 2, name: 'T3', label: 'Thứ 3' },
    { id: 3, name: 'T4', label: 'Thứ 4' },
    { id: 4, name: 'T5', label: 'Thứ 5' },
    { id: 5, name: 'T6', label: 'Thứ 6' },
    { id: 6, name: 'T7', label: 'Thứ 7' },
    { id: 0, name: 'CN', label: 'Chủ nhật' }
  ];

  const handleApplyToAllChange = (checked) => {
    onOptionsChange({
      ...options,
      applyToAllSelected: checked
    });
  };

  const handleRepeatByWeekdayChange = (checked) => {
    onOptionsChange({
      ...options,
      repeatByWeekday: checked,
      weekdays: checked ? options.weekdays : []
    });
  };

  const handleWeekdayToggle = (weekdayId) => {
    const newWeekdays = options.weekdays.includes(weekdayId)
      ? options.weekdays.filter(id => id !== weekdayId)
      : [...options.weekdays, weekdayId];
    
    onOptionsChange({
      ...options,
      weekdays: newWeekdays
    });
  };

  return (
    <div className="space-y-4">
        {/* Áp dụng cho tất cả ngày đã chọn */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="apply-to-all"
            checked={options.applyToAllSelected}
            onChange={(e) => handleApplyToAllChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label 
            htmlFor="apply-to-all"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            Áp dụng cho tất cả ngày đã chọn
          </label>
        </div>

        {/* Lặp lại theo thứ */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="repeat-by-weekday"
            checked={options.repeatByWeekday}
            onChange={(e) => handleRepeatByWeekdayChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label 
            htmlFor="repeat-by-weekday"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            Lặp lại theo Thứ
          </label>
        </div>

        {/* Chọn thứ trong tuần */}
        {options.repeatByWeekday && (
          <div className="ml-7">
            <div className="grid grid-cols-7 gap-2">
              {weekdays.map(weekday => (
                <div key={weekday.id} className="text-center">
                  <input
                    type="checkbox"
                    id={`weekday-${weekday.id}`}
                    checked={options.weekdays.includes(weekday.id)}
                    onChange={() => handleWeekdayToggle(weekday.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label 
                    htmlFor={`weekday-${weekday.id}`}
                    className="block text-xs text-gray-600 mt-1 cursor-pointer"
                  >
                    {weekday.name}
                  </label>
                </div>
              ))}
            </div>
            
            {/* Hiển thị thứ đã chọn */}
            {options.weekdays.length > 0 && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-700">
                  Đã chọn: {options.weekdays.map(id => 
                    weekdays.find(w => w.id === id)?.label
                  ).join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

    </div>
  );
}
