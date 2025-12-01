-- ============================================
-- Tạo bảng ket_qua_tinh_diem_hoc_ba
-- Lưu ý: Đảm bảo các bảng sau đã được tạo trước:
-- 1. nguoidung
-- 2. phuong_thuc_xet_hoc_ba
-- 3. thongtin_tuyensinh
-- 4. doi_tuong_uu_tien
-- 5. khu_vuc_uu_tien
-- 6. mon_hoc
-- ============================================

-- Bước 1: Tạo bảng không có foreign key trước
DROP TABLE IF EXISTS `ket_qua_tinh_diem_hoc_ba`;

CREATE TABLE `ket_qua_tinh_diem_hoc_ba` (
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
  KEY `idx_thongtin` (`idthongtin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Bảng kết quả tính điểm xét tuyển học bạ';

-- Bước 2: Thêm các foreign key sau khi bảng đã được tạo
ALTER TABLE `ket_qua_tinh_diem_hoc_ba`
  ADD CONSTRAINT `fk_ketqua_nguoidung` FOREIGN KEY (`idnguoidung`) 
    REFERENCES `nguoidung` (`idnguoidung`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ketqua_phuongthuc` FOREIGN KEY (`idphuongthuc_hb`) 
    REFERENCES `phuong_thuc_xet_hoc_ba` (`idphuongthuc_hb`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ketqua_thongtin` FOREIGN KEY (`idthongtin`) 
    REFERENCES `thongtin_tuyensinh` (`idthongtin`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ketqua_doituong` FOREIGN KEY (`iddoituong`) 
    REFERENCES `doi_tuong_uu_tien` (`iddoituong`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ketqua_khuvuc` FOREIGN KEY (`idkhuvuc`) 
    REFERENCES `khu_vuc_uu_tien` (`idkhuvuc`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ketqua_mon_nhan_heso` FOREIGN KEY (`mon_nhan_he_so_2`) 
    REFERENCES `mon_hoc` (`idmonhoc`) ON DELETE SET NULL;

