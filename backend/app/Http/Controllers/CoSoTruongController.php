<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\CoSoTruong;
use App\Models\TruongDaiHoc;
use Illuminate\Support\Facades\Validator;

class CoSoTruongController extends Controller
{
    /**
     * Get all facilities for a specific university
     */
    public function index(Request $request): JsonResponse
    {
        $query = CoSoTruong::query();
        
        // Filter by university ID if provided
        if ($request->filled('idtruong')) {
            $query->where('idtruong', $request->integer('idtruong'));
        }
        
        // Search functionality
        if ($request->filled('search')) {
            $search = '%' . $request->string('search')->trim() . '%';
            $query->where(function($q) use ($search) {
                $q->where('ten_coso', 'like', $search)
                  ->orWhere('diachi_coso', 'like', $search)
                  ->orWhere('khuvuc', 'like', $search);
            });
        }
        
        // Pagination
        $perPage = $request->integer('per_page', 20);
        $facilities = $query->orderBy('ten_coso')->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $facilities->items(),
            'pagination' => [
                'current_page' => $facilities->currentPage(),
                'last_page' => $facilities->lastPage(),
                'per_page' => $facilities->perPage(),
                'total' => $facilities->total(),
                'from' => $facilities->firstItem(),
                'to' => $facilities->lastItem(),
            ]
        ]);
    }

    /**
     * Get a specific facility by ID
     */
    public function show(int $id): JsonResponse
    {
        $facility = CoSoTruong::find($id);
        
        if (!$facility) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy cơ sở'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $facility
        ]);
    }

    /**
     * Create a new facility
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'idtruong' => 'required|integer|exists:truongdaihoc,idtruong',
            'ten_coso' => 'required|string|max:255',
            'khuvuc' => 'required|string|in:Miền Bắc,Miền Trung,Miền Nam',
            'diachi_coso' => 'required|string|max:500'
        ], [
            'idtruong.required' => 'ID trường là bắt buộc',
            'idtruong.exists' => 'Trường đại học không tồn tại',
            'ten_coso.required' => 'Tên cơ sở là bắt buộc',
            'khuvuc.required' => 'Khu vực là bắt buộc',
            'khuvuc.in' => 'Khu vực phải là: Miền Bắc, Miền Trung, hoặc Miền Nam',
            'diachi_coso.required' => 'Địa chỉ cơ sở là bắt buộc'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $facility = CoSoTruong::create($request->only([
                'idtruong',
                'ten_coso',
                'khuvuc',
                'diachi_coso'
            ]));
            
            return response()->json([
                'success' => true,
                'message' => 'Thêm cơ sở thành công',
                'data' => $facility
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi thêm cơ sở',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing facility
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $facility = CoSoTruong::find($id);
        
        if (!$facility) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy cơ sở'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'idtruong' => 'required|integer|exists:truongdaihoc,idtruong',
            'ten_coso' => 'required|string|max:255',
            'khuvuc' => 'required|string|in:Miền Bắc,Miền Trung,Miền Nam',
            'diachi_coso' => 'required|string|max:500'
        ], [
            'idtruong.required' => 'ID trường là bắt buộc',
            'idtruong.exists' => 'Trường đại học không tồn tại',
            'ten_coso.required' => 'Tên cơ sở là bắt buộc',
            'khuvuc.required' => 'Khu vực là bắt buộc',
            'khuvuc.in' => 'Khu vực phải là: Miền Bắc, Miền Trung, hoặc Miền Nam',
            'diachi_coso.required' => 'Địa chỉ cơ sở là bắt buộc'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $facility->fill($request->only([
                'idtruong',
                'ten_coso',
                'khuvuc',
                'diachi_coso'
            ]));
            $facility->save();
            $facility->refresh();
            
            return response()->json([
                'success' => true,
                'message' => 'Cập nhật cơ sở thành công',
                'data' => $facility
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi cập nhật cơ sở',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a facility
     */
    public function destroy(int $id): JsonResponse
    {
        $facility = CoSoTruong::find($id);
        
        if (!$facility) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy cơ sở'
            ], 404);
        }

        try {
            $facility->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Xóa cơ sở thành công'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi xóa cơ sở',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk delete facilities
     */
    public function bulkDestroy(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:coso_truong,id'
        ], [
            'ids.required' => 'Danh sách ID là bắt buộc',
            'ids.array' => 'Danh sách ID phải là mảng',
            'ids.min' => 'Phải chọn ít nhất 1 cơ sở để xóa'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $deletedCount = CoSoTruong::whereIn('id', $request->ids)->delete();
            
            return response()->json([
                'success' => true,
                'message' => "Đã xóa thành công {$deletedCount} cơ sở"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi xóa các cơ sở',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}






































