# Tóm tắt các thay đổi - Cập nhật bộ lọc lịch tư vấn

## [object Object]êu cầu
- Hiển thị **TẤT CẢ** lịch tư vấn (không chỉ lịch sắp tới)
- Thêm bộ lọc: **Tháng**, **Tuần**, **Ngày đã qua**, **Ngày sắp tới**

## ✅ Các thay đổi thực hiện

### 1. Backend - Model `LichTuVan.php`
**Thêm 4 scope mới để hỗ trợ các bộ lọc:**

```php
// Lịch trong tuần này
public function scopeThisWeek($query)
{
    $startOfWeek = Carbon::now()->startOfWeek();
    $endOfWeek = Carbon::now()->endOfWeek();
    return $query->whereBetween('ngayhen', [$startOfWeek, $endOfWeek]);
}

// Lịch trong tháng này
public function scopeThisMonth($query)
{
    return $query->whereMonth('ngayhen', Carbon::now()->month)
                 ->whereYear('ngayhen', Carbon::now()->year);
}

// Lịch đã qua (ngày < hôm nay)
public function scopePast($query)
{
    return $query->where('ngayhen', '<', Carbon::today());
}

// Lịch sắp tới (ngày >= hôm nay)
public function scopeFuture($query)
{
    return $query->where('ngayhen', '>=', Carbon::today());
}
```

### 2. Backend - Controller `AuthController.php` (Hàm `getConsultationNotes`)
**Sửa logic lọc:**

**Trước:**
```php
$dateFilter = $request->input('date_filter'); // 'today', '7days', 'month'
$filterUpcoming = $request->input('filter_upcoming', false);

// Chỉ hiển thị lịch sắp tới khi filterUpcoming = true
if ($filterUpcoming && $viewMode === 'input') {
    $query->where('ngayhen', '>=', Carbon::today());
}
```

**Sau:**
```php
$dateFilter = $request->input('date_filter'); // 'today', 'week', 'month', 'past', 'future', 'all'

// Hiển thị TẤT CẢ lịch theo bộ lọc được chọn
if ($dateFilter === 'today') {
    $query->where('ngayhen', Carbon::today());
} elseif ($dateFilter === 'week') {
    $query->thisWeek();
} elseif ($dateFilter === 'month') {
    $query->thisMonth();
} elseif ($dateFilter === 'past') {
    $query->past();
} elseif ($dateFilter === 'future') {
    $query->future();
}
// Nếu dateFilter là empty hoặc 'all', không filter → hiển thị tất cả
```

### 3. Frontend - Component `Notes.jsx`
**Thay đổi UI từ select dropdown sang button group:**

**Trước:**
```jsx
<select
  value={dateFilter}
  onChange={(e) => setDateFilter(e.target.value)}
  className="input"
>
  <option value="">Tất cả</option>
  <option value="today">Hôm nay</option>
  <option value="7days">7 ngày</option>
  <option value="month">Tháng này</option>
</select>
```

**Sau:**
```jsx
<div className="flex flex-wrap gap-2">
  {[
    { value: '', label: 'Tất cả' },
    { value: 'today', label: 'Hôm nay' },
    { value: 'week', label: 'Tuần này' },
    { value: 'month', label: 'Tháng này' },
    { value: 'past', label: 'Ngày đã qua' },
    { value: 'future', label: 'Ngày sắp tới' },
  ].map(option => (
    <button
      key={option.value}
      onClick={() => setDateFilter(option.value)}
      className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
        dateFilter === option.value
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      }`}
    >
      {option.label}
    </button>
  ))}
</div>
```

**Cập nhật logic gửi request:**
```jsx
// Loại bỏ filter_upcoming
const params = {
  consultant_id: consultantId,
  date_filter: dateFilter, // 'today', 'week', 'month', 'past', 'future', 'all'
  view_mode: viewMode,
};
```

## [object Object]ết quả
- ✅ Hiển thị **TẤT CẢ** lịch tư vấn mặc định
- ✅ Thêm **6 bộ lọc**: Tất cả, Hôm nay, Tuần này, Tháng này, Ngày đã qua, Ngày sắp tới
- ✅ UI thân thiện hơn với button group thay vì dropdown
- ✅ Loại bỏ logic `filter_upcoming` không cần thiết

## 📝 Ghi chú
- Mặc định khi không chọn bộ lọc, hệ thống hiển thị **tất cả lịch**
- Bộ lọc áp dụng cho cả chế độ "Nhập ghi chú" và "Xem ghi chú đã gửi"
- Các scope mới sử dụng Carbon để tính toán ngày tháng chính xác













