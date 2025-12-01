<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThongTinBoSungPhuongThuc extends Model
{
    protected $table = 'thong_tin_bo_sung_phuong_thuc';
    protected $primaryKey = 'idthong_tin_bo_sung';
    public $timestamps = true;

    protected $fillable = [
        'idphuong_thuc_chi_tiet',
        'loai_thong_tin',
        'ten_thong_tin',
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

