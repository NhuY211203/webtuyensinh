# API Thông Báo - Hướng Dẫn Sử Dụng

## Tổng Quan
API thông báo cho phép gửi thông báo ngay lập tức hoặc lên lịch gửi cho người dùng trong hệ thống.

## Endpoints

### 1. Gửi Thông Báo Ngay Lập Tức
```
POST /api/notifications/send
```

**Request Body:**
```json
{
  "title": "Tiêu đề thông báo",
  "body": "Nội dung thông báo",
  "recipients": {
    "allUsers": true,
    "roles": [1, 2, 3],
    "userIds": [1, 2, 3]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Gửi thông báo thành công",
  "data": {
    "id": 1,
    "recipientCount": 150
  }
}
```

### 2. Lên Lịch Gửi Thông Báo
```
POST /api/notifications/schedule
```

**Request Body:**
```json
{
  "title": "Tiêu đề thông báo",
  "body": "Nội dung thông báo",
  "scheduledAt": "2025-01-25 10:00:00",
  "recipients": {
    "allUsers": true,
    "roles": [1, 2, 3],
    "userIds": [1, 2, 3]
  }
}
```

### 3. Lấy Danh Sách Thông Báo
```
GET /api/notifications
```

**Query Parameters:**
- `status`: Lọc theo trạng thái (sent, scheduled, failed)
- `from_date`: Từ ngày
- `to_date`: Đến ngày
- `per_page`: Số lượng mỗi trang (mặc định: 15)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Tiêu đề thông báo",
      "body": "Nội dung thông báo",
      "status": "sent",
      "scheduledAt": "2025-01-22 10:00:00",
      "createdAt": "2025-01-22 09:30:00",
      "recipientCount": 150
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 75
  }
}
```

### 4. Lấy Thống Kê Thông Báo
```
GET /api/notifications/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "sent": 80,
    "scheduled": 15,
    "failed": 5
  }
}
```

### 5. Lấy Chi Tiết Thông Báo
```
GET /api/notifications/{id}
```

### 6. Cập Nhật Trạng Thái Thông Báo
```
PUT /api/notifications/{id}/status
```

**Request Body:**
```json
{
  "status": "cancelled"
}
```

### 7. Lấy Danh Sách Người Nhận
```
GET /api/notifications/{id}/recipients
```

## Cấu Trúc Database

### Bảng `thongbao`
- `id`: ID thông báo
- `tieude`: Tiêu đề thông báo
- `noidung`: Nội dung thông báo
- `nguoigui_id`: ID người gửi
- `thoigiangui`: Thời gian gửi
- `trangthai`: Trạng thái (sent, scheduled, failed, cancelled)

### Bảng `nguoinhan_thongbao`
- `id`: ID bản ghi
- `idthongbao`: FK tới bảng thongbao
- `idnguoinhan`: FK tới bảng nguoidung
- `idvaitro`: Vai trò người nhận
- `trangthai`: Trạng thái (1=chưa đọc, 2=đã đọc)
- `thoigiangui_thucte`: Thời gian gửi thực tế
- `thoigianxem`: Thời gian người nhận xem
- `ghichu_loi`: Ghi chú lỗi nếu gửi thất bại

## Cách Sử Dụng Trong Frontend

### 1. Import API Service
```javascript
import api from "../../services/api";
```

### 2. Gửi Thông Báo Ngay
```javascript
const sendNotification = async (title, body) => {
  try {
    const response = await api.sendNotification({
      title,
      body,
      recipients: {
        allUsers: true
      }
    });
    
    if (response.success) {
      console.log('Gửi thành công:', response.data);
    }
  } catch (error) {
    console.error('Lỗi:', error.message);
  }
};
```

### 3. Lên Lịch Gửi Thông Báo
```javascript
const scheduleNotification = async (title, body, scheduledAt) => {
  try {
    const response = await api.scheduleNotification({
      title,
      body,
      scheduledAt,
      recipients: {
        allUsers: true
      }
    });
    
    if (response.success) {
      console.log('Lên lịch thành công:', response.data);
    }
  } catch (error) {
    console.error('Lỗi:', error.message);
  }
};
```

### 4. Lấy Danh Sách Thông Báo
```javascript
const loadNotifications = async () => {
  try {
    const response = await api.getNotifications();
    if (response.success) {
      setNotifications(response.data);
    }
  } catch (error) {
    console.error('Lỗi:', error.message);
  }
};
```

### 5. Lấy Thống Kê
```javascript
const loadStats = async () => {
  try {
    const response = await api.getNotificationStats();
    if (response.success) {
      setStats(response.data);
    }
  } catch (error) {
    console.error('Lỗi:', error.message);
  }
};
```

## Lưu Ý

1. **Authentication**: Tất cả API đều yêu cầu token xác thực
2. **Validation**: Dữ liệu đầu vào được validate nghiêm ngặt
3. **Error Handling**: Luôn kiểm tra `response.success` trước khi xử lý dữ liệu
4. **Pagination**: API danh sách hỗ trợ phân trang
5. **Soft Delete**: Hỗ trợ xóa mềm thông báo

## Migration

Để tạo bảng, chạy lệnh:
```bash
php artisan migrate
```

## Testing

Có thể test API bằng Postman hoặc curl:

```bash
# Gửi thông báo
curl -X POST http://localhost:8000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test notification",
    "recipients": {
      "allUsers": true
    }
  }'
```



