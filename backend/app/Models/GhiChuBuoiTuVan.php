<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class GhiChuBuoiTuVan extends Model
{
    protected $table = 'ghi_chu_buoituvan';
    protected $primaryKey = 'id_ghichu';
    public $timestamps = true;

    protected $fillable = [
        'id_lichtuvan',
        'id_tuvanvien',
        'noi_dung',
        'ket_luan_nganh',
        'muc_quan_tam',
        'diem_du_kien',
        'yeu_cau_bo_sung',
        'chia_se_voi_thisinh',
        'trang_thai',
        'thoi_han_sua_den',
    ];

    protected $casts = [
        'muc_quan_tam' => 'integer',
        'diem_du_kien' => 'decimal:2',
        'chia_se_voi_thisinh' => 'boolean',
        'thoi_han_sua_den' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relationships
    public function lichTuVan()
    {
        return $this->belongsTo(LichTuVan::class, 'id_lichtuvan', 'idlichtuvan');
    }

    public function tuVanVien()
    {
        return $this->belongsTo(NguoiDung::class, 'id_tuvanvien', 'idnguoidung');
    }

    public function tepMinhChung()
    {
        return $this->hasMany(TepMinhChungBuoiTuVan::class, 'id_ghichu', 'id_ghichu');
    }

    // Scopes
    public function scopeNhap($query)
    {
        return $query->where('trang_thai', 'NHAP');
    }

    public function scopeChot($query)
    {
        return $query->where('trang_thai', 'CHOT');
    }

    public function scopeChuaQuaHan($query)
    {
        return $query->where(function($q) {
            $q->whereNull('thoi_han_sua_den')
              ->orWhere('thoi_han_sua_den', '>', Carbon::now());
        });
    }

    // Accessors
    public function getIsChotAttribute()
    {
        return $this->trang_thai === 'CHOT';
    }

    public function getIsNhapAttribute()
    {
        return $this->trang_thai === 'NHAP';
    }

    public function getCanEditAttribute()
    {
        if (!$this->thoi_han_sua_den) {
            return true;
        }
        return Carbon::now()->lt($this->thoi_han_sua_den);
    }
}

































