# Hướng dẫn cấu hình Gmail và gửi email thông báo

## Bước 1: Lấy App Password từ Gmail

1. Đăng nhập vào tài khoản Gmail của bạn
2. Truy cập: https://myaccount.google.com/apppasswords
3. Chọn "Mail" và "Other (Custom name)"
4. Nhập tên: "Laravel App"
5. Copy App Password (16 ký tự, không có dấu cách)

## Bước 2: Cấu hình trong file `.env`

Thêm hoặc cập nhật các dòng sau trong file `backend/.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password-here
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="${APP_NAME}"
```

**Lưu ý:**
- `MAIL_USERNAME`: Email Gmail của bạn (ví dụ: vinhhkt2003@gmail.com)
- `MAIL_PASSWORD`: App Password (16 ký tự) - KHÔNG phải mật khẩu Gmail thông thường
- `MAIL_FROM_ADDRESS`: Cùng email với MAIL_USERNAME

## Bước 3: Chạy lệnh gửi email

### Lệnh 1: Gửi các email nhắc lịch đến hạn
```bash
cd backend
php artisan reminders:dispatch-due
```

Lệnh này sẽ:
- Tìm tất cả các thông báo lịch có trạng thái `pending` và đã đến thời gian gửi
- Gửi email nhắc lịch đến người dùng
- Cập nhật trạng thái thành `sent` hoặc `failed`

### Lệnh 2: Tạo các reminder cho lịch đã duyệt
```bash
cd backend
php artisan reminders:generate-missing
```

Hoặc với các tùy chọn:
```bash
# Tạo reminder cho một lịch cụ thể
php artisan reminders:generate-missing --schedule_id=123

# Tạo reminder cho lịch trong 48 giờ tới (mặc định)
php artisan reminders:generate-missing --hours=48
```

Lệnh này sẽ tạo các bản ghi reminder (24h, 2h, 15 phút trước lịch hẹn) cho các lịch đã được duyệt.

## Bước 4: Kiểm tra kết quả

Sau khi chạy lệnh, bạn sẽ thấy thông báo:
```
Processed: X | Sent: Y
```

Kiểm tra trong database bảng `thong_bao_lich` để xem:
- `trangthai = 'sent'`: Email đã gửi thành công
- `trangthai = 'failed'`: Email gửi thất bại (xem `thongbao_loi` để biết lý do)
- `trangthai = 'pending'`: Chưa đến thời gian gửi

## Lưu ý quan trọng

1. **App Password**: Bạn PHẢI dùng App Password, không dùng mật khẩu Gmail thông thường
2. **2-Step Verification**: Phải bật xác thực 2 bước trên Gmail để tạo App Password
3. **Rate Limit**: Gmail có giới hạn số email gửi mỗi ngày (khoảng 500 email/ngày cho tài khoản miễn phí)
4. **Testing**: Có thể test bằng cách đặt `MAIL_MAILER=log` để xem email trong file log thay vì gửi thật

## Troubleshooting

### Lỗi "Authentication failed"
- Kiểm tra lại App Password (phải là 16 ký tự, không có dấu cách)
- Đảm bảo đã bật 2-Step Verification

### Lỗi "Connection timeout"
- Kiểm tra kết nối internet
- Thử đổi `MAIL_PORT=465` và `MAIL_ENCRYPTION=ssl`

### Email không đến
- Kiểm tra thư mục Spam
- Kiểm tra `thongbao_loi` trong database
- Xem log: `backend/storage/logs/laravel.log`














