Với “Giỏi/Xuất sắc” → không loại nhóm nào, bạn vẫn có thể nhận gợi ý từ tất cả 8 nhóm ngành.
“Khá” → loại riêng nhóm MED vì cấu hình yêu cầu học lực Giỏi trở lên cho khối Y.
“Trung bình” → loại MED, IT, ENG (các ngành đòi hỏi nền tảng logic/kỹ thuật cao).
“Yếu” → loại thêm INT vì nhóm này cần năng lực ngoại ngữ vững.
Khi nộp bài:
Service tính điểm tất cả câu hỏi khác như bình thường (rawScores).
Những nhóm bị loại bởi câu học lực sẽ bị xóa khỏi bảng xếp hạng chính.
Response trả về:
primaryGroup/secondaryGroups: chỉ gồm các nhóm còn lại sau khi lọc.
filteredGroups: danh sách nhóm bị loại kèm lý do, để bạn thấy vì sao chúng không xuất hiện.
rawScores: điểm gốc trước khi lọc nếu cần đối chiếu.
Vì vậy nếu chọn “Khá”, dù các câu sau thiên về Y tế thì nhóm này vẫn không xuất hiện trong kết quả cuối cùng; bạn sẽ thấy cảnh báo “Y tế – Sức khỏe bị loại vì yêu cầu học lực Giỏi trở lên”.
-- Sections cho ĐGNL HCM (idkythi = 1)
INSERT INTO `kythi_dgnl_sections`
  (`idkythi`, `ma_section`, `ten_section`, `nhom_nang_luc`, `so_cau`, `thu_tu`, `mo_ta`)
VALUES
  (1, 'LOGIC', 'Tư duy logic – toán học', 'logic', 30, 1, 'Suy luận số, hình học, dãy số, bài toán thực tế...'),
  (1, 'LANG', 'Ngôn ngữ – đọc hiểu', 'ngon_ngu', 30, 2, 'Đọc hiểu, ngữ pháp, suy luận ý ngầm.'),
  (1, 'PROBLEM', 'Giải quyết vấn đề', 'giai_quyet', 30, 3, 'Tình huống thực tiễn, so sánh phương án.'),
  (1, 'GENERAL', 'Tổng hợp KHTN & KHXH', 'tong_hop', 30, 4, 'Lý – Hóa – Sinh, Sử – Địa – GDCD mức vận dụng.');

-- Chủ đề chi tiết cho phần logic ĐGNL HCM (ví dụ)
INSERT INTO `kythi_dgnl_topics` (`idsection`, `ten_chu_de`, `mo_ta`)
VALUES
  (1, 'Suy luận số', 'Nhận diện quy luật dãy số, số học cơ bản.'),
  (1, 'Tư duy hình học', 'Quan hệ hình phẳng, hình không gian, biến đổi hình.'),
  (1, 'Biểu đồ – Bảng số liệu', 'Phân tích tỷ lệ, biểu đồ cột/tròn.');

-- Sections cho ĐGNL Hà Nội (idkythi = 2)
INSERT INTO `kythi_dgnl_sections`
  (`idkythi`, `ma_section`, `ten_section`, `nhom_nang_luc`, `thu_tu`, `mo_ta`)
VALUES
  (2, 'QUANT', 'Toán & tư duy định lượng', 'logic', 1, 'Đại số, số học, xác suất, suy luận.'),
  (2, 'LANG', 'Ngôn ngữ – đọc hiểu', 'ngon_ngu', 2, 'Đọc hiểu, từ vựng, lập luận.'),
  (2, 'SCIENCE', 'Khoa học (Tự nhiên/KHXH)', 'khoa_hoc', 3, 'Chọn 1 trong 2 nhánh: Lý-Hóa-Sinh hoặc Sử-Địa-GDCD.');

-- Sections cho TSA Bách khoa (idkythi = 3)
INSERT INTO `kythi_dgnl_sections`
  (`idkythi`, `ma_section`, `ten_section`, `nhom_nang_luc`, `thu_tu`, `mo_ta`)
VALUES
  (3, 'MATH', 'Tư duy toán', 'logic', 1, 'Đại số, hình học, bài toán thực tế.'),
  (3, 'READ', 'Đọc hiểu', 'doc_hieu', 2, 'Đọc hiểu ngắn, trích xuất thông tin.'),
  (3, 'SCI', 'Khoa học tự nhiên', 'khoa_hoc', 3, 'Vật lý trọng tâm, kèm Hóa và Sinh.');