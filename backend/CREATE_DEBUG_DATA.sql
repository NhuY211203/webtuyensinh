# SQL Scripts để tạo Test Data cho Debug

## 1. Tạo Test User (nếu chưa có)
```sql
INSERT INTO nguoidung (idvaitro, idnhomnganh, taikhoan, matkhau, email, hoten, sodienthoai, diachi, ngaysinh, gioitinh, trangthai, ngaytao, ngaycapnhat) 
VALUES (1, 1, 'admin_test', '123456', 'admin@test.com', 'Admin Test', '0123456789', 'Test Address', '1990-01-01', 'Nam', 'Hoạt động', NOW(), NOW())
ON DUPLICATE KEY UPDATE ngaycapnhat = NOW();
```

## 2. Tạo Test Notification
```sql
INSERT INTO thongbao (tieude, noidung, nguoitao_id, thoigiangui_dukien, kieuguithongbao, ngaytao, ngaycapnhat) 
VALUES ('Test Notification', 'This is a test notification for debugging', 1, NOW(), 'ngay', NOW(), NOW());
```

## 3. Tạo Test Notification Recipient
```sql
INSERT INTO nguoinhan_thongbao (idthongbao, idnguoinhan, idvaitro, trangthai, thoigiangui_thucte, created_at, updated_at) 
VALUES (1, 1, 1, 2, NOW(), NOW(), NOW());
```

## 4. Kiểm tra Data đã tạo
```sql
-- Check users
SELECT * FROM nguoidung;

-- Check notifications
SELECT * FROM thongbao;

-- Check notification recipients
SELECT * FROM nguoinhan_thongbao;

-- Check specific notification with details
SELECT 
    tb.idthongbao,
    tb.tieude,
    tb.noidung,
    tb.kieuguithongbao,
    tb.nguoitao_id,
    nd.hoten as nguoi_tao
FROM thongbao tb
LEFT JOIN nguoidung nd ON tb.nguoitao_id = nd.idnguoidung;
```

## 5. Debug Authentication Issues
```sql
-- Check if user with ID 1 exists and is active
SELECT idnguoidung, hoten, email, trangthai 
FROM nguoidung 
WHERE idnguoidung = 1;
```


