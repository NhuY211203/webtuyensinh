<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use App\Models\ThongBaoLich;
use App\Models\LichTuVan;
use App\Models\NguoiDung;
use App\Mail\ReminderMail;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Gửi các nhắc lịch đến hạn
Artisan::command('reminders:dispatch-due', function () {
    // So sánh bằng đồng hồ của DB để tránh lệch timezone
    $due = ThongBaoLich::where('trangthai', 'pending')
        ->whereRaw('thoigian_gui <= NOW()')
        ->orderBy('thoigian_gui')
        ->limit(500)
        ->get();

    $sent = 0;
    foreach ($due as $reminder) {
        /** @var LichTuVan $appointment */
        $appointment = LichTuVan::find($reminder->idlichtuvan);
        if (!$appointment) {
            $reminder->trangthai = 'canceled';
            $reminder->thongbao_loi = 'Không tìm thấy lịch tư vấn';
            $reminder->updated_at = Carbon::now();
            $reminder->save();
            continue;
        }

        // Lấy email người đặt lịch (idnguoidat)
        $user = NguoiDung::find($appointment->idnguoidat);
        $email = $user?->email;
        if (!$email) {
            $reminder->trangthai = 'failed';
            $reminder->thongbao_loi = 'Không có email người dùng';
            $reminder->updated_at = Carbon::now();
            $reminder->save();
            continue;
        }

        try {
            $dateStr = method_exists($appointment->ngayhen, 'format')
                ? $appointment->ngayhen->format('Y-m-d')
                : (string) $appointment->ngayhen; // expect Y-m-d
            $timeStr = $appointment->giobatdau?->format('H:i')
                ?? $appointment->giohen?->format('H:i')
                ?? '00:00';
            $startAt = Carbon::createFromFormat('Y-m-d H:i', $dateStr . ' ' . $timeStr);

            Mail::to($email)->send(new ReminderMail(
                topic: $appointment->tieude ?? 'Tư vấn',
                expertName: optional($appointment->nguoiDung)->hoten ?? 'Chuyên gia',
                startAt: $startAt,
                platform: '',
                joinUrl: $appointment->ghichu ?? '',
                manageUrl: url('/'),
            ));

            $reminder->trangthai = 'sent';
            $reminder->updated_at = Carbon::now();
            $reminder->save();
            $sent++;
        } catch (\Throwable $e) {
            $reminder->trangthai = 'failed';
            $reminder->thongbao_loi = $e->getMessage();
            $reminder->updated_at = Carbon::now();
            $reminder->save();
        }
    }

    $this->info("Processed: {$due->count()} | Sent: {$sent}");
})->purpose('Gửi email nhắc lịch đến hạn');

// Sinh reminders cho lịch đã duyệt mà chưa có bản ghi (24h/2h/15p)
Artisan::command('reminders:generate-missing {--schedule_id=} {--hours=48}', function () {
    $scheduleId = $this->option('schedule_id');
    $hours = (int) $this->option('hours');

    $query = LichTuVan::query()->where('duyetlich', 2);
    if ($scheduleId) {
        $query->where('idlichtuvan', $scheduleId);
    } else {
        // chỉ tạo cho lịch trong N giờ tới để tránh tạo quá nhiều
        $query->whereRaw('TIMESTAMP(ngayhen, COALESCE(giobatdau, giohen)) >= NOW()')
              ->whereRaw('TIMESTAMP(ngayhen, COALESCE(giobatdau, giohen)) <= DATE_ADD(NOW(), INTERVAL ? HOUR)', [$hours]);
    }

    $offsets = [1440, 120, 15];
    $created = 0; $skipped = 0;
    foreach ($query->get() as $l) {
        $dateStr = method_exists($l->ngayhen, 'format') ? $l->ngayhen->format('Y-m-d') : (string) $l->ngayhen;
        $timeStr = $l->giobatdau?->format('H:i') ?? $l->giohen?->format('H:i') ?? '00:00';
        $startAt = Carbon::createFromFormat('Y-m-d H:i', $dateStr.' '.$timeStr);

        foreach ($offsets as $off) {
            $sendAt = $startAt->copy()->subMinutes($off);
            if ($sendAt->isPast()) { $skipped++; continue; }

            $exists = ThongBaoLich::where('khoa_idempotent', $l->idlichtuvan.'-'.$off)->exists();
            if ($exists) { $skipped++; continue; }

            ThongBaoLich::create([
                'idlichtuvan' => $l->idlichtuvan,
                'loai' => 'reminder',
                'offset_phut' => $off,
                'thoigian_gui' => $sendAt->format('Y-m-d H:i:s'),
                'trangthai' => 'pending',
                'khoa_idempotent' => $l->idlichtuvan.'-'.$off,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            $created++;
        }
    }

    $this->info("Created: {$created} | Skipped: {$skipped}");
})->purpose('Sinh reminders 24h/2h/15p cho lịch đã duyệt');
