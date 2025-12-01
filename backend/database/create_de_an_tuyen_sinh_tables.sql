-- =====================================================
-- CÁC BẢNG CHO TÍNH NĂNG TRA CỨU ĐỀ ÁN TUYỂN SINH
-- =====================================================

-- 1. Bảng đề án tuyển sinh (lưu thông tin đề án của từng trường theo năm)
CREATE TABLE IF NOT EXISTS `de_an_tuyen_sinh` (
  `idde_an` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `idtruong` INT(11) NOT NULL,
  `nam_tuyen_sinh` INT NOT NULL,
  `tieu_de` VARCHAR(500) NOT NULL COMMENT 'VD: ĐỀ ÁN TUYỂN SINH ĐẠI HỌC KINH TẾ QUỐC DÂN 2026',
  `thong_tin_tom_tat` TEXT COMMENT 'Thông tin tuyển sinh tóm tắt',
  `thong_tin_day_du` LONGTEXT COMMENT 'Thông tin tuyển sinh đầy đủ',
  `file_pdf_url` VARCHAR(500) COMMENT 'Đường dẫn file PDF đề án',
  `trang_thai` TINYINT DEFAULT 1 COMMENT '1=hoạt động, 0=không hoạt động',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (`idtruong`) REFERENCES `truongdaihoc`(`idtruong`) ON DELETE CASCADE,
  UNIQUE KEY `unique_truong_nam` (`idtruong`, `nam_tuyen_sinh`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng phương thức tuyển sinh chi tiết (lưu chi tiết từng phương thức)
CREATE TABLE IF NOT EXISTS `phuong_thuc_tuyen_sinh_chi_tiet` (
  `idphuong_thuc_chi_tiet` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `idde_an` BIGINT UNSIGNED NOT NULL,
  `ma_phuong_thuc` VARCHAR(50) NOT NULL COMMENT 'THPT, DGNL_HN, DGNL_HCM, TSA, CCQT, UTXT_XT_THANG, KET_HOP_...',
  `ten_phuong_thuc` VARCHAR(200) NOT NULL COMMENT 'VD: Điểm thi THPT, Điểm ĐGNL HN, Chứng chỉ quốc tế',
  `thu_tu_hien_thi` INT DEFAULT 0 COMMENT 'Thứ tự hiển thị trong menu',
  `doi_tuong` TEXT COMMENT 'Đối tượng áp dụng',
  `dieu_kien_xet_tuyen` TEXT COMMENT 'Điều kiện xét tuyển',
  `cong_thuc_tinh_diem` TEXT COMMENT 'Công thức tính điểm xét tuyển',
  `mo_ta_quy_che` LONGTEXT COMMENT 'Mô tả quy chế chi tiết',
  `thoi_gian_bat_dau` DATETIME COMMENT 'Thời gian bắt đầu xét tuyển',
  `thoi_gian_ket_thuc` DATETIME COMMENT 'Thời gian kết thúc xét tuyển',
  `ghi_chu` TEXT,
  `trang_thai` TINYINT DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (`idde_an`) REFERENCES `de_an_tuyen_sinh`(`idde_an`) ON DELETE CASCADE,
  INDEX `idx_ma_phuong_thuc` (`ma_phuong_thuc`),
  INDEX `idx_thu_tu` (`thu_tu_hien_thi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng quy đổi điểm ngoại ngữ (IELTS, TOEFL, TOEIC)
CREATE TABLE IF NOT EXISTS `bang_quy_doi_diem_ngoai_ngu` (
  `idquy_doi` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `idphuong_thuc_chi_tiet` BIGINT UNSIGNED NOT NULL,
  `loai_chung_chi` VARCHAR(50) NOT NULL COMMENT 'IELTS, TOEFL_iBT, TOEIC',
  `muc_diem_min` DECIMAL(4,2) COMMENT 'Mức điểm tối thiểu',
  `muc_diem_max` DECIMAL(4,2) COMMENT 'Mức điểm tối đa',
  `ielts_min` DECIMAL(3,1) COMMENT 'IELTS min (nếu áp dụng)',
  `ielts_max` DECIMAL(3,1) COMMENT 'IELTS max (nếu áp dụng)',
  `toefl_min` INT COMMENT 'TOEFL iBT min (nếu áp dụng)',
  `toefl_max` INT COMMENT 'TOEFL iBT max (nếu áp dụng)',
  `toeic_lr_min` INT COMMENT 'TOEIC Listening & Reading min',
  `toeic_lr_max` INT COMMENT 'TOEIC Listening & Reading max',
  `toeic_s_min` INT COMMENT 'TOEIC Speaking min',
  `toeic_s_max` INT COMMENT 'TOEIC Speaking max',
  `toeic_w_min` INT COMMENT 'TOEIC Writing min',
  `toeic_w_max` INT COMMENT 'TOEIC Writing max',
  `diem_quy_doi` DECIMAL(4,2) NOT NULL COMMENT 'Điểm quy đổi tương đương (thang 10)',
  `thu_tu` INT DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (`idphuong_thuc_chi_tiet`) REFERENCES `phuong_thuc_tuyen_sinh_chi_tiet`(`idphuong_thuc_chi_tiet`) ON DELETE CASCADE,
  INDEX `idx_loai_chung_chi` (`loai_chung_chi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng danh sách ngành đào tạo theo phương thức
CREATE TABLE IF NOT EXISTS `nganh_theo_phuong_thuc` (
  `idnganh_phuong_thuc` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `idphuong_thuc_chi_tiet` BIGINT UNSIGNED NOT NULL,
  `idnganhtruong` INT(11) NOT NULL,
  `to_hop_mon` VARCHAR(100) COMMENT 'Tổ hợp môn xét tuyển (VD: A00;A01;D01;D07 hoặc Q00, K00)',
  `ghi_chu` VARCHAR(500) COMMENT 'Ghi chú đặc biệt',
  `loai_nganh` VARCHAR(50) COMMENT 'NGANH_MOI, NGANH_VIET, NGANH_QUOC_TE',
  `thu_tu` INT DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY `unique_phuong_thuc_nganh` (`idphuong_thuc_chi_tiet`, `idnganhtruong`),
  INDEX `idx_loai_nganh` (`loai_nganh`),
  INDEX `idx_idphuong_thuc_chi_tiet` (`idphuong_thuc_chi_tiet`),
  INDEX `idx_idnganhtruong` (`idnganhtruong`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm foreign key sau khi bảng đã được tạo (nếu bảng tham chiếu đã tồn tại)
-- Lưu ý: Chỉ chạy các lệnh ALTER TABLE này nếu bảng nganh_truong và phuong_thuc_tuyen_sinh_chi_tiet đã tồn tại

-- ALTER TABLE `nganh_theo_phuong_thuc`
--   ADD CONSTRAINT `fk_nganh_phuong_thuc_chi_tiet` 
--   FOREIGN KEY (`idphuong_thuc_chi_tiet`) 
--   REFERENCES `phuong_thuc_tuyen_sinh_chi_tiet`(`idphuong_thuc_chi_tiet`) 
--   ON DELETE CASCADE;

-- ALTER TABLE `nganh_theo_phuong_thuc`
--   ADD CONSTRAINT `fk_nganh_phuong_thuc_nganh_truong` 
--   FOREIGN KEY (`idnganhtruong`) 
--   REFERENCES `nganh_truong`(`idnganhtruong`) 
--   ON DELETE CASCADE;

-- 5. Bảng xét tuyển thẳng (lưu thông tin lĩnh vực và ngành tuyển thẳng)
CREATE TABLE IF NOT EXISTS `xet_tuyen_thang` (
  `idxet_tuyen_thang` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `idphuong_thuc_chi_tiet` BIGINT UNSIGNED NOT NULL,
  `linh_vuc` VARCHAR(200) NOT NULL COMMENT 'VD: Khoa học động vật, Khoa học xã hội và hành vi',
  `linh_vuc_chuyen_sau` TEXT COMMENT 'Lĩnh vực chuyên sâu chi tiết',
  `danh_sach_nganh` TEXT COMMENT 'Danh sách ngành tuyển thẳng (có thể là JSON hoặc text phân cách)',
  `ghi_chu` VARCHAR(500) COMMENT 'VD: Không tuyển, hoặc ghi chú đặc biệt',
  `thu_tu` INT DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (`idphuong_thuc_chi_tiet`) REFERENCES `phuong_thuc_tuyen_sinh_chi_tiet`(`idphuong_thuc_chi_tiet`) ON DELETE CASCADE,
  INDEX `idx_linh_vuc` (`linh_vuc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng hồ sơ xét tuyển (lưu danh sách hồ sơ cần thiết cho từng phương thức)
CREATE TABLE IF NOT EXISTS `ho_so_xet_tuyen` (
  `idho_so` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `idphuong_thuc_chi_tiet` BIGINT UNSIGNED NOT NULL,
  `loai_ho_so` VARCHAR(50) NOT NULL COMMENT 'CHUNG, THEO_DOI_TUONG, THEO_KHU_VUC',
  `noi_dung` TEXT NOT NULL COMMENT 'Nội dung yêu cầu hồ sơ',
  `thu_tu` INT DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (`idphuong_thuc_chi_tiet`) REFERENCES `phuong_thuc_tuyen_sinh_chi_tiet`(`idphuong_thuc_chi_tiet`) ON DELETE CASCADE,
  INDEX `idx_loai_ho_so` (`loai_ho_so`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng quy định điểm ưu tiên và điểm cộng (mở rộng từ quy_dinh_diem_uu_tien hiện có)
CREATE TABLE IF NOT EXISTS `quy_dinh_diem_uu_tien_de_an` (
  `idquy_dinh_de_an` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `idphuong_thuc_chi_tiet` BIGINT UNSIGNED NOT NULL,
  `nguong_diem` DECIMAL(5,2) DEFAULT 22.5 COMMENT 'Ngưỡng điểm áp dụng quy định',
  `muc_diem_cong_cctaqt` DECIMAL(4,2) DEFAULT 0.75 COMMENT 'Mức điểm cộng với thí sinh có CCTAQT',
  `cong_thuc_diem_uu_tien` TEXT COMMENT 'Công thức tính điểm ưu tiên',
  `mo_ta_quy_dinh` LONGTEXT COMMENT 'Mô tả quy định chi tiết',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (`idphuong_thuc_chi_tiet`) REFERENCES `phuong_thuc_tuyen_sinh_chi_tiet`(`idphuong_thuc_chi_tiet`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bảng thông tin bổ sung cho phương thức (lưu các thông tin đặc biệt như mã đăng ký SAT/ACT)
CREATE TABLE IF NOT EXISTS `thong_tin_bo_sung_phuong_thuc` (
  `idthong_tin_bo_sung` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `idphuong_thuc_chi_tiet` BIGINT UNSIGNED NOT NULL,
  `loai_thong_tin` VARCHAR(50) NOT NULL COMMENT 'SAT_CODE, ACT_CODE, DIEM_TOI_THIEU, THOI_HAN_CHUNG_CHI',
  `ten_thong_tin` VARCHAR(200) NOT NULL,
  `noi_dung` TEXT NOT NULL,
  `thu_tu` INT DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (`idphuong_thuc_chi_tiet`) REFERENCES `phuong_thuc_tuyen_sinh_chi_tiet`(`idphuong_thuc_chi_tiet`) ON DELETE CASCADE,
  INDEX `idx_loai_thong_tin` (`loai_thong_tin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Bảng lưu trữ file đề án (nếu cần quản lý nhiều file)
CREATE TABLE IF NOT EXISTS `file_de_an_tuyen_sinh` (
  `idfile` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `idde_an` BIGINT UNSIGNED NOT NULL,
  `ten_file` VARCHAR(500) NOT NULL,
  `duong_dan` VARCHAR(500) NOT NULL,
  `loai_file` VARCHAR(50) DEFAULT 'PDF' COMMENT 'PDF, DOC, DOCX',
  `kich_thuoc` BIGINT COMMENT 'Kích thước file (bytes)',
  `trang_thai` TINYINT DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (`idde_an`) REFERENCES `de_an_tuyen_sinh`(`idde_an`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Bảng giới thiệu trường (mở rộng thông tin trường)
CREATE TABLE IF NOT EXISTS `gioi_thieu_truong` (
  `idgioi_thieu` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `idtruong` INT(11) NOT NULL,
  `ten_tieng_anh` VARCHAR(200) COMMENT 'Tên tiếng Anh của trường',
  `ma_truong` VARCHAR(20) COMMENT 'Mã trường (VD: KHA)',
  `ten_viet_tat` VARCHAR(50) COMMENT 'Tên viết tắt (VD: NEU)',
  `dia_chi_day_du` TEXT COMMENT 'Địa chỉ đầy đủ',
  `website` VARCHAR(200),
  `lich_su` LONGTEXT COMMENT 'Lịch sử hình thành và phát triển',
  `su_menh` LONGTEXT COMMENT 'Sứ mệnh của trường',
  `thanh_tuu` LONGTEXT COMMENT 'Thành tựu và đóng góp',
  `quan_he_quoc_te` LONGTEXT COMMENT 'Quan hệ quốc tế',
  `tam_nhin` LONGTEXT COMMENT 'Tầm nhìn (VD: Vision 2030)',
  `anh_dai_dien` VARCHAR(500) COMMENT 'Đường dẫn ảnh đại diện trường',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (`idtruong`) REFERENCES `truongdaihoc`(`idtruong`) ON DELETE CASCADE,
  UNIQUE KEY `unique_truong` (`idtruong`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

