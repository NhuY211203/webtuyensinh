<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ToHopXetTuyen extends Model
{
    protected $table = 'tohop_xettuyen';
    protected $primaryKey = 'ma_to_hop';
    public $incrementing = false; // key là chuỗi như A00
    protected $keyType = 'string';
    public $timestamps = false;
}



