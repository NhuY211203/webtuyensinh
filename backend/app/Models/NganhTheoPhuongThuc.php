<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NganhTheoPhuongThuc extends Model
{
    protected $table = 'nganh_theo_phuong_thuc';
    protected $primaryKey = 'idnganh_phuong_thuc';
    public $timestamps = true;

    protected $fillable = [
        'idphuong_thuc_chi_tiet',
        'idnganhtruong',
        'to_hop_mon',
        'ghi_chu',
        'loai_nganh',
        'thu_tu',
    ];

    /**
     * Relationship with PhuongThucTuyenSinhChiTiet
     */
    public function phuongThucChiTiet()
    {
        return $this->belongsTo(PhuongThucTuyenSinhChiTiet::class, 'idphuong_thuc_chi_tiet', 'idphuong_thuc_chi_tiet');
    }

    /**
     * Relationship with NganhTruong
     */
    public function nganhTruong()
    {
        return $this->belongsTo(NganhTruong::class, 'idnganhtruong', 'idnganhtruong');
    }
}

