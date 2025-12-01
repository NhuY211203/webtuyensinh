<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhuongThucXetHocBa extends Model
{
    protected $table = 'phuong_thuc_xet_hoc_ba';
    protected $primaryKey = 'idphuongthuc_hb';
    public $timestamps = true;

    protected $fillable = [
        'ten_phuong_thuc',
        'ma_phuong_thuc',
        'mo_ta',
        'cach_tinh',
        'trang_thai',
    ];

    protected $casts = [
        'trang_thai' => 'integer',
    ];
}




