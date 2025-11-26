# 💳 Hướng Dẫn Tích Hợp Thanh Toán ZaloPay

## 📋 Tổng Quan

Tài liệu này hướng dẫn chi tiết cách tích hợp thanh toán ZaloPay vào hệ thống, bao gồm luồng tạo QR code, xử lý callback, và cấu hình cần thiết.

## 🔄 Luồng Thanh Toán ZaloPay

### Bước 1: Tạo QR Code Thanh Toán

#### Endpoint: `POST /api/payments/generate-zalopay-qr`

**Request**:
```http
POST /api/payments/generate-zalopay-qr
Authorization: Bearer <token>
Content-Type: application/json

{
  "invoiceId": 1234
}
```

**Response**:
```json
{
  "orderId": "ORD_1730415600000_1234",
  "qrCodeUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "qrCodeData": "00020101021238570010A0000007750110Zalopay...",
  "expiryAt": "2025-11-02T00:00:00.000Z",
  "amount": 200000,
  "isZaloPayQR": true
}
```

**Luồng hoạt động**:
1. Frontend gọi API với `invoiceId`
2. Backend tạo `orderId` theo format: `ORD_{timestamp}_{invoiceId}`
3. Tạo `app_trans_id` theo format ZaloPay: `YYMMDD_xxxxxx`
4. Gọi API ZaloPay để tạo payment order
5. Nhận `order_url` từ ZaloPay và tạo QR code từ đó
6. Lưu payment order vào database với trạng thái `pending`
7. Trả về QR code cho frontend

### Bước 2: Quét QR và Thanh Toán

1. User quét QR code bằng app ZaloPay
2. Xác nhận thanh toán trong app
3. ZaloPay xử lý giao dịch

### Bước 3: ZaloPay Callback

#### Endpoint: `POST /api/payments/zalopay/callback`

ZaloPay sẽ gọi callback về endpoint này sau khi user thanh toán.

**Request từ ZaloPay**:
```json
{
  "data": "{\"app_trans_id\":\"251201_123456\",\"amount\":200000,\"embed_data\":\"...\"}",
  "type": "1",
  "mac": "abc123def456..."
}
```

**Luồng xử lý callback**:
1. Verify MAC signature bằng `key2`
2. Parse `data` để lấy thông tin thanh toán
3. Kiểm tra `type`:
   - `type = 1`: Thanh toán thành công
   - `type ≠ 1`: Thanh toán thất bại/pending
4. Tìm payment order theo `app_trans_id` hoặc `orderId`
5. Cập nhật trạng thái payment order và invoice
6. Trả về response cho ZaloPay

**Response cho ZaloPay**:
```json
{
  "return_code": 1,
  "return_message": "OK"
}
```

### Bước 4: Kiểm Tra Trạng Thái Thanh Toán

#### Endpoint: `GET /api/payments/status/:orderId`

**Request**:
```http
GET /api/payments/status/ORD_1730415600000_1234
Authorization: Bearer <token>
```

**Response**:
```json
{
  "orderId": "ORD_1730415600000_1234",
  "status": "paid",
  "paidAt": "2025-11-01T14:30:00.000Z",
  "paymentMethod": "zalopay"
}
```

## 🔑 Cấu Hình ZaloPay

### Environment Variables

Thêm các biến môi trường sau vào file `.env`:

```env
# ZaloPay Configuration
ZALOPAY_APP_ID=your_app_id
ZALOPAY_KEY1=your_key1
ZALOPAY_KEY2=your_key2
ZALOPAY_ENDPOINT=https://sb-openapi.zalopay.vn/v2/create
ZALOPAY_CALLBACK_URL=https://your-domain.com/api/payments/zalopay/callback

# QR Code Configuration
QR_CODE_SIZE=200
```

### Giải Thích Các Tham Số

- **ZALOPAY_APP_ID**: App ID được cung cấp bởi ZaloPay
- **ZALOPAY_KEY1**: Key dùng để ký MAC khi tạo order
- **ZALOPAY_KEY2**: Key dùng để verify MAC trong callback
- **ZALOPAY_ENDPOINT**: URL API ZaloPay (môi trường sandbox hoặc production)
- **ZALOPAY_CALLBACK_URL**: URL nhận callback từ ZaloPay

### Sandbox vs Production

**Sandbox (Test)**:
```
https://sb-openapi.zalopay.vn/v2/create
```

**Production**:
```
https://openapi.zalopay.vn/v2/create
```

## 🔐 Bảo Mật

### MAC Signature Verification

#### Khi tạo QR code (Request tới ZaloPay):

```typescript
// Tạo chuỗi data để ký
const dataString = `${app_id}|${app_trans_id}|${app_user}|${amount}|${app_time}|${embed_data}|${item}`;

// Ký bằng HMAC-SHA256 với key1
const mac = crypto.createHmac('sha256', key1)
  .update(dataString)
  .digest('hex');

// Thêm MAC vào request
orderData.mac = mac;
```

#### Khi nhận callback (Verify từ ZaloPay):

```typescript
// Lấy data string (giữ nguyên string, KHÔNG parse JSON)
const dataStr = callbackData.data; // string
const receivedMac = callbackData.mac;

// Verify MAC bằng key2
const calculatedMac = crypto
  .createHmac('sha256', key2)
  .update(dataStr) // Verify toàn bộ string data
  .digest('hex');

// So sánh MAC
if (receivedMac !== calculatedMac) {
  return { return_code: -1, return_message: 'mac not equal' };
}

// Parse JSON sau khi verify thành công
const paymentData = JSON.parse(dataStr);
```

### Lưu Ý Quan Trọng

⚠️ **KHÔNG bao giờ parse JSON trước khi verify MAC**  
⚠️ **Luôn verify MAC trước khi xử lý callback**  
⚠️ **Sử dụng HTTPS cho callback URL**  
⚠️ **Bảo vệ KEY1 và KEY2, không commit vào git**

## 📊 Cấu Trúc Dữ Liệu

### Payment Order Schema

```typescript
{
  orderId: string;              // ORD_timestamp_invoiceId
  invoiceId: number;            // ID hóa đơn
  tenantId?: number;            // ID người thuê (optional)
  landlordId: number;           // ID chủ nhà
  amount: number;               // Số tiền
  orderType: string;            // Loại order
  status: string;               // pending | paid | expired | cancelled
  qrCodeUrl?: string;           // URL QR code (base64)
  qrCodeData?: string;          // Raw QR data
  paymentMethod?: string;       // zalopay | bank_transfer
  paidAt?: Date;                // Thời gian thanh toán
  expiryAt?: Date;              // Thời gian hết hạn
  isQrGenerated: boolean;       // Đã tạo QR chưa
  zalopayOrderId?: string;      // app_trans_id từ ZaloPay
  zalopayTransactionId?: string;// Transaction ID từ ZaloPay
  createdAt: Date;
  updatedAt: Date;
}
```

### Invoice Schema

```typescript
{
  invoiceId: number;
  landlordId: number;
  tenantId?: number;
  invoiceType: string;          // initial_payment | monthly_rent | deposit | utilities | maintenance_fee
  amount: number;
  dueDate: Date;
  status: string;               // pending | paid | overdue
  description: string;
  paymentMethod?: string;
  paidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔧 Tích Hợp Frontend

### Tạo QR Code Thanh Toán

```typescript
async function generateZaloPayQR(invoiceId: number) {
  const response = await fetch('/api/payments/generate-zalopay-qr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ invoiceId })
  });
  
  const data = await response.json();
  return data;
}
```

### Hiển Thị QR Code

```tsx
function PaymentQRDisplay({ qrCodeUrl, amount, expiryAt, onPaymentComplete }) {
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiryAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [expiryAt]);

  useEffect(() => {
    // Polling để kiểm tra trạng thái thanh toán
    const pollInterval = setInterval(async () => {
      const status = await checkPaymentStatus(orderId);
      if (status.status === 'paid') {
        clearInterval(pollInterval);
        onPaymentComplete(status);
      }
    }, 3000); // Check mỗi 3 giây
    
    return () => clearInterval(pollInterval);
  }, [orderId]);

  return (
    <div className="payment-qr-container">
      <img src={qrCodeUrl} alt="QR Code" className="qr-code" />
      <p className="amount">{amount.toLocaleString('vi-VN')} VND</p>
      <p className="countdown">
        Hết hạn sau: {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
      </p>
      <p className="instruction">
        Quét mã QR bằng ứng dụng ZaloPay để thanh toán
      </p>
    </div>
  );
}
```

### Kiểm Tra Trạng Thái

```typescript
async function checkPaymentStatus(orderId: string) {
  const response = await fetch(`/api/payments/status/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data;
}
```

## 🧪 Testing

### 📡 Hướng Dẫn Sử Dụng ngrok cho Callback URL

**ngrok** là công cụ cần thiết để test callback từ ZaloPay trong môi trường local development. ZaloPay cần một URL công khai (public URL) để gọi callback, nhưng localhost không phải là public URL.

#### Bước 1: Cài Đặt ngrok

**Option 1: Download từ website (Recommended)**
```bash
# Truy cập https://ngrok.com/download
# Download phiên bản phù hợp với hệ điều hành của bạn
# Giải nén và đặt vào thư mục PATH

# Kiểm tra cài đặt thành công
ngrok version
```

**Option 2: Cài đặt qua npm**
```bash
npm install -g ngrok

# Hoặc với Yarn
yarn global add ngrok
```

#### Bước 2: Đăng Ký Tài Khoản ngrok (Tùy Chọn)

**Free tier**: Cho phép 1 tunnel đồng thời, URL thay đổi mỗi lần restart.

**Paid tier**: Cho phép giữ URL cố định, nhiều tunnels đồng thời.

1. Truy cập https://dashboard.ngrok.com/signup
2. Đăng ký tài khoản miễn phí
3. Lấy authtoken từ dashboard: https://dashboard.ngrok.com/get-started/your-authtoken
4. Cấu hình authtoken:

```bash
ngrok config add-authtoken <your-authtoken>
```

#### Bước 3: Khởi Chạy ngrok Tunnel

```bash
# Chạy tunnel trỏ tới port của backend server
# Mặc định NestJS chạy trên port 3000
ngrok http 3000

# Hoặc nếu backend chạy trên port khác
ngrok http 3001
```

**Output mẫu**:
```
Session Status                online
Account                       Your Email (Plan: Free)
Version                       3.x.x
Region                        Asia Pacific (ap)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:3000
```

#### Bước 4: Cấu Hình Callback URL

Copy URL forwarding (ví dụ: `https://abc123xyz.ngrok-free.app`) và cấu hình trong file `.env`:

```env
# .env
ZALOPAY_CALLBACK_URL=https://abc123xyz.ngrok-free.app/api/payments/zalopay/callback
```

**⚠️ Lưu ý**: URL này sẽ thay đổi mỗi lần restart ngrok (trừ khi dùng paid plan).

#### Bước 5: Khởi Động lại Backend Server

Sau khi cấu hình `.env`, khởi động lại backend để load environment variables mới:

```bash
# Stop server hiện tại (Ctrl + C)
# Khởi động lại
npm run start:dev
```

#### Bước 6: Verify ngrok Tunnel

Mở browser và truy cập: `http://localhost:4040` để xem ngrok dashboard với:
- Inspector: Xem tất cả requests được forward
- Timing: Thời gian xử lý request
- Request/Response: Chi tiết HTTP headers và body

#### 🔄 Quy Trình Workflow Hoàn Chỉnh

```bash
# Terminal 1: Khởi động backend
npm run start:dev

# Terminal 2: Khởi động ngrok
ngrok http 3000

# Terminal 3: Test API (tùy chọn)
curl http://localhost:3000/api/payments/debug/orders \
  -H "Authorization: Bearer <token>"
```

#### 🎯 Keep ngrok Running trong Background

**Option 1: Sử dụng screen hoặc tmux**

```bash
# Với screen
screen -S ngrok
ngrok http 3000
# Detach: Ctrl + A, D
# Reattach: screen -r ngrok

# Với tmux
tmux new -s ngrok
ngrok http 3000
# Detach: Ctrl + B, D
# Reattach: tmux attach -t ngrok
```

**Option 2: Chạy ngrok làm service (Linux/Mac)**

```bash
# Tạo service file
sudo nano /etc/systemd/system/ngrok.service
```

```ini
[Unit]
Description=ngrok tunnel
After=network.target

[Service]
Type=simple
User=your-username
ExecStart=/usr/local/bin/ngrok http 3000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
# Enable và start service
sudo systemctl enable ngrok
sudo systemctl start ngrok

# Kiểm tra status
sudo systemctl status ngrok
```

#### 🚨 Troubleshooting ngrok

**Problem**: ngrok không start được

**Solution**: 
```bash
# Kiểm tra port đã bị chiếm chưa
lsof -i :3000

# Kill process nếu cần
kill -9 <PID>

# Khởi động lại ngrok
ngrok http 3000
```

**Problem**: Callback URL trả về 404

**Solution**:
1. Kiểm tra path có đúng không: `/api/payments/zalopay/callback`
2. Verify backend đang chạy: `curl http://localhost:3000/api/health`
3. Check ngrok forwarding URL: `http://localhost:4040`

**Problem**: ngrok warning page hiện lên

**Solution**: Bypass warning trong code (đã implement ở return handler):

```typescript:18:56:src/modules/payments/zalopay-callback.controller.ts
@Get('return')
async handleZaloPayReturn(@Query() queryParams: any, @Res() res: any) {
  // Bypass ngrok warning và hiển thị trang thành công
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
      <title>Thanh toán thành công</title>
      ...
```

### Test Trong Môi Trường Sandbox

1. Đăng ký tài khoản ZaloPay Developer
2. Lấy credentials (APP_ID, KEY1, KEY2)
3. Cấu hình callback URL với ngrok (theo hướng dẫn trên)
4. Test thanh toán với số tiền nhỏ

### Test Callback Manually

```bash
# POST request để test callback
curl -X POST http://localhost:3000/api/payments/zalopay/test-callback \
  -H "Content-Type: application/json" \
  -d '{
    "test": "data"
  }'
```

### Debug Payment Orders

```bash
# Xem tất cả payment orders
curl -X GET http://localhost:3000/api/payments/debug/orders \
  -H "Authorization: Bearer <token>"
```

## 📝 API Reference

### POST `/api/payments/generate-zalopay-qr`

Tạo QR code thanh toán ZaloPay cho hóa đơn.

**Request Body**:
```json
{
  "invoiceId": 1234
}
```

**Response**:
```json
{
  "orderId": "ORD_1730415600000_1234",
  "qrCodeUrl": "data:image/png;base64,...",
  "qrCodeData": "...",
  "expiryAt": "2025-11-02T00:00:00.000Z",
  "amount": 200000,
  "isZaloPayQR": true
}
```

**Errors**:
- `404`: Invoice not found
- `400`: Invoice already paid
- `500`: Failed to generate QR code

### GET `/api/payments/status/:orderId`

Kiểm tra trạng thái thanh toán.

**Response**:
```json
{
  "orderId": "ORD_1730415600000_1234",
  "status": "paid",
  "paidAt": "2025-11-01T14:30:00.000Z",
  "paymentMethod": "zalopay"
}
```

**Status Values**:
- `pending`: Đang chờ thanh toán
- `paid`: Đã thanh toán thành công
- `expired`: QR đã hết hạn
- `cancelled`: Đã hủy
- `failed`: Thanh toán thất bại

### POST `/api/payments/zalopay/callback`

Nhận callback từ ZaloPay (không cần authentication).

**Request**:
```json
{
  "data": "{\"app_trans_id\":\"251201_123456\",\"amount\":200000,...}",
  "type": "1",
  "mac": "abc123..."
}
```

**Response**:
```json
{
  "return_code": 1,
  "return_message": "OK"
}
```

### PUT `/api/payments/confirm`

Xác nhận thanh toán thủ công (fallback).

**Request Body**:
```json
{
  "orderId": "ORD_1730415600000_1234",
  "paymentMethod": "zalopay"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment confirmed successfully"
}
```

### POST `/api/payments/regenerate-qr/:orderId`

Tạo lại QR code cho payment order hết hạn.

**Response**:
```json
{
  "orderId": "ORD_1730415600000_1234",
  "qrCodeUrl": "data:image/png;base64,...",
  "qrCodeData": "...",
  "expiryAt": "2025-11-02T00:30:00.000Z",
  "amount": 200000,
  "isZaloPayQR": true
}
```

### GET `/api/payments/debug/orders`

Lấy tất cả payment orders (debug).

**Response**:
```json
[
  {
    "orderId": "ORD_1730415600000_1234",
    "invoiceId": 1234,
    "amount": 200000,
    "status": "paid",
    "paymentMethod": "zalopay",
    "paidAt": "2025-11-01T14:30:00.000Z",
    "zalopayOrderId": "251201_123456",
    "createdAt": "2025-11-01T14:00:00.000Z"
  }
]
```

## 🔍 Troubleshooting

### QR Code Không Hiển Thị

**Nguyên nhân**:
1. ZaloPay API lỗi
2. Thiếu hoặc sai cấu hình
3. MAC signature sai

**Giải pháp**:
1. Kiểm tra logs của ZaloPay API
2. Verify các environment variables
3. Kiểm tra format của MAC signature

### Callback Không Được Gọi

**Nguyên nhân**:
1. Callback URL không accessible từ internet
2. Firewall chặn request
3. HTTPS certificate issue

**Giải pháp**:
1. Sử dụng ngrok cho local testing
2. Kiểm tra firewall rules
3. Verify SSL certificate

### MAC Verification Failed

**Nguyên nhân**:
1. KEY1/KEY2 sai
2. Format data string sai
3. Encoding issue

**Giải pháp**:
1. Double-check KEY1 và KEY2 trong .env
2. Verify format của data string theo docs ZaloPay
3. Ensure UTF-8 encoding

### Thanh Toán Thành Công Nhưng Không Cập Nhật DB

**Nguyên nhân**:
1. Không tìm thấy payment order
2. Callback xử lý lỗi
3. Database transaction failed

**Giải pháp**:
1. Kiểm tra logs của callback handler
2. Verify payment order được tạo đúng
3. Check database connection

### QR Code Hết Hạn Quá Nhanh

**Mặc định**: 15 phút

**Giải pháp**: Có thể điều chỉnh trong code:

```typescript
// src/shared/services/qr-code.service.ts
const expiryAt = new Date();
expiryAt.setMinutes(expiryAt.getMinutes() + 30); // 30 phút
```

## 📚 Tài Nguyên

### Tài Liệu Chính Thức

- [ZaloPay Developer Documentation](https://developers.zalopay.vn/)
- [ZaloPay API Reference](https://developers.zalopay.vn/docs/api/create-order)
- [ZaloPay Callback Guide](https://developers.zalopay.vn/docs/guides/callback)

### Code Files

- `src/shared/services/qr-code.service.ts` - Service tạo QR code
- `src/modules/payments/zalopay-callback.controller.ts` - Callback handler
- `src/modules/payments/payments.service.ts` - Payment service
- `src/modules/payments/payments.controller.ts` - Payment endpoints
- `src/modules/contracts/schemas/payment-order.schema.ts` - Payment order schema
- `src/modules/contracts/schemas/invoice.schema.ts` - Invoice schema

### Related Documentation

- [Maintenance Fee Flow](maintenance-fee-flow.md)
- [Rental Contract Payment Flow](rental-contract-payment-flow.md)

## ✅ Checklist Tích Hợp

- [ ] Đăng ký tài khoản ZaloPay Developer
- [ ] Lấy credentials (APP_ID, KEY1, KEY2)
- [ ] Cấu hình environment variables
- [ ] Test tạo QR code trong sandbox
- [ ] Cấu hình ngrok cho local testing
- [ ] Test callback từ ZaloPay
- [ ] Verify MAC signature
- [ ] Test full payment flow
- [ ] Deploy lên production
- [ ] Cấu hình production credentials
- [ ] Update callback URL
- [ ] Test thanh toán với số tiền thật
- [ ] Setup monitoring và logging
- [ ] Document cho team

## 🎯 Best Practices

1. **Luôn test trong sandbox trước khi deploy production**
2. **Implement retry mechanism cho callback failures**
3. **Log tất cả transactions để audit**
4. **Monitor payment success rate**
5. **Implement proper error handling**
6. **Use HTTPS cho tất cả payment endpoints**
7. **Never log sensitive data (KEY1, KEY2, MAC)**
8. **Implement idempotency cho callbacks**
9. **Add timeout cho polling payment status**
10. **Provide user feedback trong payment flow**

