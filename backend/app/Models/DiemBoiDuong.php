<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class DiemBoiDuong extends Model
{
    protected $table = 'bang_diem_boi_duong';
    protected $primaryKey = 'iddiem_boi_duong';
    public $timestamps = false;

    protected $fillable = [
        'idnguoidung',
        'idlichtuvan',
        'iddoilich',
        'so_diem',
        'trang_thai',
        'ngay_tao',
        'nguoi_tao',
    ];

    protected $casts = [
        'so_diem' => 'decimal:2',
        'trang_thai' => 'integer',
        'ngay_tao' => 'datetime',
    ];

    // Relationships
    public function nguoiDung()
    {
        return $this->belongsTo(NguoiDung::class, 'idnguoidung', 'idnguoidung');
    }

    public function lichTuVan()
    {
        return $this->belongsTo(LichTuVan::class, 'idlichtuvan', 'idlichtuvan');
    }

    public function yeuCauDoiLich()
    {
        return $this->belongsTo(YeuCauDoiLich::class, 'iddoilich', 'iddoilich');
    }

    public function nguoiTao()
    {
        return $this->belongsTo(NguoiDung::class, 'nguoi_tao', 'idnguoidung');
    }

    // Scopes
    public function scopeChuaSuDung($query)
    {
        return $query->where('trang_thai', 1);
    }

    public function scopeDaSuDung($query)
    {
        return $query->where('trang_thai', 2);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('idnguoidung', $userId);
    }
}

