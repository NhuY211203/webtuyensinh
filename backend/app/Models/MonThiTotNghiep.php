<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MonThiTotNghiep extends Model
{
    protected $table = 'mon_thi_tot_nghiep';
    protected $primaryKey = 'idmonthi';
    public $timestamps = true;

    protected $fillable = [
        'ma_mon_thi',
        'ten_mon_thi',
        'loai_mon',
        'trang_thai',
        'nam_ap_dung',
    ];

    protected $casts = [
        'trang_thai' => 'boolean',
        'nam_ap_dung' => 'integer',
    ];

    // Relationships
    public function diemThiTotNghiep()
    {
        return $this->hasMany(DiemThiTotNghiep::class, 'idmonthi', 'idmonthi');
    }
}




