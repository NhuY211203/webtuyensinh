<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiemThiTotNghiep extends Model
{
    protected $table = 'diem_thi_tot_nghiep';
    protected $primaryKey = 'iddiemthi';
    public $timestamps = true;

    protected $fillable = [
        'idnguoidung',
        'idmonthi',
        'diem_thi',
        'mien_thi',
        'nam_thi',
    ];

    protected $casts = [
        'diem_thi' => 'decimal:2',
        'mien_thi' => 'boolean',
        'nam_thi' => 'integer',
    ];

    // Relationships
    public function nguoiDung()
    {
        return $this->belongsTo(NguoiDung::class, 'idnguoidung', 'idnguoidung');
    }

    public function monThiTotNghiep()
    {
        return $this->belongsTo(MonThiTotNghiep::class, 'idmonthi', 'idmonthi');
    }
}







