-- Tạo bảng phòng chat hỗ trợ giữa người dùng và người phụ trách
-- Bảng này dùng để chat giữa người dùng (Thành viên) và người phụ trách (Staff)

-- Bảng phòng chat hỗ trợ
CREATE TABLE IF NOT EXISTS `phong_chat_support` (
  `idphongchat_support` INT(11) NOT NULL AUTO_INCREMENT,
  `idnguoidung` INT(11) NOT NULL COMMENT 'ID người dùng (Thành viên)',
  `idnguoi_phu_trach` INT(11) NOT NULL COMMENT 'ID người phụ trách (Staff)',
  `trang_thai` TINYINT(1) DEFAULT 1 COMMENT '1: Đang hoạt động, 0: Đã đóng',
  `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idphongchat_support`),
  UNIQUE KEY `unique_user_staff` (`idnguoidung`, `idnguoi_phu_trach`),
  KEY `idx_nguoidung` (`idnguoidung`),
  KEY `idx_nguoi_phu_trach` (`idnguoi_phu_trach`),
  KEY `idx_ngay_cap_nhat` (`ngay_cap_nhat`),
  CONSTRAINT `fk_chat_support_nguoidung` FOREIGN KEY (`idnguoidung`) REFERENCES `nguoidung` (`idnguoidung`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_support_staff` FOREIGN KEY (`idnguoi_phu_trach`) REFERENCES `nguoidung` (`idnguoidung`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Phòng chat hỗ trợ giữa người dùng và người phụ trách';

-- Bảng tin nhắn hỗ trợ
CREATE TABLE IF NOT EXISTS `tin_nhan_support` (
  `idtinnhan_support` INT(11) NOT NULL AUTO_INCREMENT,
  `idphongchat_support` INT(11) NOT NULL COMMENT 'ID phòng chat hỗ trợ',
  `idnguoigui` INT(11) NOT NULL COMMENT 'ID người gửi tin nhắn',
  `noi_dung` TEXT NOT NULL COMMENT 'Nội dung tin nhắn',
  `tep_dinh_kem` VARCHAR(255) DEFAULT NULL COMMENT 'Đường dẫn file đính kèm',
  `da_xem` TINYINT(1) DEFAULT 0 COMMENT '0: Chưa xem, 1: Đã xem',
  `ngay_xem` DATETIME DEFAULT NULL COMMENT 'Thời gian xem tin nhắn',
  `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo tin nhắn',
  `xoa_mem_luc` DATETIME DEFAULT NULL COMMENT 'Thời gian xóa mềm (soft delete)',
  PRIMARY KEY (`idtinnhan_support`),
  KEY `idx_phongchat` (`idphongchat_support`),
  KEY `idx_nguoigui` (`idnguoigui`),
  KEY `idx_ngay_tao` (`ngay_tao`),
  KEY `idx_da_xem` (`da_xem`),
  CONSTRAINT `fk_tinnhan_support_phongchat` FOREIGN KEY (`idphongchat_support`) REFERENCES `phong_chat_support` (`idphongchat_support`) ON DELETE CASCADE,
  CONSTRAINT `fk_tinnhan_support_nguoigui` FOREIGN KEY (`idnguoigui`) REFERENCES `nguoidung` (`idnguoidung`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tin nhắn trong phòng chat hỗ trợ';

-- Tạo index để tối ưu truy vấn
CREATE INDEX `idx_phongchat_ngay_tao` ON `tin_nhan_support` (`idphongchat_support`, `ngay_tao` DESC);
CREATE INDEX `idx_phongchat_trangthai` ON `phong_chat_support` (`trang_thai`, `ngay_cap_nhat` DESC);

