<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TinTuyenSinh extends Model
{
    protected $table = 'tin_tuyensinh';
    protected $primaryKey = 'id_tin';
    public $timestamps = false;

    protected $fillable = [
        'id_truong',
        'id_nguoidang',
        'tieu_de',
        'tom_tat',
        'hinh_anh_dai_dien',
        'hinh_anh_public_id',
        'nguon_bai_viet',
        'loai_tin',
        'muc_do_uu_tien',
        'trang_thai',
        'ngay_dang',
        'ngay_het_han',
        'ma_nguon',
        'hash_noidung',
        'is_tu_dong'
    ];

    protected $casts = [
        'muc_do_uu_tien' => 'integer',
        'is_tu_dong' => 'boolean',
        'ngay_dang' => 'datetime',
        'ngay_cap_nhat' => 'datetime',
        'ngay_het_han' => 'datetime',
    ];

    public function truong()
    {
        return $this->belongsTo(TruongDaiHoc::class, 'id_truong', 'idtruong');
    }

    public function nguoiDang()
    {
        return $this->belongsTo(NguoiDung::class, 'id_nguoidang', 'idnguoidung');
    }
}














