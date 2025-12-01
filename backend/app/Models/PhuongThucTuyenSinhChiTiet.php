<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhuongThucTuyenSinhChiTiet extends Model
{
    protected $table = 'phuong_thuc_tuyen_sinh_chi_tiet';
    protected $primaryKey = 'idphuong_thuc_chi_tiet';
    public $timestamps = true;

    protected $fillable = [
        'idde_an',
        'ma_phuong_thuc',
        'ten_phuong_thuc',
        'thu_tu_hien_thi',
        'doi_tuong',
        'dieu_kien_xet_tuyen',
        'cong_thuc_tinh_diem',
        'mo_ta_quy_che',
        'thoi_gian_bat_dau',
        'thoi_gian_ket_thuc',
        'ghi_chu',
        'trang_thai',
    ];

    /**
     * Relationship with DeAnTuyenSinh
     */
    public function deAn()
    {
        return $this->belongsTo(DeAnTuyenSinh::class, 'idde_an', 'idde_an');
    }

    /**
     * Relationship with BangQuyDoiDiemNgoaiNgu
     */
    public function bangQuyDoi()
    {
        return $this->hasMany(BangQuyDoiDiemNgoaiNgu::class, 'idphuong_thuc_chi_tiet', 'idphuong_thuc_chi_tiet');
    }

    /**
     * Relationship with NganhTheoPhuongThuc
     */
    public function nganhTheoPhuongThuc()
    {
        return $this->hasMany(NganhTheoPhuongThuc::class, 'idphuong_thuc_chi_tiet', 'idphuong_thuc_chi_tiet');
    }

    /**
     * Relationship with XetTuyenThang
     */
    public function xetTuyenThang()
    {
        return $this->hasMany(XetTuyenThang::class, 'idphuong_thuc_chi_tiet', 'idphuong_thuc_chi_tiet');
    }

    /**
     * Relationship with HoSoXetTuyen
     */
    public function hoSoXetTuyen()
    {
        return $this->hasMany(HoSoXetTuyen::class, 'idphuong_thuc_chi_tiet', 'idphuong_thuc_chi_tiet');
    }

    /**
     * Relationship with QuyDinhDiemUuTienDeAn
     */
    public function quyDinhDiemUuTien()
    {
        return $this->hasOne(QuyDinhDiemUuTienDeAn::class, 'idphuong_thuc_chi_tiet', 'idphuong_thuc_chi_tiet');
    }

    /**
     * Relationship with ThongTinBoSungPhuongThuc
     */
    public function thongTinBoSung()
    {
        return $this->hasMany(ThongTinBoSungPhuongThuc::class, 'idphuong_thuc_chi_tiet', 'idphuong_thuc_chi_tiet');
    }
}

