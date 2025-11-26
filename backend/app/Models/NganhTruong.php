<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NganhTruong extends Model
{
    protected $table = 'nganh_truong';
    protected $primaryKey = 'idnganhtruong';
    public $timestamps = true;

    protected $fillable = [
        'idtruong',
        'manganh',
        'hinhthuc',
        'thoiluong_nam',
        'so_ky',
        'tohop_xettuyen_truong',
        'hocphi_ky',
        'hocphi_ghichu',
        'decuong_url',
        'mota_tomtat',
        'nam',
    ];

    public function truong()
    {
        return $this->belongsTo(TruongDaiHoc::class, 'idtruong', 'idtruong');
    }

    public function nganh()
    {
        return $this->belongsTo(NganhHoc::class, 'manganh', 'manganh');
    }
}


