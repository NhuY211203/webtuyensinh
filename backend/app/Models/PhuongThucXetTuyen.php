<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhuongThucXetTuyen extends Model
{
    protected $table = 'ptxt';
    protected $primaryKey = 'idxettuyen';
    public $timestamps = false;

    protected $fillable = [
        'idxettuyen',
        'tenptxt',
        'mota'
    ];
}


