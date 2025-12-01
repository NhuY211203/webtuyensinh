-- =====================================================
-- DỮ LIỆU MẪU CHO TRƯỜNG IUH (Trường Đại học Công nghiệp TP. Hồ Chí Minh)
-- idtruong: 21
-- =====================================================

-- Lưu ý: Cần chạy file create_de_an_tuyen_sinh_tables.sql trước
-- Đảm bảo bảng truongdaihoc và nganh_truong đã có dữ liệu

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. ĐỀ ÁN TUYỂN SINH
-- =====================================================
INSERT INTO `de_an_tuyen_sinh` (
    `idtruong`,
    `nam_tuyen_sinh`,
    `tieu_de`,
    `thong_tin_tom_tat`,
    `thong_tin_day_du`,
    `file_pdf_url`,
    `trang_thai`,
    `created_at`,
    `updated_at`
) VALUES (
    21, -- idtruong: IUH
    2025,
    'ĐỀ ÁN TUYỂN SINH ĐẠI HỌC CÔNG NGHIỆP TP. HỒ CHÍ MINH NĂM 2025',
    'Trường Đại học Công nghiệp TP. Hồ Chí Minh (IUH) thông báo tuyển sinh đại học chính quy năm 2025 với nhiều phương thức xét tuyển đa dạng, phù hợp với nhu cầu và năng lực của thí sinh.',
    'Trường Đại học Công nghiệp TP. Hồ Chí Minh (IUH) là một trong những trường đại học công lập hàng đầu tại miền Nam, có bề dày lịch sử và uy tín trong đào tạo nguồn nhân lực chất lượng cao cho các ngành công nghiệp, kinh tế và kỹ thuật.

Năm 2025, trường tuyển sinh đại học chính quy với các phương thức:
- Xét tuyển bằng điểm thi tốt nghiệp THPT
- Xét tuyển bằng điểm học bạ THPT
- Xét tuyển bằng kết quả kỳ thi đánh giá năng lực
- Xét tuyển thẳng theo quy định của Bộ GD&ĐT
- Xét tuyển bằng chứng chỉ quốc tế (IELTS, TOEFL, SAT, ACT)

Trường có nhiều ngành đào tạo đa dạng, từ kỹ thuật, công nghệ đến kinh tế, quản trị kinh doanh, phù hợp với xu hướng phát triển của thị trường lao động.',
    'https://iuh.edu.vn/uploads/de_an_tuyen_sinh_2025.pdf',
    1,
    NOW(),
    NOW()
);

SET @idde_an_IUH = LAST_INSERT_ID();

-- =====================================================
-- 2. PHƯƠNG THỨC TUYỂN SINH CHI TIẾT
-- =====================================================

-- 2.1. Phương thức 1: Xét tuyển bằng điểm thi tốt nghiệp THPT
INSERT INTO `phuong_thuc_tuyen_sinh_chi_tiet` (
    `idde_an`,
    `ma_phuong_thuc`,
    `ten_phuong_thuc`,
    `thu_tu_hien_thi`,
    `doi_tuong`,
    `dieu_kien_xet_tuyen`,
    `cong_thuc_tinh_diem`,
    `mo_ta_quy_che`,
    `thoi_gian_bat_dau`,
    `thoi_gian_ket_thuc`,
    `ghi_chu`,
    `trang_thai`,
    `created_at`,
    `updated_at`
) VALUES (
    @idde_an_IUH,
    'THPT',
    'Xét tuyển bằng điểm thi tốt nghiệp THPT',
    1,
    'Thí sinh đã tốt nghiệp THPT hoặc tương đương, có điểm thi tốt nghiệp THPT năm 2025',
    'Thí sinh đạt điểm thi tốt nghiệp THPT từ ngưỡng điểm tối thiểu do Bộ GD&ĐT quy định. Điểm xét tuyển = Tổng điểm 3 môn thi theo tổ hợp xét tuyển + Điểm ưu tiên (nếu có)',
    'ĐXT = [Tổng điểm 03 môn thi theo tổ hợp xét tuyển] + [Điểm ưu tiên khu vực] + [Điểm ưu tiên đối tượng]',
    'Phương thức này áp dụng cho tất cả các ngành đào tạo của trường. Thí sinh đăng ký xét tuyển trực tuyến trên hệ thống của Bộ GD&ĐT hoặc nộp hồ sơ trực tiếp tại trường.',
    '2025-06-15 08:00:00',
    '2025-08-15 17:00:00',
    'Đây là phương thức xét tuyển chính, chiếm tỷ lệ lớn nhất trong tổng chỉ tiêu tuyển sinh.',
    1,
    NOW(),
    NOW()
);

SET @idphuong_thuc_THPT = LAST_INSERT_ID();

-- 2.2. Phương thức 2: Xét tuyển bằng điểm học bạ THPT
INSERT INTO `phuong_thuc_tuyen_sinh_chi_tiet` (
    `idde_an`,
    `ma_phuong_thuc`,
    `ten_phuong_thuc`,
    `thu_tu_hien_thi`,
    `doi_tuong`,
    `dieu_kien_xet_tuyen`,
    `cong_thuc_tinh_diem`,
    `mo_ta_quy_che`,
    `thoi_gian_bat_dau`,
    `thoi_gian_ket_thuc`,
    `ghi_chu`,
    `trang_thai`,
    `created_at`,
    `updated_at`
) VALUES (
    @idde_an_IUH,
    'HOC_BA',
    'Xét tuyển bằng điểm học bạ THPT',
    2,
    'Thí sinh đã tốt nghiệp THPT hoặc tương đương, có học bạ THPT',
    'Thí sinh có điểm trung bình học tập lớp 10, 11, 12 đạt từ 6.5 trở lên. Điểm xét tuyển = (ĐTB lớp 10 + ĐTB lớp 11 + ĐTB lớp 12) / 3 + Điểm ưu tiên',
    'ĐXT = [(ĐTB lớp 10 + ĐTB lớp 11 + ĐTB lớp 12) / 3] + [Điểm ưu tiên khu vực] + [Điểm ưu tiên đối tượng]',
    'Phương thức này cho phép thí sinh xét tuyển sớm, không cần chờ kết quả thi tốt nghiệp THPT. Thí sinh có thể nộp hồ sơ từ tháng 3 đến tháng 7.',
    '2025-03-01 08:00:00',
    '2025-07-31 17:00:00',
    'Phương thức này phù hợp với thí sinh có học lực tốt, muốn xác định sớm kết quả trúng tuyển.',
    1,
    NOW(),
    NOW()
);

SET @idphuong_thuc_HOC_BA = LAST_INSERT_ID();

-- 2.3. Phương thức 3: Xét tuyển bằng kết quả kỳ thi đánh giá năng lực
INSERT INTO `phuong_thuc_tuyen_sinh_chi_tiet` (
    `idde_an`,
    `ma_phuong_thuc`,
    `ten_phuong_thuc`,
    `thu_tu_hien_thi`,
    `doi_tuong`,
    `dieu_kien_xet_tuyen`,
    `cong_thuc_tinh_diem`,
    `mo_ta_quy_che`,
    `thoi_gian_bat_dau`,
    `thoi_gian_ket_thuc`,
    `ghi_chu`,
    `trang_thai`,
    `created_at`,
    `updated_at`
) VALUES (
    @idde_an_IUH,
    'DGNL_HCM',
    'Xét tuyển bằng kết quả kỳ thi ĐGNL ĐHQG-HCM',
    3,
    'Thí sinh đã tham gia kỳ thi đánh giá năng lực do ĐHQG-HCM tổ chức năm 2025',
    'Thí sinh có điểm thi ĐGNL từ 600 điểm trở lên (thang điểm 1200). Điểm xét tuyển = Điểm thi ĐGNL + Điểm ưu tiên',
    'ĐXT = [Điểm thi ĐGNL] + [Điểm ưu tiên khu vực] + [Điểm ưu tiên đối tượng]',
    'Trường chấp nhận kết quả thi ĐGNL của ĐHQG-HCM. Thí sinh có thể sử dụng kết quả thi từ đợt 1 hoặc đợt 2.',
    '2025-05-01 08:00:00',
    '2025-08-10 17:00:00',
    'Phương thức này phù hợp với thí sinh muốn có thêm cơ hội xét tuyển bằng kết quả thi độc lập.',
    1,
    NOW(),
    NOW()
);

SET @idphuong_thuc_DGNL = LAST_INSERT_ID();

-- 2.4. Phương thức 4: Xét tuyển thẳng
INSERT INTO `phuong_thuc_tuyen_sinh_chi_tiet` (
    `idde_an`,
    `ma_phuong_thuc`,
    `ten_phuong_thuc`,
    `thu_tu_hien_thi`,
    `doi_tuong`,
    `dieu_kien_xet_tuyen`,
    `cong_thuc_tinh_diem`,
    `mo_ta_quy_che`,
    `thoi_gian_bat_dau`,
    `thoi_gian_ket_thuc`,
    `ghi_chu`,
    `trang_thai`,
    `created_at`,
    `updated_at`
) VALUES (
    @idde_an_IUH,
    'UTXT_XT_THANG',
    'Xét tuyển thẳng và ưu tiên xét tuyển',
    4,
    'Thí sinh thuộc các đối tượng được xét tuyển thẳng theo quy định của Bộ GD&ĐT và quy định riêng của trường',
    'Thí sinh đạt giải trong các kỳ thi học sinh giỏi quốc gia, quốc tế; thí sinh có chứng chỉ quốc tế; thí sinh thuộc diện ưu tiên xét tuyển theo quy định',
    'ĐXT = Điểm tối đa (không cần thi tuyển)',
    'Xét tuyển thẳng áp dụng cho: Học sinh giỏi quốc gia, quốc tế; Thí sinh có chứng chỉ IELTS 6.5+, TOEFL iBT 80+, SAT 1200+; Thí sinh thuộc diện chính sách theo quy định.',
    '2025-03-01 08:00:00',
    '2025-08-15 17:00:00',
    'Thí sinh cần nộp đầy đủ hồ sơ chứng minh đủ điều kiện xét tuyển thẳng.',
    1,
    NOW(),
    NOW()
);

SET @idphuong_thuc_XT_THANG = LAST_INSERT_ID();

-- =====================================================
-- 3. BẢNG QUY ĐỔI ĐIỂM NGOẠI NGỮ
-- =====================================================

-- Quy đổi IELTS
INSERT INTO `bang_quy_doi_diem_ngoai_ngu` (
    `idphuong_thuc_chi_tiet`,
    `loai_chung_chi`,
    `ielts_min`,
    `ielts_max`,
    `diem_quy_doi`,
    `thu_tu`,
    `created_at`,
    `updated_at`
) VALUES
(@idphuong_thuc_XT_THANG, 'IELTS', 6.5, 7.0, 8.0, 1, NOW(), NOW()),
(@idphuong_thuc_XT_THANG, 'IELTS', 7.0, 7.5, 8.5, 2, NOW(), NOW()),
(@idphuong_thuc_XT_THANG, 'IELTS', 7.5, 8.0, 9.0, 3, NOW(), NOW()),
(@idphuong_thuc_XT_THANG, 'IELTS', 8.0, 9.0, 10.0, 4, NOW(), NOW());

-- Quy đổi TOEFL iBT
INSERT INTO `bang_quy_doi_diem_ngoai_ngu` (
    `idphuong_thuc_chi_tiet`,
    `loai_chung_chi`,
    `toefl_min`,
    `toefl_max`,
    `diem_quy_doi`,
    `thu_tu`,
    `created_at`,
    `updated_at`
) VALUES
(@idphuong_thuc_XT_THANG, 'TOEFL_iBT', 80, 90, 8.0, 5, NOW(), NOW()),
(@idphuong_thuc_XT_THANG, 'TOEFL_iBT', 90, 100, 9.0, 6, NOW(), NOW()),
(@idphuong_thuc_XT_THANG, 'TOEFL_iBT', 100, 120, 10.0, 7, NOW(), NOW());

-- =====================================================
-- 4. NGÀNH THEO PHƯƠNG THỨC
-- =====================================================

-- Lưu ý: Cần có dữ liệu trong bảng nganh_truong trước
-- Phần này sẽ chỉ thêm ngành nếu tìm thấy ngành trong bảng nganh_truong
-- Nếu không có ngành nào khớp, phần này sẽ bị bỏ qua (không gây lỗi)

-- Thêm ngành cho phương thức THPT (chỉ insert nếu tìm thấy ngành)
-- Ngành Công nghệ thông tin
INSERT INTO `nganh_theo_phuong_thuc` (
    `idphuong_thuc_chi_tiet`,
    `idnganhtruong`,
    `to_hop_mon`,
    `ghi_chu`,
    `loai_nganh`,
    `thu_tu`,
    `created_at`,
    `updated_at`
)
SELECT 
    @idphuong_thuc_THPT,
    idnganhtruong,
    'A00;A01;D01',
    'Ngành Công nghệ thông tin - Tổ hợp môn: Toán, Lý, Hóa (A00); Toán, Lý, Anh (A01); Toán, Văn, Anh (D01)',
    'NGANH_VIET',
    1,
    NOW(),
    NOW()
FROM nganh_truong 
WHERE idtruong = 21 
  AND (manganh LIKE '%CNTT%' OR manganh LIKE '%Công nghệ thông tin%' OR manganh LIKE '%7480201%')
LIMIT 1
ON DUPLICATE KEY UPDATE 
    to_hop_mon = VALUES(to_hop_mon),
    ghi_chu = VALUES(ghi_chu);

-- Ngành Kế toán
INSERT INTO `nganh_theo_phuong_thuc` (
    `idphuong_thuc_chi_tiet`,
    `idnganhtruong`,
    `to_hop_mon`,
    `ghi_chu`,
    `loai_nganh`,
    `thu_tu`,
    `created_at`,
    `updated_at`
)
SELECT 
    @idphuong_thuc_THPT,
    idnganhtruong,
    'A00;A01;D01;D07',
    'Ngành Kế toán - Tổ hợp môn: Toán, Lý, Hóa (A00); Toán, Lý, Anh (A01); Toán, Văn, Anh (D01); Toán, Hóa, Anh (D07)',
    'NGANH_VIET',
    2,
    NOW(),
    NOW()
FROM nganh_truong 
WHERE idtruong = 21 
  AND (manganh LIKE '%KE_TOAN%' OR manganh LIKE '%Kế toán%' OR manganh LIKE '%7340301%')
LIMIT 1
ON DUPLICATE KEY UPDATE 
    to_hop_mon = VALUES(to_hop_mon),
    ghi_chu = VALUES(ghi_chu);

-- Thêm ngành cho phương thức học bạ (chỉ insert nếu tìm thấy ngành)
INSERT INTO `nganh_theo_phuong_thuc` (
    `idphuong_thuc_chi_tiet`,
    `idnganhtruong`,
    `to_hop_mon`,
    `ghi_chu`,
    `loai_nganh`,
    `thu_tu`,
    `created_at`,
    `updated_at`
)
SELECT 
    @idphuong_thuc_HOC_BA,
    idnganhtruong,
    'A00;A01;D01',
    'Ngành Công nghệ thông tin - Xét học bạ',
    'NGANH_VIET',
    1,
    NOW(),
    NOW()
FROM nganh_truong 
WHERE idtruong = 21 
  AND (manganh LIKE '%CNTT%' OR manganh LIKE '%Công nghệ thông tin%' OR manganh LIKE '%7480201%')
LIMIT 1
ON DUPLICATE KEY UPDATE 
    to_hop_mon = VALUES(to_hop_mon),
    ghi_chu = VALUES(ghi_chu);

-- =====================================================
-- 5. XÉT TUYỂN THẲNG
-- =====================================================

INSERT INTO `xet_tuyen_thang` (
    `idphuong_thuc_chi_tiet`,
    `linh_vuc`,
    `linh_vuc_chuyen_sau`,
    `danh_sach_nganh`,
    `ghi_chu`,
    `thu_tu`,
    `created_at`,
    `updated_at`
) VALUES
(@idphuong_thuc_XT_THANG,
    'Khoa học kỹ thuật và công nghệ',
    'Công nghệ thông tin; Kỹ thuật điện - điện tử; Kỹ thuật cơ khí; Kỹ thuật hóa học',
    'Công nghệ thông tin; Kỹ thuật phần mềm; An toàn thông tin; Kỹ thuật điện; Kỹ thuật điện tử - viễn thông; Kỹ thuật cơ khí; Kỹ thuật hóa học',
    'Áp dụng cho thí sinh đạt giải trong các kỳ thi học sinh giỏi quốc gia, quốc tế về các lĩnh vực trên',
    1,
    NOW(),
    NOW()),
(@idphuong_thuc_XT_THANG,
    'Khoa học xã hội và hành vi',
    'Kinh tế; Quản trị kinh doanh; Kế toán; Tài chính - Ngân hàng',
    'Kế toán; Tài chính - Ngân hàng; Quản trị kinh doanh; Marketing; Kinh doanh quốc tế',
    'Áp dụng cho thí sinh đạt giải trong các kỳ thi học sinh giỏi quốc gia, quốc tế về các lĩnh vực trên',
    2,
    NOW(),
    NOW());

-- =====================================================
-- 6. HỒ SƠ XÉT TUYỂN
-- =====================================================

-- Hồ sơ chung
INSERT INTO `ho_so_xet_tuyen` (
    `idphuong_thuc_chi_tiet`,
    `loai_ho_so`,
    `noi_dung`,
    `thu_tu`,
    `created_at`,
    `updated_at`
) VALUES
(@idphuong_thuc_THPT,
    'CHUNG',
    '1. Phiếu đăng ký xét tuyển (theo mẫu của trường)
2. Bản sao công chứng bằng tốt nghiệp THPT hoặc giấy chứng nhận tốt nghiệp tạm thời
3. Bản sao công chứng học bạ THPT
4. Bản sao công chứng giấy chứng minh nhân dân/căn cước công dân
5. Ảnh 3x4 (2 ảnh, ghi rõ họ tên, ngày sinh ở mặt sau)
6. Giấy chứng nhận ưu tiên (nếu có)
7. Phong bì có dán tem, ghi rõ địa chỉ người nhận để trường gửi giấy báo trúng tuyển',
    1,
    NOW(),
    NOW()),
(@idphuong_thuc_HOC_BA,
    'CHUNG',
    '1. Phiếu đăng ký xét tuyển bằng học bạ (theo mẫu của trường)
2. Bản sao công chứng học bạ THPT (đầy đủ 3 năm lớp 10, 11, 12)
3. Bản sao công chứng giấy chứng minh nhân dân/căn cước công dân
4. Ảnh 3x4 (2 ảnh)
5. Giấy chứng nhận ưu tiên (nếu có)
6. Phong bì có dán tem',
    1,
    NOW(),
    NOW()),
(@idphuong_thuc_XT_THANG,
    'CHUNG',
    '1. Phiếu đăng ký xét tuyển thẳng (theo mẫu của trường)
2. Bản sao công chứng bằng tốt nghiệp THPT
3. Bản sao công chứng học bạ THPT
4. Bản sao công chứng giấy chứng minh nhân dân/căn cước công dân
5. Bản sao công chứng giấy chứng nhận đạt giải (nếu xét tuyển thẳng theo giải thưởng)
6. Bản sao công chứng chứng chỉ quốc tế (IELTS, TOEFL, SAT, ACT - nếu có)
7. Ảnh 3x4 (2 ảnh)
8. Phong bì có dán tem',
    1,
    NOW(),
    NOW());

-- =====================================================
-- 7. QUY ĐỊNH ĐIỂM ƯU TIÊN ĐỀ ÁN
-- =====================================================

INSERT INTO `quy_dinh_diem_uu_tien_de_an` (
    `idphuong_thuc_chi_tiet`,
    `nguong_diem`,
    `muc_diem_cong_cctaqt`,
    `cong_thuc_diem_uu_tien`,
    `mo_ta_quy_dinh`,
    `created_at`,
    `updated_at`
) VALUES
(@idphuong_thuc_THPT,
    22.5,
    0.75,
    'Điểm ưu tiên = [(30 - Tổng điểm đạt được)/7.5] × Mức điểm ưu tiên quy định',
    'Áp dụng cho thí sinh có điểm xét tuyển từ 22.5 trở lên. Thí sinh có chứng chỉ CCTAQT (Chứng chỉ tiếng Anh quốc tế) được cộng thêm 0.75 điểm.',
    NOW(),
    NOW());

-- =====================================================
-- 8. THÔNG TIN BỔ SUNG PHƯƠNG THỨC
-- =====================================================

INSERT INTO `thong_tin_bo_sung_phuong_thuc` (
    `idphuong_thuc_chi_tiet`,
    `loai_thong_tin`,
    `ten_thong_tin`,
    `noi_dung`,
    `thu_tu`,
    `created_at`,
    `updated_at`
) VALUES
(@idphuong_thuc_XT_THANG,
    'SAT_CODE',
    'Mã đăng ký SAT',
    'Thí sinh khi thi SAT cần đăng ký mã của Trường Đại học Công nghiệp TP. Hồ Chí Minh với tổ chức thi SAT là 1234-IUH (mã giả định, cần cập nhật mã thực tế)',
    1,
    NOW(),
    NOW()),
(@idphuong_thuc_XT_THANG,
    'ACT_CODE',
    'Mã đăng ký ACT',
    'Thí sinh khi thi ACT cần đăng ký mã của Trường Đại học Công nghiệp TP. Hồ Chí Minh với tổ chức thi ACT là 5678-IUH (mã giả định, cần cập nhật mã thực tế)',
    2,
    NOW(),
    NOW()),
(@idphuong_thuc_THPT,
    'DIEM_TOI_THIEU',
    'Điểm tối thiểu xét tuyển',
    'Điểm tối thiểu xét tuyển = Điểm sàn do Bộ GD&ĐT quy định. Trường có thể quy định điểm chuẩn cao hơn điểm sàn tùy theo từng ngành và số lượng hồ sơ đăng ký.',
    1,
    NOW(),
    NOW()),
(@idphuong_thuc_XT_THANG,
    'THOI_HAN_CHUNG_CHI',
    'Thời hạn chứng chỉ quốc tế',
    'Chứng chỉ IELTS, TOEFL, SAT, ACT phải còn hiệu lực trong thời gian nộp hồ sơ. Thời hạn chứng chỉ: IELTS/TOEFL: 2 năm; SAT/ACT: 5 năm.',
    3,
    NOW(),
    NOW());

-- =====================================================
-- 9. FILE ĐỀ ÁN TUYỂN SINH
-- =====================================================

INSERT INTO `file_de_an_tuyen_sinh` (
    `idde_an`,
    `ten_file`,
    `duong_dan`,
    `loai_file`,
    `kich_thuoc`,
    `trang_thai`,
    `created_at`,
    `updated_at`
) VALUES
(@idde_an_IUH,
    'De_an_tuyen_sinh_IUH_2025.pdf',
    '/uploads/de_an/iuh/de_an_tuyen_sinh_2025.pdf',
    'PDF',
    5242880,
    1,
    NOW(),
    NOW()),
(@idde_an_IUH,
    'Huong_dan_nop_ho_so_IUH_2025.pdf',
    '/uploads/de_an/iuh/huong_dan_nop_ho_so_2025.pdf',
    'PDF',
    2097152,
    1,
    NOW(),
    NOW());

-- =====================================================
-- 10. GIỚI THIỆU TRƯỜNG
-- =====================================================

INSERT INTO `gioi_thieu_truong` (
    `idtruong`,
    `ten_tieng_anh`,
    `ma_truong`,
    `ten_viet_tat`,
    `dia_chi_day_du`,
    `website`,
    `lich_su`,
    `su_menh`,
    `thanh_tuu`,
    `quan_he_quoc_te`,
    `tam_nhin`,
    `anh_dai_dien`,
    `created_at`,
    `updated_at`
) VALUES (
    21,
    'Industrial University of Ho Chi Minh City',
    'IUH',
    'IUH',
    '12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh',
    'http://www.iuh.edu.vn',
    'Trường Đại học Công nghiệp TP. Hồ Chí Minh (IUH) được thành lập năm 2004 trên cơ sở nâng cấp từ Trường Cao đẳng Công nghiệp TP. Hồ Chí Minh (thành lập năm 1999). Trường là một trong những trường đại học công lập hàng đầu tại miền Nam, chuyên đào tạo nguồn nhân lực chất lượng cao cho các ngành công nghiệp, kinh tế và kỹ thuật.',
    'Sứ mệnh của Trường Đại học Công nghiệp TP. Hồ Chí Minh là đào tạo nguồn nhân lực chất lượng cao, có kiến thức chuyên môn vững vàng, kỹ năng thực hành tốt, đáp ứng nhu cầu phát triển kinh tế - xã hội của đất nước và hội nhập quốc tế.',
    'Trường đã đào tạo hàng chục nghìn kỹ sư, cử nhân chất lượng cao, được các doanh nghiệp đánh giá cao. Nhiều sinh viên tốt nghiệp đã trở thành lãnh đạo, chuyên gia trong các doanh nghiệp, tổ chức trong và ngoài nước. Trường có nhiều đề tài nghiên cứu khoa học được ứng dụng vào thực tế, góp phần phát triển công nghiệp và kinh tế.',
    'Trường có quan hệ hợp tác với nhiều trường đại học, tổ chức quốc tế tại các nước như Nhật Bản, Hàn Quốc, Đức, Pháp, Mỹ, Úc... Sinh viên có nhiều cơ hội tham gia các chương trình trao đổi, thực tập tại nước ngoài.',
    'Tầm nhìn đến năm 2030: Trở thành trường đại học công nghiệp hàng đầu Việt Nam, có uy tín trong khu vực, đào tạo nguồn nhân lực chất lượng cao, đáp ứng yêu cầu của cuộc cách mạng công nghiệp 4.0.',
    '/uploads/truong/iuh_logo.jpg',
    NOW(),
    NOW()
);

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- HOÀN TẤT
-- =====================================================
SELECT 'Dữ liệu mẫu cho trường IUH đã được thêm thành công!' AS 'Kết quả';

