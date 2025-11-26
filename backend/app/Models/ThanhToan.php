<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThanhToan extends Model
{
    protected $table = 'thanhtoan';
    protected $primaryKey = 'id_thanhtoan';
    
    public $timestamps = true;
    const CREATED_AT = 'thoi_gian_tao';
    const UPDATED_AT = 'thoi_gian_cap_nhat';
    
    protected $fillable = [
        'id_lichtuvan',
        'id_nguoidung',
        'phuongthuc',
        'ma_phieu',
        'so_tien',
        'don_vi_tien',
        'so_tien_giam',
        'phi_giao_dich',
        'trang_thai',
        'ma_giao_dich_app',
        'ma_giao_dich_zp',
        'ma_token_zp',
        'duong_dan_thanh_toan',
        'duong_dan_qr',
        'ma_nguoi_dung_oa',
        'du_lieu_yeu_cau',
        'du_lieu_phan_hoi',
        'noi_dung',
        'ly_do_that_bai',
        'thoi_gian_thanh_toan',
        'thoi_gian_hoan_tien'
    ];
    
    protected $casts = [
        'so_tien' => 'decimal:2',
        'so_tien_giam' => 'decimal:2',
        'phi_giao_dich' => 'decimal:2',
        'thoi_gian_tao' => 'datetime',
        'thoi_gian_cap_nhat' => 'datetime',
        'thoi_gian_thanh_toan' => 'datetime',
        'thoi_gian_hoan_tien' => 'datetime'
    ];

    protected $appends = [
        'co_ban_thuc_thu',
    ];

    // Số tiền cơ bản thực thu = so_tien - so_tien_giam - phi_giao_dich
    public function getCoBanThucThuAttribute()
    {
        $amount = (float)($this->so_tien ?? 0);
        $discount = (float)($this->so_tien_giam ?? 0);
        $fee = (float)($this->phi_giao_dich ?? 0);
        return round($amount - $discount - $fee, 2);
    }
}


