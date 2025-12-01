<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DoiTuongUuTien extends Model
{
    protected $table = 'doi_tuong_uu_tien';
    protected $primaryKey = 'iddoituong';
    public $timestamps = true;

    protected $fillable = [
        'ma_doi_tuong',
        'ten_doi_tuong',
        'mo_ta',
        'diem_uu_tien',
        'trang_thai',
    ];

    protected $casts = [
        'diem_uu_tien' => 'decimal:2',
        'trang_thai' => 'integer',
    ];
}




