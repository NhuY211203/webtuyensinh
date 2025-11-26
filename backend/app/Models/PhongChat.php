<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhongChat extends Model
{
    protected $table = 'phong_chat';
    protected $primaryKey = 'idphongchat';
    public $timestamps = false;

    protected $fillable = [
        'idlichtuvan',
        'idtuvanvien',
        'idnguoidat',
        'trang_thai',
        'ngay_tao',
        'ngay_cap_nhat',
        'ngay_dong',
    ];
}


