<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KyThiDGNLSection extends Model
{
    protected $table = 'kythi_dgnl_sections';
    protected $primaryKey = 'idsection';
    public $timestamps = true;

    protected $fillable = [
        'idkythi',
        'ma_section',
        'ten_section',
        'nhom_nang_luc',
        'so_cau',
        'thoi_luong_phut',
        'thu_tu',
        'mo_ta',
    ];

    public function exam()
    {
        return $this->belongsTo(KyThiDGNL::class, 'idkythi', 'idkythi');
    }

    public function questions()
    {
        return $this->hasMany(KyThiDGNLQuestion::class, 'idsection', 'idsection');
    }
}


