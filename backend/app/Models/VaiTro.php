<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VaiTro extends Model
{
    // Bảng thực tế trong DB
    protected $table = 'vaitro';

    // Khóa chính theo ảnh là idvaitro
    protected $primaryKey = 'idvaitro';

    // Bảng này không có cột created_at/updated_at
    public $timestamps = false;
}


