<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TepMinhChungBuoiTuVan extends Model
{
    protected $table = 'tep_minhchung_buoituvan';
    protected $primaryKey = 'id_file';
    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = null; // Bảng không có cột updated_at

    protected $fillable = [
        'id_ghichu',
        'id_lichtuvan',
        'duong_dan',
        'ten_file',
        'loai_file',
        'la_minh_chung',
        'mo_ta',
        'nguoi_tai_len',
    ];

    protected $casts = [
        'la_minh_chung' => 'integer', // Database lưu dạng integer (0/1), không phải boolean
        'created_at' => 'datetime',
    ];

    // Relationships
    public function ghiChu()
    {
        return $this->belongsTo(GhiChuBuoiTuVan::class, 'id_ghichu', 'id_ghichu');
    }

    public function lichTuVan()
    {
        return $this->belongsTo(LichTuVan::class, 'id_lichtuvan', 'idlichtuvan');
    }

    public function nguoiTaiLen()
    {
        return $this->belongsTo(NguoiDung::class, 'nguoi_tai_len', 'idnguoidung');
    }

    // Scopes
    public function scopeMinhChung($query)
    {
        return $query->where('la_minh_chung', 1);
    }

    public function scopeTheoGhiChu($query, $idGhiChu)
    {
        return $query->where('id_ghichu', $idGhiChu);
    }

    public function scopeTheoLichTuVan($query, $idLichTuVan)
    {
        return $query->where('id_lichtuvan', $idLichTuVan);
    }
}

