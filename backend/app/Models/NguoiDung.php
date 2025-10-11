<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

class NguoiDung extends Model
{
    protected $table = 'nguoidung';
    protected $primaryKey = 'idnguoidung';
    public $timestamps = false; // Bảng không dùng created_at/updated_at

    protected $fillable = [
        'idvaitro',
        'taikhoan',
        'matkhau',
        'email',
        'hoten',
        'sodienthoai',
        'diachi',
        'ngaysinh',
        'gioitinh',
        'trangthai',
        'ngaytao',
        'ngaycapnhat',
    ];

    protected $hidden = [
        'matkhau',
    ];

    // Hash password tự động khi set
    public function setMatkhauAttribute($value)
    {
        $this->attributes['matkhau'] = Hash::make($value);
    }

    // Relationship với VaiTro
    public function vaiTro()
    {
        return $this->belongsTo(VaiTro::class, 'idvaitro', 'idvaitro');
    }
}
