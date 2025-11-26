<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\NganhTruong;

class NganhTruongController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $baseQuery = DB::table('nganh_truong')
                ->leftJoin('truongdaihoc', 'nganh_truong.idtruong', '=', 'truongdaihoc.idtruong')
                ->leftJoin('nganhhoc', 'nganh_truong.manganh', '=', 'nganhhoc.manganh')
                ->select(
                    'nganh_truong.idnganhtruong',
                    'nganh_truong.idtruong',
                    'nganh_truong.manganh',
                    'nganh_truong.hinhthuc',
                    'nganh_truong.thoiluong_nam',
                    'nganh_truong.so_ky',
                    'nganh_truong.tohop_xettuyen_truong',
                    'nganh_truong.hocphi_ky',
                    'nganh_truong.hocphi_ghichu',
                    'nganh_truong.decuong_url',
                    'nganh_truong.mota_tomtat',
                    'nganh_truong.nam',
                    'truongdaihoc.tentruong',
                    'nganhhoc.tennganh'
                );

            // Apply filters
            if ($request->filled('idtruong')) {
                $baseQuery->where('nganh_truong.idtruong', $request->integer('idtruong'));
            }
            if ($request->filled('manganh')) {
                $manganh = trim($request->input('manganh'));
                \Log::info('Filtering by manganh: "' . $manganh . '" (type: ' . gettype($manganh) . ')');
                // Use whereRaw to handle both string and numeric comparison
                $baseQuery->whereRaw('nganh_truong.manganh = ?', [$manganh]);
            }
            if ($request->filled('nam')) {
                $baseQuery->where('nganh_truong.nam', $request->integer('nam'));
            }
            if ($request->filled('keyword')) {
                $kw = '%'.$request->string('keyword')->trim().'%';
                $baseQuery->where(function($q) use ($kw) {
                    $q->where('truongdaihoc.tentruong', 'like', $kw)
                      ->orWhere('nganhhoc.tennganh', 'like', $kw)
                      ->orWhere('nganh_truong.mota_tomtat', 'like', $kw);
                });
            }

            $per = $request->integer('per_page', 20);
            $page = $request->integer('page', 1);
            
            // Get total count - need to rebuild query or use subquery
            // Clone doesn't work well with query builder, so rebuild count query
            $countQuery = DB::table('nganh_truong')
                ->leftJoin('truongdaihoc', 'nganh_truong.idtruong', '=', 'truongdaihoc.idtruong')
                ->leftJoin('nganhhoc', 'nganh_truong.manganh', '=', 'nganhhoc.manganh');
            
            // Apply same filters
            if ($request->filled('idtruong')) {
                $countQuery->where('nganh_truong.idtruong', $request->integer('idtruong'));
            }
            if ($request->filled('manganh')) {
                $manganh = trim($request->input('manganh'));
                $countQuery->whereRaw('nganh_truong.manganh = ?', [$manganh]);
            }
            if ($request->filled('nam')) {
                $countQuery->where('nganh_truong.nam', $request->integer('nam'));
            }
            if ($request->filled('keyword')) {
                $kw = '%'.$request->string('keyword')->trim().'%';
                $countQuery->where(function($q) use ($kw) {
                    $q->where('truongdaihoc.tentruong', 'like', $kw)
                      ->orWhere('nganhhoc.tennganh', 'like', $kw)
                      ->orWhere('nganh_truong.mota_tomtat', 'like', $kw);
                });
            }
            
            // Debug logging
            \Log::info('NganhTruong filter params:', [
                'idtruong' => $request->input('idtruong'),
                'manganh' => $request->input('manganh'),
                'keyword' => $request->input('keyword')
            ]);
            
            // Debug: Check if there's any data without filter
            $totalWithoutFilter = DB::table('nganh_truong')->count();
            \Log::info('Total records in nganh_truong table (no filter): ' . $totalWithoutFilter);
            
            // Debug: Check distinct idtruong values in the table
            $distinctIdtruongInTable = DB::table('nganh_truong')
                ->distinct()
                ->pluck('idtruong')
                ->toArray();
            \Log::info('Distinct idtruong values in nganh_truong table: ' . json_encode($distinctIdtruongInTable));
            
            // Debug: Count records per idtruong
            $countPerIdtruong = DB::table('nganh_truong')
                ->select('idtruong', DB::raw('count(*) as count'))
                ->groupBy('idtruong')
                ->get()
                ->pluck('count', 'idtruong')
                ->toArray();
            \Log::info('Count of records per idtruong: ' . json_encode($countPerIdtruong));
            
            // Debug: Check if there's data with the specific manganh (direct query without join)
            if ($request->filled('manganh')) {
                $manganhValue = $request->string('manganh');
                $manganhCheck = DB::table('nganh_truong')
                    ->where('manganh', $manganhValue)
                    ->count();
                \Log::info('Records with manganh ' . $manganhValue . ' (direct query): ' . $manganhCheck);
                
                // Also check what manganh values exist in the table
                $allManganh = DB::table('nganh_truong')->distinct()->pluck('manganh')->toArray();
                \Log::info('All manganh values in table: ' . json_encode($allManganh));
            }
            
            // Try without distinct first to see if filter works
            // If there are no duplicates, we don't need distinct
            $total = $countQuery->count('nganh_truong.idnganhtruong');
            
            \Log::info('Total count after filter (with join): ' . $total);
            
            // Get paginated data
            $items = $baseQuery->orderBy('nganh_truong.idnganhtruong', 'desc')
                               ->skip(($page - 1) * $per)
                               ->take($per)
                               ->get();
            
            \Log::info('Items returned: ' . $items->count());
            
            // Debug: Check what tentruong values are being returned
            if ($items->count() > 0) {
                $tentruongValues = $items->pluck('tentruong', 'idtruong')->toArray();
                \Log::info('Tentruong values in results: ' . json_encode($tentruongValues));
                
                // Also check distinct idtruong values
                $distinctIdtruong = $items->pluck('idtruong')->unique()->values()->toArray();
                \Log::info('Distinct idtruong in results: ' . json_encode($distinctIdtruong));
                
                // Debug: Log first few items to see the actual data structure
                $firstItems = $items->take(3)->map(function($item) {
                    return [
                        'idnganhtruong' => $item->idnganhtruong,
                        'idtruong' => $item->idtruong,
                        'tentruong' => $item->tentruong,
                        'manganh' => $item->manganh,
                        'tennganh' => $item->tennganh
                    ];
                })->toArray();
                \Log::info('First 3 items in results: ' . json_encode($firstItems, JSON_UNESCAPED_UNICODE));
            }
            
            $lastPage = $total > 0 ? (int) ceil($total / $per) : 1;
            
            return response()->json([
                'success' => true,
                'data' => $items,
                'pagination' => [
                    'current_page' => $page,
                    'last_page' => $lastPage,
                    'per_page' => $per,
                    'total' => $total,
                    'from' => $total > 0 ? (($page - 1) * $per) + 1 : 0,
                    'to' => $total > 0 ? min($page * $per, $total) : 0,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('NganhTruong index error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi tải dữ liệu',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'idtruong' => 'required|integer|exists:truongdaihoc,idtruong',
            'manganh' => 'required|string|exists:nganhhoc,manganh',
            'hinhthuc' => 'nullable|string|max:100',
            'thoiluong_nam' => 'nullable|integer|min:1|max:10',
            'so_ky' => 'nullable|integer|min:1|max:20',
            'hocphi_ky' => 'nullable|integer|min:0',
            'hocphi_ghichu' => 'nullable|string|max:500',
            'decuong_url' => 'nullable|string|max:255',
            'mota_tomtat' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json(['success'=>false,'message'=>'Dữ liệu không hợp lệ','errors'=>$validator->errors()],422);
        }

        try {
            $row = NganhTruong::create($request->only([
                'idtruong','manganh','hinhthuc','thoiluong_nam','so_ky','hocphi_ky','hocphi_ghichu','decuong_url','mota_tomtat'
            ]));
            return response()->json(['success'=>true,'message'=>'Thêm ngành trường thành công','data'=>$row],201);
        } catch (\Exception $e) {
            return response()->json(['success'=>false,'message'=>'Có lỗi xảy ra khi thêm','error'=>$e->getMessage()],500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $item = NganhTruong::find($id);
        if (!$item) {
            return response()->json(['success'=>false,'message'=>'Không tìm thấy ngành trường'],404);
        }

        $validator = Validator::make($request->all(), [
            'idtruong' => 'required|integer|exists:truongdaihoc,idtruong',
            'manganh' => 'required|string|exists:nganhhoc,manganh',
            'hinhthuc' => 'nullable|string|max:100',
            'thoiluong_nam' => 'nullable|integer|min:1|max:10',
            'so_ky' => 'nullable|integer|min:1|max:20',
            'hocphi_ky' => 'nullable|integer|min:0',
            'hocphi_ghichu' => 'nullable|string|max:500',
            'decuong_url' => 'nullable|string|max:255',
            'mota_tomtat' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json(['success'=>false,'message'=>'Dữ liệu không hợp lệ','errors'=>$validator->errors()],422);
        }

        try {
            $item->fill($request->only([
                'idtruong','manganh','hinhthuc','thoiluong_nam','so_ky','hocphi_ky','hocphi_ghichu','decuong_url','mota_tomtat'
            ]));
            $item->save();
            $item->refresh();
            return response()->json(['success'=>true,'message'=>'Cập nhật ngành trường thành công','data'=>$item]);
        } catch (\Exception $e) {
            return response()->json(['success'=>false,'message'=>'Có lỗi xảy ra khi cập nhật','error'=>$e->getMessage()],500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $item = NganhTruong::find($id);
        if (!$item) {
            return response()->json(['success'=>false,'message'=>'Không tìm thấy ngành trường'],404);
        }

        try {
            $item->delete();
            return response()->json(['success'=>true,'message'=>'Xóa ngành trường thành công']);
        } catch (\Exception $e) {
            return response()->json(['success'=>false,'message'=>'Có lỗi xảy ra khi xóa','error'=>$e->getMessage()],500);
        }
    }
}



























