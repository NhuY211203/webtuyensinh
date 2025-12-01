<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChiTietDiemThiTotNghiep extends Model
{
    protected $table = 'chi_tiet_diem_thi_tot_nghiep';
    protected $primaryKey = 'idchitiet';
    public $timestamps = true;
    const UPDATED_AT = null; // Bảng này không có cột updated_at

    protected $fillable = [
        'idketqua',
        'idmonthi',
        'diem_thi',
        'mien_thi',
    ];

    protected $casts = [
        'diem_thi' => 'decimal:2',
        'mien_thi' => 'boolean',
    ];

    // Relationships
    public function ketQuaTinhDiem()
    {
        return $this->belongsTo(KetQuaTinhDiemTotNghiep::class, 'idketqua', 'idketqua');
    }

    public function monThiTotNghiep()
    {
        return $this->belongsTo(MonThiTotNghiep::class, 'idmonthi', 'idmonthi');
    }
}

