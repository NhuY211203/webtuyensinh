<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeAnTuyenSinh extends Model
{
    protected $table = 'de_an_tuyen_sinh';
    protected $primaryKey = 'idde_an';
    public $timestamps = true;

    protected $fillable = [
        'idtruong',
        'nam_tuyen_sinh',
        'tieu_de',
        'thong_tin_tom_tat',
        'thong_tin_day_du',
        'file_pdf_url',
        'trang_thai',
    ];

    /**
     * Relationship with TruongDaiHoc
     */
    public function truong()
    {
        return $this->belongsTo(TruongDaiHoc::class, 'idtruong', 'idtruong');
    }

    /**
     * Relationship with PhuongThucTuyenSinhChiTiet
     */
    public function phuongThucChiTiet()
    {
        return $this->hasMany(PhuongThucTuyenSinhChiTiet::class, 'idde_an', 'idde_an');
    }

    /**
     * Relationship with FileDeAnTuyenSinh
     */
    public function files()
    {
        return $this->hasMany(FileDeAnTuyenSinh::class, 'idde_an', 'idde_an');
    }
}

