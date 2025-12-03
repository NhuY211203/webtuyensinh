<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KyThiDGNLOption extends Model
{
    protected $table = 'kythi_dgnl_options';
    protected $primaryKey = 'idoption';
    public $timestamps = true;

    protected $fillable = [
        'idquestion',
        'noi_dung',
        'is_correct',
        'thu_tu',
        'loi_giai',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'thu_tu' => 'integer',
    ];
}


