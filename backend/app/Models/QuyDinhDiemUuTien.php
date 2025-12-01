<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuyDinhDiemUuTien extends Model
{
    protected $table = 'quy_dinh_diem_uu_tien';
    protected $primaryKey = 'idquydinh';
    public $timestamps = true;

    protected $fillable = [
        'ten_quy_dinh',
        'mo_ta',
        'nguong_diem',
        'cong_thuc',
        'nam_ap_dung',
        'trang_thai',
    ];

    protected $casts = [
        'nguong_diem' => 'decimal:2',
        'nam_ap_dung' => 'integer',
        'trang_thai' => 'integer',
    ];
}




