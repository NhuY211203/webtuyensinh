<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Phòng chat 1:1 theo buổi tư vấn
        Schema::create('phong_chat', function (Blueprint $table) {
            $table->bigIncrements('idphongchat');
            $table->unsignedBigInteger('idlichtuvan');
            $table->unsignedBigInteger('idtuvanvien');
            $table->unsignedBigInteger('idnguoidat');
            $table->tinyInteger('trang_thai')->default(1); // 1 = mở, 0 = đóng
            $table->timestamp('ngay_tao')->useCurrent();
            $table->timestamp('ngay_cap_nhat')->nullable();
            $table->timestamp('ngay_dong')->nullable();

            $table->index(['idtuvanvien', 'idnguoidat']);
            $table->index(['idlichtuvan']);
        });

        // Bảng tin nhắn thuộc phòng chat
        Schema::create('tin_nhan', function (Blueprint $table) {
            $table->bigIncrements('idtinnhan');
            $table->unsignedBigInteger('idphongchat');
            $table->unsignedBigInteger('idnguoigui');
            $table->text('noi_dung');
            $table->string('tep_dinh_kem')->nullable();
            $table->tinyInteger('da_xem')->default(0);
            $table->timestamp('ngay_xem')->nullable();
            $table->timestamp('ngay_tao')->useCurrent();
            $table->timestamp('xoa_mem_luc')->nullable();

            $table->index(['idphongchat']);
            $table->index(['idnguoigui']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tin_nhan');
        Schema::dropIfExists('phong_chat');
    }
};


