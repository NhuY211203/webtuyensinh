<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Models\PhuongThucXetTuyen;

class PhuongThucXetTuyenController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = PhuongThucXetTuyen::query();

            if ($request->filled('keyword')) {
                $kw = '%' . $request->string('keyword')->trim() . '%';
                $query->where('tenptxt', 'like', $kw);
            }

            $perPage = $request->integer('per_page', 20);
            $page = $request->integer('page', 1);
            
            $pagination = $query->orderBy('idxettuyen')->paginate($perPage, ['*'], 'page', $page);
            
            return response()->json([
                'success' => true,
                'data' => $pagination->items(),
                'pagination' => [
                    'current_page' => $pagination->currentPage(),
                    'last_page' => $pagination->lastPage(),
                    'per_page' => $pagination->perPage(),
                    'total' => $pagination->total(),
                    'from' => $pagination->firstItem(),
                    'to' => $pagination->lastItem(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi tải dữ liệu',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'idxettuyen' => 'required|integer|min:1|unique:ptxt,idxettuyen',
            'tenptxt' => 'required|string|max:255',
            'mota' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $item = PhuongThucXetTuyen::create($request->only([
                'idxettuyen',
                'tenptxt',
                'mota'
            ]));
            
            return response()->json([
                'success' => true,
                'message' => 'Thêm phương thức xét tuyển thành công',
                'data' => $item
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi thêm',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $item = PhuongThucXetTuyen::find($id);
        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy phương thức xét tuyển'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'idxettuyen' => 'required|integer|min:1|unique:ptxt,idxettuyen,' . $item->idxettuyen . ',idxettuyen',
            'tenptxt' => 'required|string|max:255',
            'mota' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $item->fill($request->only([
                'idxettuyen',
                'tenptxt',
                'mota'
            ]));
            $item->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Cập nhật phương thức xét tuyển thành công',
                'data' => $item
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi cập nhật',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $item = PhuongThucXetTuyen::find($id);
        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy phương thức xét tuyển'
            ], 404);
        }

        try {
            $item->delete();
            return response()->json([
                'success' => true,
                'message' => 'Xóa phương thức xét tuyển thành công'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi xóa',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

