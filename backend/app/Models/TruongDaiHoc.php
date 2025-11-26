<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TruongDaiHoc extends Model
{
    protected $table = 'truongdaihoc';
    protected $primaryKey = 'idtruong';
    public $timestamps = false;

    protected $fillable = [
        'matruong',
        'tentruong',
        'diachi',
        'dienthoai',
        'lienhe',
        'sodienthoai',
        'ngaythanhlap',
        'motantuong'
    ];
}



