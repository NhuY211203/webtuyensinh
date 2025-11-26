# ThongBao API Test Links

## Base URL
```
http://localhost:8000/api
```

## Authentication
Most endpoints require authentication. Use these headers:
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
Accept: application/json
```

## 1. Notification Management (ThongBao Model)

### 1.1 Get All Notifications
```http
GET /api/thongbao
```

**Query Parameters:**
- `search` (string): Search by title
- `status` (string): Filter by status (sent, scheduled, failed, cancelled)
- `from_date` (date): Filter from date (YYYY-MM-DD)
- `to_date` (date): Filter to date (YYYY-MM-DD)
- `per_page` (int): Records per page (default: 15)

**Test URLs:**
```
http://localhost:8000/api/thongbao
http://localhost:8000/api/thongbao?status=sent
http://localhost:8000/api/thongbao?search=thông báo
http://localhost:8000/api/thongbao?from_date=2024-01-01&to_date=2024-12-31
http://localhost:8000/api/thongbao?per_page=10
```

### 1.2 Get Notification Detail
```http
GET /api/thongbao/{id}
```

**Test URLs:**
```
http://localhost:8000/api/thongbao/1
http://localhost:8000/api/thongbao/2
```

### 1.3 Update Notification
```http
PUT /api/thongbao/{id}
```

**Request Body:**
```json
{
  "tieude": "Tiêu đề mới",
  "noidung": "Nội dung mới",
  "thoigiangui_dukien": "2024-01-21 10:00:00"
}
```

**Test URLs:**
```
http://localhost:8000/api/thongbao/1
```

### 1.4 Delete Notification
```http
DELETE /api/thongbao/{id}
```

**Test URLs:**
```
http://localhost:8000/api/thongbao/1
```

### 1.5 Get Notification Statistics
```http
GET /api/thongbao/stats/{id}
```

**Test URLs:**
```
http://localhost:8000/api/thongbao/stats/1
http://localhost:8000/api/thongbao/stats/2
```

## 2. Notification Sending & Scheduling

### 2.1 Send Notification Immediately
```http
POST /api/notifications/send
```

**Request Body:**
```json
{
  "title": "Thông báo khẩn cấp",
  "body": "Nội dung thông báo khẩn cấp",
  "recipients": {
    "allUsers": true
  }
}
```

**Alternative Request Body (Specific Recipients):**
```json
{
  "title": "Thông báo cho nhóm cụ thể",
  "body": "Nội dung thông báo",
  "recipients": {
    "allUsers": false,
    "roles": [1, 2],
    "userIds": [1, 2, 3]
  }
}
```

**Test URLs:**
```
http://localhost:8000/api/notifications/send
```

### 2.2 Schedule Notification
```http
POST /api/notifications/schedule
```

**Request Body:**
```json
{
  "title": "Thông báo đã lên lịch",
  "body": "Nội dung thông báo sẽ được gửi sau",
  "scheduledAt": "2024-01-21 10:00:00",
  "recipients": {
    "allUsers": true
  }
}
```

**Test URLs:**
```
http://localhost:8000/api/notifications/schedule
```

### 2.3 Get Notification List (Alternative endpoint)
```http
GET /api/notifications
```

**Query Parameters:**
- `status` (string): Filter by status
- `from_date` (date): Filter from date
- `to_date` (date): Filter to date
- `per_page` (int): Records per page

**Test URLs:**
```
http://localhost:8000/api/notifications
http://localhost:8000/api/notifications?status=sent
http://localhost:8000/api/notifications?from_date=2024-01-01
```

### 2.4 Get Notification Statistics
```http
GET /api/notifications/stats
```

**Test URLs:**
```
http://localhost:8000/api/notifications/stats
```

### 2.5 Get Notification Detail (Alternative endpoint)
```http
GET /api/notifications/{id}
```

**Test URLs:**
```
http://localhost:8000/api/notifications/1
```

### 2.6 Update Notification Status
```http
PUT /api/notifications/{id}/status
```

**Request Body:**
```json
{
  "status": "sent"
}
```

**Valid Status Values:**
- `ngay`: Đã gửi ngay
- `lenlich`: Đã lên lịch
- `failed`: Gửi thất bại
- `cancelled`: Đã hủy

**Test URLs:**
```
http://localhost:8000/api/notifications/1/status
```

### 2.7 Get Notification Recipients
```http
GET /api/notifications/{id}/recipients
```

**Test URLs:**
```
http://localhost:8000/api/notifications/1/recipients
```

## 3. Test Data Creation

### 3.1 Create Test User
```http
POST /api/test-create-user
```

**Test URLs:**
```
http://localhost:8000/api/test-create-user
```

### 3.2 Get Test Users
```http
GET /api/test-users
```

**Test URLs:**
```
http://localhost:8000/api/test-users
```

### 3.3 Test User Exists
```http
GET /api/test-user
```

**Test URLs:**
```
http://localhost:8000/api/test-user
```

## 4. Sample Test Scenarios

### 4.1 Complete Notification Flow Test

**Step 1: Create a test notification**
```http
POST /api/notifications/send
Content-Type: application/json

{
  "title": "Test Notification",
  "body": "This is a test notification",
  "recipients": {
    "allUsers": false,
    "userIds": [1]
  }
}
```

**Step 2: Get the notification list**
```http
GET /api/thongbao
```

**Step 3: Get notification details**
```http
GET /api/thongbao/1
```

**Step 4: Get notification statistics**
```http
GET /api/thongbao/stats/1
```

**Step 5: Get notification recipients**
```http
GET /api/notifications/1/recipients
```

### 4.2 Schedule Notification Test

**Step 1: Schedule a notification**
```http
POST /api/notifications/schedule
Content-Type: application/json

{
  "title": "Scheduled Notification",
  "body": "This notification is scheduled",
  "scheduledAt": "2024-12-31 23:59:00",
  "recipients": {
    "allUsers": true
  }
}
```

**Step 2: Update the scheduled notification**
```http
PUT /api/thongbao/2
Content-Type: application/json

{
  "tieude": "Updated Scheduled Notification",
  "noidung": "This notification has been updated",
  "thoigiangui": "2024-12-31 23:58:00"
}
```

**Step 3: Cancel the notification**
```http
PUT /api/notifications/2/status
Content-Type: application/json

{
  "status": "cancelled"
}
```

## 5. Error Testing

### 5.1 Invalid Notification ID
```http
GET /api/thongbao/999999
```

### 5.2 Invalid Status Update
```http
PUT /api/notifications/1/status
Content-Type: application/json

{
  "status": "invalid_status"
}
```

### 5.3 Missing Required Fields
```http
POST /api/notifications/send
Content-Type: application/json

{
  "title": "Missing body"
}
```

## 6. Performance Testing

### 6.1 Large Dataset Test
```http
GET /api/thongbao?per_page=100
```

### 6.2 Date Range Test
```http
GET /api/thongbao?from_date=2020-01-01&to_date=2030-12-31
```

### 6.3 Search Test
```http
GET /api/thongbao?search=test
```

## 7. Status Codes Reference

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `404`: Not Found
- `422`: Unprocessable Entity
- `500`: Internal Server Error

## 8. Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": { ... }
}
```

## 9. Testing Tools Recommendations

### 9.1 Postman Collection
Create a Postman collection with all these endpoints for easy testing.

### 9.2 cURL Examples
```bash
# Get all notifications
curl -X GET "http://localhost:8000/api/thongbao" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"

# Send notification
curl -X POST "http://localhost:8000/api/notifications/send" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "Test body",
    "recipients": {
      "allUsers": true
    }
  }'
```

### 9.3 JavaScript/Fetch Examples
```javascript
// Get notifications
fetch('http://localhost:8000/api/thongbao', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Accept': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));

// Send notification
fetch('http://localhost:8000/api/notifications/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    title: 'Test Notification',
    body: 'Test body',
    recipients: {
      allUsers: true
    }
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 10. Database Status Values

### ThongBao Status:
- `ngay`: Đã gửi ngay
- `lenlich`: Đã lên lịch  
- `failed`: Gửi thất bại
- `cancelled`: Đã hủy

### NguoiNhanThongBao Status:
- `0`: Chưa gửi
- `1`: Chưa đọc
- `2`: Đã đọc
- `3`: Gửi thất bại
- `-1`: Đã xóa mềm
