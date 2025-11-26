<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhongChatSupport extends Model
{
    protected $table = 'phong_chat_support';
    protected $primaryKey = 'idphongchat_support';
    public $timestamps = false;

    protected $fillable = [
        'idnguoidung',
        'idnguoi_phu_trach',
        'trang_thai',
        'ngay_tao',
        'ngay_cap_nhat',
    ];

    protected $casts = [
        'ngay_tao' => 'datetime',
        'ngay_cap_nhat' => 'datetime',
        'trang_thai' => 'integer',
    ];

    // Relationships
    public function nguoiDung()
    {
        return $this->belongsTo(NguoiDung::class, 'idnguoidung', 'idnguoidung');
    }

    public function nguoiPhuTrach()
    {
        return $this->belongsTo(NguoiDung::class, 'idnguoi_phu_trach', 'idnguoidung');
    }

    public function tinNhans()
    {
        return $this->hasMany(TinNhanSupport::class, 'idphongchat_support', 'idphongchat_support');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('trang_thai', 1);
    }
}

