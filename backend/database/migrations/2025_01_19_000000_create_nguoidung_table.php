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
        Schema::create('nguoidung', function (Blueprint $table) {
            $table->bigIncrements('idnguoidung');
            $table->unsignedBigInteger('idvaitro');
            $table->unsignedBigInteger('idnhomnganh')->nullable();
            $table->string('taikhoan')->unique();
            $table->string('matkhau');
            $table->string('email')->unique();
            $table->string('hoten');
            $table->string('sodienthoai')->nullable();
            $table->text('diachi')->nullable();
            $table->date('ngaysinh')->nullable();
            $table->enum('gioitinh', ['Nam', 'Nữ', 'Khác'])->nullable();
            $table->tinyInteger('trangthai')->default(1); // 1=hoạt động, 0=không hoạt động
            $table->timestamp('ngaytao')->useCurrent();
            $table->timestamp('ngaycapnhat')->useCurrent()->useCurrentOnUpdate();
            
            // Indexes
            $table->index(['idvaitro', 'trangthai']);
            $table->index(['idnhomnganh', 'trangthai']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nguoidung');
    }
};
