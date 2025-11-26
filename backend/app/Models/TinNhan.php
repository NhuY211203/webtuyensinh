<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TinNhan extends Model
{
    protected $table = 'tin_nhan';
    protected $primaryKey = 'idtinnhan';
    public $timestamps = false;

    protected $fillable = [
        'idphongchat',
        'idnguoigui',
        'noi_dung',
        'tep_dinh_kem',
        'da_xem',
        'ngay_xem',
        'ngay_tao',
        'xoa_mem_luc',
    ];
}


