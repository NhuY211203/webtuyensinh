<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DanhGiaLichTuVan extends Model
{
    protected $table = 'danhgia_lichtuvan';
    protected $primaryKey = 'iddanhgia';
    public $timestamps = false;

    protected $fillable = [
        'idlichtuvan',
        'idnguoidat',
        'diemdanhgia',
        'nhanxet',
        'an_danh',
        'trangthai',
        'ngaydanhgia',
        'ngaycapnhat',
    ];
}










