# Hướng dẫn sử dụng bộ lọc lịch tư vấn mới

## [object Object]ính năng mới

Trang "Lịch của tôi" (Lịch tư vấn) giờ đây hỗ trợ **6 bộ lọc** để giúp bạn dễ dàng tìm kiếm lịch tư vấn:

### 1. **Tất cả** (Mặc định)
- Hiển thị **tất cả** lịch tư vấn không có giới hạn thời gian
- Sử dụng khi bạn muốn xem toàn bộ lịch

### 2. **Hôm nay**
- Chỉ hiển thị lịch tư vấn **trong ngày hôm nay**
- Hữu ích để xem các buổi tư vấn sắp diễn ra

### 3. **Tuần này**
- Hiển thị lịch tư vấn **trong tuần hiện tại** (từ thứ 2 đến chủ nhật)
- Giúp bạn lên kế hoạch cho tuần

### 4. **Tháng này**
- Hiển thị lịch tư vấn **trong tháng hiện tại**
- Tổng quan về toàn bộ công việc trong tháng

### 5. **Ngày đã qua** ⭐ MỚI
- Hiển thị **tất cả** lịch tư vấn trong **quá khứ** (ngày < hôm nay)
- Sử dụng để xem lại các buổi tư vấn đã hoàn thành

### 6. **Ngày sắp tới** ⭐ MỚI
- Hiển thị **tất cả** lịch tư vấn trong **tương lai** (ngày >= hôm nay)
- Tổng quan về các buổi tư vấn sắp tới

## 📱 Cách sử dụng

### Bước 1: Truy cập trang "Lịch của tôi"
- Đăng nhập vào hệ thống
- Chọn menu "Lịch của tôi" hoặc "Lịch tư vấn"

### Bước 2: Chọn bộ lọc
- Bạn sẽ thấy **6 nút lọc** ở phần "Thời gian"
- Nhấp vào nút lọc mong muốn
- Nút được chọn sẽ **chuyển sang màu xanh** để chỉ định

### Bước 3: Xem kết quả
- Danh sách lịch sẽ **cập nhật tự động** theo bộ lọc
- Số lượng lịch được hiển thị ở phía trên

## 💡 Ví dụ sử dụng

| Tình huống | Bộ lọc cần chọn |
|-----------|-----------------|
| Xem buổi tư vấn hôm nay | **Hôm nay** |
| Xem tất cả buổi tư vấn sắp tới | **Ngày sắp tới** |
| Xem buổi tư vấn đã hoàn thành | **Ngày đã qua** |
| Lên kế hoạch cho tuần | **Tuần này** |
| Báo cáo hàng tháng | **Tháng này** |
| Xem toàn bộ lịch | **Tất cả** |

## 🔄 Chế độ xem

Bộ lọc hoạt động với **cả 2 chế độ**:

### Chế độ "Nhập ghi chú"
- Hiển thị các buổi tư vấn **đã được duyệt** và **có thí sinh đặt lịch**
- Cho phép bạn nhập ghi chú tư vấn

### Chế độ "Xem ghi chú đã gửi"
- Hiển thị các buổi tư vấn **đã có ghi chú chốt**
- Cho phép bạn xem lại ghi chú đã gửi

## ⚙️ Thông tin kỹ thuật

### Giá trị `date_filter` được gửi đến backend:
- `''` hoặc `'all'` → Tất cả
- `'today'` → Hôm nay
- `'week'` → Tuần này
- `'month'` → Tháng này
- `'past'` → Ngày đã qua
- `'future'` → Ngày sắp tới

### Xử lý ở backend:
- Mỗi bộ lọc sử dụng một **scope** riêng trong model `LichTuVan`
- Nếu không chọn bộ lọc, mặc định hiển thị **tất cả**
- Dữ liệu được sắp xếp theo **ngày giảm dần** (mới nhất trước)

## 🐛 Khắc phục sự cố

### Không thấy bộ lọc mới?
- Hãy **refresh** trang (F5)
- Xóa cache trình duyệt (Ctrl+Shift+Delete)

### Lịch không cập nhật?
- Kiểm tra kết nối internet
- Đảm bảo backend đang chạy
- Xem console (F12) để kiểm tra lỗi

### Hiển thị sai số lượng lịch?
- Kiểm tra lại bộ lọc được chọn
- Đảm bảo các lịch có ngày hợp lệ

## 📞 Hỗ trợ
Nếu gặp vấn đề, vui lòng liên hệ với đội hỗ trợ kỹ thuật.













