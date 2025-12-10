<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "🚀 Thêm dữ liệu điểm chuẩn lịch sử (tránh constraint)...\n\n";

try {
    // Xóa dữ liệu cũ
    DB::delete('DELETE FROM diemchuanxettuyen WHERE namxettuyen BETWEEN 2020 AND 2023');
    echo "✅ Đã xóa dữ liệu cũ\n";

    // Lấy dữ liệu 2024 để tạo dữ liệu lịch sử
    $data2024 = DB::select('SELECT * FROM diemchuanxettuyen WHERE namxettuyen = 2024');
    $count2024 = count($data2024);
    echo "📊 Có {$count2024} bản ghi năm 2024\n\n";

    $years = [
        2023 => 0.3,
        2022 => 0.6, 
        2021 => 0.9,
        2020 => 1.3
    ];

    foreach ($years as $year => $decrease) {
        echo "📝 Thêm dữ liệu năm {$year}...\n";
        
        $inserted = 0;
        foreach ($data2024 as $record) {
            try {
                $newScore = max(15.00, round($record->diemchuan - $decrease, 2));
                $newGhichu = str_replace('2024', (string)$year, $record->ghichu ?? '');
                
                // Kiểm tra xem bản ghi đã tồn tại chưa
                $exists = DB::table('diemchuanxettuyen')
                    ->where('idtruong', $record->idtruong)
                    ->where('manganh', $record->manganh)
                    ->where('idxettuyen', $record->idxettuyen)
                    ->where('tohopmon', $record->tohopmon)
                    ->where('namxettuyen', $year)
                    ->exists();
                
                if (!$exists) {
                    DB::table('diemchuanxettuyen')->insert([
                        'idtruong' => $record->idtruong,
                        'manganh' => $record->manganh,
                        'idxettuyen' => $record->idxettuyen,
                        'tohopmon' => $record->tohopmon,
                        'diemchuan' => $newScore,
                        'namxettuyen' => $year,
                        'ghichu' => $newGhichu
                    ]);
                    $inserted++;
                }
            } catch (Exception $e) {
                echo "⚠️ Lỗi khi thêm bản ghi (idtruong={$record->idtruong}, manganh={$record->manganh}, năm={$year}): " . $e->getMessage() . "\n";
            }
        }
        
        echo "✅ Đã thêm {$inserted} bản ghi năm {$year}\n";
    }

    // Tạo view
    echo "\n📝 Tạo view xu hướng...\n";
    DB::unprepared("
        CREATE OR REPLACE VIEW v_diemchuan_xuhuong AS
        SELECT 
            dc.idtruong,
            t.tentruong,
            dc.manganh,
            n.tennganh,
            dc.namxettuyen,
            dc.diemchuan,
            dc.tohopmon,
            LAG(dc.diemchuan) OVER (PARTITION BY dc.idtruong, dc.manganh ORDER BY dc.namxettuyen) as diem_nam_truoc,
            ROUND(dc.diemchuan - LAG(dc.diemchuan) OVER (PARTITION BY dc.idtruong, dc.manganh ORDER BY dc.namxettuyen), 2) as bien_dong,
            CASE 
                WHEN dc.diemchuan - LAG(dc.diemchuan) OVER (PARTITION BY dc.idtruong, dc.manganh ORDER BY dc.namxettuyen) > 0.3 THEN 'Tăng mạnh'
                WHEN dc.diemchuan - LAG(dc.diemchuan) OVER (PARTITION BY dc.idtruong, dc.manganh ORDER BY dc.namxettuyen) > 0 THEN 'Tăng nhẹ'
                WHEN dc.diemchuan - LAG(dc.diemchuan) OVER (PARTITION BY dc.idtruong, dc.manganh ORDER BY dc.namxettuyen) < -0.3 THEN 'Giảm mạnh'
                WHEN dc.diemchuan - LAG(dc.diemchuan) OVER (PARTITION BY dc.idtruong, dc.manganh ORDER BY dc.namxettuyen) < 0 THEN 'Giảm nhẹ'
                ELSE 'Ổn định'
            END as xu_huong
        FROM diemchuanxettuyen dc
        JOIN truongdaihoc t ON dc.idtruong = t.idtruong
        JOIN nganhhoc n ON dc.manganh = n.manganh
        ORDER BY t.tentruong, n.tennganh, dc.namxettuyen
    ");
    echo "✅ Đã tạo view v_diemchuan_xuhuong\n\n";

    // Thống kê
    $stats = DB::select("
        SELECT 
            namxettuyen,
            COUNT(*) as so_ban_ghi,
            MIN(diemchuan) as min_diem,
            MAX(diemchuan) as max_diem,
            ROUND(AVG(diemchuan), 2) as diem_trung_binh
        FROM diemchuanxettuyen
        GROUP BY namxettuyen
        ORDER BY namxettuyen
    ");

    echo "📊 THỐNG KÊ KẾT QUẢ:\n";
    echo "====================\n";
    foreach ($stats as $stat) {
        echo "Năm {$stat->namxettuyen}: {$stat->so_ban_ghi} bản ghi | TB: {$stat->diem_trung_binh} | Min: {$stat->min_diem} | Max: {$stat->max_diem}\n";
    }

    $total = DB::table('diemchuanxettuyen')->count();
    echo "\n🎉 HOÀN THÀNH!\n";
    echo "📈 Tổng cộng: {$total} bản ghi điểm chuẩn từ 2020-2024\n";
    echo "🔍 Bây giờ bạn có thể tra cứu xu hướng điểm chuẩn!\n\n";

    echo "💡 VÍ DỤ TRA CỨU:\n";
    echo "================\n";
    echo "-- Xem xu hướng Công nghệ thông tin:\n";
    echo "SELECT tentruong, namxettuyen, diemchuan, bien_dong, xu_huong\n";
    echo "FROM v_diemchuan_xuhuong \n";
    echo "WHERE tennganh LIKE '%Công nghệ thông tin%'\n";
    echo "ORDER BY tentruong, namxettuyen;\n\n";

} catch (Exception $e) {
    echo "❌ LỖI: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}