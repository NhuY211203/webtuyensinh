<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NhomNganh extends Model
{
    protected $table = 'nhomnganh';
    protected $primaryKey = 'idnhomnganh';
    public $timestamps = false;
    
    protected $fillable = [
        'manhom',
        'tennhom',
        'mota'
    ];

    // Relationship với NguoiDung (tư vấn viên)
    public function tuVanVien()
    {
        return $this->hasMany(NguoiDung::class, 'idnhomnganh', 'idnhomnganh')
                    ->where('idvaitro', 4) // Tư vấn viên
                    ->where('trangthai', 1); // Đang hoạt động
    }
}


