-- =====================================================
-- SQL Script: Tạo các bảng cho chức năng Tính Điểm Tốt Nghiệp THPT
-- =====================================================

-- 1. Bảng danh sách môn thi tốt nghiệp
CREATE TABLE IF NOT EXISTS `mon_thi_tot_nghiep` (
  `idmonthi` INT(11) NOT NULL AUTO_INCREMENT,
  `ma_mon_thi` VARCHAR(20) NOT NULL COMMENT 'Mã môn thi (VAN, TOAN, TU_CHON_1, TU_CHON_2, NGOAI_NGU)',
  `ten_mon_thi` VARCHAR(100) NOT NULL COMMENT 'Tên môn thi',
  `loai_mon` ENUM('BAT_BUOC', 'TU_CHON', 'NGOAI_NGU') DEFAULT 'BAT_BUOC' COMMENT 'Loại môn: Bắt buộc, Tự chọn, Ngoại ngữ',
  `trang_thai` TINYINT(1) DEFAULT 1 COMMENT '1: Hoạt động, 0: Không hoạt động',
  `nam_ap_dung` INT(4) DEFAULT 2025 COMMENT 'Năm áp dụng',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`idmonthi`),
  UNIQUE KEY `uk_ma_mon_thi_nam` (`ma_mon_thi`, `nam_ap_dung`),
  KEY `idx_trang_thai` (`trang_thai`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Bảng danh sách môn thi tốt nghiệp THPT';

-- 2. Bảng lưu điểm thi tốt nghiệp
CREATE TABLE IF NOT EXISTS `diem_thi_tot_nghiep` (
  `iddiemthi` INT(11) NOT NULL AUTO_INCREMENT,
  `idnguoidung` BIGINT UNSIGNED NOT NULL COMMENT 'ID người dùng (học sinh)',
  `idmonthi` INT(11) NOT NULL COMMENT 'ID môn thi',
  `diem_thi` DECIMAL(4,2) DEFAULT 0.00 COMMENT 'Điểm thi (0.00 - 10.00)',
  `mien_thi` TINYINT(1) DEFAULT 0 COMMENT '1: Miễn thi, 0: Không miễn thi',
  `nam_thi` INT(4) DEFAULT 2025 COMMENT 'Năm thi tốt nghiệp',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`iddiemthi`),
  KEY `idx_nguoidung` (`idnguoidung`),
  KEY `idx_monthi` (`idmonthi`),
  KEY `idx_nam_thi` (`nam_thi`),
  UNIQUE KEY `uk_nguoidung_monthi_nam` (`idnguoidung`, `idmonthi`, `nam_thi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Bảng lưu điểm thi tốt nghiệp THPT';

-- 3. Bảng lưu điểm môn học cho tốt nghiệp (lớp 10, 11, 12)
CREATE TABLE IF NOT EXISTS `diem_mon_hoc_tot_nghiep` (
  `iddiemmon` INT(11) NOT NULL AUTO_INCREMENT,
  `idnguoidung` BIGINT UNSIGNED NOT NULL COMMENT 'ID người dùng (học sinh)',
  `idmonhoc` INT(11) NOT NULL COMMENT 'ID môn học',
  `lop` TINYINT(2) NOT NULL COMMENT 'Lớp (10, 11, 12)',
  `diem_trung_binh` DECIMAL(4,2) DEFAULT 0.00 COMMENT 'Điểm trung bình cả năm (0.00 - 10.00)',
  `nam_hoc` INT(4) DEFAULT NULL COMMENT 'Năm học',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`iddiemmon`),
  KEY `idx_nguoidung` (`idnguoidung`),
  KEY `idx_monhoc` (`idmonhoc`),
  KEY `idx_lop` (`lop`),
  KEY `idx_nam_hoc` (`nam_hoc`),
  UNIQUE KEY `uk_nguoidung_monhoc_lop` (`idnguoidung`, `idmonhoc`, `lop`, `nam_hoc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Bảng lưu điểm môn học cho tính điểm tốt nghiệp';

-- 4. Bảng lưu điểm khuyến khích
CREATE TABLE IF NOT EXISTS `diem_khuyen_khich` (
  `iddiemkk` INT(11) NOT NULL AUTO_INCREMENT,
  `idnguoidung` BIGINT UNSIGNED NOT NULL COMMENT 'ID người dùng (học sinh)',
  `loai_kk` VARCHAR(100) DEFAULT NULL COMMENT 'Loại khuyến khích (VD: Giải thưởng, Chứng chỉ, v.v.)',
  `diem_kk` DECIMAL(4,2) DEFAULT 0.00 COMMENT 'Điểm khuyến khích (0.00 - 10.00)',
  `mo_ta` TEXT DEFAULT NULL COMMENT 'Mô tả chi tiết',
  `nam_ap_dung` INT(4) DEFAULT 2025 COMMENT 'Năm áp dụng',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`iddiemkk`),
  KEY `idx_nguoidung` (`idnguoidung`),
  KEY `idx_nam_ap_dung` (`nam_ap_dung`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Bảng lưu điểm khuyến khích';

-- 5. Bảng lưu kết quả tính điểm tốt nghiệp
CREATE TABLE IF NOT EXISTS `ket_qua_tinh_diem_tot_nghiep` (
  `idketqua` INT(11) NOT NULL AUTO_INCREMENT,
  `idnguoidung` BIGINT UNSIGNED NOT NULL COMMENT 'ID người dùng (học sinh)',
  `mien_thi_ngoai_ngu` TINYINT(1) DEFAULT 0 COMMENT '1: Miễn thi ngoại ngữ, 0: Không miễn',
  `tong_diem_4_mon_thi` DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Tổng điểm 4 môn thi (hoặc 3 môn nếu miễn thi ngoại ngữ)',
  `tong_diem_kk` DECIMAL(4,2) DEFAULT 0.00 COMMENT 'Tổng điểm khuyến khích',
  `diem_tb_lop_10` DECIMAL(4,2) DEFAULT 0.00 COMMENT 'Điểm trung bình lớp 10',
  `diem_tb_lop_11` DECIMAL(4,2) DEFAULT 0.00 COMMENT 'Điểm trung bình lớp 11',
  `diem_tb_lop_12` DECIMAL(4,2) DEFAULT 0.00 COMMENT 'Điểm trung bình lớp 12',
  `dtb_cac_nam_hoc` DECIMAL(4,2) DEFAULT 0.00 COMMENT 'ĐTB các năm học (theo công thức)',
  `diem_uu_tien` DECIMAL(4,2) DEFAULT 0.00 COMMENT 'Điểm ưu tiên',
  `tong_diem_xet_tot_nghiep` DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Tổng điểm xét tốt nghiệp (DXTN)',
  `cong_thuc_ap_dung` VARCHAR(50) DEFAULT NULL COMMENT 'Công thức áp dụng (THUONG hoặc MIEN_THI_NN)',
  `nam_thi` INT(4) DEFAULT 2025 COMMENT 'Năm thi tốt nghiệp',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`idketqua`),
  KEY `idx_nguoidung` (`idnguoidung`),
  KEY `idx_nam_thi` (`nam_thi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Bảng lưu kết quả tính điểm tốt nghiệp THPT';

-- 6. Bảng chi tiết điểm thi tốt nghiệp (tùy chọn)
CREATE TABLE IF NOT EXISTS `chi_tiet_diem_thi_tot_nghiep` (
  `idchitiet` INT(11) NOT NULL AUTO_INCREMENT,
  `idketqua` INT(11) NOT NULL COMMENT 'ID kết quả tính điểm',
  `idmonthi` INT(11) NOT NULL COMMENT 'ID môn thi',
  `diem_thi` DECIMAL(4,2) DEFAULT 0.00 COMMENT 'Điểm thi',
  `mien_thi` TINYINT(1) DEFAULT 0 COMMENT '1: Miễn thi, 0: Không miễn',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`idchitiet`),
  KEY `idx_ketqua` (`idketqua`),
  KEY `idx_monthi` (`idmonthi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Bảng chi tiết điểm thi tốt nghiệp';

-- =====================================================
-- Thêm Foreign Key Constraints
-- =====================================================

-- Foreign keys cho diem_thi_tot_nghiep
ALTER TABLE `diem_thi_tot_nghiep`
  ADD CONSTRAINT `fk_diemthi_nguoidung` FOREIGN KEY (`idnguoidung`) REFERENCES `nguoidung` (`idnguoidung`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_diemthi_monthi` FOREIGN KEY (`idmonthi`) REFERENCES `mon_thi_tot_nghiep` (`idmonthi`) ON DELETE CASCADE;

-- Foreign keys cho diem_mon_hoc_tot_nghiep
ALTER TABLE `diem_mon_hoc_tot_nghiep`
  ADD CONSTRAINT `fk_diemmon_nguoidung` FOREIGN KEY (`idnguoidung`) REFERENCES `nguoidung` (`idnguoidung`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_diemmon_monhoc` FOREIGN KEY (`idmonhoc`) REFERENCES `mon_hoc` (`idmonhoc`) ON DELETE CASCADE;

-- Foreign keys cho diem_khuyen_khich
ALTER TABLE `diem_khuyen_khich`
  ADD CONSTRAINT `fk_diemkk_nguoidung` FOREIGN KEY (`idnguoidung`) REFERENCES `nguoidung` (`idnguoidung`) ON DELETE CASCADE;

-- Foreign keys cho ket_qua_tinh_diem_tot_nghiep
ALTER TABLE `ket_qua_tinh_diem_tot_nghiep`
  ADD CONSTRAINT `fk_ketqua_nguoidung` FOREIGN KEY (`idnguoidung`) REFERENCES `nguoidung` (`idnguoidung`) ON DELETE CASCADE;

-- Foreign keys cho chi_tiet_diem_thi_tot_nghiep
ALTER TABLE `chi_tiet_diem_thi_tot_nghiep`
  ADD CONSTRAINT `fk_chitiet_ketqua` FOREIGN KEY (`idketqua`) REFERENCES `ket_qua_tinh_diem_tot_nghiep` (`idketqua`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_chitiet_monthi` FOREIGN KEY (`idmonthi`) REFERENCES `mon_thi_tot_nghiep` (`idmonthi`) ON DELETE CASCADE;

-- =====================================================
-- Insert dữ liệu mẫu
-- =====================================================

-- Insert môn thi tốt nghiệp
INSERT INTO `mon_thi_tot_nghiep` (`ma_mon_thi`, `ten_mon_thi`, `loai_mon`, `nam_ap_dung`) VALUES
('VAN', 'Ngữ văn', 'BAT_BUOC', 2025),
('TOAN', 'Toán', 'BAT_BUOC', 2025),
('NGOAI_NGU', 'Ngoại ngữ', 'BAT_BUOC', 2025),
('TU_CHON_1', 'Tự chọn 1', 'TU_CHON', 2025),
('TU_CHON_2', 'Tự chọn 2', 'TU_CHON', 2025)
ON DUPLICATE KEY UPDATE `ten_mon_thi` = VALUES(`ten_mon_thi`);




