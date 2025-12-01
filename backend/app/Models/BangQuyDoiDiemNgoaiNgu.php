<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BangQuyDoiDiemNgoaiNgu extends Model
{
    protected $table = 'bang_quy_doi_diem_ngoai_ngu';
    protected $primaryKey = 'idquy_doi';
    public $timestamps = true;

    protected $fillable = [
        'idphuong_thuc_chi_tiet',
        'loai_chung_chi',
        'muc_diem_min',
        'muc_diem_max',
        'ielts_min',
        'ielts_max',
        'toefl_min',
        'toefl_max',
        'toeic_lr_min',
        'toeic_lr_max',
        'toeic_s_min',
        'toeic_s_max',
        'toeic_w_min',
        'toeic_w_max',
        'diem_quy_doi',
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

