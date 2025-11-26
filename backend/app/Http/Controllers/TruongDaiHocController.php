<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\TruongDaiHoc;
use Illuminate\Support\Facades\Validator;

class TruongDaiHocController extends Controller
{
    /**
     * Get all universities with pagination and search
     */
    public function index(Request $request): JsonResponse
    {
        $query = TruongDaiHoc::query();
        
        // Search functionality
        if ($request->filled('search')) {
            $search = '%' . $request->string('search')->trim() . '%';
            $query->where(function($q) use ($search) {
                $q->where('tentruong', 'like', $search)
                  ->orWhere('matruong', 'like', $search)
                  ->orWhere('diachi', 'like', $search);
            });
        }
        
        // Pagination
        $perPage = $request->integer('per_page', 20);
        $universities = $query->orderBy('tentruong')->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $universities->items(),
            'pagination' => [
                'current_page' => $universities->currentPage(),
                'last_page' => $universities->lastPage(),
                'per_page' => $universities->perPage(),
                'total' => $universities->total(),
                'from' => $universities->firstItem(),
                'to' => $universities->lastItem(),
            ]
        ]);
    }

    /**
     * Get all universities for export (no pagination)
     */
    public function export(Request $request): JsonResponse
    {
        $query = TruongDaiHoc::query();
        
        // Search functionality
        if ($request->filled('search')) {
            $search = '%' . $request->string('search')->trim() . '%';
            $query->where(function($q) use ($search) {
                $q->where('tentruong', 'like', $search)
                  ->orWhere('matruong', 'like', $search)
                  ->orWhere('diachi', 'like', $search);
            });
        }
        
        $universities = $query->orderBy('tentruong')->get();
        
        return response()->json([
            'success' => true,
            'data' => $universities,
            'total' => $universities->count()
        ]);
    }

    /**
     * Get a specific university by ID
     */
    public function show(int $id): JsonResponse
    {
        $university = TruongDaiHoc::find($id);
        
        if (!$university) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy trường đại học'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $university
        ]);
    }

    /**
     * Create a new university
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'matruong' => 'required|string|max:20|unique:truongdaihoc,matruong',
            'tentruong' => 'required|string|max:255',
            'diachi' => 'required|string|max:500',
            'dienthoai' => 'nullable|string|max:20',
            'lienhe' => 'nullable|string|max:255',
            'sodienthoai' => 'nullable|string|max:20',
            'ngaythanhlap' => 'nullable|date',
            'motantuong' => 'nullable|string|max:1000'
        ], [
            'matruong.required' => 'Mã trường là bắt buộc',
            'matruong.unique' => 'Mã trường đã tồn tại',
            'tentruong.required' => 'Tên trường là bắt buộc',
            'diachi.required' => 'Địa chỉ là bắt buộc',
            'ngaythanhlap.date' => 'Ngày thành lập không hợp lệ'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Only create with fillable fields
            $university = TruongDaiHoc::create($request->only([
                'matruong',
                'tentruong',
                'diachi',
                'dienthoai',
                'lienhe',
                'sodienthoai',
                'ngaythanhlap',
                'motantuong'
            ]));
            
            return response()->json([
                'success' => true,
                'message' => 'Thêm trường đại học thành công',
                'data' => $university
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi thêm trường đại học',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing university
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $university = TruongDaiHoc::find($id);
        
        if (!$university) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy trường đại học'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'matruong' => 'required|string|max:20|unique:truongdaihoc,matruong,' . $id . ',idtruong',
            'tentruong' => 'required|string|max:255',
            'diachi' => 'required|string|max:500',
            'dienthoai' => 'nullable|string|max:20',
            'lienhe' => 'nullable|string|max:255',
            'sodienthoai' => 'nullable|string|max:20',
            'ngaythanhlap' => 'nullable|date',
            'motantuong' => 'nullable|string|max:1000'
        ], [
            'matruong.required' => 'Mã trường là bắt buộc',
            'matruong.unique' => 'Mã trường đã tồn tại',
            'tentruong.required' => 'Tên trường là bắt buộc',
            'diachi.required' => 'Địa chỉ là bắt buộc',
            'ngaythanhlap.date' => 'Ngày thành lập không hợp lệ'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Only update fillable fields
            $university->fill($request->only([
                'matruong',
                'tentruong',
                'diachi',
                'dienthoai',
                'lienhe',
                'sodienthoai',
                'ngaythanhlap',
                'motantuong'
            ]));
            $university->save();
            
            // Refresh to get updated data
            $university->refresh();
            
            return response()->json([
                'success' => true,
                'message' => 'Cập nhật trường đại học thành công',
                'data' => $university
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi cập nhật trường đại học',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a university
     */
    public function destroy(int $id): JsonResponse
    {
        $university = TruongDaiHoc::find($id);
        
        if (!$university) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy trường đại học'
            ], 404);
        }

        try {
            $university->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Xóa trường đại học thành công'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi xóa trường đại học',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk delete universities
     */
    public function bulkDestroy(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:truongdaihoc,idtruong'
        ], [
            'ids.required' => 'Danh sách ID là bắt buộc',
            'ids.array' => 'Danh sách ID phải là mảng',
            'ids.min' => 'Phải chọn ít nhất 1 trường để xóa'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $deletedCount = TruongDaiHoc::whereIn('idtruong', $request->ids)->delete();
            
            return response()->json([
                'success' => true,
                'message' => "Đã xóa thành công {$deletedCount} trường đại học"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi xóa các trường đại học',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import universities from CSV (matruong,tentruong,diachi,dienthoai,lienhe,sodienthoai,ngaythanhlap,motantuong)
     */
    public function import(Request $request): JsonResponse
    {
        if (!$request->hasFile('file')) {
            return response()->json(['success' => false, 'message' => 'Thiếu file tải lên'], 422);
        }

        $file = $request->file('file');
        if (!$file->isValid()) {
            return response()->json(['success' => false, 'message' => 'File không hợp lệ'], 422);
        }

        $created = 0; $updated = 0; $failed = 0; $errors = [];
        try {
            $handle = fopen($file->getRealPath(), 'r');
            if ($handle === false) {
                return response()->json(['success'=>false,'message'=>'Không thể đọc file'], 422);
            }
            $header = fgetcsv($handle);
            if ($header && isset($header[0])) {
                $header[0] = preg_replace("/^\xEF\xBB\xBF/", '', $header[0]);
            }
            $normalize = function ($h) {
                $h = strtolower(trim((string) $h));
                $aliases = [
                    'mã trường' => 'matruong',
                    'ten truong' => 'tentruong',
                    'tên trường' => 'tentruong',
                    'dia chi' => 'diachi',
                    'địa chỉ' => 'diachi',
                    'điện thoại' => 'dienthoai',
                    'dien thoai' => 'dienthoai',
                    'lien he' => 'lienhe',
                    'liên hệ' => 'lienhe',
                    'so dien thoai' => 'sodienthoai',
                    'số điện thoại' => 'sodienthoai',
                    'ngay thanh lap' => 'ngaythanhlap',
                    'ngày thành lập' => 'ngaythanhlap',
                    'mo ta' => 'motantuong',
                    'mô tả' => 'motantuong',
                ];
                return $aliases[$h] ?? $h;
            };
            $header = array_map($normalize, $header ?: []);

            $rowIndex = 1;
            while (($row = fgetcsv($handle)) !== false) {
                $rowIndex++;
                try {
                    $data = array_combine($header, $row);
                    if ($data === false) { $failed++; continue; }
                    $payload = [
                        'matruong' => trim($data['matruong'] ?? ''),
                        'tentruong' => trim($data['tentruong'] ?? ''),
                        'diachi' => $data['diachi'] ?? '',
                        'dienthoai' => $data['dienthoai'] ?? null,
                        'lienhe' => $data['lienhe'] ?? null,
                        'sodienthoai' => $data['sodienthoai'] ?? null,
                        'ngaythanhlap' => $data['ngaythanhlap'] ?? null,
                        'motantuong' => $data['motantuong'] ?? null,
                    ];

                    if (!$payload['matruong'] || !$payload['tentruong'] || !$payload['diachi']) {
                        $failed++;
                        $errors[] = "Dòng {$rowIndex}: thiếu cột bắt buộc (matruong/tentruong/diachi)";
                        continue;
                    }

                    $existing = TruongDaiHoc::where('matruong', $payload['matruong'])->first();
                    if ($existing) {
                        $existing->fill($payload);
                        $existing->save();
                        $updated++;
                    } else {
                        TruongDaiHoc::create($payload);
                        $created++;
                    }
                } catch (\Throwable $te) {
                    $failed++; $errors[] = "Dòng {$rowIndex}: " . $te->getMessage();
                }
            }
            fclose($handle);

            return response()->json([
                'success' => true,
                'message' => 'Nhập CSV hoàn tất',
                'summary' => compact('created','updated','failed'),
                'errors' => $errors
            ]);
        } catch (\Exception $e) {
            return response()->json(['success'=>false,'message'=>'Có lỗi khi nhập CSV','error'=>$e->getMessage()],500);
        }
    }
}
