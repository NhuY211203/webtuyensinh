# Hướng dẫn test nhanh

## ⚡ Bắt đầu trong 2 phút

### Bước 1: Chạy Backend
```bash
cd backend
php artisan serve
# Backend chạy tại: http://localhost:8000
```

### Bước 2: Chạy Frontend
```bash
cd frontend
npm run dev
# Frontend chạy tại: http://localhost:5173
```

### Bước 3: Truy cập trang
```
http://localhost:5173/consultant/schedule
```

---

## 🧪 Test các bộ lọc

### ✅ Test 1: Bộ lọc "Tất cả"
1. Nhấp nút **"Tất cả"** (màu xanh)
2. **Kỳ vọng:** Hiển thị tất cả lịch
3. **Kiểm tra:** Số lượng lịch nhiều nhất

### ✅ Test 2: Bộ lọc "Hôm nay"
1. Nhấp nút **"Hôm nay"**
2. **Kỳ vọng:** Chỉ hiển thị lịch hôm nay
3. **Kiểm tra:** Tất cả ngày đều là hôm nay

### ✅ Test 3: Bộ lọc "Tuần này"
1. Nhấp nút **"Tuần này"**
2. **Kỳ vọng:** Chỉ hiển thị lịch tuần này
3. **Kiểm tra:** Ngày từ thứ 2 đến chủ nhật

### ✅ Test 4: Bộ lọc "Tháng này"
1. Nhấp nút **"Tháng này"**
2. **Kỳ vọng:** Chỉ hiển thị lịch tháng này
3. **Kiểm tra:** Tất cả ngày đều trong tháng hiện tại

### ✅ Test 5: Bộ lọc "Ngày đã qua" ⭐ MỚI
1. Nhấp nút **"Ngày đã qua"**
2. **Kỳ vọng:** Hiển thị lịch trong quá khứ
3. **Kiểm tra:** Tất cả ngày < hôm nay

### ✅ Test 6: Bộ lọc "Ngày sắp tới" ⭐ MỚI
1. Nhấp nút **"Ngày sắp tới"**
2. **Kỳ vọng:** Hiển thị lịch từ hôm nay trở đi
3. **Kiểm tra:** Tất cả ngày >= hôm nay

---

## 🔍 Kiểm tra chi tiết

### Mở DevTools (F12)
1. Nhấp **F12** để mở DevTools
2. Chọn tab **Network**
3. Nhấp bộ lọc
4. Kiểm tra request:
   - URL có chứa `date_filter=week` (ví dụ)
   - Response có dữ liệu đúng

### Kiểm tra Console
1. Chọn tab **Console**
2. Không có lỗi đỏ
3. Có thể thấy log từ backend

### Kiểm tra Database
```bash
mysql -u root -p
USE tuyensinhweb_vn;

# Xem lịch
SELECT idlichtuvan, ngayhen, giobatdau, ketthuc 
FROM lichtuvan 
WHERE idnguoidung = 5 
ORDER BY ngayhen DESC 
LIMIT 10;
```

---

## ✅ Checklist

- [ ] Backend chạy (http://localhost:8000)
- [ ] Frontend chạy (http://localhost:5173)
- [ ] Trang Schedule hiển thị
- [ ] Thấy 6 nút lọc
- [ ] Bộ lọc "Tất cả" hoạt động
- [ ] Bộ lọc "Hôm nay" hoạt động
- [ ] Bộ lọc "Tuần này" hoạt động
- [ ] Bộ lọc "Tháng này" hoạt động
- [ ] Bộ lọc "Ngày đã qua" hoạt động ⭐
- [ ] Bộ lọc "Ngày sắp tới" hoạt động ⭐
- [ ] Không có lỗi console
- [ ] Số lượng lịch chính xác

---

## [object Object]eshooting

| Vấn đề | Giải pháp |
|--------|----------|
| Không thấy bộ lọc | Refresh (F5) |
| Lỗi 404 | Backend không chạy |
| Dữ liệu không cập nhật | Xóa cache (Ctrl+Shift+Delete) |
| Lỗi CORS | Kiểm tra backend config |
| Lỗi console | Xem DevTools (F12) |

---

## 📊 Kỳ vọng

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
✅ UI cải thiện
```

---

**Sẵn sàng test! 🚀**













