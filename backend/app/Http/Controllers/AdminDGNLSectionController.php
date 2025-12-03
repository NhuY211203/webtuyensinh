<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\KyThiDGNLSection;
use App\Models\KyThiDGNL;

class AdminDGNLSectionController extends Controller
{
    /**
     * Danh sách sections của một kỳ thi
     */
    public function index($idkythi): JsonResponse
    {
        try {
            $sections = KyThiDGNLSection::where('idkythi', $idkythi)
                ->orderBy('thu_tu')
                ->get()
                ->map(function($section) {
                    $section->so_cau_hoi = $section->questions()->count();
                    return $section;
                });

            return response()->json([
                'success' => true,
                'data' => $sections,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy danh sách sections',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tạo section mới
     */
    public function store(Request $request, $idkythi): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'ma_section' => 'required|string|max:50',
                'ten_section' => 'required|string|max:255',
                'nhom_nang_luc' => 'nullable|string|max:255',
                'so_cau' => 'nullable|integer|min:0',
                'thoi_luong_phut' => 'nullable|integer|min:0',
                'thu_tu' => 'nullable|integer|min:0',
                'mo_ta' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Kiểm tra kỳ thi tồn tại
            $exam = KyThiDGNL::findOrFail($idkythi);

            $data = $validator->validated();
            $data['idkythi'] = $idkythi;

            $section = KyThiDGNLSection::create($data);

            return response()->json([
                'success' => true,
                'data' => $section,
                'message' => 'Tạo section thành công',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể tạo section',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật section
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $section = KyThiDGNLSection::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'ma_section' => 'sometimes|required|string|max:50',
                'ten_section' => 'sometimes|required|string|max:255',
                'nhom_nang_luc' => 'nullable|string|max:255',
                'so_cau' => 'nullable|integer|min:0',
                'thoi_luong_phut' => 'nullable|integer|min:0',
                'thu_tu' => 'nullable|integer|min:0',
                'mo_ta' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $section->update($validator->validated());

            return response()->json([
                'success' => true,
                'data' => $section,
                'message' => 'Cập nhật section thành công',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể cập nhật section',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa section
     */
    public function destroy($id): JsonResponse
    {
        try {
            $section = KyThiDGNLSection::findOrFail($id);

            // Kiểm tra xem có câu hỏi nào không
            $questionsCount = $section->questions()->count();
            if ($questionsCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể xóa section vì đã có câu hỏi',
                ], 400);
            }

            $section->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xóa section thành công',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa section',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}


