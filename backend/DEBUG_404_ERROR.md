# Debug API Endpoints for ThongBao

## 1. Check Authentication Status
```bash
# Test if you're authenticated
curl -X GET "http://localhost:8000/api/test-user" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

## 2. Check Database Data
```bash
# Check if there are any notifications in database
curl -X GET "http://localhost:8000/api/thongbao" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

## 3. Create Test Data First
```bash
# Create a test user first
curl -X POST "http://localhost:8000/api/test-create-user" \
  -H "Accept: application/json"
```

## 4. Send Test Notification
```bash
# Send a test notification
curl -X POST "http://localhost:8000/api/notifications/send" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test notification",
    "recipients": {
      "allUsers": false,
      "userIds": [1]
    }
  }'
```

## 5. Check Created Notification
```bash
# Get the notification you just created
curl -X GET "http://localhost:8000/api/thongbao/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

## 6. Debug Database Directly
```sql
-- Check if notifications exist
SELECT * FROM thongbao;

-- Check if user exists
SELECT * FROM nguoidung WHERE idnguoidung = 1;

-- Check notification recipients
SELECT * FROM nguoinhan_thongbao;
```

## Common Issues:

### Issue 1: No Authentication Token
- Make sure you're logged in and have a valid Bearer token
- Test with: `curl -X GET "http://localhost:8000/api/test-user"`

### Issue 2: No Data in Database
- The notification with ID 1 might not exist
- Check with: `curl -X GET "http://localhost:8000/api/thongbao"`

### Issue 3: Wrong User ID
- The notification might belong to a different user
- Check with: `curl -X GET "http://localhost:8000/api/thongbao"` to see all notifications

### Issue 4: Database Connection Issues
- Check if Laravel can connect to database
- Test with: `curl -X GET "http://localhost:8000/api/test-users"`


