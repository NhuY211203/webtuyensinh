<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Models\NganhHoc;

class NganhHocController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = NganhHoc::query();

        if ($request->filled('search')) {
            $search = '%' . $request->string('search')->trim() . '%';
            $query->where(function ($q) use ($search) {
                $q->where('tennganh', 'like', $search)
                  ->orWhere('manganh', 'like', $search)
                  ->orWhere('motanganh', 'like', $search);
            });
        }

        if ($request->filled('idnhomnganh')) {
            $query->where('idnhomnganh', $request->integer('idnhomnganh'));
        }

        $perPage = $request->integer('per_page', 20);
        $majors = $query->orderBy('tennganh')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $majors->items(),
            'pagination' => [
                'current_page' => $majors->currentPage(),
                'last_page' => $majors->lastPage(),
                'per_page' => $majors->perPage(),
                'total' => $majors->total(),
                'from' => $majors->firstItem(),
                'to' => $majors->lastItem(),
            ]
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $major = NganhHoc::find($id);
        if (!$major) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy ngành học'], 404);
        }
        return response()->json(['success' => true, 'data' => $major]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'idnhomnganh' => 'required|integer|exists:nhomnganh,idnhomnganh',
            'manganh' => 'required|string|max:20',
            'tennganh' => 'required|string|max:255',
            'capdo' => 'nullable|string|max:50',
            'bangcap' => 'nullable|string|max:100',
            'motanganh' => 'nullable|string|max:1000',
            'mucluong' => 'nullable|string|max:50',
            'xuhuong' => 'nullable|string|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $major = NganhHoc::create($request->only([
                'idnhomnganh','manganh','tennganh','capdo','bangcap','motanganh','mucluong','xuhuong'
            ]));
            return response()->json(['success' => true, 'message' => 'Thêm ngành học thành công', 'data' => $major], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Có lỗi xảy ra khi thêm', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $major = NganhHoc::find($id);
        if (!$major) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy ngành học'], 404);
        }

        $validator = Validator::make($request->all(), [
            'idnhomnganh' => 'required|integer|exists:nhomnganh,idnhomnganh',
            'manganh' => 'required|string|max:20',
            'tennganh' => 'required|string|max:255',
            'capdo' => 'nullable|string|max:50',
            'bangcap' => 'nullable|string|max:100',
            'motanganh' => 'nullable|string|max:1000',
            'mucluong' => 'nullable|string|max:50',
            'xuhuong' => 'nullable|string|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $major->fill($request->only([
                'idnhomnganh','manganh','tennganh','capdo','bangcap','motanganh','mucluong','xuhuong'
            ]));
            $major->save();
            $major->refresh();
            return response()->json(['success' => true, 'message' => 'Cập nhật ngành học thành công', 'data' => $major]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Có lỗi xảy ra khi cập nhật', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $major = NganhHoc::find($id);
        if (!$major) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy ngành học'], 404);
        }
        try {
            $major->delete();
            return response()->json(['success' => true, 'message' => 'Xóa ngành học thành công']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Có lỗi xảy ra khi xóa', 'error' => $e->getMessage()], 500);
        }
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $deleted = NganhHoc::whereIn('idnganh', $request->ids)->delete();
            return response()->json(['success' => true, 'message' => "Đã xóa {$deleted} ngành học"]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Có lỗi xảy ra khi xóa', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Import majors from CSV (columns: idnhomnganh,manganh,tennganh,capdo,bangcap,motanganh,mucluong,xuhuong)
     */
    public function import(Request $request): JsonResponse
    {
        if (!$request->hasFile('file')) {
            return response()->json(['success'=>false,'message'=>'Thiếu file tải lên'], 422);
        }

        $file = $request->file('file');
        if (!$file->isValid()) {
            return response()->json(['success'=>false,'message'=>'File không hợp lệ'], 422);
        }

        $created = 0; $updated = 0; $failed = 0; $errors = [];
        try {
            $handle = fopen($file->getRealPath(), 'r');
            if ($handle === false) {
                return response()->json(['success'=>false,'message'=>'Không thể đọc file'], 422);
            }
            // Read header
            $header = fgetcsv($handle);
            $normalize = function($h){ return strtolower(trim((string)$h)); };
            $header = array_map($normalize, $header ?: []);

            while (($row = fgetcsv($handle)) !== false) {
                try {
                    $data = array_combine($header, $row);
                    if ($data === false) { $failed++; continue; }
                    $payload = [
                        'idnhomnganh' => isset($data['idnhomnganh']) && $data['idnhomnganh'] !== '' ? (int)$data['idnhomnganh'] : null,
                        'manganh' => trim($data['manganh'] ?? ''),
                        'tennganh' => trim($data['tennganh'] ?? ''),
                        'capdo' => $data['capdo'] ?? null,
                        'bangcap' => $data['bangcap'] ?? null,
                        'motanganh' => $data['motanganh'] ?? null,
                        'mucluong' => $data['mucluong'] ?? null,
                        'xuhuong' => $data['xuhuong'] ?? null,
                    ];
                    if (!$payload['manganh'] || !$payload['tennganh']) { $failed++; continue; }

                    // Upsert by manganh
                    $existing = NganhHoc::where('manganh', $payload['manganh'])->first();
                    if ($existing) {
                        $existing->fill($payload);
                        $existing->save();
                        $updated++;
                    } else {
                        NganhHoc::create($payload);
                        $created++;
                    }
                } catch (\Throwable $te) {
                    $failed++;
                    $errors[] = $te->getMessage();
                }
            }
            fclose($handle);

            return response()->json([
                'success' => true,
                'message' => 'Nhập dữ liệu hoàn tất',
                'summary' => compact('created','updated','failed'),
                'errors' => $errors,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success'=>false,'message'=>'Có lỗi khi nhập CSV','error'=>$e->getMessage()],500);
        }
    }
}


