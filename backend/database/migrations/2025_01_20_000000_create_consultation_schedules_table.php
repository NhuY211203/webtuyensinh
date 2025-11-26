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
        Schema::create('consultation_schedules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('consultant_id'); // ID của tư vấn viên
            $table->unsignedBigInteger('student_id')->nullable(); // ID của thí sinh (có thể null nếu chưa có ai đặt)
            $table->date('date'); // Ngày tư vấn
            $table->time('start_time'); // Giờ bắt đầu
            $table->time('end_time'); // Giờ kết thúc
            $table->enum('status', ['available', 'booked', 'cancelled', 'completed'])->default('available');
            $table->string('meeting_link')->nullable(); // Link phòng họp
            $table->string('meeting_platform')->nullable(); // Nền tảng (Google Meet, Zoom, etc.)
            $table->text('notes')->nullable(); // Ghi chú
            $table->timestamps();
            
            // Foreign keys - Sửa để tham chiếu đúng cột primary key
            $table->foreign('consultant_id')->references('idnguoidung')->on('nguoidung')->onDelete('cascade');
            $table->foreign('student_id')->references('idnguoidung')->on('nguoidung')->onDelete('set null');
            
            // Indexes
            $table->index(['consultant_id', 'date']);
            $table->index(['status', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultation_schedules');
    }
};
