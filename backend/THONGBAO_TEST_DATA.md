# Sample Test Data for ThongBao API

## Test Data Creation Scripts

### 1. Create Sample Users
```sql
-- Insert sample users for testing
INSERT INTO nguoidung (idvaitro, idnhomnganh, taikhoan, matkhau, email, hoten, sodienthoai, diachi, ngaysinh, gioitinh, trangthai, ngaytao, ngaycapnhat) VALUES
(1, 1, 'admin_test', '123456', 'admin@test.com', 'Admin Test', '0123456789', 'Test Address', '1990-01-01', 'Nam', 'Hoạt động', NOW(), NOW()),
(2, 1, 'user_test1', '123456', 'user1@test.com', 'User Test 1', '0123456790', 'Test Address 1', '1991-01-01', 'Nữ', 'Hoạt động', NOW(), NOW()),
(2, 1, 'user_test2', '123456', 'user2@test.com', 'User Test 2', '0123456791', 'Test Address 2', '1992-01-01', 'Nam', 'Hoạt động', NOW(), NOW()),
(3, 1, 'consultant_test', '123456', 'consultant@test.com', 'Consultant Test', '0123456792', 'Test Address 3', '1989-01-01', 'Nữ', 'Hoạt động', NOW(), NOW());
```

### 2. Create Sample Notifications
```sql
-- Insert sample notifications
INSERT INTO thongbao (tieude, noidung, nguoitao_id, thoigiangui_dukien, kieuguithongbao, ngaytao, ngaycapnhat) VALUES
('Thông báo hệ thống', 'Hệ thống sẽ bảo trì vào ngày mai từ 2h-4h sáng', 1, NOW(), 'ngay', NOW(), NOW()),
('Thông báo tuyển sinh', 'Thông tin tuyển sinh năm 2024 đã được cập nhật', 1, NOW(), 'ngay', NOW(), NOW()),
('Thông báo lịch tư vấn', 'Lịch tư vấn tuần này đã được cập nhật', 1, NOW() + INTERVAL 1 HOUR, 'lenlich', NOW(), NOW()),
('Thông báo hủy', 'Thông báo này đã bị hủy', 1, NOW(), 'cancelled', NOW(), NOW()),
('Thông báo lỗi', 'Thông báo này gửi thất bại', 1, NOW(), 'failed', NOW(), NOW());
```

### 3. Create Sample Notification Recipients
```sql
-- Insert sample notification recipients
INSERT INTO nguoinhan_thongbao (idthongbao, idnguoinhan, idvaitro, trangthai, thoigiangui_thucte, thoigianxem, created_at, updated_at) VALUES
-- Recipients for notification 1 (sent)
(1, 2, 2, 2, NOW(), NOW(), NOW(), NOW()),
(1, 3, 2, 1, NOW(), NULL, NOW(), NOW()),
(1, 4, 3, 2, NOW(), NOW(), NOW(), NOW()),

-- Recipients for notification 2 (sent)
(2, 2, 2, 1, NOW(), NULL, NOW(), NOW()),
(2, 3, 2, 2, NOW(), NOW(), NOW(), NOW()),
(2, 4, 3, 1, NOW(), NULL, NOW(), NOW()),

-- Recipients for notification 3 (scheduled)
(3, 2, 2, 0, NULL, NULL, NOW(), NOW()),
(3, 3, 2, 0, NULL, NULL, NOW(), NOW()),
(3, 4, 3, 0, NULL, NULL, NOW(), NOW()),

-- Recipients for notification 4 (cancelled)
(4, 2, 2, 0, NULL, NULL, NOW(), NOW()),
(4, 3, 2, 0, NULL, NULL, NOW(), NOW()),

-- Recipients for notification 5 (failed)
(5, 2, 2, 3, NULL, NULL, NOW(), NOW()),
(5, 3, 2, 3, NULL, NULL, NOW(), NOW());
```

## Test API Endpoints with Sample Data

### 1. Test Get All Notifications
```bash
curl -X GET "http://localhost:8000/api/thongbao" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "tieude": "Thông báo lỗi",
      "noidung": "Thông báo này gửi thất bại",
      "trangthai": "failed",
      "thoigiangui": "2024-01-20T10:00:00.000000Z",
      "created_at": "2024-01-20T10:00:00.000000Z",
      "nguoi_gui": {
        "idnguoidung": 1,
        "hoten": "Admin Test"
      },
      "recipient_count": 2
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 5
  }
}
```

### 2. Test Get Notification Detail
```bash
curl -X GET "http://localhost:8000/api/thongbao/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tieude": "Thông báo hệ thống",
    "noidung": "Hệ thống sẽ bảo trì vào ngày mai từ 2h-4h sáng",
    "trangthai": "sent",
    "thoigiangui": "2024-01-20T10:00:00.000000Z",
    "nguoi_gui": {
      "idnguoidung": 1,
      "hoten": "Admin Test"
    },
    "nguoi_nhan": [
      {
        "id": 1,
        "trangthai": 2,
        "thoigiangui_thucte": "2024-01-20T10:00:00.000000Z",
        "thoigianxem": "2024-01-20T10:05:00.000000Z",
        "nguoi_nhan": {
          "idnguoidung": 2,
          "hoten": "User Test 1"
        }
      }
    ]
  }
}
```

### 3. Test Get Notification Statistics
```bash
curl -X GET "http://localhost:8000/api/thongbao/stats/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "total_recipients": 3,
    "read_count": 2,
    "unread_count": 1,
    "sent_count": 3,
    "failed_count": 0,
    "not_sent_count": 0
  }
}
```

### 4. Test Send New Notification
```bash
curl -X POST "http://localhost:8000/api/notifications/send" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "title": "Test Notification từ API",
    "body": "Đây là thông báo test được gửi qua API",
    "recipients": {
      "allUsers": false,
      "userIds": [2, 3]
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Gửi thông báo thành công",
  "data": {
    "id": 6,
    "recipientCount": 2
  }
}
```

### 5. Test Schedule Notification
```bash
curl -X POST "http://localhost:8000/api/notifications/schedule" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "title": "Thông báo đã lên lịch",
    "body": "Thông báo này sẽ được gửi vào ngày mai",
    "scheduledAt": "2024-01-21 10:00:00",
    "recipients": {
      "allUsers": true
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Lên lịch thông báo thành công",
  "data": {
    "id": 7,
    "scheduledAt": "2024-01-21 10:00:00",
    "recipientCount": 4
  }
}
```

### 6. Test Update Notification Status
```bash
curl -X PUT "http://localhost:8000/api/notifications/3/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "status": "sent"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cập nhật trạng thái thành công"
}
```

### 7. Test Get Notification Recipients
```bash
curl -X GET "http://localhost:8000/api/notifications/1/recipients" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "User Test 1",
      "email": "user1@test.com",
      "status": 2,
      "sentAt": "2024-01-20T10:00:00.000000Z",
      "readAt": "2024-01-20T10:05:00.000000Z"
    },
    {
      "id": 3,
      "name": "User Test 2",
      "email": "user2@test.com",
      "status": 1,
      "sentAt": "2024-01-20T10:00:00.000000Z",
      "readAt": null
    }
  ]
}
```

## Test Scenarios

### Scenario 1: Complete Notification Lifecycle
1. **Create** a scheduled notification
2. **Update** the notification content
3. **Send** the notification (change status to sent)
4. **Check** recipient status
5. **Mark** recipients as read
6. **Get** statistics

### Scenario 2: Error Handling
1. **Try** to update a sent notification (should fail)
2. **Try** to send to invalid user IDs (should fail)
3. **Try** to get non-existent notification (should return 404)

### Scenario 3: Filtering and Search
1. **Filter** by status (sent, scheduled, failed, cancelled)
2. **Search** by title
3. **Filter** by date range
4. **Paginate** results

## Database Verification Queries

### Check notification counts by status
```sql
SELECT trangthai, COUNT(*) as count 
FROM thongbao 
GROUP BY trangthai;
```

### Check recipient status distribution
```sql
SELECT trangthai, COUNT(*) as count 
FROM nguoinhan_thongbao 
GROUP BY trangthai;
```

### Check notification with recipient details
```sql
SELECT 
    tb.id,
    tb.tieude,
    tb.trangthai as notification_status,
    COUNT(nntb.id) as total_recipients,
    SUM(CASE WHEN nntb.trangthai = 2 THEN 1 ELSE 0 END) as read_count,
    SUM(CASE WHEN nntb.trangthai = 1 THEN 1 ELSE 0 END) as unread_count
FROM thongbao tb
LEFT JOIN nguoinhan_thongbao nntb ON tb.id = nntb.idthongbao
GROUP BY tb.id, tb.tieude, tb.trangthai;
```

## Performance Test Data

### Create Large Dataset for Performance Testing
```sql
-- Create 1000 test notifications
INSERT INTO thongbao (tieude, noidung, nguoitao_id, thoigiangui_dukien, kieuguithongbao, ngaytao, ngaycapnhat)
SELECT 
    CONCAT('Test Notification ', i),
    CONCAT('This is test notification number ', i),
    1,
    NOW() - INTERVAL (i % 30) DAY,
    CASE (i % 4)
        WHEN 0 THEN 'ngay'
        WHEN 1 THEN 'lenlich'
        WHEN 2 THEN 'failed'
        ELSE 'cancelled'
    END,
    NOW() - INTERVAL (i % 30) DAY,
    NOW() - INTERVAL (i % 30) DAY
FROM (
    SELECT @row := @row + 1 as i
    FROM (SELECT 0 UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t1,
         (SELECT 0 UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t2,
         (SELECT 0 UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t3,
         (SELECT @row := 0) r
    LIMIT 1000
) numbers;
```

This test data will help you verify that all the ThongBao API endpoints are working correctly with realistic data scenarios.
