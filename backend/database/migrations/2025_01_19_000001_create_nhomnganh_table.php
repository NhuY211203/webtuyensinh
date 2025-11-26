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
        Schema::create('nhomnganh', function (Blueprint $table) {
            $table->bigIncrements('idnhomnganh');
            $table->string('manhom')->unique();
            $table->string('tennhom');
            $table->text('mota')->nullable();
            $table->tinyInteger('trangthai')->default(1); // 1=hoạt động, 0=không hoạt động
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nhomnganh');
    }
};
