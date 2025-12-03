-- ============================================
-- Tạo bảng cau_hinh_mon_nhan_he_so
-- Lưu ý: Đảm bảo các bảng sau đã được tạo trước:
-- 1. thongtin_tuyensinh
-- 2. mon_hoc
-- ============================================

-- Bước 1: Tạo bảng không có foreign key trước
DROP TABLE IF EXISTS `cau_hinh_mon_nhan_he_so`;

CREATE TABLE `cau_hinh_mon_nhan_he_so` (
  `idcauhinh` INT(11) NOT NULL AUTO_INCREMENT,
  `idthongtin` INT(11) NOT NULL COMMENT 'ID thông tin tuyển sinh',
  `idmonhoc` INT(11) NOT NULL COMMENT 'ID môn học được nhân hệ số',
  `he_so` DECIMAL(3,2) DEFAULT 2.00 COMMENT 'Hệ số nhân (thường là 2.0)',
  `trang_thai` TINYINT(1) DEFAULT 1 COMMENT '1: Hoạt động, 0: Không hoạt động',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`idcauhinh`),
  KEY `idx_thongtin` (`idthongtin`),
  KEY `idx_monhoc` (`idmonhoc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Bảng cấu hình môn nhân hệ số trong tổ hợp xét tuyển';

-- Bước 2: Thêm các foreign key sau khi bảng đã được tạo
ALTER TABLE `cau_hinh_mon_nhan_he_so`
  ADD CONSTRAINT `fk_cauhinh_thongtin` FOREIGN KEY (`idthongtin`) 
    REFERENCES `thongtin_tuyensinh` (`idthongtin`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cauhinh_monhoc` FOREIGN KEY (`idmonhoc`) 
    REFERENCES `mon_hoc` (`idmonhoc`) ON DELETE CASCADE;







