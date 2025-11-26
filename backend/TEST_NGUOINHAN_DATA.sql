-- Test SQL để tạo data cho nguoinhan_thongbao
-- Chạy SQL này để tạo test data

-- 1. Tạo test user (nếu chưa có)
INSERT INTO nguoidung (idvaitro, idnhomnganh, taikhoan, matkhau, email, hoten, sodienthoai, diachi, ngaysinh, gioitinh, trangthai, ngaytao, ngaycapnhat) 
VALUES (1, 1, 'admin_test', '123456', 'admin@test.com', 'Admin Test', '0123456789', 'Test Address', '1990-01-01', 'Nam', 'Hoạt động', NOW(), NOW())
ON DUPLICATE KEY UPDATE ngaycapnhat = NOW();

-- 2. Tạo test notification
INSERT INTO thongbao (tieude, noidung, nguoitao_id, thoigiangui_dukien, kieuguithongbao, ngaytao, ngaycapnhat) 
VALUES ('Test Notification', 'This is a test notification for debugging', 1, NOW(), 'ngay', NOW(), NOW());

-- 3. Tạo test notification recipient (không có created_at, updated_at)
INSERT INTO nguoinhan_thongbao (idthongbao, idnguoinhan, idvaitro, trangthai, thoigiangui_thucte) 
VALUES (1, 1, 1, 2, NOW());

-- 4. Kiểm tra data
SELECT * FROM nguoidung;
SELECT * FROM thongbao;
SELECT * FROM nguoinhan_thongbao;


