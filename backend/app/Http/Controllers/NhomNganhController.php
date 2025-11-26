<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Models\NhomNganh;

class NhomNganhController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = NhomNganh::query();
        if ($request->filled('search')) {
            $kw = '%' . $request->string('search')->trim() . '%';
            $q->where('tennhom','like',$kw)->orWhere('manhom','like',$kw);
        }
        $per = $request->integer('per_page', 50);
        $items = $q->orderBy('tennhom')->paginate($per);
        return response()->json([
            'success' => true,
            'data' => $items->items(),
            'pagination' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'manhom' => 'required|string|max:20',
            'tennhom' => 'required|string|max:255',
            'mota' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['success'=>false,'message'=>'Dữ liệu không hợp lệ','errors'=>$validator->errors()],422);
        }

        try {
            $group = NhomNganh::create($request->only(['manhom','tennhom','mota']) + ['trangthai'=>1]);
            return response()->json(['success'=>true,'message'=>'Thêm nhóm ngành thành công','data'=>$group],201);
        } catch (\Exception $e) {
            return response()->json(['success'=>false,'message'=>'Có lỗi xảy ra khi thêm','error'=>$e->getMessage()],500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $group = NhomNganh::find($id);
        if (!$group) return response()->json(['success'=>false,'message'=>'Không tìm thấy nhóm ngành'],404);

        $validator = Validator::make($request->all(), [
            'manhom' => 'required|string|max:20',
            'tennhom' => 'required|string|max:255',
            'mota' => 'nullable|string|max:1000',
        ]);
        if ($validator->fails()) {
            return response()->json(['success'=>false,'message'=>'Dữ liệu không hợp lệ','errors'=>$validator->errors()],422);
        }

        try {
            $group->fill($request->only(['manhom','tennhom','mota']));
            $group->save();
            $group->refresh();
            return response()->json(['success'=>true,'message'=>'Cập nhật nhóm ngành thành công','data'=>$group]);
        } catch (\Exception $e) {
            return response()->json(['success'=>false,'message'=>'Có lỗi xảy ra khi cập nhật','error'=>$e->getMessage()],500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $group = NhomNganh::find($id);
        if (!$group) return response()->json(['success'=>false,'message'=>'Không tìm thấy nhóm ngành'],404);
        try {
            $group->delete();
            return response()->json(['success'=>true,'message'=>'Xóa nhóm ngành thành công']);
        } catch (\Exception $e) {
            return response()->json(['success'=>false,'message'=>'Có lỗi xảy ra khi xóa','error'=>$e->getMessage()],500);
        }
    }
}


