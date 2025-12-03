<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CauHinhMonNhanHeSo extends Model
{
    protected $table = 'cau_hinh_mon_nhan_he_so';
    protected $primaryKey = 'idcauhinh';
    public $timestamps = true;

    protected $fillable = [
        'idthongtin',
        'idmonhoc',
        'he_so',
        'trang_thai',
    ];

    protected $casts = [
        'idthongtin' => 'integer',
        'idmonhoc' => 'integer',
        'he_so' => 'decimal:2',
        'trang_thai' => 'integer',
    ];

    // Relationships
    public function thongTinTuyenSinh()
    {
        return $this->belongsTo(ThongTinTuyenSinh::class, 'idthongtin', 'idthongtin');
    }

    public function monHoc()
    {
        return $this->belongsTo(MonHoc::class, 'idmonhoc', 'idmonhoc');
    }
}







