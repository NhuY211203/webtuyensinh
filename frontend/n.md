Chào bạn\! Việc triển khai (deploy) một project sử dụng **Laravel** (backend) và **ReactJS** (frontend) khi chúng đang nằm chung trong một project đòi hỏi một vài bước để xây dựng (build) ứng dụng React và tích hợp nó vào Laravel.

Dưới đây là phương pháp phổ biến và hiệu quả nhất, thường được thực hiện thông qua **Vite** (hoặc Webpack cũ hơn) mà Laravel hiện đang sử dụng:

## 🚀 Phương pháp Deploy (Sử dụng Vite/Mix)

Vì Laravel và ReactJS đang chung project, ReactJS của bạn gần như chắc chắn được tích hợp thông qua **Vite** (hoặc Laravel Mix/Webpack trong các phiên bản cũ hơn) của Laravel.

-----

### 1\. Chuẩn bị Frontend (Build React)

Trước khi deploy lên host, bạn cần phải "biên dịch" (compile) code ReactJS từ code nguồn (source code) thành các file tĩnh **HTML, CSS, và JavaScript** tối ưu và sẵn sàng cho môi trường Production.

  * **Bước 1: Cài đặt Dependencies**
    Chắc chắn rằng tất cả các thư viện Node.js đã được cài đặt:

    ```bash
    npm install
    # HOẶC
    yarn install
    ```

  * **Bước 2: Chạy Build Script**
    Sử dụng lệnh build được định nghĩa trong file `package.json` của Laravel. Lệnh này sẽ chạy Vite (hoặc Mix) để biên dịch React và đưa các file tĩnh đã tối ưu vào thư mục `public` của Laravel (thường là `public/build`):

    ```bash
    npm run build
    # HOẶC
    yarn build
    ```

    > **Lưu ý:** Sau bước này, bạn sẽ thấy thư mục `public/build` (hoặc `public/mix-manifest.json` trong Mix) được tạo ra. Các file ReactJS đã được tối ưu hóa nằm trong đó.

-----

### 2\. Triển khai lên Hosting

Bạn sẽ upload **toàn bộ** project Laravel lên host, bao gồm cả các file tĩnh đã được build ở bước 1.

  * **Bước 1: Upload Files**

      * Sử dụng **Git/SSH** (khuyến nghị) hoặc **FTP** để đẩy toàn bộ mã nguồn lên thư mục gốc của domain trên hosting (thường là `~/`).
      * **Đảm bảo** bạn upload cả thư mục `vendor` (các thư viện PHP của Composer) và thư mục `public/build` (các file React đã build).

  * **Bước 2: Cấu hình Môi trường (Environment)**

      * Tạo file `.env` trên host nếu chưa có và cấu hình các biến môi trường quan trọng:
          * `APP_ENV=production`
          * `APP_DEBUG=false`
          * Cấu hình **Database** (`DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, v.v.)
          * Cấu hình **Domain/URL** của ứng dụng (`APP_URL`)

  * **Bước 3: Cài đặt Dependencies PHP & Tối ưu hóa**
    Truy cập vào host qua SSH (nếu host hỗ trợ) và chạy các lệnh sau trong thư mục project:

    ```bash
    # Cài đặt thư viện PHP (Nếu bạn chưa upload thư mục vendor)
    composer install --no-dev --optimize-autoloader

    # Tạo khóa ứng dụng (Nếu chưa có trong .env)
    php artisan key:generate

    # Chạy Migrate Database
    php artisan migrate --force

    # Xóa và Tối ưu hóa config, route, view (quan trọng cho môi trường production)
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    ```

  * **Bước 4: Cấu hình Document Root (Quan trọng)**
    Bạn cần đảm bảo rằng **Document Root** (thư mục gốc công khai) của domain trên hosting được trỏ vào thư mục **`public`** của project Laravel.

      * *(Ví dụ: `/home/user/project-name/public`)*

## 💡 Tóm tắt Quy trình

1.  **Local (Máy tính của bạn):** Chạy `npm install` -\> **`npm run build`** (tạo file tĩnh React trong thư mục `public`).
2.  **Host (Server):** Upload **tất cả** các file (bao gồm `vendor` và thư mục `public/build`) -\> Cấu hình `.env` -\> Trỏ Document Root về thư mục **`public`** -\> Chạy `composer install` và các lệnh `php artisan:cache`.
