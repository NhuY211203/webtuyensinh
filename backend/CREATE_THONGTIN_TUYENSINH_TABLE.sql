-- ============================================
-- Tạo bảng thongtin_tuyensinh để lưu thông tin tuyển sinh
-- Bao gồm: tổ hợp xét tuyển và phương thức xét tuyển
-- ============================================

CREATE TABLE IF NOT EXISTS `thongtin_tuyensinh` (
  `idthongtin` INT(11) NOT NULL AUTO_INCREMENT,
  `idtruong` INT(11) NOT NULL COMMENT 'ID trường đại học',
  `manganh` VARCHAR(20) NOT NULL COMMENT 'Mã ngành học',
  `idxettuyen` TINYINT(1) NOT NULL COMMENT 'Phương thức xét tuyển: 1=Điểm thi THPT, 2=Điểm học bạ, 3=ĐGNL, 4=Xét tuyển kết hợp',
  `tohopmon` VARCHAR(200) NOT NULL COMMENT 'Tổ hợp môn xét tuyển (cách nhau bởi dấu ;)',
  `nam` INT(4) NOT NULL COMMENT 'Năm tuyển sinh',
  `diemchuan` DECIMAL(5,2) DEFAULT NULL COMMENT 'Điểm chuẩn (nếu có)',
  `chitieu` INT(11) DEFAULT NULL COMMENT 'Chỉ tiêu tuyển sinh',
  `ghichu` TEXT DEFAULT NULL COMMENT 'Ghi chú bổ sung',
  `trangthai` TINYINT(1) DEFAULT 1 COMMENT 'Trạng thái: 1=Hoạt động, 0=Không hoạt động',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`idthongtin`),
  KEY `idx_idtruong` (`idtruong`),
  KEY `idx_manganh` (`manganh`),
  KEY `idx_idxettuyen` (`idxettuyen`),
  KEY `idx_nam` (`nam`),
  KEY `idx_idtruong_manganh` (`idtruong`, `manganh`),
  KEY `idx_idtruong_nam` (`idtruong`, `nam`),
  KEY `idx_manganh_nam` (`manganh`, `nam`),
  CONSTRAINT `fk_thongtin_truong` FOREIGN KEY (`idtruong`) 
    REFERENCES `truongdaihoc` (`idtruong`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_thongtin_nganh` FOREIGN KEY (`manganh`) 
    REFERENCES `nganhhoc` (`manganh`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_thongtin_phuongthuc` FOREIGN KEY (`idxettuyen`) 
    REFERENCES `ptxt` (`idxettuyen`) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng thông tin tuyển sinh - lưu tổ hợp xét tuyển và phương thức xét tuyển';

-- ============================================
-- Tạo index để tối ưu truy vấn
-- ============================================

-- Index cho truy vấn theo trường + ngành + năm
CREATE INDEX `idx_truong_nganh_nam` ON `thongtin_tuyensinh` (`idtruong`, `manganh`, `nam`);

-- Index cho truy vấn theo phương thức + năm
CREATE INDEX `idx_phuongthuc_nam` ON `thongtin_tuyensinh` (`idxettuyen`, `nam`);

-- ============================================
-- Ví dụ: Thêm dữ liệu mẫu
-- ============================================

-- Thêm thông tin tuyển sinh cho một ngành
INSERT INTO `thongtin_tuyensinh` 
  (`idtruong`, `manganh`, `idxettuyen`, `tohopmon`, `nam`, `diemchuan`, `chitieu`, `ghichu`, `trangthai`, `created_at`, `updated_at`)
VALUES
  (27, '7480201', 1, 'A00;A01;D01', 2024, 28.50, 100, 'Phương thức 1 - Điểm thi THPT', 1, NOW(), NOW()),
  (27, '7480201', 2, 'A00;A01;D01', 2024, 26.00, 50, 'Phương thức 2 - Học bạ', 1, NOW(), NOW()),
  (27, '7480201', 3, 'A00;B00;D07', 2024, 99.99, 30, 'Phương thức 3 - ĐGNL HCM', 1, NOW(), NOW());

-- ============================================
-- Copy dữ liệu từ bảng diemchuanxettuyen sang thongtin_tuyensinh
-- (Nếu muốn migrate dữ liệu cũ)
-- ============================================

INSERT INTO `thongtin_tuyensinh` 
  (`idtruong`, `manganh`, `idxettuyen`, `tohopmon`, `nam`, `diemchuan`, `ghichu`, `trangthai`, `created_at`, `updated_at`)
SELECT 
  `idtruong`,
  `manganh`,
  `idxettuyen`,
  `tohopmon`,
  `namxettuyen`,
  `diemchuan`,
  `ghichu`,
  1 AS `trangthai`,
  NOW() AS `created_at`,
  NOW() AS `updated_at`
FROM `diemchuanxettuyen`
WHERE NOT EXISTS (
  SELECT 1 FROM `thongtin_tuyensinh` AS ttt
  WHERE ttt.`idtruong` = `diemchuanxettuyen`.`idtruong`
    AND ttt.`manganh` = `diemchuanxettuyen`.`manganh`
    AND ttt.`idxettuyen` = `diemchuanxettuyen`.`idxettuyen`
    AND ttt.`nam` = `diemchuanxettuyen`.`namxettuyen`
    AND ttt.`tohopmon` = `diemchuanxettuyen`.`tohopmon`
);

-- ============================================
-- Copy dữ liệu từ bảng nganh_truong sang thongtin_tuyensinh
-- (Nếu muốn migrate dữ liệu từ nganh_truong)
-- ============================================

INSERT INTO `thongtin_tuyensinh` 
  (`idtruong`, `manganh`, `idxettuyen`, `tohopmon`, `nam`, `trangthai`, `created_at`, `updated_at`)
SELECT 
  `idtruong`,
  `manganh`,
  `hinhthuc` AS `idxettuyen`,
  `tohop_xettuyen_truong` AS `tohopmon`,
  `nam`,
  1 AS `trangthai`,
  NOW() AS `created_at`,
  NOW() AS `updated_at`
FROM `nganh_truong`
WHERE `tohop_xettuyen_truong` IS NOT NULL
  AND `nam` IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `thongtin_tuyensinh` AS ttt
    WHERE ttt.`idtruong` = `nganh_truong`.`idtruong`
      AND ttt.`manganh` = `nganh_truong`.`manganh`
      AND ttt.`idxettuyen` = `nganh_truong`.`hinhthuc`
      AND ttt.`nam` = `nganh_truong`.`nam`
      AND ttt.`tohopmon` = `nganh_truong`.`tohop_xettuyen_truong`
  );

-- ============================================
-- Kiểm tra dữ liệu đã thêm
-- ============================================

-- Xem tổng số bản ghi
SELECT COUNT(*) AS total FROM `thongtin_tuyensinh`;

-- Xem dữ liệu mẫu
SELECT 
  ttt.`idthongtin`,
  td.`tentruong`,
  nh.`tennganh`,
  pt.`tenptxt` AS `phuongthuc`,
  ttt.`tohopmon`,
  ttt.`nam`,
  ttt.`diemchuan`,
  ttt.`chitieu`
FROM `thongtin_tuyensinh` AS ttt
LEFT JOIN `truongdaihoc` AS td ON ttt.`idtruong` = td.`idtruong`
LEFT JOIN `nganhhoc` AS nh ON ttt.`manganh` = nh.`manganh`
LEFT JOIN `ptxt` AS pt ON ttt.`idxettuyen` = pt.`idxettuyen`
ORDER BY ttt.`nam` DESC, ttt.`idtruong`, ttt.`manganh`
LIMIT 20;

