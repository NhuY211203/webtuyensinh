# Hướng dẫn Setup Database

## 1. Đảm bảo XAMPP đang chạy
- Mở XAMPP Control Panel
- Start Apache và MySQL services

## 2. Tạo/Kiểm tra database
- Mở phpMyAdmin: http://localhost/phpmyadmin
- Đảm bảo database "ptdh" đã tồn tại
- Nếu chưa có, tạo database mới với tên "ptdh"

## 3. Import dữ liệu (nếu cần)
Nếu cần import dữ liệu mẫu:
```sql
-- Chạy file COMPLETE_DATA_IMPORT.sql trong phpMyAdmin
-- hoặc sử dụng command line:
mysql -u root -p ptdh < COMPLETE_DATA_IMPORT.sql
```

## 4. Chạy Laravel migrations
```bash
cd backend
php artisan migrate
```

## 5. Kiểm tra kết nối
```bash
cd backend
php artisan tinker
# Trong tinker, chạy:
DB::connection()->getPdo();
```

## Cấu hình hiện tại (.env):
- DB_CONNECTION=mysql
- DB_HOST=127.0.0.1
- DB_PORT=3306
- DB_DATABASE=ptdh
- DB_USERNAME=root
- DB_PASSWORD=