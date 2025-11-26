<!doctype html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Nhắc lịch tư vấn</title>
    <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#111}
        .box{max-width:560px;margin:0 auto;padding:16px}
        .btn{display:inline-block;background:#16a34a;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none}
        .muted{color:#555}
    </style>
    </head>
<body>
<div class="box">
    <h2>Nhắc lịch tư vấn</h2>
    <p class="muted">Chuyên gia: {{ $expertName }}</p>
    <p class="muted">Chủ đề: {{ $topic }}</p>
    <p><strong>Thời gian:</strong> {{ $startAt->timezone('Asia/Ho_Chi_Minh')->format('H:i d/m/Y') }}</p>
    @if($platform)
        <p><strong>Nền tảng:</strong> {{ $platform }}</p>
    @endif
    @if($joinUrl)
        <p><a class="btn" href="{{ $joinUrl }}" target="_blank" rel="noopener">Tham gia</a></p>
    @endif
    @if($manageUrl)
        <p><a class="muted" href="{{ $manageUrl }}" target="_blank" rel="noopener">Xem / Huỷ lịch</a></p>
    @endif
    <p>Trân trọng,<br>Hoa học trò</p>
  </div>
</body>
</html>

























