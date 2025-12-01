<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiemMonHocTotNghiep extends Model
{
    protected $table = 'diem_mon_hoc_tot_nghiep';
    protected $primaryKey = 'iddiemmon';
    public $timestamps = true;

    protected $fillable = [
        'idnguoidung',
        'idmonhoc',
        'lop',
        'diem_trung_binh',
        'nam_hoc',
    ];

    protected $casts = [
        'lop' => 'integer',
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




