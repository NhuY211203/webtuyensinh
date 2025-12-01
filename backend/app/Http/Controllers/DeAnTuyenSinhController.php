<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\DeAnTuyenSinh;
use App\Models\PhuongThucTuyenSinhChiTiet;
use App\Models\BangQuyDoiDiemNgoaiNgu;
use App\Models\NganhTheoPhuongThuc;
use App\Models\XetTuyenThang;
use App\Models\HoSoXetTuyen;
use App\Models\QuyDinhDiemUuTienDeAn;
use App\Models\ThongTinBoSungPhuongThuc;
use App\Models\FileDeAnTuyenSinh;
use App\Models\GioiThieuTruong;

class DeAnTuyenSinhController extends Controller
{
    // ============================================
    // DE AN TUYEN SINH
    // ============================================

    /**
     * Lấy danh sách đề án tuyển sinh
     */
    public function getDeAnTuyenSinh(Request $request): JsonResponse
    {
        try {
            $query = DeAnTuyenSinh::with(['truong'])
                ->withCount('phuongThucChiTiet');

            if ($request->filled('idtruong')) {
                $query->where('idtruong', $request->integer('idtruong'));
            }

            if ($request->filled('nam_tuyen_sinh')) {
                $query->where('nam_tuyen_sinh', $request->integer('nam_tuyen_sinh'));
            }

            if ($request->filled('trang_thai')) {
                $query->where('trang_thai', $request->integer('trang_thai'));
            }

            if ($request->filled('keyword')) {
                $keyword = '%' . $request->string('keyword')->trim() . '%';
                $query->where(function($q) use ($keyword) {
                    $q->where('tieu_de', 'like', $keyword)
                      ->orWhere('thong_tin_tom_tat', 'like', $keyword);
                });
            }

            $perPage = $request->integer('per_page', 20);
            $items = $query->orderBy('nam_tuyen_sinh', 'desc')
                          ->orderBy('created_at', 'desc')
                          ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $items->items(),
                'pagination' => [
                    'current_page' => $items->currentPage(),
                    'per_page' => $items->perPage(),
                    'total' => $items->total(),
                    'last_page' => $items->lastPage(),
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting de an tuyen sinh: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách đề án tuyển sinh',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy chi tiết đề án tuyển sinh
     */
    public function getDeAnTuyenSinhDetail($id): JsonResponse
    {
        try {
            $deAn = DeAnTuyenSinh::with([
                'truong',
                'phuongThucChiTiet' => function($q) {
                    $q->with([
                        'bangQuyDoi' => function($sub) {
                            $sub->orderBy('thu_tu');
                        },
                        'nganhTheoPhuongThuc.nganhTruong',
                        'xetTuyenThang' => function($sub) {
                            $sub->orderBy('thu_tu');
                        },
                        'hoSoXetTuyen' => function($sub) {
                            $sub->orderBy('thu_tu');
                        },
                        'quyDinhDiemUuTien',
                        'thongTinBoSung' => function($sub) {
                            $sub->orderBy('thu_tu');
                        },
                    ])->orderBy('thu_tu_hien_thi');
                },
                'files'
            ])->find($id);

            if (!$deAn) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy đề án tuyển sinh',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $deAn,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting de an tuyen sinh detail: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy chi tiết đề án tuyển sinh',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tạo đề án tuyển sinh mới
     */
    public function createDeAnTuyenSinh(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idtruong' => 'required|integer|exists:truongdaihoc,idtruong',
                'nam_tuyen_sinh' => 'required|integer|min:2020|max:2100',
                'tieu_de' => 'required|string|max:500',
                'thong_tin_tom_tat' => 'nullable|string',
                'thong_tin_day_du' => 'nullable|string',
                'file_pdf_url' => 'nullable|string|max:500',
                'trang_thai' => 'nullable|integer|in:0,1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            // Kiểm tra đề án đã tồn tại chưa
            $existing = DeAnTuyenSinh::where('idtruong', $request->idtruong)
                                     ->where('nam_tuyen_sinh', $request->nam_tuyen_sinh)
                                     ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Đề án tuyển sinh cho trường này trong năm này đã tồn tại',
                ], 400);
            }

            $deAn = DeAnTuyenSinh::create($request->only([
                'idtruong',
                'nam_tuyen_sinh',
                'tieu_de',
                'thong_tin_tom_tat',
                'thong_tin_day_du',
                'file_pdf_url',
                'trang_thai',
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Tạo đề án tuyển sinh thành công',
                'data' => $deAn,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error creating de an tuyen sinh: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tạo đề án tuyển sinh',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật đề án tuyển sinh
     */
    public function updateDeAnTuyenSinh(Request $request, $id): JsonResponse
    {
        try {
            $deAn = DeAnTuyenSinh::find($id);

            if (!$deAn) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy đề án tuyển sinh',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'idtruong' => 'nullable|integer|exists:truongdaihoc,idtruong',
                'nam_tuyen_sinh' => 'nullable|integer|min:2020|max:2100',
                'tieu_de' => 'nullable|string|max:500',
                'thong_tin_tom_tat' => 'nullable|string',
                'thong_tin_day_du' => 'nullable|string',
                'file_pdf_url' => 'nullable|string|max:500',
                'trang_thai' => 'nullable|integer|in:0,1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            // Kiểm tra trùng lặp nếu thay đổi idtruong hoặc nam_tuyen_sinh
            if ($request->filled('idtruong') || $request->filled('nam_tuyen_sinh')) {
                $idtruong = $request->idtruong ?? $deAn->idtruong;
                $nam = $request->nam_tuyen_sinh ?? $deAn->nam_tuyen_sinh;
                
                $existing = DeAnTuyenSinh::where('idtruong', $idtruong)
                                         ->where('nam_tuyen_sinh', $nam)
                                         ->where('idde_an', '!=', $id)
                                         ->first();

                if ($existing) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Đề án tuyển sinh cho trường này trong năm này đã tồn tại',
                    ], 400);
                }
            }

            $deAn->update($request->only([
                'idtruong',
                'nam_tuyen_sinh',
                'tieu_de',
                'thong_tin_tom_tat',
                'thong_tin_day_du',
                'file_pdf_url',
                'trang_thai',
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật đề án tuyển sinh thành công',
                'data' => $deAn,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating de an tuyen sinh: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật đề án tuyển sinh',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa đề án tuyển sinh
     */
    public function deleteDeAnTuyenSinh($id): JsonResponse
    {
        try {
            $deAn = DeAnTuyenSinh::find($id);

            if (!$deAn) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy đề án tuyển sinh',
                ], 404);
            }

            $deAn->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xóa đề án tuyển sinh thành công',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting de an tuyen sinh: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xóa đề án tuyển sinh',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // PHUONG THUC TUYEN SINH CHI TIET
    // ============================================

    /**
     * Lấy danh sách phương thức tuyển sinh chi tiết
     */
    public function getPhuongThucChiTiet(Request $request): JsonResponse
    {
        try {
            $query = PhuongThucTuyenSinhChiTiet::with(['deAn']);

            if ($request->filled('idde_an')) {
                $query->where('idde_an', $request->integer('idde_an'));
            }

            if ($request->filled('ma_phuong_thuc')) {
                $query->where('ma_phuong_thuc', $request->string('ma_phuong_thuc'));
            }

            if ($request->filled('trang_thai')) {
                $query->where('trang_thai', $request->integer('trang_thai'));
            }

            $items = $query->orderBy('thu_tu_hien_thi')
                          ->orderBy('created_at', 'desc')
                          ->get();

            return response()->json([
                'success' => true,
                'data' => $items,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting phuong thuc chi tiet: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách phương thức tuyển sinh',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy chi tiết phương thức tuyển sinh
     */
    public function getPhuongThucChiTietDetail($id): JsonResponse
    {
        try {
            $phuongThuc = PhuongThucTuyenSinhChiTiet::with([
                'deAn',
                'bangQuyDoi' => function($q) {
                    $q->orderBy('thu_tu');
                },
                'nganhTheoPhuongThuc.nganhTruong',
                'xetTuyenThang' => function($q) {
                    $q->orderBy('thu_tu');
                },
                'hoSoXetTuyen' => function($q) {
                    $q->orderBy('thu_tu');
                },
                'quyDinhDiemUuTien',
                'thongTinBoSung' => function($q) {
                    $q->orderBy('thu_tu');
                },
            ])->find($id);

            if (!$phuongThuc) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy phương thức tuyển sinh',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $phuongThuc,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting phuong thuc chi tiet detail: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy chi tiết phương thức tuyển sinh',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tạo phương thức tuyển sinh mới
     */
    public function createPhuongThucChiTiet(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idde_an' => 'required|integer|exists:de_an_tuyen_sinh,idde_an',
                'ma_phuong_thuc' => 'required|string|max:50',
                'ten_phuong_thuc' => 'required|string|max:200',
                'thu_tu_hien_thi' => 'nullable|integer',
                'doi_tuong' => 'nullable|string',
                'dieu_kien_xet_tuyen' => 'nullable|string',
                'cong_thuc_tinh_diem' => 'nullable|string',
                'mo_ta_quy_che' => 'nullable|string',
                'thoi_gian_bat_dau' => 'nullable|date',
                'thoi_gian_ket_thuc' => 'nullable|date|after_or_equal:thoi_gian_bat_dau',
                'ghi_chu' => 'nullable|string',
                'trang_thai' => 'nullable|integer|in:0,1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $phuongThuc = PhuongThucTuyenSinhChiTiet::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Tạo phương thức tuyển sinh thành công',
                'data' => $phuongThuc,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error creating phuong thuc chi tiet: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tạo phương thức tuyển sinh',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật phương thức tuyển sinh
     */
    public function updatePhuongThucChiTiet(Request $request, $id): JsonResponse
    {
        try {
            $phuongThuc = PhuongThucTuyenSinhChiTiet::find($id);

            if (!$phuongThuc) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy phương thức tuyển sinh',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'idde_an' => 'nullable|integer|exists:de_an_tuyen_sinh,idde_an',
                'ma_phuong_thuc' => 'nullable|string|max:50',
                'ten_phuong_thuc' => 'nullable|string|max:200',
                'thu_tu_hien_thi' => 'nullable|integer',
                'doi_tuong' => 'nullable|string',
                'dieu_kien_xet_tuyen' => 'nullable|string',
                'cong_thuc_tinh_diem' => 'nullable|string',
                'mo_ta_quy_che' => 'nullable|string',
                'thoi_gian_bat_dau' => 'nullable|date',
                'thoi_gian_ket_thuc' => 'nullable|date|after_or_equal:thoi_gian_bat_dau',
                'ghi_chu' => 'nullable|string',
                'trang_thai' => 'nullable|integer|in:0,1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $phuongThuc->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật phương thức tuyển sinh thành công',
                'data' => $phuongThuc,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating phuong thuc chi tiet: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật phương thức tuyển sinh',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa phương thức tuyển sinh
     */
    public function deletePhuongThucChiTiet($id): JsonResponse
    {
        try {
            $phuongThuc = PhuongThucTuyenSinhChiTiet::find($id);

            if (!$phuongThuc) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy phương thức tuyển sinh',
                ], 404);
            }

            $phuongThuc->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xóa phương thức tuyển sinh thành công',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting phuong thuc chi tiet: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xóa phương thức tuyển sinh',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // BANG QUY DOI DIEM NGOAI NGU
    // ============================================

    /**
     * Lấy danh sách bảng quy đổi điểm ngoại ngữ
     */
    public function getBangQuyDoiDiemNgoaiNgu(Request $request): JsonResponse
    {
        try {
            $query = BangQuyDoiDiemNgoaiNgu::with(['phuongThucChiTiet']);

            if ($request->filled('idphuong_thuc_chi_tiet')) {
                $query->where('idphuong_thuc_chi_tiet', $request->integer('idphuong_thuc_chi_tiet'));
            }

            if ($request->filled('loai_chung_chi')) {
                $query->where('loai_chung_chi', $request->string('loai_chung_chi'));
            }

            $items = $query->orderBy('thu_tu')
                          ->orderBy('diem_quy_doi', 'desc')
                          ->get();

            return response()->json([
                'success' => true,
                'data' => $items,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting bang quy doi diem ngoai ngu: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách bảng quy đổi điểm ngoại ngữ',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tạo bảng quy đổi điểm ngoại ngữ mới
     */
    public function createBangQuyDoiDiemNgoaiNgu(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idphuong_thuc_chi_tiet' => 'required|integer|exists:phuong_thuc_tuyen_sinh_chi_tiet,idphuong_thuc_chi_tiet',
                'loai_chung_chi' => 'required|string|max:50|in:IELTS,TOEFL_iBT,TOEIC',
                'ielts_min' => 'nullable|numeric|min:0|max:9',
                'ielts_max' => 'nullable|numeric|min:0|max:9',
                'toefl_min' => 'nullable|integer|min:0|max:120',
                'toefl_max' => 'nullable|integer|min:0|max:120',
                'toeic_lr_min' => 'nullable|integer|min:0|max:990',
                'toeic_lr_max' => 'nullable|integer|min:0|max:990',
                'toeic_s_min' => 'nullable|integer|min:0|max:200',
                'toeic_s_max' => 'nullable|integer|min:0|max:200',
                'toeic_w_min' => 'nullable|integer|min:0|max:200',
                'toeic_w_max' => 'nullable|integer|min:0|max:200',
                'diem_quy_doi' => 'required|numeric|min:0|max:10',
                'thu_tu' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $bangQuyDoi = BangQuyDoiDiemNgoaiNgu::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Tạo bảng quy đổi điểm ngoại ngữ thành công',
                'data' => $bangQuyDoi,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error creating bang quy doi diem ngoai ngu: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tạo bảng quy đổi điểm ngoại ngữ',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật bảng quy đổi điểm ngoại ngữ
     */
    public function updateBangQuyDoiDiemNgoaiNgu(Request $request, $id): JsonResponse
    {
        try {
            $bangQuyDoi = BangQuyDoiDiemNgoaiNgu::find($id);

            if (!$bangQuyDoi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy bảng quy đổi điểm ngoại ngữ',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'idphuong_thuc_chi_tiet' => 'nullable|integer|exists:phuong_thuc_tuyen_sinh_chi_tiet,idphuong_thuc_chi_tiet',
                'loai_chung_chi' => 'nullable|string|max:50|in:IELTS,TOEFL_iBT,TOEIC',
                'ielts_min' => 'nullable|numeric|min:0|max:9',
                'ielts_max' => 'nullable|numeric|min:0|max:9',
                'toefl_min' => 'nullable|integer|min:0|max:120',
                'toefl_max' => 'nullable|integer|min:0|max:120',
                'toeic_lr_min' => 'nullable|integer|min:0|max:990',
                'toeic_lr_max' => 'nullable|integer|min:0|max:990',
                'toeic_s_min' => 'nullable|integer|min:0|max:200',
                'toeic_s_max' => 'nullable|integer|min:0|max:200',
                'toeic_w_min' => 'nullable|integer|min:0|max:200',
                'toeic_w_max' => 'nullable|integer|min:0|max:200',
                'diem_quy_doi' => 'nullable|numeric|min:0|max:10',
                'thu_tu' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $bangQuyDoi->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật bảng quy đổi điểm ngoại ngữ thành công',
                'data' => $bangQuyDoi,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating bang quy doi diem ngoai ngu: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật bảng quy đổi điểm ngoại ngữ',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa bảng quy đổi điểm ngoại ngữ
     */
    public function deleteBangQuyDoiDiemNgoaiNgu($id): JsonResponse
    {
        try {
            $bangQuyDoi = BangQuyDoiDiemNgoaiNgu::find($id);

            if (!$bangQuyDoi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy bảng quy đổi điểm ngoại ngữ',
                ], 404);
            }

            $bangQuyDoi->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xóa bảng quy đổi điểm ngoại ngữ thành công',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting bang quy doi diem ngoai ngu: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xóa bảng quy đổi điểm ngoại ngữ',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // NGANH THEO PHUONG THUC
    // ============================================

    /**
     * Lấy danh sách ngành theo phương thức
     */
    public function getNganhTheoPhuongThuc(Request $request): JsonResponse
    {
        try {
            $query = NganhTheoPhuongThuc::with(['phuongThucChiTiet', 'nganhTruong']);

            if ($request->filled('idphuong_thuc_chi_tiet')) {
                $query->where('idphuong_thuc_chi_tiet', $request->integer('idphuong_thuc_chi_tiet'));
            }

            if ($request->filled('idnganhtruong')) {
                $query->where('idnganhtruong', $request->integer('idnganhtruong'));
            }

            if ($request->filled('loai_nganh')) {
                $query->where('loai_nganh', $request->string('loai_nganh'));
            }

            $items = $query->orderBy('thu_tu')
                          ->orderBy('created_at', 'desc')
                          ->get();

            return response()->json([
                'success' => true,
                'data' => $items,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting nganh theo phuong thuc: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách ngành theo phương thức',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tạo ngành theo phương thức mới
     */
    public function createNganhTheoPhuongThuc(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idphuong_thuc_chi_tiet' => 'required|integer|exists:phuong_thuc_tuyen_sinh_chi_tiet,idphuong_thuc_chi_tiet',
                'idnganhtruong' => 'required|integer|exists:nganh_truong,idnganhtruong',
                'to_hop_mon' => 'nullable|string|max:100',
                'ghi_chu' => 'nullable|string|max:500',
                'loai_nganh' => 'nullable|string|max:50|in:NGANH_MOI,NGANH_VIET,NGANH_QUOC_TE',
                'thu_tu' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            // Kiểm tra trùng lặp
            $existing = NganhTheoPhuongThuc::where('idphuong_thuc_chi_tiet', $request->idphuong_thuc_chi_tiet)
                                          ->where('idnganhtruong', $request->idnganhtruong)
                                          ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ngành này đã được thêm vào phương thức này',
                ], 400);
            }

            $nganh = NganhTheoPhuongThuc::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Thêm ngành vào phương thức thành công',
                'data' => $nganh,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error creating nganh theo phuong thuc: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi thêm ngành vào phương thức',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật ngành theo phương thức
     */
    public function updateNganhTheoPhuongThuc(Request $request, $id): JsonResponse
    {
        try {
            $nganh = NganhTheoPhuongThuc::find($id);

            if (!$nganh) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy ngành theo phương thức',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'idphuong_thuc_chi_tiet' => 'nullable|integer|exists:phuong_thuc_tuyen_sinh_chi_tiet,idphuong_thuc_chi_tiet',
                'idnganhtruong' => 'nullable|integer|exists:nganh_truong,idnganhtruong',
                'to_hop_mon' => 'nullable|string|max:100',
                'ghi_chu' => 'nullable|string|max:500',
                'loai_nganh' => 'nullable|string|max:50|in:NGANH_MOI,NGANH_VIET,NGANH_QUOC_TE',
                'thu_tu' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            // Kiểm tra trùng lặp nếu thay đổi
            if ($request->filled('idphuong_thuc_chi_tiet') || $request->filled('idnganhtruong')) {
                $idphuong_thuc = $request->idphuong_thuc_chi_tiet ?? $nganh->idphuong_thuc_chi_tiet;
                $idnganhtruong = $request->idnganhtruong ?? $nganh->idnganhtruong;
                
                $existing = NganhTheoPhuongThuc::where('idphuong_thuc_chi_tiet', $idphuong_thuc)
                                              ->where('idnganhtruong', $idnganhtruong)
                                              ->where('idnganh_phuong_thuc', '!=', $id)
                                              ->first();

                if ($existing) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ngành này đã được thêm vào phương thức này',
                    ], 400);
                }
            }

            $nganh->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật ngành theo phương thức thành công',
                'data' => $nganh,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating nganh theo phuong thuc: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật ngành theo phương thức',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa ngành theo phương thức
     */
    public function deleteNganhTheoPhuongThuc($id): JsonResponse
    {
        try {
            $nganh = NganhTheoPhuongThuc::find($id);

            if (!$nganh) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy ngành theo phương thức',
                ], 404);
            }

            $nganh->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xóa ngành theo phương thức thành công',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting nganh theo phuong thuc: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xóa ngành theo phương thức',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // XET TUYEN THANG
    // ============================================

    /**
     * Lấy danh sách xét tuyển thẳng
     */
    public function getXetTuyenThang(Request $request): JsonResponse
    {
        try {
            $query = XetTuyenThang::with(['phuongThucChiTiet']);

            if ($request->filled('idphuong_thuc_chi_tiet')) {
                $query->where('idphuong_thuc_chi_tiet', $request->integer('idphuong_thuc_chi_tiet'));
            }

            if ($request->filled('linh_vuc')) {
                $keyword = '%' . $request->string('linh_vuc')->trim() . '%';
                $query->where('linh_vuc', 'like', $keyword);
            }

            $items = $query->orderBy('thu_tu')
                          ->orderBy('created_at', 'desc')
                          ->get();

            return response()->json([
                'success' => true,
                'data' => $items,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting xet tuyen thang: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách xét tuyển thẳng',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tạo xét tuyển thẳng mới
     */
    public function createXetTuyenThang(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idphuong_thuc_chi_tiet' => 'required|integer|exists:phuong_thuc_tuyen_sinh_chi_tiet,idphuong_thuc_chi_tiet',
                'linh_vuc' => 'required|string|max:200',
                'linh_vuc_chuyen_sau' => 'nullable|string',
                'danh_sach_nganh' => 'nullable|string',
                'ghi_chu' => 'nullable|string|max:500',
                'thu_tu' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $xetTuyenThang = XetTuyenThang::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Tạo xét tuyển thẳng thành công',
                'data' => $xetTuyenThang,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error creating xet tuyen thang: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tạo xét tuyển thẳng',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật xét tuyển thẳng
     */
    public function updateXetTuyenThang(Request $request, $id): JsonResponse
    {
        try {
            $xetTuyenThang = XetTuyenThang::find($id);

            if (!$xetTuyenThang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy xét tuyển thẳng',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'idphuong_thuc_chi_tiet' => 'nullable|integer|exists:phuong_thuc_tuyen_sinh_chi_tiet,idphuong_thuc_chi_tiet',
                'linh_vuc' => 'nullable|string|max:200',
                'linh_vuc_chuyen_sau' => 'nullable|string',
                'danh_sach_nganh' => 'nullable|string',
                'ghi_chu' => 'nullable|string|max:500',
                'thu_tu' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $xetTuyenThang->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật xét tuyển thẳng thành công',
                'data' => $xetTuyenThang,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating xet tuyen thang: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật xét tuyển thẳng',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa xét tuyển thẳng
     */
    public function deleteXetTuyenThang($id): JsonResponse
    {
        try {
            $xetTuyenThang = XetTuyenThang::find($id);

            if (!$xetTuyenThang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy xét tuyển thẳng',
                ], 404);
            }

            $xetTuyenThang->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xóa xét tuyển thẳng thành công',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting xet tuyen thang: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xóa xét tuyển thẳng',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // HO SO XET TUYEN
    // ============================================

    /**
     * Lấy danh sách hồ sơ xét tuyển
     */
    public function getHoSoXetTuyen(Request $request): JsonResponse
    {
        try {
            $query = HoSoXetTuyen::with(['phuongThucChiTiet']);

            if ($request->filled('idphuong_thuc_chi_tiet')) {
                $query->where('idphuong_thuc_chi_tiet', $request->integer('idphuong_thuc_chi_tiet'));
            }

            if ($request->filled('loai_ho_so')) {
                $query->where('loai_ho_so', $request->string('loai_ho_so'));
            }

            $items = $query->orderBy('thu_tu')
                          ->orderBy('created_at', 'desc')
                          ->get();

            return response()->json([
                'success' => true,
                'data' => $items,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting ho so xet tuyen: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách hồ sơ xét tuyển',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tạo hồ sơ xét tuyển mới
     */
    public function createHoSoXetTuyen(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idphuong_thuc_chi_tiet' => 'required|integer|exists:phuong_thuc_tuyen_sinh_chi_tiet,idphuong_thuc_chi_tiet',
                'loai_ho_so' => 'required|string|max:50|in:CHUNG,THEO_DOI_TUONG,THEO_KHU_VUC',
                'noi_dung' => 'required|string',
                'thu_tu' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $hoSo = HoSoXetTuyen::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Tạo hồ sơ xét tuyển thành công',
                'data' => $hoSo,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error creating ho so xet tuyen: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tạo hồ sơ xét tuyển',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật hồ sơ xét tuyển
     */
    public function updateHoSoXetTuyen(Request $request, $id): JsonResponse
    {
        try {
            $hoSo = HoSoXetTuyen::find($id);

            if (!$hoSo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy hồ sơ xét tuyển',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'idphuong_thuc_chi_tiet' => 'nullable|integer|exists:phuong_thuc_tuyen_sinh_chi_tiet,idphuong_thuc_chi_tiet',
                'loai_ho_so' => 'nullable|string|max:50|in:CHUNG,THEO_DOI_TUONG,THEO_KHU_VUC',
                'noi_dung' => 'nullable|string',
                'thu_tu' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $hoSo->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật hồ sơ xét tuyển thành công',
                'data' => $hoSo,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating ho so xet tuyen: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật hồ sơ xét tuyển',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa hồ sơ xét tuyển
     */
    public function deleteHoSoXetTuyen($id): JsonResponse
    {
        try {
            $hoSo = HoSoXetTuyen::find($id);

            if (!$hoSo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy hồ sơ xét tuyển',
                ], 404);
            }

            $hoSo->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xóa hồ sơ xét tuyển thành công',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting ho so xet tuyen: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xóa hồ sơ xét tuyển',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // QUY DINH DIEM UU TIEN DE AN
    // ============================================

    /**
     * Lấy quy định điểm ưu tiên đề án
     */
    public function getQuyDinhDiemUuTienDeAn(Request $request): JsonResponse
    {
        try {
            $query = QuyDinhDiemUuTienDeAn::with(['phuongThucChiTiet']);

            if ($request->filled('idphuong_thuc_chi_tiet')) {
                $query->where('idphuong_thuc_chi_tiet', $request->integer('idphuong_thuc_chi_tiet'));
            }

            $items = $query->get();

            return response()->json([
                'success' => true,
                'data' => $items,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting quy dinh diem uu tien de an: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy quy định điểm ưu tiên đề án',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tạo quy định điểm ưu tiên đề án mới
     */
    public function createQuyDinhDiemUuTienDeAn(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idphuong_thuc_chi_tiet' => 'required|integer|exists:phuong_thuc_tuyen_sinh_chi_tiet,idphuong_thuc_chi_tiet',
                'nguong_diem' => 'nullable|numeric|min:0|max:30',
                'muc_diem_cong_cctaqt' => 'nullable|numeric|min:0|max:10',
                'cong_thuc_diem_uu_tien' => 'nullable|string',
                'mo_ta_quy_dinh' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            // Kiểm tra đã tồn tại chưa
            $existing = QuyDinhDiemUuTienDeAn::where('idphuong_thuc_chi_tiet', $request->idphuong_thuc_chi_tiet)->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quy định điểm ưu tiên cho phương thức này đã tồn tại',
                ], 400);
            }

            $quyDinh = QuyDinhDiemUuTienDeAn::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Tạo quy định điểm ưu tiên đề án thành công',
                'data' => $quyDinh,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error creating quy dinh diem uu tien de an: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tạo quy định điểm ưu tiên đề án',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật quy định điểm ưu tiên đề án
     */
    public function updateQuyDinhDiemUuTienDeAn(Request $request, $id): JsonResponse
    {
        try {
            $quyDinh = QuyDinhDiemUuTienDeAn::find($id);

            if (!$quyDinh) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy quy định điểm ưu tiên đề án',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'idphuong_thuc_chi_tiet' => 'nullable|integer|exists:phuong_thuc_tuyen_sinh_chi_tiet,idphuong_thuc_chi_tiet',
                'nguong_diem' => 'nullable|numeric|min:0|max:30',
                'muc_diem_cong_cctaqt' => 'nullable|numeric|min:0|max:10',
                'cong_thuc_diem_uu_tien' => 'nullable|string',
                'mo_ta_quy_dinh' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $quyDinh->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật quy định điểm ưu tiên đề án thành công',
                'data' => $quyDinh,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating quy dinh diem uu tien de an: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật quy định điểm ưu tiên đề án',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa quy định điểm ưu tiên đề án
     */
    public function deleteQuyDinhDiemUuTienDeAn($id): JsonResponse
    {
        try {
            $quyDinh = QuyDinhDiemUuTienDeAn::find($id);

            if (!$quyDinh) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy quy định điểm ưu tiên đề án',
                ], 404);
            }

            $quyDinh->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xóa quy định điểm ưu tiên đề án thành công',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting quy dinh diem uu tien de an: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xóa quy định điểm ưu tiên đề án',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // THONG TIN BO SUNG PHUONG THUC
    // ============================================

    /**
     * Lấy danh sách thông tin bổ sung phương thức
     */
    public function getThongTinBoSungPhuongThuc(Request $request): JsonResponse
    {
        try {
            $query = ThongTinBoSungPhuongThuc::with(['phuongThucChiTiet']);

            if ($request->filled('idphuong_thuc_chi_tiet')) {
                $query->where('idphuong_thuc_chi_tiet', $request->integer('idphuong_thuc_chi_tiet'));
            }

            if ($request->filled('loai_thong_tin')) {
                $query->where('loai_thong_tin', $request->string('loai_thong_tin'));
            }

            $items = $query->orderBy('thu_tu')
                          ->orderBy('created_at', 'desc')
                          ->get();

            return response()->json([
                'success' => true,
                'data' => $items,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting thong tin bo sung phuong thuc: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách thông tin bổ sung phương thức',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tạo thông tin bổ sung phương thức mới
     */
    public function createThongTinBoSungPhuongThuc(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idphuong_thuc_chi_tiet' => 'required|integer|exists:phuong_thuc_tuyen_sinh_chi_tiet,idphuong_thuc_chi_tiet',
                'loai_thong_tin' => 'required|string|max:50|in:SAT_CODE,ACT_CODE,DIEM_TOI_THIEU,THOI_HAN_CHUNG_CHI',
                'ten_thong_tin' => 'required|string|max:200',
                'noi_dung' => 'required|string',
                'thu_tu' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $thongTin = ThongTinBoSungPhuongThuc::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Tạo thông tin bổ sung phương thức thành công',
                'data' => $thongTin,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error creating thong tin bo sung phuong thuc: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tạo thông tin bổ sung phương thức',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật thông tin bổ sung phương thức
     */
    public function updateThongTinBoSungPhuongThuc(Request $request, $id): JsonResponse
    {
        try {
            $thongTin = ThongTinBoSungPhuongThuc::find($id);

            if (!$thongTin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông tin bổ sung phương thức',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'idphuong_thuc_chi_tiet' => 'nullable|integer|exists:phuong_thuc_tuyen_sinh_chi_tiet,idphuong_thuc_chi_tiet',
                'loai_thong_tin' => 'nullable|string|max:50|in:SAT_CODE,ACT_CODE,DIEM_TOI_THIEU,THOI_HAN_CHUNG_CHI',
                'ten_thong_tin' => 'nullable|string|max:200',
                'noi_dung' => 'nullable|string',
                'thu_tu' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $thongTin->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật thông tin bổ sung phương thức thành công',
                'data' => $thongTin,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating thong tin bo sung phuong thuc: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật thông tin bổ sung phương thức',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa thông tin bổ sung phương thức
     */
    public function deleteThongTinBoSungPhuongThuc($id): JsonResponse
    {
        try {
            $thongTin = ThongTinBoSungPhuongThuc::find($id);

            if (!$thongTin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông tin bổ sung phương thức',
                ], 404);
            }

            $thongTin->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xóa thông tin bổ sung phương thức thành công',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting thong tin bo sung phuong thuc: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xóa thông tin bổ sung phương thức',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // FILE DE AN TUYEN SINH
    // ============================================

    /**
     * Lấy danh sách file đề án tuyển sinh
     */
    public function getFileDeAnTuyenSinh(Request $request): JsonResponse
    {
        try {
            $query = FileDeAnTuyenSinh::with(['deAn']);

            if ($request->filled('idde_an')) {
                $query->where('idde_an', $request->integer('idde_an'));
            }

            if ($request->filled('loai_file')) {
                $query->where('loai_file', $request->string('loai_file'));
            }

            if ($request->filled('trang_thai')) {
                $query->where('trang_thai', $request->integer('trang_thai'));
            }

            $items = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $items,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting file de an tuyen sinh: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách file đề án tuyển sinh',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tạo file đề án tuyển sinh mới
     */
    public function createFileDeAnTuyenSinh(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idde_an' => 'required|integer|exists:de_an_tuyen_sinh,idde_an',
                'ten_file' => 'required|string|max:500',
                'duong_dan' => 'required|string|max:500',
                'loai_file' => 'nullable|string|max:50|in:PDF,DOC,DOCX',
                'kich_thuoc' => 'nullable|integer|min:0',
                'trang_thai' => 'nullable|integer|in:0,1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $file = FileDeAnTuyenSinh::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Tạo file đề án tuyển sinh thành công',
                'data' => $file,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error creating file de an tuyen sinh: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tạo file đề án tuyển sinh',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật file đề án tuyển sinh
     */
    public function updateFileDeAnTuyenSinh(Request $request, $id): JsonResponse
    {
        try {
            $file = FileDeAnTuyenSinh::find($id);

            if (!$file) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy file đề án tuyển sinh',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'idde_an' => 'nullable|integer|exists:de_an_tuyen_sinh,idde_an',
                'ten_file' => 'nullable|string|max:500',
                'duong_dan' => 'nullable|string|max:500',
                'loai_file' => 'nullable|string|max:50|in:PDF,DOC,DOCX',
                'kich_thuoc' => 'nullable|integer|min:0',
                'trang_thai' => 'nullable|integer|in:0,1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $file->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật file đề án tuyển sinh thành công',
                'data' => $file,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating file de an tuyen sinh: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật file đề án tuyển sinh',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa file đề án tuyển sinh
     */
    public function deleteFileDeAnTuyenSinh($id): JsonResponse
    {
        try {
            $file = FileDeAnTuyenSinh::find($id);

            if (!$file) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy file đề án tuyển sinh',
                ], 404);
            }

            $file->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xóa file đề án tuyển sinh thành công',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting file de an tuyen sinh: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xóa file đề án tuyển sinh',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // GIOI THIEU TRUONG
    // ============================================

    /**
     * Lấy giới thiệu trường
     */
    public function getGioiThieuTruong(Request $request): JsonResponse
    {
        try {
            $query = GioiThieuTruong::with(['truong']);

            if ($request->filled('idtruong')) {
                $query->where('idtruong', $request->integer('idtruong'));
            }

            $items = $query->get();

            return response()->json([
                'success' => true,
                'data' => $items,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting gioi thieu truong: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy giới thiệu trường',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy chi tiết giới thiệu trường
     */
    public function getGioiThieuTruongDetail($id): JsonResponse
    {
        try {
            $gioiThieu = GioiThieuTruong::with(['truong'])->find($id);

            if (!$gioiThieu) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy giới thiệu trường',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $gioiThieu,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting gioi thieu truong detail: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy chi tiết giới thiệu trường',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tạo giới thiệu trường mới
     */
    public function createGioiThieuTruong(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idtruong' => 'required|integer|exists:truongdaihoc,idtruong',
                'ten_tieng_anh' => 'nullable|string|max:200',
                'ma_truong' => 'nullable|string|max:20',
                'ten_viet_tat' => 'nullable|string|max:50',
                'dia_chi_day_du' => 'nullable|string',
                'website' => 'nullable|string|max:200|url',
                'lich_su' => 'nullable|string',
                'su_menh' => 'nullable|string',
                'thanh_tuu' => 'nullable|string',
                'quan_he_quoc_te' => 'nullable|string',
                'tam_nhin' => 'nullable|string',
                'anh_dai_dien' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            // Kiểm tra đã tồn tại chưa
            $existing = GioiThieuTruong::where('idtruong', $request->idtruong)->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Giới thiệu trường này đã tồn tại',
                ], 400);
            }

            $gioiThieu = GioiThieuTruong::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Tạo giới thiệu trường thành công',
                'data' => $gioiThieu,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error creating gioi thieu truong: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tạo giới thiệu trường',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật giới thiệu trường
     */
    public function updateGioiThieuTruong(Request $request, $id): JsonResponse
    {
        try {
            $gioiThieu = GioiThieuTruong::find($id);

            if (!$gioiThieu) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy giới thiệu trường',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'idtruong' => 'nullable|integer|exists:truongdaihoc,idtruong',
                'ten_tieng_anh' => 'nullable|string|max:200',
                'ma_truong' => 'nullable|string|max:20',
                'ten_viet_tat' => 'nullable|string|max:50',
                'dia_chi_day_du' => 'nullable|string',
                'website' => 'nullable|string|max:200|url',
                'lich_su' => 'nullable|string',
                'su_menh' => 'nullable|string',
                'thanh_tuu' => 'nullable|string',
                'quan_he_quoc_te' => 'nullable|string',
                'tam_nhin' => 'nullable|string',
                'anh_dai_dien' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $gioiThieu->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật giới thiệu trường thành công',
                'data' => $gioiThieu,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating gioi thieu truong: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật giới thiệu trường',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa giới thiệu trường
     */
    public function deleteGioiThieuTruong($id): JsonResponse
    {
        try {
            $gioiThieu = GioiThieuTruong::find($id);

            if (!$gioiThieu) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy giới thiệu trường',
                ], 404);
            }

            $gioiThieu->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xóa giới thiệu trường thành công',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting gioi thieu truong: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xóa giới thiệu trường',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

