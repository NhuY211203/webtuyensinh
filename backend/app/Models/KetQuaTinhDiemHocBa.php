<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KetQuaTinhDiemHocBa extends Model
{
    protected $table = 'ket_qua_tinh_diem_hoc_ba';
    protected $primaryKey = 'idketqua';
    public $timestamps = true;

    protected $fillable = [
        'idnguoidung',
        'idphuongthuc_hb',
        'idthongtin',
        'tohopmon',
        'mon_nhan_he_so_2',
        'iddoituong',
        'idkhuvuc',
        'diem_to_hop',
        'diem_uu_tien_doi_tuong',
        'diem_uu_tien_khu_vuc',
        'tong_diem_uu_tien',
        'tong_diem_xet_tuyen',
        'chi_tiet_tinh_toan',
    ];

    protected $casts = [
        'idnguoidung' => 'integer',
        'idphuongthuc_hb' => 'integer',
        'idthongtin' => 'integer',
        'mon_nhan_he_so_2' => 'integer',
        'iddoituong' => 'integer',
        'idkhuvuc' => 'integer',
        'diem_to_hop' => 'decimal:2',
        'diem_uu_tien_doi_tuong' => 'decimal:2',
        'diem_uu_tien_khu_vuc' => 'decimal:2',
        'tong_diem_uu_tien' => 'decimal:2',
        'tong_diem_xet_tuyen' => 'decimal:2',
        'chi_tiet_tinh_toan' => 'array',
    ];

    // Relationships
    public function nguoiDung()
    {
        return $this->belongsTo(NguoiDung::class, 'idnguoidung', 'idnguoidung');
    }

    public function phuongThucXetHocBa()
    {
        return $this->belongsTo(PhuongThucXetHocBa::class, 'idphuongthuc_hb', 'idphuongthuc_hb');
    }

    public function thongTinTuyenSinh()
    {
        // Kiểm tra xem bảng thongtin_tuyensinh dùng cột nào làm primary key
        // Nếu dùng idthongtin thì dùng idthongtin, nếu dùng idthongtintuyensinh thì dùng idthongtintuyensinh
        return $this->belongsTo(ThongTinTuyenSinh::class, 'idthongtin', 'idthongtin');
    }

    public function doiTuongUuTien()
    {
        return $this->belongsTo(DoiTuongUuTien::class, 'iddoituong', 'iddoituong');
    }

    public function khuVucUuTien()
    {
        return $this->belongsTo(KhuVucUuTien::class, 'idkhuvuc', 'idkhuvuc');
    }

    public function monNhanHeSo()
    {
        return $this->belongsTo(MonHoc::class, 'mon_nhan_he_so_2', 'idmonhoc');
    }
}

