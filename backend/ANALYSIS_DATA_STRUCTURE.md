# Cấu trúc Dữ liệu cho Trang Phân tích và Dự báo

Tài liệu này mô tả cấu trúc bảng dữ liệu cần thiết để hỗ trợ các biểu đồ phân tích trong trang `/analyst/analysis`.

## 📊 Tổng quan các Biểu đồ

1. **Dự báo Ngành học "Hot"**
   - Line Chart: Xu hướng số lượng đăng ký qua các năm
   - Bubble Chart: Tỷ lệ việc làm, Mức lương, Chỉ tiêu
   - Stacked Bar Chart: Tỷ lệ Nguyện vọng 1 vs Tổng nguyện vọng

2. **Dự báo Điểm chuẩn Đầu vào**
   - Line Chart: Xu hướng Điểm chuẩn qua các năm
   - Scatter Plot: Mối quan hệ Điểm chuẩn vs Số lượng đăng ký

3. **Phân tích Ngành dễ xin việc**
   - Bar Chart: Tỷ lệ sinh viên có việc làm
   - Stacked Bar Chart: Phân loại tình trạng việc làm
   - Scatter Plot: Học phí vs Tỷ lệ việc làm

4. **Phân tích Số điểm các Ngành**
   - Bar Chart: So sánh Điểm chuẩn hiện tại (Top 10)
   - Grouped Bar Chart: Điểm chuẩn cùng ngành ở các trường khác nhau

---

## 🗄️ Cấu trúc Bảng Dữ liệu

### 1. Bảng hiện có (Đã có trong hệ thống)

#### `diemchuanxettuyen` - Điểm chuẩn xét tuyển
```sql
- iddiemchuan (PK)
- idtruong (FK -> truongdaihoc)
- manganh (FK -> nganhhoc)
- idxettuyen (FK -> ptxt) - Phương thức xét tuyển
- tohopmon - Tổ hợp môn
- diemchuan - Điểm chuẩn
- namxettuyen - Năm xét tuyển
- ghichu
```

#### `thongtin_tuyensinh` - Thông tin tuyển sinh
```sql
- idthongtin (PK)
- idtruong (FK)
- manganh (FK)
- idxettuyen (FK)
- tohopmon
- nam - Năm tuyển sinh
- diemchuan - Điểm chuẩn
- chitieu - Chỉ tiêu tuyển sinh
- ghichu
- trangthai
- created_at, updated_at
```

#### `nganhhoc` - Ngành học
```sql
- idnganh (PK)
- idnhomnganh (FK)
- manganh - Mã ngành
- tennganh - Tên ngành
- capdo
- bangcap
- motanganh
- mucluong - Mức lương (text)
- xuhuong - Xu hướng (Rất nóng, Tăng mạnh, Tăng, Cao, Ổn định, Khác)
```

#### `nganh_truong` - Ngành của trường
```sql
- idnganhtruong (PK)
- idtruong (FK)
- manganh (FK)
- hinhthuc
- thoiluong_nam
- so_ky
- hocphi_ky - Học phí/kỳ
- hocphi_ghichu
- decuong_url
- mota_tomtat
```

---

### 2. Bảng cần bổ sung (Chưa có - Cần tạo)

#### `nguyen_vong_dang_ky` - Nguyện vọng đăng ký
**Mục đích:** Lưu số lượng đăng ký nguyện vọng của thí sinh theo từng ngành/năm

```sql
CREATE TABLE IF NOT EXISTS `nguyen_vong_dang_ky` (
  `idnguyenvong` INT(11) NOT NULL AUTO_INCREMENT,
  `idtruong` INT(11) NOT NULL COMMENT 'ID trường đại học',
  `manganh` VARCHAR(20) NOT NULL COMMENT 'Mã ngành học',
  `nam` INT(4) NOT NULL COMMENT 'Năm tuyển sinh',
  `so_nguyen_vong_1` INT(11) DEFAULT 0 COMMENT 'Số lượng nguyện vọng 1',
  `tong_nguyen_vong` INT(11) DEFAULT 0 COMMENT 'Tổng số nguyện vọng',
  `so_luong_dang_ky` INT(11) DEFAULT 0 COMMENT 'Tổng số lượng đăng ký',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`idnguyenvong`),
  KEY `idx_truong_nganh_nam` (`idtruong`, `manganh`, `nam`),
  KEY `idx_nam` (`nam`),
  KEY `idx_manganh` (`manganh`),
  CONSTRAINT `fk_nv_truong` FOREIGN KEY (`idtruong`) 
    REFERENCES `truongdaihoc` (`idtruong`) ON DELETE CASCADE,
  CONSTRAINT `fk_nv_nganh` FOREIGN KEY (`manganh`) 
    REFERENCES `nganhhoc` (`manganh`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Dữ liệu mẫu:**
```sql
INSERT INTO `nguyen_vong_dang_ky` 
  (`idtruong`, `manganh`, `nam`, `so_nguyen_vong_1`, `tong_nguyen_vong`, `so_luong_dang_ky`)
VALUES
  (27, '7480201', 2024, 1800, 2500, 2500),
  (27, '7480101', 2024, 1500, 2200, 2200),
  (27, '7480103', 2024, 1300, 2000, 2000);
```

---

#### `ty_le_viec_lam` - Tỷ lệ việc làm sau tốt nghiệp
**Mục đích:** Lưu thống kê việc làm của sinh viên sau tốt nghiệp theo ngành

```sql
CREATE TABLE IF NOT EXISTS `ty_le_viec_lam` (
  `idtylevl` INT(11) NOT NULL AUTO_INCREMENT,
  `manganh` VARCHAR(20) NOT NULL COMMENT 'Mã ngành học',
  `nam_tot_nghiep` INT(4) NOT NULL COMMENT 'Năm tốt nghiệp',
  `ty_le_co_viec_lam` DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Tỷ lệ có việc làm (%)',
  `ty_le_that_nghiep` DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Tỷ lệ thất nghiệp (%)',
  `ty_le_hoc_len` DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Tỷ lệ học lên (%)',
  `muc_luong_trung_binh` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Mức lương trung bình (triệu VNĐ)',
  `so_sinh_vien_khao_sat` INT(11) DEFAULT 0 COMMENT 'Số sinh viên được khảo sát',
  `nguon_du_lieu` VARCHAR(255) DEFAULT NULL COMMENT 'Nguồn dữ liệu (VD: Khảo sát Bộ GD&ĐT, Trường...)',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`idtylevl`),
  KEY `idx_manganh_nam` (`manganh`, `nam_tot_nghiep`),
  KEY `idx_nam` (`nam_tot_nghiep`),
  CONSTRAINT `fk_vl_nganh` FOREIGN KEY (`manganh`) 
    REFERENCES `nganhhoc` (`manganh`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Dữ liệu mẫu:**
```sql
INSERT INTO `ty_le_viec_lam` 
  (`manganh`, `nam_tot_nghiep`, `ty_le_co_viec_lam`, `ty_le_that_nghiep`, `ty_le_hoc_len`, `muc_luong_trung_binh`, `so_sinh_vien_khao_sat`)
VALUES
  ('7480201', 2023, 95.00, 3.00, 2.00, 15.00, 500),
  ('7480101', 2023, 92.00, 5.00, 3.00, 14.00, 400),
  ('7480103', 2023, 90.00, 6.00, 4.00, 13.00, 350);
```

---

#### `lich_su_diem_chuan` - Lịch sử điểm chuẩn (View hoặc bảng)
**Mục đích:** Tổng hợp điểm chuẩn qua các năm để phân tích xu hướng

**Có thể sử dụng bảng `diemchuanxettuyen` hiện có, nhưng cần đảm bảo có đủ dữ liệu lịch sử.**

**Query mẫu để lấy xu hướng:**
```sql
SELECT 
  nh.tennganh,
  dc.namxettuyen AS year,
  AVG(dc.diemchuan) AS diem_chuan_tb,
  COUNT(DISTINCT dc.idtruong) AS so_truong
FROM diemchuanxettuyen dc
JOIN nganhhoc nh ON dc.manganh = nh.manganh
WHERE dc.namxettuyen >= 2020
GROUP BY nh.tennganh, dc.namxettuyen
ORDER BY nh.tennganh, dc.namxettuyen;
```

---

## 📡 API Endpoints Cần Tạo

### 1. `/api/thongke/xu-huong-nganh-hot`
**Mục đích:** Lấy xu hướng số lượng đăng ký của các ngành hot qua các năm

**Request:**
```
GET /api/thongke/xu-huong-nganh-hot?year=2024&manganh=7480201
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "year": "2020",
      "Công nghệ thông tin": 1200,
      "Khoa học máy tính": 980,
      "Kỹ thuật phần mềm": 850
    },
    {
      "year": "2021",
      "Công nghệ thông tin": 1450,
      "Khoa học máy tính": 1120,
      "Kỹ thuật phần mềm": 1020
    }
  ]
}
```

**Query SQL:**
```sql
SELECT 
  nv.nam AS year,
  nh.tennganh,
  SUM(nv.so_luong_dang_ky) AS so_luong
FROM nguyen_vong_dang_ky nv
JOIN nganhhoc nh ON nv.manganh = nh.manganh
WHERE nh.xuhuong IN ('Rất nóng', 'Tăng mạnh', 'Tăng', 'Cao')
  AND nv.nam >= 2020
GROUP BY nv.nam, nh.tennganh
ORDER BY nv.nam, nh.tennganh;
```

---

### 2. `/api/thongke/bubble-chart`
**Mục đích:** Lấy dữ liệu cho Bubble Chart (Tỷ lệ việc làm, Mức lương, Chỉ tiêu)

**Request:**
```
GET /api/thongke/bubble-chart
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Công nghệ thông tin",
      "employmentRate": 95,
      "avgSalary": 15,
      "quota": 500
    },
    {
      "name": "Khoa học máy tính",
      "employmentRate": 92,
      "avgSalary": 14,
      "quota": 400
    }
  ]
}
```

**Query SQL:**
```sql
SELECT 
  nh.tennganh AS name,
  COALESCE(vl.ty_le_co_viec_lam, 0) AS employmentRate,
  COALESCE(vl.muc_luong_trung_binh, 0) AS avgSalary,
  COALESCE(SUM(tt.chitieu), 0) AS quota
FROM nganhhoc nh
LEFT JOIN ty_le_viec_lam vl ON nh.manganh = vl.manganh 
  AND vl.nam_tot_nghiep = (SELECT MAX(nam_tot_nghiep) FROM ty_le_viec_lam)
LEFT JOIN thongtin_tuyensinh tt ON nh.manganh = tt.manganh 
  AND tt.nam = 2024
WHERE nh.xuhuong IN ('Rất nóng', 'Tăng mạnh', 'Tăng', 'Cao')
GROUP BY nh.manganh, nh.tennganh, vl.ty_le_co_viec_lam, vl.muc_luong_trung_binh
ORDER BY vl.ty_le_co_viec_lam DESC
LIMIT 10;
```

---

### 3. `/api/thongke/xu-huong-diem-chuan`
**Mục đích:** Lấy xu hướng điểm chuẩn qua các năm

**Request:**
```
GET /api/thongke/xu-huong-diem-chuan?year=2024&manganh=7480201
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "year": "2020",
      "Công nghệ thông tin": 25.5,
      "Khoa học máy tính": 25.2,
      "Kỹ thuật phần mềm": 24.8
    }
  ]
}
```

**Query SQL:**
```sql
SELECT 
  dc.namxettuyen AS year,
  nh.tennganh,
  AVG(dc.diemchuan) AS diem_chuan_tb
FROM diemchuanxettuyen dc
JOIN nganhhoc nh ON dc.manganh = nh.manganh
WHERE dc.namxettuyen >= 2020
  AND (dc.manganh = ? OR ? = '')
GROUP BY dc.namxettuyen, nh.tennganh
ORDER BY dc.namxettuyen, nh.tennganh;
```

---

### 4. `/api/thongke/scatter-plot`
**Mục đích:** Lấy dữ liệu mối quan hệ Điểm chuẩn vs Số lượng đăng ký

**Request:**
```
GET /api/thongke/scatter-plot?year=2024
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "applications": 2000,
      "score": 27.5,
      "major": "CNTT"
    }
  ]
}
```

**Query SQL:**
```sql
SELECT 
  COALESCE(SUM(nv.so_luong_dang_ky), 0) AS applications,
  COALESCE(AVG(dc.diemchuan), 0) AS score,
  nh.tennganh AS major
FROM nganhhoc nh
LEFT JOIN nguyen_vong_dang_ky nv ON nh.manganh = nv.manganh 
  AND nv.nam = 2024
LEFT JOIN diemchuanxettuyen dc ON nh.manganh = dc.manganh 
  AND dc.namxettuyen = 2024
GROUP BY nh.manganh, nh.tennganh
HAVING applications > 0 AND score > 0
ORDER BY score DESC;
```

---

### 5. `/api/thongke/grouped-bar`
**Mục đích:** Lấy điểm chuẩn cùng ngành ở các trường khác nhau

**Request:**
```
GET /api/thongke/grouped-bar?year=2024&manganh=7480201
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "CNTT",
      "ĐH Bách khoa HN": 28.5,
      "ĐH Công nghệ": 27.8,
      "ĐH FPT": 26.5
    }
  ]
}
```

**Query SQL:**
```sql
SELECT 
  nh.tennganh AS name,
  td.tentruong,
  AVG(dc.diemchuan) AS diem_chuan
FROM diemchuanxettuyen dc
JOIN nganhhoc nh ON dc.manganh = nh.manganh
JOIN truongdaihoc td ON dc.idtruong = td.idtruong
WHERE dc.namxettuyen = 2024
  AND (dc.manganh = ? OR ? = '')
GROUP BY nh.manganh, nh.tennganh, td.idtruong, td.tentruong
ORDER BY nh.tennganh, diem_chuan DESC;
```

---

## 📝 Ghi chú Quan trọng

1. **Dữ liệu lịch sử:** Cần đảm bảo có đủ dữ liệu từ ít nhất 3-5 năm trước để phân tích xu hướng.

2. **Dữ liệu việc làm:** Bảng `ty_le_viec_lam` có thể được cập nhật hàng năm từ:
   - Khảo sát của Bộ GD&ĐT
   - Khảo sát của các trường đại học
   - Dữ liệu từ các trang tuyển dụng

3. **Dữ liệu nguyện vọng:** Bảng `nguyen_vong_dang_ky` có thể được cập nhật từ:
   - Hệ thống đăng ký nguyện vọng của Bộ GD&ĐT
   - Dữ liệu thống kê từ các trường

4. **Performance:** Nên tạo các index phù hợp và có thể cân nhắc tạo Materialized Views cho các query phức tạp.

5. **Cache:** Các API thống kê nên được cache để tăng hiệu suất.

---

## 🔄 Migration Script

Tạo file migration để tạo các bảng mới:

```bash
php artisan make:migration create_nguyen_vong_dang_ky_table
php artisan make:migration create_ty_le_viec_lam_table
```

Sau đó chạy migration:
```bash
php artisan migrate
```



