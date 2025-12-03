<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiemHocBa extends Model
{
    protected $table = 'diem_hoc_ba';
    protected $primaryKey = 'iddiem_hb';
    public $timestamps = true;

    protected $fillable = [
        'idnguoidung',
        'idmonhoc',
        'lop',
        'hoc_ky',
        'diem_trung_binh',
        'nam_hoc',
    ];

    protected $casts = [
        'idnguoidung' => 'integer',
        'idmonhoc' => 'integer',
        'lop' => 'integer',
        'hoc_ky' => 'integer',
        'diem_trung_binh' => 'decimal:2',
        'nam_hoc' => 'integer',
    ];

    // Relationships
    public function nguoiDung()
    {
        return $this->belongsTo(NguoiDung::class, 'idnguoidung', 'idnguoidung');
    }

    public function monHoc()
    {
        return $this->belongsTo(MonHoc::class, 'idmonhoc', 'idmonhoc');
    }
}







