<?php

namespace App\Http\Controllers;

use App\Models\MonThiTotNghiep;
use App\Models\DiemThiTotNghiep;
use App\Models\DiemMonHocTotNghiep;
use App\Models\DiemKhuyenKhich;
use App\Models\KetQuaTinhDiemTotNghiep;
use App\Models\ChiTietDiemThiTotNghiep;
use App\Models\MonHoc;
use App\Models\NguoiDung;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class TinhDiemTotNghiepController extends Controller
{
    /**
     * Lấy danh sách môn thi tốt nghiệp
     */
    public function getMonThiTotNghiep(Request $request): JsonResponse
    {
        try {
            $query = MonThiTotNghiep::query();

            if ($request->has('trang_thai')) {
                $query->where('trang_thai', $request->trang_thai);
            } else {
                $query->where('trang_thai', 1);
            }

            if ($request->has('nam_ap_dung')) {
                $query->where('nam_ap_dung', $request->nam_ap_dung);
            } else {
                $query->where('nam_ap_dung', 2025); // Mặc định năm 2025
            }

            $data = $query->orderBy('idmonthi')->get();

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách môn thi tốt nghiệp: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách môn học (cho nhập điểm lớp 10, 11, 12)
     */
    public function getMonHoc(Request $request): JsonResponse
    {
        try {
            $data = MonHoc::where('trang_thai', 1)
                ->orderBy('idmonhoc')
                ->get();

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
     * Lấy điểm thi tốt nghiệp của học sinh
     */
    public function getDiemThiTotNghiep(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idnguoidung' => 'required|exists:nguoidung,idnguoidung',
                'nam_thi' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 400);
            }

            $query = DiemThiTotNghiep::with('monThiTotNghiep')
                ->where('idnguoidung', $request->idnguoidung);

            if ($request->has('nam_thi')) {
                $query->where('nam_thi', $request->nam_thi);
            } else {
                $query->where('nam_thi', 2025);
            }

            $data = $query->get();

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy điểm thi tốt nghiệp: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lưu điểm thi tốt nghiệp
     */
    public function saveDiemThiTotNghiep(Request $request): JsonResponse
    {
        try {
            // Đảm bảo diem_thi luôn là array (có thể rỗng)
            // Xử lý trước khi validate để đảm bảo field luôn tồn tại
            if (!$request->has('diem_thi') || $request->diem_thi === null) {
                $request->merge(['diem_thi' => []]);
            } elseif (!is_array($request->diem_thi)) {
                // Nếu không phải array và không phải null, trả về lỗi
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ: diem_thi phải là mảng',
                    'errors' => ['diem_thi' => ['Trường diem_thi phải là mảng']]
                ], 400);
            }

            // Log dữ liệu nhận được để debug
            \Log::info('saveDiemThiTotNghiep request', [
                'idnguoidung' => $request->idnguoidung,
                'diem_thi_count' => is_array($request->diem_thi) ? count($request->diem_thi) : 'not_array',
                'diem_thi' => $request->diem_thi,
                'nam_thi' => $request->nam_thi,
                'replace_all' => $request->replace_all,
            ]);

            $rules = [
                'idnguoidung' => 'required|exists:nguoidung,idnguoidung',
                'diem_thi' => 'required|array',
                'nam_thi' => 'nullable|integer',
                'replace_all' => 'nullable|boolean', // Nếu true, xóa tất cả điểm cũ trước khi lưu mới
            ];

            // Chỉ validate các phần tử trong mảng nếu mảng không rỗng
            if (is_array($request->diem_thi) && count($request->diem_thi) > 0) {
                $rules['diem_thi.*.idmonthi'] = 'required|exists:mon_thi_tot_nghiep,idmonthi';
                $rules['diem_thi.*.diem_thi'] = 'nullable|numeric|min:0|max:10';
                $rules['diem_thi.*.mien_thi'] = 'nullable|boolean';
            }

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                \Log::error('saveDiemThiTotNghiep validation failed', [
                    'errors' => $validator->errors()->toArray(),
                    'request' => $request->all()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                    'debug' => [
                        'diem_thi_count' => is_array($request->diem_thi) ? count($request->diem_thi) : 'not_array',
                        'diem_thi' => $request->diem_thi,
                        'idnguoidung' => $request->idnguoidung,
                    ]
                ], 400);
            }

            $idnguoidung = $request->idnguoidung;
            $namThi = $request->nam_thi ?? 2025;
            $replaceAll = $request->replace_all ?? false;

            DB::beginTransaction();

            try {
                // Xóa điểm cũ nếu replace_all = true
                if ($replaceAll) {
                    DiemThiTotNghiep::where('idnguoidung', $idnguoidung)
                        ->where('nam_thi', $namThi)
                        ->delete();
                }

                // Lưu điểm mới (chỉ lưu nếu mảng không rỗng)
                if (!empty($request->diem_thi)) {
                    foreach ($request->diem_thi as $item) {
                        DiemThiTotNghiep::updateOrCreate(
                            [
                                'idnguoidung' => $idnguoidung,
                                'idmonthi' => $item['idmonthi'],
                                'nam_thi' => $namThi,
                            ],
                            [
                                'diem_thi' => $item['diem_thi'] ?? 0,
                                'mien_thi' => $item['mien_thi'] ?? false,
                            ]
                        );
                    }
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Lưu điểm thi tốt nghiệp thành công'
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lưu điểm thi tốt nghiệp: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy điểm môn học (lớp 10, 11, 12) của học sinh
     */
    public function getDiemMonHocTotNghiep(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idnguoidung' => 'required|exists:nguoidung,idnguoidung',
                'nam_hoc' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 400);
            }

            $query = DiemMonHocTotNghiep::with('monHoc')
                ->where('idnguoidung', $request->idnguoidung);

            if ($request->has('nam_hoc')) {
                $query->where('nam_hoc', $request->nam_hoc);
            }

            $data = $query->get();

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy điểm môn học: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lưu điểm môn học (lớp 10, 11, 12)
     */
    public function saveDiemMonHocTotNghiep(Request $request): JsonResponse
    {
        try {
            // Đảm bảo diem_mon_hoc luôn là array (có thể rỗng)
            // Xử lý trước khi validate để đảm bảo field luôn tồn tại
            if (!$request->has('diem_mon_hoc') || $request->diem_mon_hoc === null) {
                $request->merge(['diem_mon_hoc' => []]);
            } elseif (!is_array($request->diem_mon_hoc)) {
                // Nếu không phải array và không phải null, trả về lỗi
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ: diem_mon_hoc phải là mảng',
                    'errors' => ['diem_mon_hoc' => ['Trường diem_mon_hoc phải là mảng']]
                ], 400);
            }

            $rules = [
                'idnguoidung' => 'required|exists:nguoidung,idnguoidung',
                'diem_mon_hoc' => 'required|array',
                'replace_all' => 'nullable|boolean',
            ];

            // Chỉ validate các phần tử trong mảng nếu mảng không rỗng
            if (is_array($request->diem_mon_hoc) && count($request->diem_mon_hoc) > 0) {
                $rules['diem_mon_hoc.*.idmonhoc'] = 'required|exists:mon_hoc,idmonhoc';
                $rules['diem_mon_hoc.*.lop'] = 'required|integer|in:10,11,12';
                $rules['diem_mon_hoc.*.diem_trung_binh'] = 'required|numeric|min:0|max:10';
                $rules['diem_mon_hoc.*.nam_hoc'] = 'nullable|integer';
            }

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 400);
            }

            $idnguoidung = $request->idnguoidung;
            $replaceAll = $request->replace_all ?? false;

            DB::beginTransaction();

            try {
                // Xóa điểm cũ nếu replace_all = true
                if ($replaceAll) {
                    DiemMonHocTotNghiep::where('idnguoidung', $idnguoidung)->delete();
                }

                // Lưu điểm mới (chỉ lưu nếu mảng không rỗng)
                if (!empty($request->diem_mon_hoc)) {
                    foreach ($request->diem_mon_hoc as $item) {
                        DiemMonHocTotNghiep::updateOrCreate(
                            [
                                'idnguoidung' => $idnguoidung,
                                'idmonhoc' => $item['idmonhoc'],
                                'lop' => $item['lop'],
                                'nam_hoc' => $item['nam_hoc'] ?? null,
                            ],
                            [
                                'diem_trung_binh' => $item['diem_trung_binh'],
                            ]
                        );
                    }
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Lưu điểm môn học thành công'
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lưu điểm môn học: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy điểm khuyến khích của học sinh
     */
    public function getDiemKhuyenKhich(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idnguoidung' => 'required|exists:nguoidung,idnguoidung',
                'nam_ap_dung' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 400);
            }

            $query = DiemKhuyenKhich::where('idnguoidung', $request->idnguoidung);

            if ($request->has('nam_ap_dung')) {
                $query->where('nam_ap_dung', $request->nam_ap_dung);
            } else {
                $query->where('nam_ap_dung', 2025);
            }

            $data = $query->get();

            // Tính tổng điểm khuyến khích
            $tongDiem = $data->sum('diem_kk');

            return response()->json([
                'success' => true,
                'data' => $data,
                'tong_diem_kk' => round($tongDiem, 2)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy điểm khuyến khích: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lưu điểm khuyến khích
     */
    public function saveDiemKhuyenKhich(Request $request): JsonResponse
    {
        try {
            // Log dữ liệu nhận được để debug (trước khi xử lý)
            \Log::info('saveDiemKhuyenKhich request RAW', [
                'all_request' => $request->all(),
                'has_diem_khuyen_khich' => $request->has('diem_khuyen_khich'),
                'diem_khuyen_khich_raw' => $request->input('diem_khuyen_khich'),
                'diem_khuyen_khich_type' => gettype($request->input('diem_khuyen_khich')),
            ]);

            // Đảm bảo diem_khuyen_khich luôn là array (có thể rỗng)
            // Xử lý trước khi validate để đảm bảo field luôn tồn tại
            $diemKhuyenKhich = $request->input('diem_khuyen_khich');
            
            if ($diemKhuyenKhich === null || $diemKhuyenKhich === '' || !is_array($diemKhuyenKhich)) {
                // Nếu null, rỗng, hoặc không phải array, set thành mảng rỗng
                $diemKhuyenKhich = [];
            }
            
            // Đảm bảo field luôn có trong request bằng cách merge
            $request->merge(['diem_khuyen_khich' => $diemKhuyenKhich]);

            // Log dữ liệu sau khi xử lý
            \Log::info('saveDiemKhuyenKhich request PROCESSED', [
                'idnguoidung' => $request->idnguoidung,
                'diem_khuyen_khich' => $request->diem_khuyen_khich,
                'diem_khuyen_khich_type' => gettype($request->diem_khuyen_khich),
                'diem_khuyen_khich_is_array' => is_array($request->diem_khuyen_khich),
                'diem_khuyen_khich_count' => is_array($request->diem_khuyen_khich) ? count($request->diem_khuyen_khich) : 'not_array',
                'request_all' => $request->all(),
                'nam_ap_dung' => $request->nam_ap_dung,
                'replace_all' => $request->replace_all,
            ]);

            // Validation rules - diem_khuyen_khich có thể là mảng rỗng
            $rules = [
                'idnguoidung' => 'required|exists:nguoidung,idnguoidung',
                'diem_khuyen_khich' => 'present|array', // 'present' thay vì 'required' để cho phép mảng rỗng
                'nam_ap_dung' => 'nullable|integer',
                'replace_all' => 'nullable|boolean',
            ];

            // Chỉ validate các phần tử trong mảng nếu mảng không rỗng
            if (is_array($request->diem_khuyen_khich) && count($request->diem_khuyen_khich) > 0) {
                $rules['diem_khuyen_khich.*.loai_kk'] = 'nullable|string|max:100';
                $rules['diem_khuyen_khich.*.diem_kk'] = 'required|numeric|min:0|max:2'; // Điểm khuyến khích tối đa 2
                $rules['diem_khuyen_khich.*.mo_ta'] = 'nullable|string';
            }

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 400);
            }

            $idnguoidung = $request->idnguoidung;
            $namApDung = $request->nam_ap_dung ?? 2025;
            $replaceAll = $request->replace_all ?? false;

            DB::beginTransaction();

            try {
                // Xóa điểm cũ nếu replace_all = true
                if ($replaceAll) {
                    DiemKhuyenKhich::where('idnguoidung', $idnguoidung)
                        ->where('nam_ap_dung', $namApDung)
                        ->delete();
                }

                // Lưu điểm mới (chỉ lưu nếu mảng không rỗng)
                if (!empty($request->diem_khuyen_khich)) {
                    foreach ($request->diem_khuyen_khich as $item) {
                        DiemKhuyenKhich::create([
                            'idnguoidung' => $idnguoidung,
                            'loai_kk' => $item['loai_kk'] ?? null,
                            'diem_kk' => $item['diem_kk'],
                            'mo_ta' => $item['mo_ta'] ?? null,
                            'nam_ap_dung' => $namApDung,
                        ]);
                    }
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Lưu điểm khuyến khích thành công'
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lưu điểm khuyến khích: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tính điểm tốt nghiệp THPT
     */
    public function tinhDiemTotNghiep(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idnguoidung' => 'required|exists:nguoidung,idnguoidung',
                'mien_thi_ngoai_ngu' => 'nullable|boolean',
                'diem_uu_tien' => 'nullable|numeric|min:0|max:10',
                'nam_thi' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 400);
            }

            $idnguoidung = $request->idnguoidung;
            $mienThiNgoaiNgu = $request->mien_thi_ngoai_ngu ?? false;
            $diemUuTien = $request->diem_uu_tien ?? 0;
            $namThi = $request->nam_thi ?? 2025;

            // Lấy điểm thi tốt nghiệp
            $diemThi = DiemThiTotNghiep::with('monThiTotNghiep')
                ->where('idnguoidung', $idnguoidung)
                ->where('nam_thi', $namThi)
                ->get();

            // Lấy điểm môn học (lớp 10, 11, 12)
            $diemMonHoc = DiemMonHocTotNghiep::where('idnguoidung', $idnguoidung)->get();

            // Lấy điểm khuyến khích
            $diemKK = DiemKhuyenKhich::where('idnguoidung', $idnguoidung)
                ->where('nam_ap_dung', $namThi)
                ->sum('diem_kk');

            // Tính điểm thi
            $tongDiemThi = 0;
            $soMonThi = 0;
            $chiTietDiemThi = [];

            foreach ($diemThi as $item) {
                // Bỏ qua môn ngoại ngữ nếu miễn thi
                if ($mienThiNgoaiNgu && $item->monThiTotNghiep->ma_mon_thi === 'NGOAI_NGU') {
                    continue;
                }

                if (!$item->mien_thi && $item->diem_thi > 0) {
                    $tongDiemThi += $item->diem_thi;
                    $soMonThi++;
                    $chiTietDiemThi[] = [
                        'idmonthi' => $item->idmonthi,
                        'diem_thi' => $item->diem_thi,
                        'mien_thi' => false,
                    ];
                }
            }

            // Tính ĐTB các năm học
            $diemTBLop10 = $this->tinhDTBTheoLop($diemMonHoc, 10);
            $diemTBLop11 = $this->tinhDTBTheoLop($diemMonHoc, 11);
            $diemTBLop12 = $this->tinhDTBTheoLop($diemMonHoc, 12);

            // Áp dụng công thức: ĐTB = ((Lớp 10)x1 + (Lớp 11)x2 + (Lớp 12)x3) / 6
            $dtbCacNamHoc = (($diemTBLop10 * 1) + ($diemTBLop11 * 2) + ($diemTBLop12 * 3)) / 6;

            // Tính điểm xét tốt nghiệp
            $tongDiemXetTotNghiep = 0;
            $congThucApDung = 'THUONG';

            if ($mienThiNgoaiNgu) {
                // Công thức miễn thi ngoại ngữ: DXTN = ((Tổng điểm 3 môn thi + Tổng điểm KK) / 3 + ĐTB các năm học + Điểm ƯT) / 2
                $tongDiemThiVaKK = $tongDiemThi + $diemKK;
                $tongDiemXetTotNghiep = (($tongDiemThiVaKK / 3) + $dtbCacNamHoc + $diemUuTien) / 2;
                $congThucApDung = 'MIEN_THI_NN';
            } else {
                // Công thức thông thường: DXTN = ((Tổng điểm 4 môn thi + Tổng điểm KK) / 4 + ĐTB các năm học + Điểm ƯT) / 2
                $tongDiemThiVaKK = $tongDiemThi + $diemKK;
                $tongDiemXetTotNghiep = (($tongDiemThiVaKK / 4) + $dtbCacNamHoc + $diemUuTien) / 2;
            }

            // Làm tròn đến 2 chữ số thập phân
            $tongDiemXetTotNghiep = round($tongDiemXetTotNghiep, 2);
            $dtbCacNamHoc = round($dtbCacNamHoc, 2);
            $tongDiemThi = round($tongDiemThi, 2);
            $diemKK = round($diemKK, 2);

            // Lưu kết quả vào database
            DB::beginTransaction();
            try {
                $ketQua = KetQuaTinhDiemTotNghiep::updateOrCreate(
                    [
                        'idnguoidung' => $idnguoidung,
                        'nam_thi' => $namThi,
                    ],
                    [
                        'mien_thi_ngoai_ngu' => $mienThiNgoaiNgu,
                        'tong_diem_4_mon_thi' => $tongDiemThi,
                        'tong_diem_kk' => $diemKK,
                        'diem_tb_lop_10' => round($diemTBLop10, 2),
                        'diem_tb_lop_11' => round($diemTBLop11, 2),
                        'diem_tb_lop_12' => round($diemTBLop12, 2),
                        'dtb_cac_nam_hoc' => $dtbCacNamHoc,
                        'diem_uu_tien' => $diemUuTien,
                        'tong_diem_xet_tot_nghiep' => $tongDiemXetTotNghiep,
                        'cong_thuc_ap_dung' => $congThucApDung,
                    ]
                );

                // Lưu chi tiết điểm thi
                ChiTietDiemThiTotNghiep::where('idketqua', $ketQua->idketqua)->delete();
                foreach ($chiTietDiemThi as $chiTiet) {
                    ChiTietDiemThiTotNghiep::create([
                        'idketqua' => $ketQua->idketqua,
                        'idmonthi' => $chiTiet['idmonthi'],
                        'diem_thi' => $chiTiet['diem_thi'],
                        'mien_thi' => $chiTiet['mien_thi'],
                    ]);
                }

                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'tong_diem_xet_tot_nghiep' => $tongDiemXetTotNghiep,
                    'tong_diem_4_mon_thi' => $tongDiemThi,
                    'tong_diem_kk' => $diemKK,
                    'diem_tb_lop_10' => round($diemTBLop10, 2),
                    'diem_tb_lop_11' => round($diemTBLop11, 2),
                    'diem_tb_lop_12' => round($diemTBLop12, 2),
                    'dtb_cac_nam_hoc' => $dtbCacNamHoc,
                    'diem_uu_tien' => $diemUuTien,
                    'mien_thi_ngoai_ngu' => $mienThiNgoaiNgu,
                    'cong_thuc_ap_dung' => $congThucApDung,
                    'chi_tiet_diem_thi' => $chiTietDiemThi,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tính điểm tốt nghiệp: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy kết quả tính điểm tốt nghiệp đã lưu
     */
    public function getKetQuaTinhDiemTotNghiep(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idnguoidung' => 'required|exists:nguoidung,idnguoidung',
                'nam_thi' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 400);
            }

            $query = KetQuaTinhDiemTotNghiep::with('chiTietDiemThi.monThiTotNghiep')
                ->where('idnguoidung', $request->idnguoidung);

            if ($request->has('nam_thi')) {
                $query->where('nam_thi', $request->nam_thi);
            } else {
                $query->where('nam_thi', 2025);
            }

            $data = $query->orderBy('created_at', 'desc')->first();

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
     * Tính ĐTB theo lớp
     */
    private function tinhDTBTheoLop($diemMonHoc, $lop)
    {
        $diemLop = $diemMonHoc->where('lop', $lop);
        if ($diemLop->count() === 0) {
            return 0;
        }
        return $diemLop->avg('diem_trung_binh') ?? 0;
    }
}

