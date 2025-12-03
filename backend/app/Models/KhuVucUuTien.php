<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KhuVucUuTien extends Model
{
    protected $table = 'khu_vuc_uu_tien';
    protected $primaryKey = 'idkhuvuc';
    public $timestamps = true;

    protected $fillable = [
        'ma_khu_vuc',
        'ten_khu_vuc',
        'mo_ta',
        'diem_uu_tien',
        'trang_thai',
    ];

    protected $casts = [
        'diem_uu_tien' => 'decimal:2',
        'trang_thai' => 'integer',
    ];
}







