-- Tạo bảng tích điểm bồi đắp cho người dùng bị đổi lịch tư vấn (Bảng đơn giản)
-- Bảng này dùng để quản lý điểm thưởng/compensation cho người dùng khi lịch tư vấn bị thay đổi

-- Bảng điểm bồi đắp (Bảng nhỏ - chỉ các trường cần thiết)
CREATE TABLE IF NOT EXISTS `bang_diem_boi_duong` (
  `iddiem_boi_duong` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'ID điểm bồi đắp',
  `idnguoidung` INT(11) NOT NULL COMMENT 'ID người dùng được bồi đắp',
  `idlichtuvan` INT(11) DEFAULT NULL COMMENT 'ID lịch tư vấn liên quan',
  `iddoilich` INT(11) DEFAULT NULL COMMENT 'ID yêu cầu đổi lịch',
  `so_diem` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Số điểm được bồi đắp',
  `trang_thai` TINYINT(1) DEFAULT 1 COMMENT '1: Chưa sử dụng, 2: Đã sử dụng',
  `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo điểm',
  `nguoi_tao` INT(11) DEFAULT NULL COMMENT 'ID người tạo',
  PRIMARY KEY (`iddiem_boi_duong`),
  KEY `idx_nguoidung` (`idnguoidung`),
  KEY `idx_trang_thai` (`trang_thai`),
  CONSTRAINT `fk_diem_boi_duong_nguoidung` FOREIGN KEY (`idnguoidung`) REFERENCES `nguoidung` (`idnguoidung`) ON DELETE CASCADE,
  CONSTRAINT `fk_diem_boi_duong_lichtuvan` FOREIGN KEY (`idlichtuvan`) REFERENCES `lichtuvan` (`idlichtuvan`) ON DELETE SET NULL,
  CONSTRAINT `fk_diem_boi_duong_doilich` FOREIGN KEY (`iddoilich`) REFERENCES `bang_yeucau_doilich` (`iddoilich`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng điểm bồi đắp cho người dùng bị đổi lịch tư vấn';

