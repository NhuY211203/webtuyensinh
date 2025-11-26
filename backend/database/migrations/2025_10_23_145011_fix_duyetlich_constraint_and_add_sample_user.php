<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, drop the existing constraint
        DB::statement('ALTER TABLE lichtuvan DROP CONSTRAINT IF EXISTS ck_duyetlich');
        
        // Add new constraint to allow 1, 2, 3
        DB::statement('ALTER TABLE lichtuvan ADD CONSTRAINT ck_duyetlich CHECK (duyetlich IN (1, 2, 3))');
        
        // Check if user with ID 1 exists, if not create one
        $existingUser = DB::table('nguoidung')->where('idnguoidung', 1)->first();
        if (!$existingUser) {
            // Get the next available ID
            $nextId = DB::table('nguoidung')->max('idnguoidung') + 1;
            
            DB::table('nguoidung')->insert([
                'idnguoidung' => $nextId,
                'idvaitro' => 1, // Assuming role 1 is admin
                'idnhomnganh' => 1, // Assuming group 1 exists
                'taikhoan' => 'admin_' . $nextId,
                'matkhau' => bcrypt('admin123'),
                'email' => 'admin' . $nextId . '@example.com',
                'hoten' => 'Administrator ' . $nextId,
                'sodienthoai' => '0123456789',
                'diachi' => 'Admin Address',
                'ngaysinh' => '1990-01-01',
                'gioitinh' => 'Nam',
                'trangthai' => 1,
                'ngaytao' => now(),
                'ngaycapnhat' => now(),
            ]);
            
            // Update the approverId in the controller to use this new ID
            echo "Created admin user with ID: " . $nextId . "\n";
        } else {
            echo "User with ID 1 already exists: " . $existingUser->hoten . "\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the new constraint
        DB::statement('ALTER TABLE lichtuvan DROP CONSTRAINT IF EXISTS ck_duyetlich');
        
        // Restore original constraint (1, 2 only)
        DB::statement('ALTER TABLE lichtuvan ADD CONSTRAINT ck_duyetlich CHECK (duyetlich IN (1, 2))');
        
        // Remove the sample admin user
        DB::table('nguoidung')->where('idnguoidung', 1)->delete();
    }
};