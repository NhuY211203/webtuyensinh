-- ============================================
-- Script tạo các bảng cho chức năng tính điểm xét tuyển học bạ
-- Thứ tự tạo: Bảng không có foreign key trước, bảng có foreign key sau
-- ============================================

-- 1. Tạo bảng môn học (không có foreign key)
CREATE TABLE IF NOT EXISTS `mon_hoc` (
  `idmonhoc` INT(11) NOT NULL AUTO_INCREMENT,
  `ma_mon_hoc` VARCHAR(20) NOT NULL COMMENT 'Mã môn học (VD: TOAN, VAN, ANH)',
  `ten_mon_hoc` VARCHAR(255) NOT NULL COMMENT 'Tên môn học',
  `ten_viet_tat` VARCHAR(50) DEFAULT NULL COMMENT 'Tên viết tắt (VD: Toán, Văn, T.Anh)',
  `trang_thai` TINYINT(1) DEFAULT 1 COMMENT '1: Hoạt động, 0: Không hoạt động',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`idmonhoc`),
  UNIQUE KEY `uk_ma_mon_hoc` (`ma_mon_hoc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Bảng danh mục môn học';

-- 2. Tạo bảng phương thức xét học bạ (không có foreign key)
CREATE TABLE IF NOT EXISTS `phuong_thuc_xet_hoc_ba` (
  `idphuongthuc_hb` INT(11) NOT NULL AUTO_INCREMENT,
  `ten_phuong_thuc` VARCHAR(255) NOT NULL COMMENT 'Tên phương thức (VD: Xét học bạ 3 năm)',
  `ma_phuong_thuc` VARCHAR(50) NOT NULL COMMENT 'Mã phương thức (VD: HB_3_NAM)',
  `mo_ta` TEXT DEFAULT NULL COMMENT 'Mô tả chi tiết phương thức',
  `cach_tinh` TEXT DEFAULT NULL COMMENT 'Cách tính điểm (VD: (Điểm lớp 10 + 11 + 12)/3)',
  `trang_thai` TINYINT(1) DEFAULT 1 COMMENT '1: Hoạt động, 0: Không hoạt động',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`idphuongthuc_hb`),
  UNIQUE KEY `uk_ma_phuong_thuc` (`ma_phuong_thuc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Bảng phương thức xét học bạ';

-- 3. Tạo bảng đối tượng ưu tiên (không có foreign key)
CREATE TABLE IF NOT EXISTS `doi_tuong_uu_tien` (
  `iddoituong` INT(11) NOT NULL AUTO_INCREMENT,
  `ma_doi_tuong` VARCHAR(20) NOT NULL COMMENT 'Mã đối tượng (VD: DT01, DT02)',
  `ten_doi_tuong` VARCHAR(255) NOT NULL COMMENT 'Tên đối tượng ưu tiên',
  `mo_ta` TEXT DEFAULT NULL COMMENT 'Mô tả đối tượng',
  `diem_uu_tien` DECIMAL(4,2) DEFAULT 0.00 COMMENT 'Mức điểm ưu tiên (theo quy định)',
  `trang_thai` TINYINT(1) DEFAULT 1 COMMENT '1: Hoạt động, 0: Không hoạt động',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`iddoituong`),
  UNIQUE KEY `uk_ma_doi_tuong` (`ma_doi_tuong`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Bảng danh mục đối tượng ưu tiên';

-- 4. Tạo bảng khu vực ưu tiên (không có foreign key)
CREATE TABLE IF NOT EXISTS `khu_vuc_uu_tien` (
  `idkhuvuc` INT(11) NOT NULL AUTO_INCREMENT,
  `ma_khu_vuc` VARCHAR(20) NOT NULL COMMENT 'Mã khu vực (VD: KV1, KV2, KV2-NT, KV3)',
  `ten_khu_vuc` VARCHAR(255) NOT NULL COMMENT 'Tên khu vực',
  `mo_ta` TEXT DEFAULT NULL COMMENT 'Mô tả khu vực',
  `diem_uu_tien` DECIMAL(4,2) DEFAULT 0.00 COMMENT 'Mức điểm ưu tiên',
  `trang_thai` TINYINT(1) DEFAULT 1 COMMENT '1: Hoạt động, 0: Không hoạt động',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`idkhuvuc`),
  UNIQUE KEY `uk_ma_khu_vuc` (`ma_khu_vuc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Bảng danh mục khu vực ưu tiên';

-- 5. Tạo bảng điểm học bạ (có foreign key đến nguoidung và mon_hoc)
-- Lưu ý: Đảm bảo bảng nguoidung đã tồn tại
CREATE TABLE IF NOT EXISTS `diem_hoc_ba` (
  `iddiem_hb` INT(11) NOT NULL AUTO_INCREMENT,
  `idnguoidung` BIGINT UNSIGNED NOT NULL COMMENT 'ID người dùng (học sinh)',
  `idmonhoc` INT(11) NOT NULL COMMENT 'ID môn học',
  `lop` TINYINT(2) NOT NULL COMMENT 'Lớp (10, 11, 12)',
  `hoc_ky` TINYINT(1) DEFAULT NULL COMMENT 'Học kỳ (1, 2) - NULL nếu là cả năm',
  `diem_trung_binh` DECIMAL(4,2) NOT NULL COMMENT 'Điểm trung bình',
  `nam_hoc` INT(4) DEFAULT NULL COMMENT 'Năm học (VD: 2024)',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`iddiem_hb`),
  KEY `idx_nguoidung` (`idnguoidung`),
  KEY `idx_monhoc` (`idmonhoc`),
  KEY `idx_lop_hocky` (`lop`, `hoc_ky`),
  KEY `idx_nguoidung_monhoc` (`idnguoidung`, `idmonhoc`),
  CONSTRAINT `fk_diem_hb_nguoidung` FOREIGN KEY (`idnguoidung`) 
    REFERENCES `nguoidung` (`idnguoidung`) ON DELETE CASCADE,
  CONSTRAINT `fk_diem_hb_monhoc` FOREIGN KEY (`idmonhoc`) 
    REFERENCES `mon_hoc` (`idmonhoc`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Bảng điểm học bạ của học sinh';

-- 6. Tạo bảng kết quả tính điểm học bạ (có nhiều foreign key)
-- Lưu ý: Đảm bảo các bảng tham chiếu đã tồn tại:
-- - nguoidung
-- - phuong_thuc_xet_hoc_ba
-- - thongtin_tuyensinh
-- - doi_tuong_uu_tien
-- - khu_vuc_uu_tien
-- - mon_hoc
CREATE TABLE IF NOT EXISTS `ket_qua_tinh_diem_hoc_ba` (
  `idketqua` INT(11) NOT NULL AUTO_INCREMENT,
  `idnguoidung` BIGINT UNSIGNED NOT NULL COMMENT 'ID người dùng (học sinh)',
  `idphuongthuc_hb` INT(11) NOT NULL COMMENT 'ID phương thức xét học bạ',
  `idthongtin` INT(11) DEFAULT NULL COMMENT 'ID thông tin tuyển sinh (ngành/trường)',
  `tohopmon` VARCHAR(200) DEFAULT NULL COMMENT 'Tổ hợp môn xét tuyển',
  `mon_nhan_he_so_2` INT(11) DEFAULT NULL COMMENT 'ID môn nhân hệ số 2 (nếu có)',
  `iddoituong` INT(11) DEFAULT NULL COMMENT 'ID đối tượng ưu tiên',
  `idkhuvuc` INT(11) DEFAULT NULL COMMENT 'ID khu vực ưu tiên',
  `diem_to_hop` DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Điểm tổ hợp môn (chưa cộng ưu tiên)',
  `diem_uu_tien_doi_tuong` DECIMAL(4,2) DEFAULT 0.00 COMMENT 'Điểm ưu tiên đối tượng',
  `diem_uu_tien_khu_vuc` DECIMAL(4,2) DEFAULT 0.00 COMMENT 'Điểm ưu tiên khu vực',
  `tong_diem_uu_tien` DECIMAL(4,2) DEFAULT 0.00 COMMENT 'Tổng điểm ưu tiên (sau khi áp dụng công thức)',
  `tong_diem_xet_tuyen` DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Tổng điểm xét tuyển (điểm tổ hợp + điểm ưu tiên)',
  `chi_tiet_tinh_toan` JSON DEFAULT NULL COMMENT 'Chi tiết tính toán (lưu dạng JSON)',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`idketqua`),
  KEY `idx_nguoidung` (`idnguoidung`),
  KEY `idx_phuongthuc` (`idphuongthuc_hb`),
  KEY `idx_thongtin` (`idthongtin`),
  CONSTRAINT `fk_ketqua_nguoidung` FOREIGN KEY (`idnguoidung`) 
    REFERENCES `nguoidung` (`idnguoidung`) ON DELETE CASCADE,
  CONSTRAINT `fk_ketqua_phuongthuc` FOREIGN KEY (`idphuongthuc_hb`) 
    REFERENCES `phuong_thuc_xet_hoc_ba` (`idphuongthuc_hb`) ON DELETE CASCADE,
  CONSTRAINT `fk_ketqua_thongtin` FOREIGN KEY (`idthongtin`) 
    REFERENCES `thongtin_tuyensinh` (`idthongtin`) ON DELETE SET NULL,
  CONSTRAINT `fk_ketqua_doituong` FOREIGN KEY (`iddoituong`) 
    REFERENCES `doi_tuong_uu_tien` (`iddoituong`) ON DELETE SET NULL,
  CONSTRAINT `fk_ketqua_khuvuc` FOREIGN KEY (`idkhuvuc`) 
    REFERENCES `khu_vuc_uu_tien` (`idkhuvuc`) ON DELETE SET NULL,
  CONSTRAINT `fk_ketqua_mon_nhan_heso` FOREIGN KEY (`mon_nhan_he_so_2`) 
    REFERENCES `mon_hoc` (`idmonhoc`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Bảng kết quả tính điểm xét tuyển học bạ';

-- 7. Tạo bảng quy định điểm ưu tiên (không có foreign key)
CREATE TABLE IF NOT EXISTS `quy_dinh_diem_uu_tien` (
  `idquydinh` INT(11) NOT NULL AUTO_INCREMENT,
  `ten_quy_dinh` VARCHAR(255) NOT NULL COMMENT 'Tên quy định',
  `mo_ta` TEXT DEFAULT NULL COMMENT 'Mô tả quy định',
  `nguong_diem` DECIMAL(5,2) DEFAULT 22.50 COMMENT 'Ngưỡng điểm (VD: 22.5)',
  `cong_thuc` TEXT DEFAULT NULL COMMENT 'Công thức tính điểm ưu tiên',
  `nam_ap_dung` INT(4) NOT NULL COMMENT 'Năm áp dụng',
  `trang_thai` TINYINT(1) DEFAULT 1 COMMENT '1: Hoạt động, 0: Không hoạt động',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`idquydinh`),
  KEY `idx_nam_ap_dung` (`nam_ap_dung`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Bảng quy định tính điểm ưu tiên';

-- 8. Tạo bảng cấu hình môn nhân hệ số (có foreign key đến thongtin_tuyensinh và mon_hoc)
-- Lưu ý: Đảm bảo bảng thongtin_tuyensinh và mon_hoc đã tồn tại
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

-- Thêm foreign key sau khi bảng đã được tạo
ALTER TABLE `cau_hinh_mon_nhan_he_so`
  ADD CONSTRAINT `fk_cauhinh_thongtin` FOREIGN KEY (`idthongtin`) 
    REFERENCES `thongtin_tuyensinh` (`idthongtin`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cauhinh_monhoc` FOREIGN KEY (`idmonhoc`) 
    REFERENCES `mon_hoc` (`idmonhoc`) ON DELETE CASCADE;

-- ============================================
-- Kiểm tra các bảng đã được tạo
-- ============================================
-- SELECT TABLE_NAME 
-- FROM information_schema.TABLES 
-- WHERE TABLE_SCHEMA = 'ptdh' 
--   AND TABLE_NAME IN (
--     'mon_hoc',
--     'phuong_thuc_xet_hoc_ba',
--     'doi_tuong_uu_tien',
--     'khu_vuc_uu_tien',
--     'diem_hoc_ba',
--     'ket_qua_tinh_diem_hoc_ba',
--     'quy_dinh_diem_uu_tien',
--     'cau_hinh_mon_nhan_he_so'
--   );

