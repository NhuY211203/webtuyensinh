<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiemKhuyenKhich extends Model
{
    protected $table = 'diem_khuyen_khich';
    protected $primaryKey = 'iddiemkk';
    public $timestamps = true;

    protected $fillable = [
        'idnguoidung',
        'loai_kk',
        'diem_kk',
        'mo_ta',
        'nam_ap_dung',
    ];

    protected $casts = [
        'diem_kk' => 'decimal:2',
        'nam_ap_dung' => 'integer',
    ];

    // Relationships
    public function nguoiDung()
    {
        return $this->belongsTo(NguoiDung::class, 'idnguoidung', 'idnguoidung');
    }
}




