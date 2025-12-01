<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class XetTuyenThang extends Model
{
    protected $table = 'xet_tuyen_thang';
    protected $primaryKey = 'idxet_tuyen_thang';
    public $timestamps = true;

    protected $fillable = [
        'idphuong_thuc_chi_tiet',
        'linh_vuc',
        'linh_vuc_chuyen_sau',
        'danh_sach_nganh',
        'ghi_chu',
        'thu_tu',
    ];

    /**
     * Relationship with PhuongThucTuyenSinhChiTiet
     */
    public function phuongThucChiTiet()
    {
        return $this->belongsTo(PhuongThucTuyenSinhChiTiet::class, 'idphuong_thuc_chi_tiet', 'idphuong_thuc_chi_tiet');
    }
}

