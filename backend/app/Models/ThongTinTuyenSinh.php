<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThongTinTuyenSinh extends Model
{
    protected $table = 'thongtin_tuyensinh';
    protected $primaryKey = 'idthongtin';
    public $timestamps = true;

    protected $fillable = [
        'idtruong',
        'manganh',
        'idxettuyen',
        'tohopmon',
        'nam',
        'diemchuan',
        'chitieu',
        'ghichu',
        'trangthai',
    ];

    protected $casts = [
        'nam' => 'integer',
        'idxettuyen' => 'integer',
        'diemchuan' => 'decimal:2',
        'chitieu' => 'integer',
        'trangthai' => 'integer',
    ];

    /**
     * Quan hệ với bảng trường đại học
     */
    public function truong()
    {
        return $this->belongsTo(TruongDaiHoc::class, 'idtruong', 'idtruong');
    }

    /**
     * Quan hệ với bảng ngành học
     */
    public function nganh()
    {
        return $this->belongsTo(NganhHoc::class, 'manganh', 'manganh');
    }

    /**
     * Quan hệ với bảng phương thức xét tuyển
     */
    public function phuongThuc()
    {
        return $this->belongsTo(PhuongThucXetTuyen::class, 'idxettuyen', 'idxettuyen');
    }

    /**
     * Lấy danh sách tổ hợp từ chuỗi tohopmon
     */
    public function getToHopArrayAttribute()
    {
        if (empty($this->tohopmon)) {
            return [];
        }
        return array_filter(array_map('trim', explode(';', $this->tohopmon)));
    }

    /**
     * Scope: Lọc theo trường
     */
    public function scopeByTruong($query, $idtruong)
    {
        return $query->where('idtruong', $idtruong);
    }

    /**
     * Scope: Lọc theo ngành
     */
    public function scopeByNganh($query, $manganh)
    {
        return $query->where('manganh', $manganh);
    }

    /**
     * Scope: Lọc theo phương thức xét tuyển
     */
    public function scopeByPhuongThuc($query, $idxettuyen)
    {
        return $query->where('idxettuyen', $idxettuyen);
    }

    /**
     * Scope: Lọc theo năm
     */
    public function scopeByNam($query, $nam)
    {
        return $query->where('nam', $nam);
    }

    /**
     * Scope: Chỉ lấy bản ghi hoạt động
     */
    public function scopeActive($query)
    {
        return $query->where('trangthai', 1);
    }
}

