<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class YeuCauDoiLich extends Model
{
    protected $table = 'bang_yeucau_doilich';
    protected $primaryKey = 'iddoilich';
    public $timestamps = false;

    protected $fillable = [
        'idlichtuvan',
        'ngaymoi',
        'giomoi',
        'lydo_doilich',
        'nguoigui_yeucau',
        'thoigian_gui',
        'trangthai_duyet',
        'nguoiduyet',
        'thoigian_duyet',
        'ghichu_duyet'
    ];

    protected $casts = [
        'ngaymoi' => 'date',
        'giomoi' => 'datetime:H:i',
        'thoigian_gui' => 'datetime',
        'thoigian_duyet' => 'datetime',
        'trangthai_duyet' => 'integer',
    ];

    // Relationships
    public function lichTuVan()
    {
        return $this->belongsTo(LichTuVan::class, 'idlichtuvan', 'idlichtuvan');
    }

    public function nguoiGuiYeuCau()
    {
        return $this->belongsTo(NguoiDung::class, 'nguoigui_yeucau', 'idnguoidung');
    }

    public function nguoiDuyet()
    {
        return $this->belongsTo(NguoiDung::class, 'nguoiduyet', 'idnguoidung');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('trangthai_duyet', 1);
    }

    public function scopeApproved($query)
    {
        return $query->where('trangthai_duyet', 2);
    }

    public function scopeRejected($query)
    {
        return $query->where('trangthai_duyet', 3);
    }
}

