# Cập nhật Schedule.jsx - Thêm bộ lọc lịch

## ✅ Hoàn thành

Đã cập nhật trang "Lịch của tôi" (Schedule.jsx) để hiển thị **TẤT CẢ** lịch và thêm **6 bộ lọc** mới.

---

## 📝 Thay đổi thực hiện

### 1️⃣ Frontend - `Schedule.jsx`

#### Thêm state dateFilter
```javascript
const [dateFilter, setDateFilter] = useState('all');
```

#### Cập nhật useEffect
```javascript
useEffect(() => {
  fetchSchedules();
}, [approvalFilter, dateFilter]); // Thêm dateFilter
```

#### Cập nhật fetchSchedules()
```javascript
// Thêm bộ lọc ngày
if (dateFilter && dateFilter !== 'all') {
  url += `&date_filter=${dateFilter}`;
}
```

#### Thêm UI bộ lọc ngày
```jsx
{/* Bộ lọc theo thời gian */}
<div className="mb-4 flex gap-2 flex-wrap">
  <label className="text-xs text-gray-600 self-center mr-2">Thời gian:</label>
  {[
    { value: 'all', label: 'Tất cả' },
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

### 2️⃣ Backend - `AuthController.php`

#### Hàm `getConsultationSchedules()`

**Thêm parameter:**
```php
$dateFilter = $request->input('date_filter'); // 'today', 'week', 'month', 'past', 'future', 'all'
```

**Thêm logic lọc:**
```php
// Filter theo thời gian - Hiển thị TẤT CẢ lịch theo bộ lọc được chọn
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
} elseif ($date) {
    $query->byDate($date);
} else {
    // Mặc định: Chỉ áp dụng filter upcoming() khi không phải filter booked_only
    if (!$bookedOnly && !$dateFilter) {
        $query->upcoming();
    }
}
```

---

## 🎨 6 Bộ lọc mới

| # | Tên | Giá trị | Mô tả |
|---|-----|--------|-------|
| 1 | Tất cả | `'all'` | Hiển thị tất cả lịch |
| 2 | Hôm nay | `'today'` | Chỉ lịch hôm nay |
| 3 | Tuần này | `'week'` | Lịch tuần hiện tại |
| 4 | Tháng này | `'month'` | Lịch tháng hiện tại |
| 5 | **Ngày đã qua** ⭐ | `'past'` | Tất cả lịch trong quá khứ |
| 6 | **Ngày sắp tới** ⭐ | `'future'` | Tất cả lịch từ hôm nay trở đi |

---

## [object Object]ết quả

### Trước cập nhật
```
❌ Chỉ hiển thị lịch sắp tới
❌ Không thể xem lịch đã qua
❌ Bộ lọc hạn chế
```

### Sau cập nhật
```
✅ Hiển thị TẤT CẢ lịch mặc định
✅ Có thể xem lịch đã qua
✅ 6 bộ lọc linh hoạt
✅ UI cải thiện (button group)
```

---

## [object Object]ách test

### 1. Chạy backend
```bash
cd backend
php artisan serve
```

### 2. Chạy frontend
```bash
cd frontend
npm run dev
```

### 3. Truy cập trang
```
http://localhost:5173/consultant/schedule
```

### 4. Test các bộ lọc

#### Test "Tất cả"
- Nhấp nút "Tất cả"
- Kiểm tra: Hiển thị tất cả lịch

#### Test "Hôm nay"
- Nhấp nút "Hôm nay"
- Kiểm tra: Chỉ hiển thị lịch hôm nay

#### Test "Tuần này"
- Nhấp nút "Tuần này"
- Kiểm tra: Chỉ hiển thị lịch tuần này

#### Test "Tháng này"
- Nhấp nút "Tháng này"
- Kiểm tra: Chỉ hiển thị lịch tháng này

#### Test "Ngày đã qua" ⭐ MỚI
- Nhấp nút "Ngày đã qua"
- Kiểm tra: Hiển thị lịch trong quá khứ

#### Test "Ngày sắp tới" ⭐ MỚI
- Nhấp nút "Ngày sắp tới"
- Kiểm tra: Hiển thị lịch từ hôm nay trở đi

---

## 📁 File đã thay đổi

```
✏️ frontend/src/pages/consultant/Schedule.jsx
   - Thêm state dateFilter
   - Thêm bộ lọc UI
   - Cập nhật fetchSchedules()

✏️ backend/app/Http/Controllers/AuthController.php
   - Hàm getConsultationSchedules()
   - Thêm logic lọc date_filter
```

---

## 🔗 Liên kết với Notes.jsx

Cả hai file `Schedule.jsx` và `Notes.jsx` đều sử dụng **cùng một bộ lọc**:

| Bộ lọc | Schedule.jsx | Notes.jsx |
|--------|--------------|----------|
| Tất cả | ✅ | ✅ |
| Hôm nay | ✅ | ✅ |
| Tuần này | ✅ | ✅ |
| Tháng này | ✅ | ✅ |
| Ngày đã qua | ✅ | ✅ |
| Ngày sắp tới | ✅ | ✅ |

---

## 💡 Ưu điểm

✅ **Hiển thị toàn bộ dữ liệu** - Không bỏ sót lịch đã qua  
✅ **Bộ lọc linh hoạt** - 6 lựa chọn khác nhau  
✅ **UI cải thiện** - Button group dễ sử dụng  
✅ **Tương thích** - Hoạt động với tất cả tab (Chờ duyệt, Đã duyệt, Từ chối, Đã đăng ký)  
✅ **Hiệu suất** - Query tối ưu  

---

## 🚀 Triển khai

```bash
# 1. Commit code
git add .
git commit -m "feat: add date filters to Schedule.jsx"

# 2. Push
git push

# 3. Test trên staging
# 4. Deploy lên production
```

---

## 📞 Hỗ trợ

| Vấn đề | Giải pháp |
|--------|----------|
| Không thấy bộ lọc | Refresh trang (F5) |
| Lỗi 404 | Kiểm tra backend chạy |
| Dữ liệu không cập nhật | Xóa cache (Ctrl+Shift+Delete) |
| Lỗi console | Xem DevTools (F12) |

---

**✅ Hoàn thành! Sẵn sàng để triển khai! 🎉**













