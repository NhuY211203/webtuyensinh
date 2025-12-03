<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MonHoc extends Model
{
    protected $table = 'mon_hoc';
    protected $primaryKey = 'idmonhoc';
    public $timestamps = true;

    protected $fillable = [
        'ma_mon_hoc',
        'ten_mon_hoc',
        'ten_viet_tat',
        'trang_thai',
    ];

    protected $casts = [
        'trang_thai' => 'integer',
    ];
}







