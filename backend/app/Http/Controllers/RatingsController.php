<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\DanhGiaLichTuVan;
use App\Models\LichTuVan;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RatingsController extends Controller
{
    // GET /api/ratings/by-schedule?lichtuvan_id=ID
    public function showBySchedule(Request $request): JsonResponse
    {
        $scheduleId = (int) $request->query('lichtuvan_id');
        if (!$scheduleId) {
            return response()->json(['success' => false, 'message' => 'Thiếu lichtuvan_id'], 400);
        }

        $rating = DanhGiaLichTuVan::where('idlichtuvan', $scheduleId)->first();
        if (!$rating) {
            return response()->json(['success' => true, 'data' => null]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'iddanhgia' => $rating->iddanhgia,
                'idlichtuvan' => $rating->idlichtuvan,
                'idnguoidat' => $rating->idnguoidat,
                'diemdanhgia' => (float) $rating->diemdanhgia,
                'nhanxet' => $rating->nhanxet,
                'an_danh' => (int) ($rating->an_danh ?? 0),
                'trangthai' => (int) ($rating->trangthai ?? 1),
                'ngaydanhgia' => $rating->ngaydanhgia,
                'ngaycapnhat' => $rating->ngaycapnhat,
            ]
        ]);
    }

    // POST /api/ratings
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'idlichtuvan' => 'required|integer|exists:lichtuvan,idlichtuvan',
            'idnguoidat' => 'required|integer|exists:nguoidung,idnguoidung',
            'diemdanhgia' => 'required|numeric|min:1|max:5',
            'nhanxet' => 'nullable|string',
            'an_danh' => 'nullable|integer|in:0,1'
        ]);

        $scheduleId = $request->integer('idlichtuvan');
        $userId = $request->integer('idnguoidat');

        // Ensure this user is the booker of the schedule
        $schedule = LichTuVan::find($scheduleId);
        if (!$schedule || (int)$schedule->idnguoidat !== $userId) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền đánh giá lịch này'], 403);
        }

        // Only one rating per schedule
        $exists = DanhGiaLichTuVan::where('idlichtuvan', $scheduleId)->first();
        if ($exists) {
            return response()->json(['success' => false, 'message' => 'Lịch này đã được đánh giá'], 409);
        }

        $rating = DanhGiaLichTuVan::create([
            'idlichtuvan' => $scheduleId,
            'idnguoidat' => $userId,
            'diemdanhgia' => $request->input('diemdanhgia'),
            'nhanxet' => $request->input('nhanxet'),
            'an_danh' => $request->integer('an_danh', 0),
            'trangthai' => 1,
            'ngaydanhgia' => Carbon::now(),
            'ngaycapnhat' => Carbon::now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $rating
        ], 201);
    }

    // PUT /api/ratings/{id}
    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'diemdanhgia' => 'nullable|numeric|min:1|max:5',
            'nhanxet' => 'nullable|string',
            'an_danh' => 'nullable|integer|in:0,1',
            'trangthai' => 'nullable|integer|in:0,1'
        ]);

        $rating = DanhGiaLichTuVan::find($id);
        if (!$rating) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy đánh giá'], 404);
        }

        // Only owner can update content; staff may toggle visibility via trangthai
        $userId = (int) ($request->user()->idnguoidung ?? $request->input('idnguoidat'));
        $isVisibilityChangeOnly = $request->has('trangthai') && !$request->has('diemdanhgia') && !$request->has('nhanxet') && !$request->has('an_danh');
        if (!$isVisibilityChangeOnly && $userId && $rating->idnguoidat != $userId) {
            return response()->json(['success' => false, 'message' => 'Không có quyền sửa đánh giá này'], 403);
        }

        $rating->diemdanhgia = $request->input('diemdanhgia', $rating->diemdanhgia);
        $rating->nhanxet = $request->input('nhanxet', $rating->nhanxet);
        $rating->an_danh = $request->integer('an_danh', $rating->an_danh ?? 0);
        if ($request->has('trangthai')) {
            $rating->trangthai = $request->integer('trangthai', $rating->trangthai ?? 1);
        }
        $rating->ngaycapnhat = Carbon::now();
        $rating->save();

        return response()->json(['success' => true, 'data' => $rating]);
    }

    // GET /api/ratings/by-consultant?consultant_id=ID
    public function getByConsultant(Request $request): JsonResponse
    {
        $consultantId = (int) $request->query('consultant_id');
        if (!$consultantId) {
            return response()->json(['success' => false, 'message' => 'Thiếu consultant_id'], 400);
        }

        $includeHidden = (int) $request->query('include_hidden', 0);

        // Lấy tất cả lịch tư vấn của tư vấn viên này đã hoàn thành và có đánh giá
        $query = DB::table('danhgia_lichtuvan')
            ->join('lichtuvan', 'danhgia_lichtuvan.idlichtuvan', '=', 'lichtuvan.idlichtuvan')
            ->leftJoin('nguoidung', 'danhgia_lichtuvan.idnguoidat', '=', 'nguoidung.idnguoidung')
            ->where('lichtuvan.idnguoidung', $consultantId);

        if (!$includeHidden) {
            $query->where('danhgia_lichtuvan.trangthai', 1); // Chỉ lấy đánh giá đang hiển thị cho phía user
        }

        $ratings = $query
            ->select(
                'danhgia_lichtuvan.iddanhgia',
                'danhgia_lichtuvan.diemdanhgia',
                'danhgia_lichtuvan.nhanxet',
                'danhgia_lichtuvan.an_danh',
                'danhgia_lichtuvan.trangthai',
                'danhgia_lichtuvan.ngaydanhgia',
                'nguoidung.hoten as nguoi_danh_gia'
            )
            ->orderBy('danhgia_lichtuvan.ngaydanhgia', 'desc')
            ->get();

        // Tính trung bình sao
        $averageRating = $ratings->avg('diemdanhgia');
        $totalRatings = $ratings->count();

        // Lấy 5 nhận xét mới nhất
        $recentReviews = $ratings->take(5)->map(function ($rating) {
            return [
                'iddanhgia' => $rating->iddanhgia,
                'diemdanhgia' => (float) $rating->diemdanhgia,
                'nhanxet' => $rating->nhanxet,
                'an_danh' => (int) ($rating->an_danh ?? 0),
                'trangthai' => (int) ($rating->trangthai ?? 1),
                'nguoi_danh_gia' => $rating->an_danh ? 'Người dùng ẩn danh' : ($rating->nguoi_danh_gia ?? 'Người dùng'),
                'ngaydanhgia' => $rating->ngaydanhgia,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'average_rating' => $averageRating ? round($averageRating, 1) : 0,
                'total_ratings' => $totalRatings,
                'reviews' => $recentReviews
            ]
        ]);
    }
}


