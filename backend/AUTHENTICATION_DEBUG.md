# Authentication Debug Guide

## 1. Check if you have a valid login endpoint
```bash
curl -X POST "http://localhost:8000/api/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "123456"
  }'
```

## 2. If login works, you'll get a response like:
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "your_bearer_token_here"
  }
}
```

## 3. Use the token in subsequent requests:
```bash
curl -X GET "http://localhost:8000/api/thongbao/stats/1" \
  -H "Authorization: Bearer your_bearer_token_here" \
  -H "Accept: application/json"
```

## 4. Alternative: Create a test user and login
```bash
# First create test user
curl -X POST "http://localhost:8000/api/test-create-user"

# Then try to login (adjust credentials based on your test user)
curl -X POST "http://localhost:8000/api/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'
```

## 5. Check authentication status
```bash
curl -X GET "http://localhost:8000/api/test-user" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Common Issues:

### Issue 1: No Login Endpoint
If `/api/login` doesn't exist, check your routes:
```bash
curl -X GET "http://localhost:8000/api/test-user"
```

### Issue 2: Wrong Credentials
Make sure you're using the correct email/password combination.

### Issue 3: Token Expired
If you had a token before, it might have expired. Get a new one.

### Issue 4: Wrong Token Format
Make sure you're using: `Bearer YOUR_TOKEN` (with space after Bearer)


