<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuyDinhDiemUuTienDeAn extends Model
{
    protected $table = 'quy_dinh_diem_uu_tien_de_an';
    protected $primaryKey = 'idquy_dinh_de_an';
    public $timestamps = true;

    protected $fillable = [
        'idphuong_thuc_chi_tiet',
        'nguong_diem',
        'muc_diem_cong_cctaqt',
        'cong_thuc_diem_uu_tien',
        'mo_ta_quy_dinh',
    ];

    /**
     * Relationship with PhuongThucTuyenSinhChiTiet
     */
    public function phuongThucChiTiet()
    {
        return $this->belongsTo(PhuongThucTuyenSinhChiTiet::class, 'idphuong_thuc_chi_tiet', 'idphuong_thuc_chi_tiet');
    }
}

