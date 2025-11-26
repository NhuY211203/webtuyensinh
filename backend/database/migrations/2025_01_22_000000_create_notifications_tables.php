<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Bảng thông báo chính
        Schema::create('thongbao', function (Blueprint $table) {
            $table->id();
            $table->string('tieude'); // Tiêu đề thông báo
            $table->text('noidung'); // Nội dung thông báo
            $table->unsignedBigInteger('nguoigui_id'); // ID người gửi
            $table->timestamp('thoigiangui'); // Thời gian gửi (có thể là thời gian lên lịch)
            $table->enum('trangthai', ['sent', 'scheduled', 'failed', 'cancelled'])->default('scheduled');
            $table->timestamps();
            
            $table->foreign('nguoigui_id')->references('idnguoidung')->on('nguoidung');
            $table->index(['nguoigui_id', 'trangthai']);
            $table->index('thoigiangui');
        });

        // Bảng người nhận thông báo
        Schema::create('nguoinhan_thongbao', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('idthongbao'); // FK tới bảng thongbao
            $table->unsignedBigInteger('idnguoinhan'); // FK tới bảng nguoidung - người nhận thông báo
            $table->unsignedBigInteger('idvaitro'); // Vai trò người nhận (VD: 4 = tư vấn viên)
            $table->tinyInteger('trangthai')->default(1); // Trạng thái thông báo: 1 = chưa đọc, 2 = đã đọc
            $table->timestamp('thoigiangui_thucte')->nullable(); // Thời điểm thông báo được gửi thực tế
            $table->timestamp('thoigianxem')->nullable(); // Thời điểm người nhận mở xem thông báo
            $table->text('ghichu_loi')->nullable(); // Ghi chú lỗi nếu gửi thất bại
            $table->timestamp('ngayxoa')->nullable(); // Dùng cho xóa mềm (nếu cần)
            $table->timestamps();
            
            $table->foreign('idthongbao')->references('id')->on('thongbao')->onDelete('cascade');
            $table->foreign('idnguoinhan')->references('idnguoidung')->on('nguoidung')->onDelete('cascade');
            $table->index(['idthongbao', 'idnguoinhan']);
            $table->index(['idnguoinhan', 'trangthai']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nguoinhan_thongbao');
        Schema::dropIfExists('thongbao');
    }
};



