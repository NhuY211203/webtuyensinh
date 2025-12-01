<?php

namespace App\Http\Controllers;

use App\Models\PhuongThucXetHocBa;
use App\Models\DoiTuongUuTien;
use App\Models\KhuVucUuTien;
use App\Models\MonHoc;
use App\Models\DiemHocBa;
use App\Models\KetQuaTinhDiemHocBa;
use App\Models\QuyDinhDiemUuTien;
use App\Models\CauHinhMonNhanHeSo;
use App\Models\ThongTinTuyenSinh;
use App\Models\NguoiDung;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TinhDiemHocBaController extends Controller
{
    /**
     * Lấy danh sách phương thức xét học bạ
     */
    public function getPhuongThucXetHocBa(Request $request): JsonResponse
    {
        try {
            $query = PhuongThucXetHocBa::query();

            // Lọc theo trạng thái nếu có
            if ($request->has('trang_thai')) {
                $query->where('trang_thai', $request->trang_thai);
            } else {
                $query->where('trang_thai', 1); // Mặc định chỉ lấy bản ghi hoạt động
            }

            $data = $query->orderBy('idphuongthuc_hb')->get();

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách phương thức xét học bạ: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách đối tượng ưu tiên
     */
    public function getDoiTuongUuTien(Request $request): JsonResponse
    {
        try {
            $query = DoiTuongUuTien::query();

            if ($request->has('trang_thai')) {
                $query->where('trang_thai', $request->trang_thai);
            } else {
                $query->where('trang_thai', 1);
            }

            $data = $query->orderBy('iddoituong')->get();

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách đối tượng ưu tiên: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách khu vực ưu tiên
     */
    public function getKhuVucUuTien(Request $request): JsonResponse
    {
        try {
            $query = KhuVucUuTien::query();

            if ($request->has('trang_thai')) {
                $query->where('trang_thai', $request->trang_thai);
            } else {
                $query->where('trang_thai', 1);
            }

            $data = $query->orderBy('idkhuvuc')->get();

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách khu vực ưu tiên: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách môn học
     */
    public function getMonHoc(Request $request): JsonResponse
    {
        try {
            $query = MonHoc::query();

            if ($request->has('trang_thai')) {
                $query->where('trang_thai', $request->trang_thai);
            } else {
                $query->where('trang_thai', 1);
            }

            $data = $query->orderBy('idmonhoc')->get();

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách môn học: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy điểm học bạ của người dùng
     */
    public function getDiemHocBa(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idnguoidung' => 'required|integer|exists:nguoidung,idnguoidung',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 400);
            }

            $idnguoidung = $request->idnguoidung;
            $query = DiemHocBa::with('monHoc')
                ->where('idnguoidung', $idnguoidung);

            // Lọc theo lớp nếu có
            if ($request->has('lop')) {
                $query->where('lop', $request->lop);
            }

            // Lọc theo môn học nếu có
            if ($request->has('idmonhoc')) {
                $query->where('idmonhoc', $request->idmonhoc);
            }

            $data = $query->orderBy('lop')->orderBy('hoc_ky')->get();

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy điểm học bạ: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lưu điểm học bạ
     */
    public function saveDiemHocBa(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idnguoidung' => 'required|integer|exists:nguoidung,idnguoidung',
                'diem_hoc_ba' => 'required|array',
                'diem_hoc_ba.*.idmonhoc' => 'required|integer|exists:mon_hoc,idmonhoc',
                'diem_hoc_ba.*.lop' => 'required|integer|in:10,11,12',
                'diem_hoc_ba.*.hoc_ky' => 'nullable|integer|in:1,2',
                'diem_hoc_ba.*.diem_trung_binh' => 'required|numeric|min:0|max:10',
                'diem_hoc_ba.*.nam_hoc' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 400);
            }

            $idnguoidung = $request->idnguoidung;
            $diemHocBa = $request->diem_hoc_ba;

            DB::beginTransaction();

            // Xóa điểm cũ của người dùng (nếu muốn cập nhật toàn bộ)
            if ($request->has('replace_all') && $request->replace_all) {
                DiemHocBa::where('idnguoidung', $idnguoidung)->delete();
            }

            $saved = [];
            foreach ($diemHocBa as $diem) {
                // Kiểm tra xem đã tồn tại chưa
                $existing = DiemHocBa::where('idnguoidung', $idnguoidung)
                    ->where('idmonhoc', $diem['idmonhoc'])
                    ->where('lop', $diem['lop'])
                    ->where('hoc_ky', $diem['hoc_ky'] ?? null)
                    ->first();

                if ($existing) {
                    // Cập nhật
                    $existing->update([
                        'diem_trung_binh' => $diem['diem_trung_binh'],
                        'nam_hoc' => $diem['nam_hoc'] ?? null,
                    ]);
                    $saved[] = $existing;
                } else {
                    // Tạo mới
                    $newDiem = DiemHocBa::create([
                        'idnguoidung' => $idnguoidung,
                        'idmonhoc' => $diem['idmonhoc'],
                        'lop' => $diem['lop'],
                        'hoc_ky' => $diem['hoc_ky'] ?? null,
                        'diem_trung_binh' => $diem['diem_trung_binh'],
                        'nam_hoc' => $diem['nam_hoc'] ?? null,
                    ]);
                    $saved[] = $newDiem;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Lưu điểm học bạ thành công',
                'data' => $saved
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lưu điểm học bạ: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tính điểm xét tuyển học bạ
     */
    public function tinhDiemHocBa(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idnguoidung' => 'required|integer|exists:nguoidung,idnguoidung',
                'idphuongthuc_hb' => 'required|integer|exists:phuong_thuc_xet_hoc_ba,idphuongthuc_hb',
                'idthongtin' => 'nullable|integer|exists:thongtin_tuyensinh,idthongtin',
                'tohopmon' => 'required|string', // VD: "A00" hoặc "TOAN;LI;HOA"
                'mon_nhan_he_so_2' => 'nullable|integer|exists:mon_hoc,idmonhoc',
                'iddoituong' => 'nullable|integer|exists:doi_tuong_uu_tien,iddoituong',
                'idkhuvuc' => 'nullable|integer|exists:khu_vuc_uu_tien,idkhuvuc',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 400);
            }

            $idnguoidung = $request->idnguoidung;
            $idphuongthuc_hb = $request->idphuongthuc_hb;
            $tohopmon = $request->tohopmon;

            // Lấy phương thức xét học bạ
            $phuongThuc = PhuongThucXetHocBa::findOrFail($idphuongthuc_hb);

            // Parse tổ hợp môn (có thể là mã tổ hợp như "A00" hoặc danh sách môn như "TOAN;LI;HOA")
            $monHocIds = $this->parseToHopMon($tohopmon);

            if (empty($monHocIds) || count($monHocIds) < 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tổ hợp môn không hợp lệ. Cần ít nhất 3 môn.'
                ], 400);
            }

            // Lấy điểm học bạ của người dùng
            $diemHocBa = DiemHocBa::where('idnguoidung', $idnguoidung)
                ->whereIn('idmonhoc', $monHocIds)
                ->get();

            if ($diemHocBa->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chưa có điểm học bạ. Vui lòng nhập điểm trước.'
                ], 400);
            }

            // Tính điểm tổ hợp theo phương thức
            $diemToHop = $this->tinhDiemToHop($diemHocBa, $monHocIds, $phuongThuc, $request->mon_nhan_he_so_2);

            // Tính điểm ưu tiên
            $diemUuTien = $this->tinhDiemUuTien(
                $diemToHop,
                $request->iddoituong,
                $request->idkhuvuc
            );

            // Tính tổng điểm
            $tongDiemXetTuyen = $diemToHop + $diemUuTien['tong_diem_uu_tien'];

            // Lưu kết quả
            $ketQua = KetQuaTinhDiemHocBa::create([
                'idnguoidung' => $idnguoidung,
                'idphuongthuc_hb' => $idphuongthuc_hb,
                'idthongtin' => $request->idthongtin,
                'tohopmon' => $tohopmon,
                'mon_nhan_he_so_2' => $request->mon_nhan_he_so_2,
                'iddoituong' => $request->iddoituong,
                'idkhuvuc' => $request->idkhuvuc,
                'diem_to_hop' => $diemToHop,
                'diem_uu_tien_doi_tuong' => $diemUuTien['diem_doi_tuong'],
                'diem_uu_tien_khu_vuc' => $diemUuTien['diem_khu_vuc'],
                'tong_diem_uu_tien' => $diemUuTien['tong_diem_uu_tien'],
                'tong_diem_xet_tuyen' => $tongDiemXetTuyen,
                'chi_tiet_tinh_toan' => [
                    'phuong_thuc' => $phuongThuc->ten_phuong_thuc,
                    'to_hop_mon' => $tohopmon,
                    'diem_chi_tiet' => $diemUuTien['chi_tiet'],
                ],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tính điểm thành công',
                'data' => [
                    'idketqua' => $ketQua->idketqua,
                    'diem_to_hop' => $diemToHop,
                    'diem_uu_tien_doi_tuong' => $diemUuTien['diem_doi_tuong'],
                    'diem_uu_tien_khu_vuc' => $diemUuTien['diem_khu_vuc'],
                    'tong_diem_uu_tien' => $diemUuTien['tong_diem_uu_tien'],
                    'tong_diem_xet_tuyen' => $tongDiemXetTuyen,
                    'chi_tiet_tinh_toan' => $ketQua->chi_tiet_tinh_toan,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tính điểm: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy kết quả tính điểm của người dùng
     */
    public function getKetQuaTinhDiem(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idnguoidung' => 'required|integer|exists:nguoidung,idnguoidung',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 400);
            }

            $query = KetQuaTinhDiemHocBa::with([
                'phuongThucXetHocBa',
                'thongTinTuyenSinh',
                'doiTuongUuTien',
                'khuVucUuTien',
                'monNhanHeSo'
            ])
                ->where('idnguoidung', $request->idnguoidung);

            // Lọc theo idketqua nếu có
            if ($request->has('idketqua')) {
                $query->where('idketqua', $request->idketqua);
            }

            $data = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy kết quả tính điểm: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy quy định điểm ưu tiên
     */
    public function getQuyDinhDiemUuTien(Request $request): JsonResponse
    {
        try {
            $query = QuyDinhDiemUuTien::query();

            // Lọc theo năm nếu có
            if ($request->has('nam_ap_dung')) {
                $query->where('nam_ap_dung', $request->nam_ap_dung);
            } else {
                // Lấy quy định mới nhất
                $query->orderBy('nam_ap_dung', 'desc');
            }

            if ($request->has('trang_thai')) {
                $query->where('trang_thai', $request->trang_thai);
            } else {
                $query->where('trang_thai', 1);
            }

            $data = $query->first();

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy quy định điểm ưu tiên: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy cấu hình môn nhân hệ số
     */
    public function getCauHinhMonNhanHeSo(Request $request): JsonResponse
    {
        try {
            $query = CauHinhMonNhanHeSo::with(['thongTinTuyenSinh', 'monHoc']);

            // Lọc theo idthongtin nếu có
            if ($request->has('idthongtin')) {
                $query->where('idthongtin', $request->idthongtin);
            }

            if ($request->has('trang_thai')) {
                $query->where('trang_thai', $request->trang_thai);
            } else {
                $query->where('trang_thai', 1);
            }

            $data = $query->get();

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy cấu hình môn nhân hệ số: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Parse tổ hợp môn từ chuỗi
     */
    private function parseToHopMon($tohopmon)
    {
        // Nếu là mã tổ hợp như "A00", cần map sang các môn học
        // Tạm thời giả sử tổ hợp môn là danh sách mã môn cách nhau bởi dấu ;
        $maMonList = explode(';', $tohopmon);
        $maMonList = array_map('trim', $maMonList);

        // Lấy ID môn học từ mã môn
        $monHocIds = MonHoc::whereIn('ma_mon_hoc', $maMonList)
            ->pluck('idmonhoc')
            ->toArray();

        return $monHocIds;
    }

    /**
     * Tính điểm tổ hợp môn
     */
    private function tinhDiemToHop($diemHocBa, $monHocIds, $phuongThuc, $monNhanHeSo2 = null)
    {
        $maPhuongThuc = $phuongThuc->ma_phuong_thuc;
        $diemTong = 0;
        $soMon = count($monHocIds);

        foreach ($monHocIds as $idmonhoc) {
            $diemMon = 0;

            switch ($maPhuongThuc) {
                case 'HB_3_NAM':
                    // Xét điểm trung bình cả năm của 3 năm
                    $diemMon = $diemHocBa->where('idmonhoc', $idmonhoc)
                        ->whereNull('hoc_ky')
                        ->avg('diem_trung_binh') ?? 0;
                    break;

                case 'HB_12_NAM':
                    // Xét điểm trung bình cả năm lớp 12
                    $diemMon = $diemHocBa->where('idmonhoc', $idmonhoc)
                        ->where('lop', 12)
                        ->whereNull('hoc_ky')
                        ->avg('diem_trung_binh') ?? 0;
                    break;

                case 'HB_6_HK':
                    // Xét điểm trung bình 6 học kỳ
                    $diemMon = $diemHocBa->where('idmonhoc', $idmonhoc)
                        ->whereNotNull('hoc_ky')
                        ->avg('diem_trung_binh') ?? 0;
                    break;

                case 'HB_10_11_HK1_12':
                    // Xét điểm lớp 10, 11 và HK1 lớp 12
                    $diemLop10 = $diemHocBa->where('idmonhoc', $idmonhoc)
                        ->where('lop', 10)
                        ->whereNull('hoc_ky')
                        ->avg('diem_trung_binh') ?? 0;
                    $diemLop11 = $diemHocBa->where('idmonhoc', $idmonhoc)
                        ->where('lop', 11)
                        ->whereNull('hoc_ky')
                        ->avg('diem_trung_binh') ?? 0;
                    $diemHK1Lop12 = $diemHocBa->where('idmonhoc', $idmonhoc)
                        ->where('lop', 12)
                        ->where('hoc_ky', 1)
                        ->avg('diem_trung_binh') ?? 0;
                    $diemMon = ($diemLop10 + $diemLop11 + $diemHK1Lop12) / 3;
                    break;

                case 'HB_3_HK':
                    // Xét điểm 3 học kỳ gần nhất
                    $diemMon = $diemHocBa->where('idmonhoc', $idmonhoc)
                        ->whereIn('lop', [11, 12])
                        ->whereNotNull('hoc_ky')
                        ->orderBy('lop', 'desc')
                        ->orderBy('hoc_ky', 'desc')
                        ->take(3)
                        ->avg('diem_trung_binh') ?? 0;
                    break;

                case 'HB_5_HK':
                    // Xét điểm 5 học kỳ
                    $diemMon = $diemHocBa->where('idmonhoc', $idmonhoc)
                        ->whereNotNull('hoc_ky')
                        ->orderBy('lop', 'desc')
                        ->orderBy('hoc_ky', 'desc')
                        ->take(5)
                        ->avg('diem_trung_binh') ?? 0;
                    break;

                default:
                    // Mặc định: lấy điểm trung bình cả năm
                    $diemMon = $diemHocBa->where('idmonhoc', $idmonhoc)
                        ->whereNull('hoc_ky')
                        ->avg('diem_trung_binh') ?? 0;
            }

            // Nhân hệ số 2 nếu có
            if ($monNhanHeSo2 && $idmonhoc == $monNhanHeSo2) {
                $diemMon = $diemMon * 2;
            }

            $diemTong += $diemMon;
        }

        return round($diemTong, 2);
    }

    /**
     * Tính điểm ưu tiên
     */
    private function tinhDiemUuTien($diemToHop, $iddoituong = null, $idkhuvuc = null)
    {
        $diemDoiTuong = 0;
        $diemKhuVuc = 0;

        // Lấy điểm ưu tiên đối tượng
        if ($iddoituong) {
            $doiTuong = DoiTuongUuTien::find($iddoituong);
            if ($doiTuong) {
                $diemDoiTuong = $doiTuong->diem_uu_tien;
            }
        }

        // Lấy điểm ưu tiên khu vực
        if ($idkhuvuc) {
            $khuVuc = KhuVucUuTien::find($idkhuvuc);
            if ($khuVuc) {
                $diemKhuVuc = $khuVuc->diem_uu_tien;
            }
        }

        $tongDiemUuTien = $diemDoiTuong + $diemKhuVuc;

        // Áp dụng quy định điểm ưu tiên nếu điểm cao
        $quyDinh = QuyDinhDiemUuTien::where('trang_thai', 1)
            ->orderBy('nam_ap_dung', 'desc')
            ->first();

        if ($quyDinh && $diemToHop >= $quyDinh->nguong_diem) {
            // Áp dụng công thức giảm điểm ưu tiên
            // Công thức: [(30 - Tổng điểm đạt được)/7.5] x Tổng điểm ưu tiên được xác định thông thường
            $tongDiemUuTien = ((30 - $diemToHop) / 7.5) * $tongDiemUuTien;
        }

        return [
            'diem_doi_tuong' => round($diemDoiTuong, 2),
            'diem_khu_vuc' => round($diemKhuVuc, 2),
            'tong_diem_uu_tien' => round($tongDiemUuTien, 2),
            'chi_tiet' => [
                'diem_to_hop' => $diemToHop,
                'nguong_diem' => $quyDinh->nguong_diem ?? null,
                'ap_dung_quy_dinh' => $quyDinh && $diemToHop >= $quyDinh->nguong_diem,
            ],
        ];
    }
}

