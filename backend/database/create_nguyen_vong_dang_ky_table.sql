-- ============================================
-- Tạo bảng nguyen_vong_dang_ky để lưu số lượng đăng ký nguyện vọng
-- ============================================

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Bảng lưu số lượng đăng ký nguyện vọng theo ngành/năm';

-- ============================================
-- Dữ liệu mẫu
-- ============================================

INSERT INTO `nguyen_vong_dang_ky` 
  (`idtruong`, `manganh`, `nam`, `so_nguyen_vong_1`, `tong_nguyen_vong`, `so_luong_dang_ky`)
VALUES
  (27, '7480201', 2020, 1200, 1800, 1800),
  (27, '7480201', 2021, 1450, 2100, 2100),
  (27, '7480201', 2022, 1680, 2400, 2400),
  (27, '7480201', 2023, 1920, 2700, 2700),
  (27, '7480201', 2024, 2150, 3000, 3000),
  (27, '7480101', 2020, 980, 1500, 1500),
  (27, '7480101', 2021, 1120, 1700, 1700),
  (27, '7480101', 2022, 1350, 2000, 2000),
  (27, '7480101', 2023, 1580, 2300, 2300),
  (27, '7480101', 2024, 1820, 2600, 2600),
  (27, '7480103', 2020, 850, 1300, 1300),
  (27, '7480103', 2021, 1020, 1550, 1550),
  (27, '7480103', 2022, 1250, 1800, 1800),
  (27, '7480103', 2023, 1480, 2100, 2100),
  (27, '7480103', 2024, 1720, 2400, 2400);














