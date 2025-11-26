<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NganhHoc extends Model
{
    protected $table = 'nganhhoc';
    protected $primaryKey = 'idnganh';
    public $timestamps = false;
    
    protected $fillable = [
        'idnhomnganh',
        'manganh',
        'tennganh',
        'capdo',
        'bangcap',
        'motanganh',
        'mucluong',
        'xuhuong'
    ];
}



