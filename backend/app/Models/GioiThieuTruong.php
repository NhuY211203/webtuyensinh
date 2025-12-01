<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GioiThieuTruong extends Model
{
    protected $table = 'gioi_thieu_truong';
    protected $primaryKey = 'idgioi_thieu';
    public $timestamps = true;

    protected $fillable = [
        'idtruong',
        'ten_tieng_anh',
        'ma_truong',
        'ten_viet_tat',
        'dia_chi_day_du',
        'website',
        'lich_su',
        'su_menh',
        'thanh_tuu',
        'quan_he_quoc_te',
        'tam_nhin',
        'anh_dai_dien',
    ];

    /**
     * Relationship with TruongDaiHoc
     */
    public function truong()
    {
        return $this->belongsTo(TruongDaiHoc::class, 'idtruong', 'idtruong');
    }
}

