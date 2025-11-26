<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThongBaoLich extends Model
{
    protected $table = 'thongbao_lich';
    protected $primaryKey = 'id';
    public $timestamps = false; // bảng dùng created_at/updated_at thủ công

    protected $fillable = [
        'idlichtuvan',
        'loai',
        'offset_phut',
        'thoigian_gui',
        'trangthai',
        'thongbao_loi',
        'khoa_idempotent',
        'created_at',
        'updated_at',
    ];

    public function lichTuVan()
    {
        return $this->belongsTo(LichTuVan::class, 'idlichtuvan', 'idlichtuvan');
    }
}

























