-- ============================================
-- Tạo bảng ty_le_viec_lam để lưu thống kê việc làm sau tốt nghiệp
-- ============================================

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Bảng lưu thống kê tỷ lệ việc làm sau tốt nghiệp theo ngành';

-- ============================================
-- Dữ liệu mẫu
-- ============================================

INSERT INTO `ty_le_viec_lam` 
  (`manganh`, `nam_tot_nghiep`, `ty_le_co_viec_lam`, `ty_le_that_nghiep`, `ty_le_hoc_len`, `muc_luong_trung_binh`, `so_sinh_vien_khao_sat`, `nguon_du_lieu`)
VALUES
  ('7480201', 2023, 95.00, 3.00, 2.00, 15.00, 500, 'Khảo sát Bộ GD&ĐT 2023'),
  ('7480101', 2023, 92.00, 5.00, 3.00, 14.00, 400, 'Khảo sát Bộ GD&ĐT 2023'),
  ('7480103', 2023, 90.00, 6.00, 4.00, 13.00, 350, 'Khảo sát Bộ GD&ĐT 2023'),
  ('7480107', 2023, 98.00, 1.00, 1.00, 18.00, 200, 'Khảo sát Bộ GD&ĐT 2023'),
  ('7480202', 2023, 88.00, 8.00, 4.00, 12.00, 150, 'Khảo sát Bộ GD&ĐT 2023'),
  ('7340101', 2023, 85.00, 10.00, 5.00, 10.00, 600, 'Khảo sát Bộ GD&ĐT 2023'),
  ('7340201', 2023, 87.00, 9.00, 4.00, 11.00, 550, 'Khảo sát Bộ GD&ĐT 2023');



