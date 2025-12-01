<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HoSoXetTuyen extends Model
{
    protected $table = 'ho_so_xet_tuyen';
    protected $primaryKey = 'idho_so';
    public $timestamps = true;

    protected $fillable = [
        'idphuong_thuc_chi_tiet',
        'loai_ho_so',
        'noi_dung',
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

