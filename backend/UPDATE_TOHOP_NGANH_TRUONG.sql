-- ============================================
-- Script cập nhật tổ hợp xét tuyển cho bảng nganh_truong
-- ============================================

-- 1. Cập nhật tổ hợp cho một bản ghi cụ thể theo idnganhtruong
UPDATE `nganh_truong` 
SET `tohop_xettuyen_truong` = 'A00;A01;D01' 
WHERE `idnganhtruong` = 131;

-- 2. Cập nhật tổ hợp cho nhiều bản ghi theo điều kiện
-- Ví dụ: Cập nhật tổ hợp cho tất cả ngành có manganh = '7480201' và idtruong = 27, năm = 2024
UPDATE `nganh_truong` 
SET `tohop_xettuyen_truong` = 'A00;A01;D01' 
WHERE `manganh` = '7480201' 
  AND `idtruong` = 27 
  AND `nam` = 2024;

-- 3. Cập nhật tổ hợp cho tất cả bản ghi có hinhthuc = 1 (Điểm thi THPT)
UPDATE `nganh_truong` 
SET `tohop_xettuyen_truong` = 'A00;A01' 
WHERE `hinhthuc` = 1 
  AND `tohop_xettuyen_truong` IS NULL;

-- 4. Copy tổ hợp từ bảng diemchuanxettuyen sang nganh_truong
-- (Nếu có dữ liệu tương ứng)
UPDATE `nganh_truong` AS nt
INNER JOIN `diemchuanxettuyen` AS dc 
  ON nt.`idtruong` = dc.`idtruong` 
  AND nt.`manganh` = dc.`manganh`
  AND nt.`hinhthuc` = dc.`idxettuyen`
  AND nt.`nam` = dc.`namxettuyen`
SET nt.`tohop_xettuyen_truong` = dc.`tohopmon`
WHERE nt.`tohop_xettuyen_truong` IS NULL 
  AND dc.`tohopmon` IS NOT NULL;

-- 5. Cập nhật tổ hợp cho một trường cụ thể trong một năm
UPDATE `nganh_truong` 
SET `tohop_xettuyen_truong` = 'A00;A01;D01' 
WHERE `idtruong` = 27 
  AND `nam` = 2024
  AND `tohop_xettuyen_truong` IS NULL;

-- 6. Cập nhật tổ hợp cho một ngành cụ thể ở tất cả các trường
UPDATE `nganh_truong` 
SET `tohop_xettuyen_truong` = 'A00;B00;D07' 
WHERE `manganh` = '7720101' 
  AND `tohop_xettuyen_truong` IS NULL;

-- 7. Cập nhật tổ hợp theo từng hinhthuc (phương thức xét tuyển)
-- hinhthuc = 1: Điểm thi THPT
UPDATE `nganh_truong` 
SET `tohop_xettuyen_truong` = 'A00;A01;D01' 
WHERE `hinhthuc` = 1 
  AND `nam` = 2024
  AND `tohop_xettuyen_truong` IS NULL;

-- hinhthuc = 2: Điểm học bạ
UPDATE `nganh_truong` 
SET `tohop_xettuyen_truong` = 'A00;A01;D01' 
WHERE `hinhthuc` = 2 
  AND `nam` = 2024
  AND `tohop_xettuyen_truong` IS NULL;

-- hinhthuc = 3: Đánh giá năng lực
UPDATE `nganh_truong` 
SET `tohop_xettuyen_truong` = 'A00;B00;D07' 
WHERE `hinhthuc` = 3 
  AND `nam` = 2024
  AND `tohop_xettuyen_truong` IS NULL;

-- hinhthuc = 4: Xét tuyển kết hợp
UPDATE `nganh_truong` 
SET `tohop_xettuyen_truong` = 'A00;A01' 
WHERE `hinhthuc` = 4 
  AND `nam` = 2024
  AND `tohop_xettuyen_truong` IS NULL;

-- 8. Xem danh sách các bản ghi chưa có tổ hợp để kiểm tra
SELECT 
  `idnganhtruong`,
  `idtruong`,
  `manganh`,
  `hinhthuc`,
  `nam`,
  `tohop_xettuyen_truong`
FROM `nganh_truong`
WHERE `tohop_xettuyen_truong` IS NULL
ORDER BY `nam` DESC, `idtruong`, `manganh`;

-- 9. Xem danh sách các tổ hợp đã có để tham khảo
SELECT DISTINCT `tohop_xettuyen_truong`
FROM `nganh_truong`
WHERE `tohop_xettuyen_truong` IS NOT NULL
ORDER BY `tohop_xettuyen_truong`;

-- 10. Cập nhật hàng loạt với CASE WHEN (ví dụ: khác nhau theo hinhthuc)
UPDATE `nganh_truong`
SET `tohop_xettuyen_truong` = CASE
  WHEN `hinhthuc` = 1 THEN 'A00;A01;D01'
  WHEN `hinhthuc` = 2 THEN 'A00;A01;D01'
  WHEN `hinhthuc` = 3 THEN 'A00;B00;D07'
  WHEN `hinhthuc` = 4 THEN 'A00;A01'
  ELSE `tohop_xettuyen_truong`
END
WHERE `nam` = 2024 
  AND `tohop_xettuyen_truong` IS NULL;

