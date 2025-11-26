<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TinNhanSupport extends Model
{
    protected $table = 'tin_nhan_support';
    protected $primaryKey = 'idtinnhan_support';
    public $timestamps = false;

    protected $fillable = [
        'idphongchat_support',
        'idnguoigui',
        'noi_dung',
        'tep_dinh_kem',
        'da_xem',
        'ngay_xem',
        'ngay_tao',
        'xoa_mem_luc',
    ];

    protected $casts = [
        'ngay_tao' => 'datetime',
        'ngay_xem' => 'datetime',
        'xoa_mem_luc' => 'datetime',
        'da_xem' => 'integer',
    ];

    // Relationships
    public function phongChatSupport()
    {
        return $this->belongsTo(PhongChatSupport::class, 'idphongchat_support', 'idphongchat_support');
    }

    public function nguoiGui()
    {
        return $this->belongsTo(NguoiDung::class, 'idnguoigui', 'idnguoidung');
    }

    // Scopes
    public function scopeUnread($query)
    {
        return $query->where('da_xem', 0);
    }

    public function scopeNotDeleted($query)
    {
        return $query->whereNull('xoa_mem_luc');
    }
}

