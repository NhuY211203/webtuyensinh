<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Cloudinary\Cloudinary as CloudinaryClient;
use App\Models\TinTuyenSinh;

class TinTuyenSinhController extends Controller
{
    /**
     * Build Cloudinary client from env.
     */
    private function makeCloudinaryClient(): CloudinaryClient
    {
        $url = env('CLOUDINARY_URL');
        if ($url) {
            // Parse cloudinary://api_key:api_secret@cloud_name
            $parts = parse_url($url);
            $apiKey = $parts['user'] ?? null;
            $apiSecret = $parts['pass'] ?? null;
            $cloudName = $parts['host'] ?? null;
            if ($apiKey && $apiSecret && $cloudName) {
                return new CloudinaryClient([
                    'cloud' => [
                        'cloud_name' => $cloudName,
                        'api_key' => $apiKey,
                        'api_secret' => $apiSecret,
                    ],
                ]);
            }
        }
        // Fallback to separated env vars if provided
        $cloudName = env('CLOUDINARY_CLOUD_NAME');
        $apiKey = env('CLOUDINARY_API_KEY');
        $apiSecret = env('CLOUDINARY_API_SECRET');
        if ($cloudName && $apiKey && $apiSecret) {
            return new CloudinaryClient([
                'cloud' => [
                    'cloud_name' => $cloudName,
                    'api_key' => $apiKey,
                    'api_secret' => $apiSecret,
                ],
            ]);
        }
        throw new \RuntimeException('Cloudinary credentials are missing. Please set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET.');
    }
    public function index(Request $request): JsonResponse
    {
        try {
            $query = TinTuyenSinh::query()
                ->leftJoin('truongdaihoc', 'tin_tuyensinh.id_truong', '=', 'truongdaihoc.idtruong')
                ->select(
                    'tin_tuyensinh.*',
                    'truongdaihoc.tentruong'
                );

            // Filters
            if ($request->filled('id_truong')) {
                $query->where('tin_tuyensinh.id_truong', $request->integer('id_truong'));
            }
            if ($request->filled('loai_tin')) {
                $query->where('tin_tuyensinh.loai_tin', $request->string('loai_tin'));
            }
            if ($request->filled('trang_thai')) {
                $query->where('tin_tuyensinh.trang_thai', $request->string('trang_thai'));
            }
            if ($request->filled('keyword')) {
                $kw = '%' . $request->string('keyword')->trim() . '%';
                $query->where(function($q) use ($kw) {
                    $q->where('tin_tuyensinh.tieu_de', 'like', $kw)
                      ->orWhere('tin_tuyensinh.tom_tat', 'like', $kw)
                      ->orWhere('truongdaihoc.tentruong', 'like', $kw);
                });
            }

            $perPage = $request->integer('per_page', 20);
            $page = $request->integer('page', 1);
            
            $pagination = $query->orderBy('tin_tuyensinh.ngay_dang', 'desc')
                                ->paginate($perPage, ['*'], 'page', $page);
            
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
            'id_truong' => 'nullable|integer|exists:truongdaihoc,idtruong',
            'tieu_de' => 'required|string|max:255',
            'tom_tat' => 'nullable|string',
            // Accept either URL or file upload
            'hinh_anh_dai_dien' => 'nullable|url',
            'file_hinh_anh' => 'nullable|image|mimes:jpeg,jpg,png,gif,webp|max:5120',
            'nguon_bai_viet' => 'nullable|string|max:500|url',
            'loai_tin' => 'required|in:Tin tuyển sinh,Thông báo,Học bổng,Sự kiện,Khác',
            'muc_do_uu_tien' => 'nullable|integer|min:0|max:100',
            'trang_thai' => 'nullable|in:Chờ duyệt,Đã duyệt,Ẩn,Đã gỡ',
            'ngay_het_han' => 'nullable|date',
            'ma_nguon' => 'nullable|string|max:50',
            'is_tu_dong' => 'nullable|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        // No extra file validation needed here since already in main validator

        try {
            // Get current user ID from auth or request
            $userId = null;
            if (auth()->check()) {
                $userId = auth()->id();
            } elseif ($request->filled('id_nguoidang')) {
                $userId = $request->integer('id_nguoidang');
            }
            
            // Generate hash if not provided
            $hashNoidung = $request->string('hash_noidung', null);
            if (!$hashNoidung && $request->filled('nguon_bai_viet')) {
                $hashNoidung = hash('sha256', $request->string('nguon_bai_viet'));
            }
            
            $data = $request->only([
                'id_truong',
                'tieu_de',
                'tom_tat',
                'hinh_anh_dai_dien',
                'hinh_anh_public_id',
                'nguon_bai_viet',
                'loai_tin',
                'muc_do_uu_tien',
                'trang_thai',
                'ngay_het_han',
                'ma_nguon',
                'is_tu_dong'
            ]);
            
            // If a file is uploaded, upload to Cloudinary and store secure_url + public_id
            if ($request->hasFile('file_hinh_anh')) {
                try {
                    \Log::info('Attempting Cloudinary upload');
                    $client = $this->makeCloudinaryClient();
                    $result = $client->uploadApi()->upload(
                        $request->file('file_hinh_anh')->getRealPath(),
                        ['folder' => 'Tracuutuyensinh', 'use_filename' => true, 'unique_filename' => false]
                    );
                    $data['hinh_anh_dai_dien'] = $result['secure_url'] ?? ($result['url'] ?? null);
                    $data['hinh_anh_public_id'] = $result['public_id'] ?? null;
                    if (empty($data['hinh_anh_dai_dien']) || empty($data['hinh_anh_public_id'])) {
                        throw new \RuntimeException('Cloudinary response missing secure_url/public_id');
                    }
                    \Log::info('Cloudinary upload successful: ' . $data['hinh_anh_dai_dien']);
                } catch (\Throwable $cloudinaryError) {
                    \Log::error('Cloudinary upload failed: ' . $cloudinaryError->getMessage());
                    return response()->json([
                        'success' => false,
                        'message' => 'Không thể upload ảnh lên Cloudinary. Vui lòng kiểm tra cấu hình.',
                        'error' => app()->environment('local') ? $cloudinaryError->getMessage() : null,
                    ], 422);
                }
            }

            $data['id_nguoidang'] = $userId;
            $data['hash_noidung'] = $hashNoidung;
            $data['trang_thai'] = $data['trang_thai'] ?? 'Chờ duyệt';
            $data['muc_do_uu_tien'] = $data['muc_do_uu_tien'] ?? 0;
            $data['is_tu_dong'] = $data['is_tu_dong'] ?? false;
            $data['ngay_dang'] = now();
            
            $item = TinTuyenSinh::create($data);
            
            return response()->json([
                'success' => true,
                'message' => 'Thêm tin tuyển sinh thành công',
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
        $item = TinTuyenSinh::find($id);
        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy tin tuyển sinh'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'id_truong' => 'nullable|integer|exists:truongdaihoc,idtruong',
            'tieu_de' => 'required|string|max:255',
            'tom_tat' => 'nullable|string',
            'hinh_anh_dai_dien' => 'nullable|url',
            'file_hinh_anh' => 'nullable|image|mimes:jpeg,jpg,png,gif,webp|max:5120',
            'nguon_bai_viet' => 'nullable|string|max:500|url',
            'loai_tin' => 'required|in:Tin tuyển sinh,Thông báo,Học bổng,Sự kiện,Khác',
            'muc_do_uu_tien' => 'nullable|integer|min:0|max:100',
            'trang_thai' => 'nullable|in:Chờ duyệt,Đã duyệt,Ẩn,Đã gỡ',
            'ngay_het_han' => 'nullable|date',
            'ma_nguon' => 'nullable|string|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        // No extra file validator needed

        try {
            $data = $request->only([
                'id_truong',
                'tieu_de',
                'tom_tat',
                'hinh_anh_dai_dien',
                'hinh_anh_public_id',
                'nguon_bai_viet',
                'loai_tin',
                'muc_do_uu_tien',
                'trang_thai',
                'ngay_het_han',
                'ma_nguon'
            ]);
            
            // Upload new image to Cloudinary if provided and optionally delete old one
            if ($request->hasFile('file_hinh_anh')) {
                try {
                    // Delete old Cloudinary image if exists
                    if (!empty($item->hinh_anh_public_id)) {
                        try {
                            $client = $this->makeCloudinaryClient();
                            $client->uploadApi()->destroy($item->hinh_anh_public_id);
                        } catch (\Throwable $deleteError) {
                            \Log::warning('Failed to delete old Cloudinary image: ' . $deleteError->getMessage());
                        }
                    }
                    
                    // Attempt Cloudinary upload
                    \Log::info('Attempting Cloudinary upload (update)');
                    $client = $this->makeCloudinaryClient();
                    $result = $client->uploadApi()->upload(
                        $request->file('file_hinh_anh')->getRealPath(),
                        ['folder' => 'Tracuutuyensinh', 'use_filename' => true, 'unique_filename' => false]
                    );
                    $data['hinh_anh_dai_dien'] = $result['secure_url'] ?? ($result['url'] ?? null);
                    $data['hinh_anh_public_id'] = $result['public_id'] ?? null;
                    if (empty($data['hinh_anh_dai_dien']) || empty($data['hinh_anh_public_id'])) {
                        throw new \RuntimeException('Cloudinary response missing secure_url/public_id');
                    }
                    \Log::info('Cloudinary upload successful (update): ' . $data['hinh_anh_dai_dien']);
                } catch (\Throwable $cloudinaryError) {
                    \Log::error('Cloudinary upload failed (update): ' . $cloudinaryError->getMessage());
                    return response()->json([
                        'success' => false,
                        'message' => 'Không thể upload ảnh lên Cloudinary khi cập nhật.',
                        'error' => app()->environment('local') ? $cloudinaryError->getMessage() : null,
                    ], 422);
                }
            }


            // Update hash if nguon_bai_viet changed
            if ($request->filled('nguon_bai_viet') && $request->string('nguon_bai_viet') !== $item->nguon_bai_viet) {
                $data['hash_noidung'] = hash('sha256', $request->string('nguon_bai_viet'));
            }
            
            $item->fill($data);
            $item->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Cập nhật tin tuyển sinh thành công',
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
        $item = TinTuyenSinh::find($id);
        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy tin tuyển sinh'
            ], 404);
        }

        try {
            $item->delete();
            return response()->json([
                'success' => true,
                'message' => 'Xóa tin tuyển sinh thành công'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi xóa',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Public API - chỉ lấy tin đã duyệt
    public function publicIndex(Request $request): JsonResponse
    {
        try {
            // Debug: Check total records in table
            $totalRecords = TinTuyenSinh::count();
            \Log::info('Total records in tin_tuyensinh table: ' . $totalRecords);
            
            // Debug: Check records by status
            $byStatus = TinTuyenSinh::select('trang_thai', DB::raw('count(*) as count'))
                ->groupBy('trang_thai')
                ->get()
                ->pluck('count', 'trang_thai')
                ->toArray();
            \Log::info('Records by status: ' . json_encode($byStatus));
            
            // Debug: Check records with Đã duyệt status and their expiration dates
            $approvedNews = TinTuyenSinh::where('trang_thai', 'Đã duyệt')
                ->select('id_tin', 'tieu_de', 'ngay_het_han', DB::raw('ngay_het_han >= NOW() as is_valid'))
                ->get();
            \Log::info('Approved news with expiration: ' . json_encode($approvedNews->toArray(), JSON_UNESCAPED_UNICODE));
            
            $query = TinTuyenSinh::query()
                ->leftJoin('truongdaihoc', 'tin_tuyensinh.id_truong', '=', 'truongdaihoc.idtruong')
                ->select(
                    'tin_tuyensinh.id_tin',
                    'tin_tuyensinh.tieu_de',
                    'tin_tuyensinh.tom_tat',
                    'tin_tuyensinh.hinh_anh_dai_dien',
                    'tin_tuyensinh.nguon_bai_viet',
                    'tin_tuyensinh.loai_tin',
                    'tin_tuyensinh.ngay_dang',
                    'tin_tuyensinh.ngay_het_han',
                    'tin_tuyensinh.trang_thai',
                    'truongdaihoc.tentruong'
                )
                ->where('tin_tuyensinh.trang_thai', 'Đã duyệt');
                // Tạm thời bỏ điều kiện ngày hết hạn để test
                // Nếu muốn áp dụng lại, uncomment dòng dưới:
                // ->where(function($q) {
                //     $q->whereNull('tin_tuyensinh.ngay_het_han')
                //       ->orWhereDate('tin_tuyensinh.ngay_het_han', '>=', now()->toDateString());
                // });
            
            // Debug: Log SQL query
            \Log::info('Public news query SQL: ' . $query->toSql());
            \Log::info('Public news query bindings: ' . json_encode($query->getBindings()));

            // Filters
            if ($request->filled('id_truong')) {
                $query->where('tin_tuyensinh.id_truong', $request->integer('id_truong'));
            }
            if ($request->filled('loai_tin')) {
                $query->where('tin_tuyensinh.loai_tin', $request->string('loai_tin'));
            }
            if ($request->filled('keyword')) {
                $kw = '%' . $request->string('keyword')->trim() . '%';
                $query->where(function($q) use ($kw) {
                    $q->where('tin_tuyensinh.tieu_de', 'like', $kw)
                      ->orWhere('tin_tuyensinh.tom_tat', 'like', $kw)
                      ->orWhere('truongdaihoc.tentruong', 'like', $kw);
                });
            }

            $perPage = $request->integer('per_page', 12);
            $page = $request->integer('page', 1);
            
            // Debug: Count before pagination
            $countBeforePagination = $query->count();
            \Log::info('Count before pagination: ' . $countBeforePagination);
            
            $pagination = $query->orderBy('tin_tuyensinh.muc_do_uu_tien', 'desc')
                                ->orderBy('tin_tuyensinh.ngay_dang', 'desc')
                                ->paginate($perPage, ['*'], 'page', $page);
            
            // Debug: Log results
            \Log::info('Pagination total: ' . $pagination->total());
            \Log::info('Items returned: ' . count($pagination->items()));
            if (count($pagination->items()) > 0) {
                \Log::info('First item: ' . json_encode($pagination->items()[0], JSON_UNESCAPED_UNICODE));
            }
            
            // Convert relative image paths to full URLs for local storage
            $items = collect($pagination->items())->map(function ($item) {
                if (!empty($item->hinh_anh_dai_dien) && !str_starts_with($item->hinh_anh_dai_dien, 'http')) {
                    // If it's a relative path (starts with /storage/), convert to full URL
                    if (str_starts_with($item->hinh_anh_dai_dien, '/storage/')) {
                        $item->hinh_anh_dai_dien = url($item->hinh_anh_dai_dien);
                    }
                }
                return $item;
            })->toArray();
            
            return response()->json([
                'success' => true,
                'data' => $items,
                'pagination' => [
                    'current_page' => $pagination->currentPage(),
                    'last_page' => $pagination->lastPage(),
                    'per_page' => $pagination->perPage(),
                    'total' => $pagination->total(),
                    'from' => $pagination->firstItem(),
                    'to' => $pagination->lastItem(),
                ],
                'debug' => [
                    'total_in_table' => $totalRecords,
                    'by_status' => $byStatus,
                    'count_before_pagination' => $countBeforePagination,
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

    // Get single news item (public)
    public function show(int $id): JsonResponse
    {
        try {
            $item = TinTuyenSinh::query()
                ->leftJoin('truongdaihoc', 'tin_tuyensinh.id_truong', '=', 'truongdaihoc.idtruong')
                ->select(
                    'tin_tuyensinh.*',
                    'truongdaihoc.tentruong'
                )
                ->where('tin_tuyensinh.id_tin', $id)
                ->where('tin_tuyensinh.trang_thai', 'Đã duyệt')
                ->where(function($q) {
                    $q->whereNull('tin_tuyensinh.ngay_het_han')
                      ->orWhereRaw('tin_tuyensinh.ngay_het_han >= ?', [now()->format('Y-m-d H:i:s')]);
                })
                ->first();

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy tin tuyển sinh'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $item
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi tải dữ liệu',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

