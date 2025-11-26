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
        Schema::table('lichtuvan', function (Blueprint $table) {
            $table->tinyInteger('duyetlich')->default(1)->comment('0=từ chối, 1=chờ duyệt, 2=đã duyệt');
            $table->unsignedBigInteger('idnguoiduyet')->nullable()->comment('ID người duyệt');
            $table->timestamp('ngayduyet')->nullable()->comment('Ngày duyệt');
            $table->text('ghichu')->nullable()->comment('Ghi chú duyệt');
            $table->string('molavande')->nullable()->comment('Hình thức tư vấn (Google Meet, Zoom, Trực tiếp)');
            $table->string('danhdanhgiadem')->nullable()->comment('Link tư vấn');
            
            // Foreign key cho người duyệt
            $table->foreign('idnguoiduyet')->references('idnguoidung')->on('nguoidung')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lichtuvan', function (Blueprint $table) {
            $table->dropForeign(['idnguoiduyet']);
            $table->dropColumn([
                'duyetlich',
                'idnguoiduyet', 
                'ngayduyet',
                'ghichu',
                'molavande',
                'danhdanhgiadem'
            ]);
        });
    }
};
