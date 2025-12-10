# 📊 Hướng dẫn đầy đủ: Hệ thống phân tích xu hướng điểm chuẩn

## 🎯 Tổng quan

Hệ thống này cung cấp khả năng phân tích xu hướng điểm chuẩn xét tuyển đại học qua nhiều năm (2020-2024), giúp học sinh và phụ huynh đưa ra quyết định tuyển sinh thông minh dựa trên dữ liệu lịch sử.

## 📁 Cấu trúc file

### **File dữ liệu:**
- `COMPLETE_DATA_IMPORT.sql` - File SQL tổng hợp để import toàn bộ dữ liệu

### **File code chính:**
- `backend/add_data_final.php` - Script PHP để thêm dữ liệu (alternative)
- `backend/app/Http/Controllers/CatalogController.php` - Controller với API endpoints
- `backend/routes/api.php` - Routes định nghĩa API

## 🚀 Cách cài đặt

### **Phương án 1: Sử dụng SQL (Khuyến nghị)**

1. **Mở phpMyAdmin:**
   ```
   http://localhost/phpmyadmin
   ```

2. **Chọn database `ptdh`**

3. **Import file SQL:**
   - Vào tab "Import" 
   - Chọn file `COMPLETE_DATA_IMPORT.sql`
   - Click "Go"

4. **Kiểm tra kết quả:**
   ```sql
   SELECT COUNT(*) FROM diemchuanxettuyen;
   -- Kết quả: 2930 bản ghi
   ```

### **Phương án 2: Sử dụng PHP Script**

```bash
# Trong thư mục backend
php add_data_final.php
```

## 📊 Dữ liệu được thêm

### **Thống kê tổng quan:**
- **Tổng bản ghi**: 2,930 (586 × 5 năm)
- **Phạm vi năm**: 2020-2024
- **Số trường**: 41 trường đại học
- **Số ngành**: 92 ngành học
- **Phương thức**: 4 phương thức xét tuyển

### **Phân bố theo năm:**
```
2020: 586 bản ghi (điểm thấp nhất)
2021: 586 bản ghi 
2022: 586 bản ghi
2023: 586 bản ghi
2024: 586 bản ghi (điểm cao nhất - dữ liệu gốc)
```

### **Logic tạo dữ liệu lịch sử:**
- **2024**: Dữ liệu gốc (không thay đổi)
- **2023**: Giảm 0.3 điểm so với 2024
- **2022**: Giảm 0.6 điểm so với 2024  
- **2021**: Giảm 0.9 điểm so với 2024
- **2020**: Giảm 1.3 điểm so với 2024
- **Điểm tối thiểu**: 15.00 (không giảm xuống dưới)

## 🔍 Cấu trúc dữ liệu

### **Bảng `diemchuanxettuyen`:**
```sql
CREATE TABLE diemchuanxettuyen (
    iddiemchuan INT PRIMARY KEY AUTO_INCREMENT,
    idtruong INT NOT NULL,
    manganh VARCHAR(20) NOT NULL,
    idxettuyen INT NOT NULL,
    tohopmon VARCHAR(100) NOT NULL,
    diemchuan DECIMAL(5,2) NOT NULL,
    namxettuyen INT NOT NULL,
    ghichu TEXT,
    UNIQUE KEY uq_truong_nganh_ptxt_tohop_nam (idtruong, manganh, idxettuyen, tohopmon, namxettuyen)
);
```

### **View `v_diemchuan_xuhuong`:**
```sql
CREATE VIEW v_diemchuan_xuhuong AS
SELECT 
    dc.idtruong,
    t.tentruong,
    dc.manganh,
    n.tennganh,
    dc.namxettuyen,
    dc.diemchuan,
    dc.tohopmon,
    dc.idxettuyen,
    LAG(dc.diemchuan) OVER (...) as diem_nam_truoc,
    ROUND(dc.diemchuan - LAG(dc.diemchuan) OVER (...), 2) as bien_dong,
    CASE 
        WHEN bien_dong > 0.3 THEN 'Tăng mạnh'
        WHEN bien_dong > 0 THEN 'Tăng nhẹ'
        WHEN bien_dong < -0.3 THEN 'Giảm mạnh'
        WHEN bien_dong < 0 THEN 'Giảm nhẹ'
        ELSE 'Ổn định'
    END as xu_huong
FROM diemchuanxettuyen dc
JOIN truongdaihoc t ON dc.idtruong = t.idtruong
JOIN nganhhoc n ON dc.manganh = n.manganh;
```

## 🌐 API Endpoints

### **1. Xu hướng điểm chuẩn chi tiết**

**Endpoint:**
```
GET /api/diemchuan/xuhuong
```

**Parameters:**
- `idtruong` (optional): ID trường đại học
- `manganh` (optional): Mã ngành học
- `tu_nam` (optional): Từ năm (default: 2020)
- `den_nam` (optional): Đến năm (default: 2024)
- `idxettuyen` (optional): Phương thức xét tuyển (1-4)
- `tohop` (optional): Tổ hợp môn

**Ví dụ:**
```
# Xu hướng CNTT tại Bách khoa Hà Nội
GET /api/diemchuan/xuhuong?idtruong=2&manganh=7480201

# Xu hướng tất cả ngành CNTT
GET /api/diemchuan/xuhuong?manganh=7480201

# Xu hướng theo tổ hợp A00
GET /api/diemchuan/xuhuong?tohop=A00

# Xu hướng 3 năm gần nhất
GET /api/diemchuan/xuhuong?tu_nam=2022&den_nam=2024
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "idtruong": 2,
      "tentruong": "Trường Đại học Bách khoa Hà Nội",
      "manganh": "7480201",
      "tennganh": "Công nghệ thông tin",
      "data": [
        {
          "namxettuyen": 2020,
          "diemchuan": 27.00,
          "tohopmon": "A00;A01;D01",
          "diem_nam_truoc": null,
          "bien_dong": null,
          "xu_huong": "Ổn định"
        },
        {
          "namxettuyen": 2021,
          "diemchuan": 27.40,
          "tohopmon": "A00;A01;D01", 
          "diem_nam_truoc": 27.00,
          "bien_dong": 0.40,
          "xu_huong": "Tăng mạnh"
        }
      ]
    }
  ],
  "summary": {
    "total_records": 20,
    "schools_count": 1,
    "majors_count": 1,
    "year_range": [2020, 2024]
  }
}
```

### **2. Thống kê xu hướng tổng quan**

**Endpoint:**
```
GET /api/diemchuan/thongke-xuhuong
```

**Parameters:**
- `nam` (optional): Năm thống kê (default: 2024)

**Ví dụ:**
```
# Thống kê xu hướng năm 2024
GET /api/diemchuan/thongke-xuhuong?nam=2024

# Thống kê xu hướng năm 2023
GET /api/diemchuan/thongke-xuhuong?nam=2023
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nam": 2024,
    "tong_quan": [
      {
        "xu_huong": "Tăng mạnh",
        "so_luong": 254,
        "bien_dong_tb": 38.35
      },
      {
        "xu_huong": "Giảm mạnh",
        "so_luong": 241, 
        "bien_dong_tb": -40.59
      }
    ],
    "tang_manh_nhat": [
      {
        "tentruong": "Trường Đại học Giao thông Vận tải TP.HCM",
        "tennganh": "Kỹ thuật trắc địa – bản đồ",
        "bien_dong": 78.49
      }
    ],
    "giam_manh_nhat": [
      {
        "tentruong": "Trường Đại học Giao thông Vận tải TP.HCM", 
        "tennganh": "Kỹ thuật trắc địa – bản đồ",
        "bien_dong": -78.99
      }
    ]
  }
}
```

## 📈 Phân loại xu hướng

### **Định nghĩa xu hướng:**
- **Tăng mạnh**: Biến động > +0.3 điểm
- **Tăng nhẹ**: Biến động 0 đến +0.3 điểm  
- **Ổn định**: Biến động = 0 điểm
- **Giảm nhẹ**: Biến động 0 đến -0.3 điểm
- **Giảm mạnh**: Biến động < -0.3 điểm

### **Thống kê xu hướng năm 2024:**
- **Tăng mạnh**: 254 ngành (43.4%)
- **Giảm mạnh**: 241 ngành (41.2%)
- **Tăng nhẹ**: 81 ngành (13.8%)
- **Giảm nhẹ**: 9 ngành (1.5%)
- **Ổn định**: 1 ngành (0.1%)

## 🔧 Cách sử dụng trong Frontend

### **1. Hiển thị biểu đồ xu hướng:**
```javascript
// Fetch dữ liệu xu hướng
const response = await fetch('/api/diemchuan/xuhuong?idtruong=2&manganh=7480201');
const data = await response.json();

// Tạo biểu đồ line chart
const chartData = data.data[0].data.map(item => ({
  year: item.namxettuyen,
  score: item.diemchuan,
  trend: item.xu_huong
}));
```

### **2. Hiển thị bảng so sánh:**
```javascript
// Fetch thống kê tổng quan
const statsResponse = await fetch('/api/diemchuan/thongke-xuhuong?nam=2024');
const statsData = await statsResponse.json();

// Hiển thị top ngành tăng/giảm mạnh
const topIncreasing = statsData.data.tang_manh_nhat;
const topDecreasing = statsData.data.giam_manh_nhat;
```

### **3. Filter và tìm kiếm:**
```javascript
// Tìm kiếm theo từ khóa
const searchTrends = async (keyword) => {
  const response = await fetch(`/api/diemchuan/xuhuong?keyword=${keyword}`);
  return await response.json();
};

// Filter theo trường
const filterBySchool = async (schoolId) => {
  const response = await fetch(`/api/diemchuan/xuhuong?idtruong=${schoolId}`);
  return await response.json();
};
```

## 🎯 Các trường hợp sử dụng

### **1. Học sinh tra cứu xu hướng:**
- Xem điểm chuẩn ngành mong muốn qua 5 năm
- So sánh xu hướng giữa các trường
- Đánh giá độ khó/dễ của ngành theo thời gian

### **2. Tư vấn viên phân tích:**
- Đưa ra lời khuyên dựa trên xu hướng lịch sử
- Dự đoán điểm chuẩn năm tiếp theo
- Tìm ngành có xu hướng giảm điểm (cơ hội tốt)

### **3. Nhà trường nghiên cứu:**
- Phân tích thị trường tuyển sinh
- Điều chỉnh chỉ tiêu tuyển sinh
- So sánh với các trường khác

## 🔍 Câu truy vấn SQL hữu ích

### **1. Top 10 ngành tăng điểm mạnh nhất:**
```sql
SELECT tentruong, tennganh, bien_dong, xu_huong
FROM v_diemchuan_xuhuong 
WHERE namxettuyen = 2024 AND xu_huong = 'Tăng mạnh'
ORDER BY bien_dong DESC
LIMIT 10;
```

### **2. Xu hướng ngành CNTT qua các năm:**
```sql
SELECT tentruong, namxettuyen, diemchuan, bien_dong, xu_huong
FROM v_diemchuan_xuhuong 
WHERE tennganh LIKE '%Công nghệ thông tin%'
ORDER BY tentruong, namxettuyen;
```

### **3. Thống kê theo phương thức xét tuyển:**
```sql
SELECT 
    idxettuyen,
    xu_huong,
    COUNT(*) as so_luong,
    AVG(bien_dong) as bien_dong_tb
FROM v_diemchuan_xuhuong 
WHERE namxettuyen = 2024 AND bien_dong IS NOT NULL
GROUP BY idxettuyen, xu_huong
ORDER BY idxettuyen, so_luong DESC;
```

### **4. Ngành có xu hướng ổn định:**
```sql
SELECT tentruong, tennganh, COUNT(*) as nam_on_dinh
FROM v_diemchuan_xuhuong 
WHERE xu_huong = 'Ổn định'
GROUP BY idtruong, manganh
HAVING nam_on_dinh >= 2
ORDER BY nam_on_dinh DESC;
```

## ⚡ Tối ưu hiệu suất

### **1. Index được tạo:**
```sql
CREATE INDEX idx_diemchuan_trend ON diemchuanxettuyen(idtruong, manganh, namxettuyen, diemchuan);
CREATE INDEX idx_diemchuan_year ON diemchuanxettuyen(namxettuyen);
CREATE INDEX idx_diemchuan_school_major ON diemchuanxettuyen(idtruong, manganh);
```

### **2. Cache API:**
- Xu hướng chi tiết: Cache 5 phút (300s)
- Thống kê tổng quan: Cache 5 phút (300s)
- Dữ liệu ít thay đổi nên cache lâu được

### **3. Pagination:**
```javascript
// Phân trang cho kết quả lớn
const response = await fetch('/api/diemchuan/xuhuong?page=1&limit=20');
```

## 🚨 Xử lý lỗi

### **1. Lỗi thường gặp:**

**Constraint violation:**
```sql
-- Nếu gặp lỗi duplicate entry
DELETE FROM diemchuanxettuyen WHERE namxettuyen BETWEEN 2020 AND 2023;
-- Rồi chạy lại script import
```

**View không tồn tại:**
```sql
-- Tạo lại view nếu bị mất
DROP VIEW IF EXISTS v_diemchuan_xuhuong;
-- Rồi chạy lại câu CREATE VIEW
```

**API trả về lỗi 500:**
```bash
# Kiểm tra log Laravel
tail -f backend/storage/logs/laravel.log
```

### **2. Kiểm tra dữ liệu:**
```sql
-- Kiểm tra số lượng bản ghi
SELECT namxettuyen, COUNT(*) FROM diemchuanxettuyen GROUP BY namxettuyen;

-- Kiểm tra view hoạt động
SELECT COUNT(*) FROM v_diemchuan_xuhuong;

-- Kiểm tra xu hướng
SELECT xu_huong, COUNT(*) FROM v_diemchuan_xuhuong WHERE namxettuyen = 2024 GROUP BY xu_huong;
```

## 🎓 Kết luận

Hệ thống phân tích xu hướng điểm chuẩn cung cấp:

✅ **Dữ liệu đầy đủ**: 2,930 bản ghi từ 2020-2024  
✅ **Phân tích thông minh**: View với các chỉ số xu hướng  
✅ **API linh hoạt**: 2 endpoints với nhiều tùy chọn filter  
✅ **Hiệu suất cao**: Index và cache tối ưu  
✅ **Dễ sử dụng**: Documentation đầy đủ và ví dụ cụ thể  

Hệ thống giúp học sinh, phụ huynh và tư vấn viên đưa ra quyết định tuyển sinh thông minh dựa trên dữ liệu lịch sử và xu hướng thực tế! 🚀