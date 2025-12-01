<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuyCheXetTuyen extends Model
{
    protected $table = 'quyche_xettuyen';
    protected $primaryKey = 'idquyche';
    public $timestamps = true;

    protected $fillable = [
        'idtruong',
        'idnganhtruong',
        'idxettuyen',
        'nam_ap_dung',
        'mota_ngan',
        'noi_dung_day_du',
        'cong_thuc_diem',
    ];
}












