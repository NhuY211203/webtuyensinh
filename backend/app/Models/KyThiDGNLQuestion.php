<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KyThiDGNLQuestion extends Model
{
    protected $table = 'kythi_dgnl_questions';
    protected $primaryKey = 'idquestion';
    public $timestamps = true;

    protected $fillable = [
        'idsection',
        'noi_dung',
        'loai_cau',
        'thu_tu',
        'do_kho',
        'diem_mac_dinh',
    ];

    public function section()
    {
        return $this->belongsTo(KyThiDGNLSection::class, 'idsection', 'idsection');
    }

    public function options()
    {
        return $this->hasMany(KyThiDGNLOption::class, 'idquestion', 'idquestion');
    }
}


