<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KetQuaTinhDiemTotNghiep extends Model
{
    protected $table = 'ket_qua_tinh_diem_tot_nghiep';
    protected $primaryKey = 'idketqua';
    public $timestamps = true;

    protected $fillable = [
        'idnguoidung',
        'mien_thi_ngoai_ngu',
        'tong_diem_4_mon_thi',
        'tong_diem_kk',
        'diem_tb_lop_10',
        'diem_tb_lop_11',
        'diem_tb_lop_12',
        'dtb_cac_nam_hoc',
        'diem_uu_tien',
        'tong_diem_xet_tot_nghiep',
        'cong_thuc_ap_dung',
        'nam_thi',
    ];

    protected $casts = [
        'mien_thi_ngoai_ngu' => 'boolean',
        'tong_diem_4_mon_thi' => 'decimal:2',
        'tong_diem_kk' => 'decimal:2',
        'diem_tb_lop_10' => 'decimal:2',
        'diem_tb_lop_11' => 'decimal:2',
        'diem_tb_lop_12' => 'decimal:2',
        'dtb_cac_nam_hoc' => 'decimal:2',
        'diem_uu_tien' => 'decimal:2',
        'tong_diem_xet_tot_nghiep' => 'decimal:2',
        'nam_thi' => 'integer',
    ];

    // Relationships
    public function nguoiDung()
    {
        return $this->belongsTo(NguoiDung::class, 'idnguoidung', 'idnguoidung');
    }

    public function chiTietDiemThi()
    {
        return $this->hasMany(ChiTietDiemThiTotNghiep::class, 'idketqua', 'idketqua');
    }
}







