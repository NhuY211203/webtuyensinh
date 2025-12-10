<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\TruongDaiHoc;
use App\Models\NganhHoc;
use App\Models\NhomNganh;
use App\Models\ToHopXetTuyen;
use App\Models\DiemChuanXetTuyen;
use App\Models\PhuongThucXetTuyen;
use App\Models\NganhTruong;
use App\Models\DieuKienTuyenSinh;
use App\Models\CoSoTruong;

class CatalogController extends Controller
{
    public function truong(Request $request): JsonResponse
    {
        $q = TruongDaiHoc::query();
        if ($request->filled('keyword')) {
            $kw = '%'.$request->string('keyword')->trim().'%' ;
            $q->where('tentruong', 'like', $kw)->orWhere('matruong', 'like', $kw);
        }
        return response()->json($q->paginate((int) $request->integer('perPage', 20)));
    }

    // Detail aggregator for a given diemchuan id
    public function diemchuanDetail(int $id): JsonResponse
    {
        // Base row (join school + major meta)
        $base = DiemChuanXetTuyen::query()
            ->leftJoin('truongdaihoc', 'diemchuanxettuyen.idtruong', '=', 'truongdaihoc.idtruong')
            ->leftJoin('nganhhoc', 'diemchuanxettuyen.manganh', '=', 'nganhhoc.manganh')
            ->select(
                'diemchuanxettuyen.*',
                'truongdaihoc.tentruong',
                'truongdaihoc.dienthoai',
                'truongdaihoc.lienhe',
                'truongdaihoc.diachi',
                'nganhhoc.tennganh',
                'nganhhoc.capdo',
                'nganhhoc.bangcap',
                'nganhhoc.motanganh',
                'nganhhoc.mucluong',
                'nganhhoc.xuhuong'
            )
            ->where('diemchuanxettuyen.iddiemchuan', '=', $id)
            ->first();

        if (!$base) {
            return response()->json(['message' => 'Not found'], 404);
        }

        // Additional data
        $nganhTruong = NganhTruong::query()
            ->where('idtruong', $base->idtruong)
            ->where('manganh', $base->manganh)
            ->first();

        // Fetch ALL methods/years conditions for this school + major
        $dieukien = DieuKienTuyenSinh::query()
            ->where('idtruong', $base->idtruong)
            ->where('manganh', $base->manganh)
            ->orderByDesc('nam')
            ->orderBy('idxettuyen')
            ->get(['nam','idxettuyen','ielts_min','chungchi_khac','mon_batbuoc','ghichu']);

        $coso = CoSoTruong::query()
            ->where('idtruong', $base->idtruong)
            ->get(['ten_coso','khuvuc','diachi_coso']);

        // Main campus region
        $mainCampus = CoSoTruong::query()
            ->where('idtruong', $base->idtruong)
            ->where('ten_coso', 'like', '%Cơ sở chính%')
            ->first(['ten_coso','khuvuc','diachi_coso']);

        // Latest score of latest year for this major at this school
        $latestYear = DiemChuanXetTuyen::query()
            ->where('idtruong', $base->idtruong)
            ->where('manganh', $base->manganh)
            ->max('namxettuyen');
        $latest = null;
        if ($latestYear) {
            $latest = DiemChuanXetTuyen::query()
                ->where('idtruong', $base->idtruong)
                ->where('manganh', $base->manganh)
                ->where('namxettuyen', $latestYear)
                ->orderByDesc('diemchuan')
                ->first(['namxettuyen','diemchuan','tohopmon','idxettuyen']);
        }

        // Related suggestions
        $relatedSameSchool = NganhTruong::query()
            ->where('idtruong', $base->idtruong)
            ->where('manganh', '!=', $base->manganh)
            ->limit(6)
            ->get(['manganh','mota_tomtat']);

        $relatedSameCode = NganhTruong::query()
            ->leftJoin('truongdaihoc', 'nganh_truong.idtruong', '=', 'truongdaihoc.idtruong')
            ->where('nganh_truong.manganh', $base->manganh)
            ->where('nganh_truong.idtruong', '!=', $base->idtruong)
            ->limit(6)
            ->get(['nganh_truong.idtruong', 'truongdaihoc.tentruong']);

        // Distinct admission methods for this major at this school
        $methods = DiemChuanXetTuyen::query()
            ->where('idtruong', $base->idtruong)
            ->where('manganh', $base->manganh)
            ->distinct()
            ->orderBy('idxettuyen')
            ->pluck('idxettuyen');

        return response()->json([
            'data' => [
                'detail' => $base,
                'nganh_truong' => $nganhTruong,
                'dieukien' => $dieukien,
                'coso' => $coso,
                'main_campus' => $mainCampus,
                'latest' => $latest,
                'related_same_school' => $relatedSameSchool,
                'related_same_code' => $relatedSameCode,
                'methods' => $methods,
            ]
        ]);
    }

    public function nganh(Request $request): JsonResponse
    {
        $q = NganhHoc::query();
        if ($request->filled('keyword')) {
            $kw = '%'.$request->string('keyword')->trim().'%' ;
            $q->where('tennganh', 'like', $kw)->orWhere('manganh', 'like', $kw);
        }
        return response()->json($q->paginate((int) $request->integer('perPage', 20)));
    }

    // Trả về toàn bộ danh sách ngành (đơn giản, không phân trang)
    public function majorsAll(Request $request): JsonResponse
    {
        $q = NganhHoc::query()->orderBy('tennganh');
        if ($request->filled('keyword')) {
            $kw = '%'.$request->string('keyword')->trim().'%' ;
            $q->where('tennganh', 'like', $kw)->orWhere('manganh', 'like', $kw);
        }
        $rows = $q->get(['manganh','tennganh']);
        return response()->json(['data' => $rows]);
    }

    // Danh sách ngành xuất phát từ bảng diemchuanxettuyen (distinct), có thể lọc theo tổ hợp/idxettuyen
    public function majors(Request $request): JsonResponse
    {
        $q = DiemChuanXetTuyen::query()
            ->leftJoin('nganhhoc', 'diemchuanxettuyen.manganh', '=', 'nganhhoc.manganh')
            ->select('diemchuanxettuyen.manganh', 'nganhhoc.tennganh')
            ->distinct();

        if ($request->filled('tohop')) {
            $q->where('diemchuanxettuyen.tohopmon', 'like', '%'.$request->string('tohop')->trim().'%');
        }
        if ($request->filled('idxettuyen')) {
            $q->where('diemchuanxettuyen.idxettuyen', $request->integer('idxettuyen'));
        }
        if ($request->filled('keyword')) {
            $kw = '%'.$request->string('keyword')->trim().'%';
            $q->where(function($w) use ($kw){
                $w->where('nganhhoc.tennganh','like',$kw)->orWhere('diemchuanxettuyen.manganh','like',$kw);
            });
        }

        $rows = $q->orderBy('nganhhoc.tennganh')->get();
        return response()->json(['data' => $rows]);
    }

    public function tohop(Request $request): JsonResponse
    {
        // Nếu có manganh, lấy tổ hợp từ bảng diemchuanxettuyen cho ngành đó
        if ($request->filled('manganh')) {
            $q = DiemChuanXetTuyen::query()
                ->where('manganh', $request->string('manganh')->trim());
            
            // Optional filters
            if ($request->filled('idtruong')) {
                $q->where('idtruong', $request->integer('idtruong'));
            }
            if ($request->filled('idxettuyen')) {
                $q->where('idxettuyen', $request->integer('idxettuyen'));
            }
            if ($request->filled('nam')) {
                $q->where('namxettuyen', $request->integer('nam'));
            }
            
            $rows = $q->get(['tohopmon']);

            // Tách và chuẩn hoá danh sách tổ hợp
            $codes = [];
            foreach ($rows as $r) {
                $parts = array_filter(array_map('trim', explode(';', (string) $r->tohopmon)));
                foreach ($parts as $c) { $codes[$c] = true; }
            }
            $codes = array_keys($codes);

            // Ghép mô tả từ bảng tohop_xettuyen nếu có
            $meta = ToHopXetTuyen::query()->whereIn('ma_to_hop', $codes)->get(['ma_to_hop','mo_ta'])->keyBy('ma_to_hop');
            $data = array_map(function($code) use ($meta){
                $desc = optional($meta->get($code))->mo_ta;
                return [
                    'code' => $code,
                    'label' => $desc ? ($code.' - '.$desc) : $code,
                    'ma_to_hop' => $code,
                    'mo_ta' => $desc
                ];
            }, $codes);

            return response()->json(['data' => $data]);
        }

        // Ngược lại: trả về danh mục tổ hợp như cũ (có thể lọc keyword)
        $q = ToHopXetTuyen::query();
        if ($request->filled('keyword')) {
            $kw = '%'.$request->string('keyword')->trim().'%' ;
            $q->where('ma_to_hop', 'like', $kw)->orWhere('mo_ta', 'like', $kw);
        }
        return response()->json($q->paginate((int) $request->integer('perPage', 20)));
    }

    // Danh sách ngành có xét tuyển theo một tổ hợp cụ thể (distinct)
    public function majorsByCombo(Request $request): JsonResponse
    {
        $tohop = $request->string('tohop')->trim();
        if (!$tohop) {
            return response()->json(['data' => []]);
        }
        $rows = DiemChuanXetTuyen::query()
            ->leftJoin('nganhhoc', 'diemchuanxettuyen.manganh', '=', 'nganhhoc.manganh')
            ->where('diemchuanxettuyen.tohopmon', 'like', '%'.$tohop.'%')
            ->distinct()
            ->orderBy('nganhhoc.tennganh')
            ->get(['diemchuanxettuyen.manganh','nganhhoc.tennganh']);
        $data = $rows->map(fn($r)=>[
            'manganh' => $r->manganh,
            'tennganh' => $r->tennganh,
        ])->values();
        return response()->json(['data' => $data]);
    }

    public function diemchuan(Request $request): JsonResponse
    {
        $q = DiemChuanXetTuyen::query()
            ->leftJoin('truongdaihoc', 'diemchuanxettuyen.idtruong', '=', 'truongdaihoc.idtruong')
            ->leftJoin('nganhhoc', 'diemchuanxettuyen.manganh', '=', 'nganhhoc.manganh')
            ->leftJoin('nganh_truong', function($join) {
                $join->on('diemchuanxettuyen.idtruong', '=', 'nganh_truong.idtruong')
                     ->on('diemchuanxettuyen.manganh', '=', 'nganh_truong.manganh');
            })
            ->select(
                'diemchuanxettuyen.*',
                'truongdaihoc.tentruong',
                'nganhhoc.tennganh',
                'nganh_truong.thoiluong_nam',
                'nganh_truong.mota_tomtat'
            );
            
        if ($request->filled('idtruong')) $q->where('diemchuanxettuyen.idtruong', $request->integer('idtruong'));
        if ($request->filled('manganh')) $q->where('diemchuanxettuyen.manganh', $request->string('manganh'));
        if ($request->filled('nam')) $q->where('diemchuanxettuyen.namxettuyen', $request->integer('nam'));
        if ($request->filled('tohop')) $q->where('diemchuanxettuyen.tohopmon', 'like', '%'.$request->string('tohop').'%');
        if ($request->filled('idxettuyen')) {
            $idxettuyen = (int) $request->input('idxettuyen');
            if ($idxettuyen >= 1 && $idxettuyen <= 4) {
                $q->where('diemchuanxettuyen.idxettuyen', $idxettuyen);
            }
        }
        // If manganh is provided, we don't need to search by tennganh in keyword
        // Only search in tentruong and tohopmon
        if ($request->filled('keyword')) {
            $kw = '%'.$request->string('keyword')->trim().'%';
            $hasManganh = $request->filled('manganh');
            $q->where(function($query) use ($kw, $hasManganh) {
                $query->where('truongdaihoc.tentruong', 'like', $kw)
                      ->orWhere('diemchuanxettuyen.tohopmon', 'like', $kw);
                // Only search in tennganh if manganh is not provided
                if (!$hasManganh) {
                    $query->orWhere('nganhhoc.tennganh', 'like', $kw);
                }
            });
        }
        
        return response()->json($q->orderByDesc('diemchuanxettuyen.namxettuyen')->paginate((int) $request->integer('perPage', 20)));
    }

    /**
     * Export diem chuan without pagination (supports same filters as list)
     */
    public function exportDiemchuan(Request $request): JsonResponse
    {
        $q = DiemChuanXetTuyen::query()
            ->leftJoin('truongdaihoc', 'diemchuanxettuyen.idtruong', '=', 'truongdaihoc.idtruong')
            ->leftJoin('nganhhoc', 'diemchuanxettuyen.manganh', '=', 'nganhhoc.manganh')
            ->select(
                'diemchuanxettuyen.*',
                'truongdaihoc.tentruong',
                'nganhhoc.tennganh'
            );

        if ($request->filled('idtruong')) $q->where('diemchuanxettuyen.idtruong', $request->integer('idtruong'));
        if ($request->filled('manganh')) $q->where('diemchuanxettuyen.manganh', $request->string('manganh'));
        if ($request->filled('nam')) $q->where('diemchuanxettuyen.namxettuyen', $request->integer('nam'));
        if ($request->filled('idxettuyen')) $q->where('diemchuanxettuyen.idxettuyen', $request->integer('idxettuyen'));
        if ($request->filled('keyword')) {
            $kw = '%'.$request->string('keyword')->trim().'%';
            $q->where(function($query) use ($kw) {
                $query->where('truongdaihoc.tentruong', 'like', $kw)
                      ->orWhere('nganhhoc.tennganh', 'like', $kw)
                      ->orWhere('diemchuanxettuyen.tohopmon', 'like', $kw);
            });
        }

        $rows = $q->orderByDesc('diemchuanxettuyen.namxettuyen')->get();

        return response()->json([
            'success' => true,
            'data' => $rows,
            'total' => $rows->count()
        ]);
    }

    public function storeDiemchuan(Request $request): JsonResponse
    {
        try {
            // Validate required fields
            $request->validate([
                'idtruong' => 'required|integer',
                'manganh' => 'required|string|max:20',
                'idxettuyen' => 'required|integer|min:1|max:4',
                'tohopmon' => 'required|string|max:100',
                'diemchuan' => 'required|numeric|min:0|max:30',
                'namxettuyen' => 'required|integer|min:2020|max:2030',
                'ghichu' => 'nullable|string|max:500'
            ]);

            // Create new record
            $diemchuan = DiemChuanXetTuyen::create([
                'idtruong' => $request->integer('idtruong'),
                'manganh' => $request->string('manganh')->trim(),
                'idxettuyen' => $request->integer('idxettuyen'),
                'tohopmon' => $request->string('tohopmon')->trim(),
                'diemchuan' => $request->string('diemchuan'),
                'namxettuyen' => $request->integer('namxettuyen'),
                'ghichu' => $request->filled('ghichu') ? $request->string('ghichu')->trim() : null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Dữ liệu điểm chuẩn đã được thêm thành công',
                'data' => $diemchuan
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi thêm dữ liệu',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import diem chuan from CSV
     * Headers supported (aliases in VN): idtruong, manganh, idxettuyen, tohopmon, diemchuan, namxettuyen, ghichu
     */
    public function importDiemchuan(Request $request): JsonResponse
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
                    'truong' => 'idtruong',
                    'id truong' => 'idtruong',
                    'mã ngành' => 'manganh',
                    'ma nganh' => 'manganh',
                    'phuong thuc' => 'idxettuyen',
                    'phương thức' => 'idxettuyen',
                    'to hop' => 'tohopmon',
                    'tổ hợp' => 'tohopmon',
                    'diem' => 'diemchuan',
                    'điểm' => 'diemchuan',
                    'nam' => 'namxettuyen',
                    'năm' => 'namxettuyen',
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
                        'idtruong' => isset($data['idtruong']) && $data['idtruong'] !== '' ? (int)$data['idtruong'] : null,
                        'manganh' => trim((string)($data['manganh'] ?? '')),
                        'idxettuyen' => (int) ($data['idxettuyen'] ?? 0),
                        'tohopmon' => trim((string)($data['tohopmon'] ?? '')),
                        'diemchuan' => (string) ($data['diemchuan'] ?? ''),
                        'namxettuyen' => (int) ($data['namxettuyen'] ?? 0),
                        'ghichu' => isset($data['ghichu']) ? (string) $data['ghichu'] : null,
                    ];

                    if (!$payload['idtruong'] || !$payload['manganh'] || !$payload['idxettuyen'] || !$payload['tohopmon'] || $payload['diemchuan'] === '' || !$payload['namxettuyen']) {
                        $failed++; $errors[] = "Dòng {$rowIndex}: thiếu cột bắt buộc"; continue;
                    }

                    $existing = \App\Models\DiemChuanXetTuyen::where('idtruong',$payload['idtruong'])
                        ->where('manganh',$payload['manganh'])
                        ->where('idxettuyen',$payload['idxettuyen'])
                        ->where('tohopmon',$payload['tohopmon'])
                        ->where('namxettuyen',$payload['namxettuyen'])
                        ->first();

                    if ($existing) {
                        $existing->fill($payload);
                        $existing->save();
                        $updated++;
                    } else {
                        \App\Models\DiemChuanXetTuyen::create($payload);
                        $created++;
                    }
                } catch (\Throwable $te) {
                    $failed++; $errors[] = "Dòng {$rowIndex}: ".$te->getMessage();
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

    public function phuongthuc(Request $request): JsonResponse
    {
        $q = PhuongThucXetTuyen::query();
        if ($request->filled('keyword')) {
            $kw = '%'.$request->string('keyword')->trim().'%' ;
            $q->where('tenptxt', 'like', $kw);
        }
        return response()->json($q->orderBy('idxettuyen')->paginate((int) $request->integer('perPage', 50)));
    }

    /**
     * Get distinct years from diemchuanxettuyen and nganh_truong tables
     */
    public function years(Request $request): JsonResponse
    {
        // Get years from diemchuanxettuyen (namxettuyen column)
        $q1 = DiemChuanXetTuyen::query()
            ->select('namxettuyen')
            ->distinct();
        
        // Get years from nganh_truong (nam column)
        $q2 = NganhTruong::query()
            ->select('nam')
            ->whereNotNull('nam')
            ->distinct();
        
        // Optional: filter by school if provided
        if ($request->filled('idtruong')) {
            $idtruong = $request->integer('idtruong');
            $q1->where('idtruong', $idtruong);
            $q2->where('idtruong', $idtruong);
        }
        
        // Optional: filter by major if provided
        if ($request->filled('manganh')) {
            $manganh = $request->string('manganh');
            $q1->where('manganh', $manganh);
            $q2->where('manganh', $manganh);
        }
        
        // Get years from both tables
        $years1 = $q1->pluck('namxettuyen')->filter()->values();
        $years2 = $q2->pluck('nam')->filter()->values();
        
        // Combine and get unique years, sorted descending
        $allYears = $years1->merge($years2)->unique()->sortDesc()->values();
        
        return response()->json([
            'success' => true,
            'data' => $allYears->map(fn($year) => [
                'value' => (string) $year,
                'label' => (string) $year
            ])->toArray()
        ]);
    }

    public function nhomNganh(Request $request): JsonResponse
    {
        try {
            // Return groups with their majors (simple join/group). If database lacks relation, do two queries
            $groups = NhomNganh::query()->where('trangthai', 1)->orderBy('tennhom')->get([
                'idnhomnganh','manhom','tennhom'
            ]);

            // Fetch majors optionally filtered by keyword and school
            $majorsQ = NganhHoc::query();
            
            // If idtruong is provided, only get majors that the school offers
            if ($request->filled('idtruong')) {
                $idtruong = $request->integer('idtruong');
                // Use join instead of whereIn subquery for better performance
                $majorsQ->join('nganh_truong', 'nganhhoc.manganh', '=', 'nganh_truong.manganh')
                        ->where('nganh_truong.idtruong', $idtruong)
                        ->distinct(); // Avoid duplicates if a major appears multiple times
            }
            
            if ($request->filled('keyword')) {
                $kw = '%'.$request->string('keyword')->trim().'%';
                $majorsQ->where(function($q) use ($kw) {
                    $q->where('nganhhoc.tennganh','like',$kw)
                      ->orWhere('nganhhoc.manganh','like',$kw);
                });
            }
            // If schema has idnhomnganh on nganhhoc, include it; otherwise, default null
            $majors = $majorsQ->get(['nganhhoc.idnganh','nganhhoc.manganh','nganhhoc.tennganh','nganhhoc.idnhomnganh']);

            // Group
            $groupIdToItems = [];
            foreach ($majors as $m) {
                $gid = $m->idnhomnganh ?? null;
                if (!$gid) continue;
                if (!isset($groupIdToItems[$gid])) $groupIdToItems[$gid] = [];
                $groupIdToItems[$gid][] = [
                    'id' => $m->idnganh,
                    'code' => $m->manganh,
                    'name' => $m->tennganh,
                ];
            }

            $result = $groups->map(function($g) use ($groupIdToItems) {
                return [
                    'id' => $g->idnhomnganh,
                    'code' => $g->manhom,
                    'name' => $g->tennhom,
                    'majors' => $groupIdToItems[$g->idnhomnganh] ?? []
                ];
            })->filter(function($g) {
                // Only return groups that have at least one major
                return count($g['majors']) > 0;
            })->values();

            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách nhóm ngành: ' . $e->getMessage()
            ], 500);
        }
    }

    // ---------------- Prediction API ----------------
    public function predict(Request $request): JsonResponse
    {
        $idx = (int) $request->integer('idxettuyen'); // 1=THPT, 2=Học bạ, 3=ĐGNL, 4=Kết hợp
        $tohop = trim((string) $request->input('tohop'));
        $nam = (int) ($request->integer('nam', 2024));
        $manganh = $request->input('manganh');
        $scores = (array) ($request->input('scores') ?? []);
        $bonuses = (array) ($request->input('bonuses') ?? []);
        $weights = (array) ($request->input('weights') ?? []);

        if (!$idx || !$tohop) {
            return response()->json(['message' => 'Thiếu idxettuyen hoặc tohop'], 422);
        }

        // 1) Compute total score (simple model; can be extended by quy chế)
        $total = 0.0; $note = '';
        if ($idx === 1) { // THPT
            $m1 = (float) ($scores['m1'] ?? 0); $m2 = (float) ($scores['m2'] ?? 0); $m3 = (float) ($scores['m3'] ?? 0);
            $total = $m1 + $m2 + $m3;
        } elseif ($idx === 2) { // Học bạ
            $m1 = (float) ($scores['m1'] ?? 0); $m2 = (float) ($scores['m2'] ?? 0); $m3 = (float) ($scores['m3'] ?? 0);
            $total = $m1 + $m2 + $m3;
        } elseif ($idx === 3) { // ĐGNL
            $total = (float) ($scores['dgnl'] ?? 0);
            $note = 'ĐGNL (chưa quy đổi)';
        } else { // Kết hợp
            $gpa12 = (float) ($scores['gpa12'] ?? 0);
            $total = min(30.0, $gpa12 * 3.0);
        }

        // Apply bonuses if provided (very simple)
        $total += (float) ($bonuses['uutien'] ?? 0);

        // If weights present and appliesTo includes current tohop, we can adjust
        foreach ($weights as $w) {
            $applies = isset($w['appliesTo']) && is_array($w['appliesTo']) ? $w['appliesTo'] : [];
            if (in_array($tohop, $applies, true)) {
                // Example: if subject name matches we might re-weight m1/m2/m3 (omitted: requires subject mapping)
                $note = trim(($note ? $note.'; ' : '').'Áp dụng hệ số (ước lượng)');
            }
        }

        // 2) Fetch thresholds from DB
        $q = DiemChuanXetTuyen::query()
            ->leftJoin('truongdaihoc', 'diemchuanxettuyen.idtruong', '=', 'truongdaihoc.idtruong')
            ->leftJoin('nganhhoc', 'diemchuanxettuyen.manganh', '=', 'nganhhoc.manganh')
            ->where('diemchuanxettuyen.idxettuyen', $idx)
            ->where('diemchuanxettuyen.namxettuyen', $nam)
            ->where('diemchuanxettuyen.tohopmon', 'like', '%'.$tohop.'%');
        if (!empty($manganh)) {
            $q->where('diemchuanxettuyen.manganh', $manganh);
        }
        // Ưu tiên lấy các ngưỡng thấp nhất trước để tăng khả năng đậu
        $q->orderBy('diemchuanxettuyen.diemchuan', 'asc');
        $rows = $q->limit(100)->get([
            'diemchuanxettuyen.idtruong',
            'truongdaihoc.tentruong',
            'diemchuanxettuyen.manganh',
            'nganhhoc.tennganh',
            'diemchuanxettuyen.tohopmon',
            'diemchuanxettuyen.diemchuan',
            'diemchuanxettuyen.ghichu'
        ]);

        $rankings = [];
        foreach ($rows as $i => $r) {
            $threshold = (float) ($r->diemchuan ?? 0);
            $delta = $total - $threshold;
            $prob = $this->mapDeltaToProb($delta);
            $rankings[] = [
                'rank' => $i + 1,
                'truong' => $r->tentruong ?? $r->idtruong,
                'manganh' => $r->manganh,
                'tennganh' => $r->tennganh,
                'phuongthuc' => $idx,
                'tohop' => $tohop,
                'diemchuan' => round($threshold, 2),
                'delta' => round($delta, 2),
                'prob' => round($prob, 2),
                'level' => $this->mapProbToLevel($prob),
                'ghichu' => $r->ghichu,
            ];
        }
        usort($rankings, function($a,$b){
            if ($b['prob'] === $a['prob']) {
                return $b['delta'] <=> $a['delta'];
            }
            return $b['prob'] <=> $a['prob'];
        });
        $rankings = array_slice($rankings, 0, 10);

        // Summary
        $deltas = array_map(fn($r)=>$r['delta'], $rankings);
        sort($deltas);
        $median = count($deltas) ? $deltas[(int) floor(count($deltas)/2)] : 0.0;
        $verdict = $this->mapDeltaToVerdict($median);

        return response()->json([
            'summary' => [
                'idxettuyen' => $idx,
                'tohop' => $tohop,
                'total_score' => round($total, 2),
                'bonus' => (float) ($bonuses['uutien'] ?? 0),
                'note' => $note,
                'verdict' => $verdict,
                'delta_vs_median' => round((float) $median, 2)
            ],
            'rankings' => $rankings,
            'alternatives' => [
                'tohop_khac' => [],
                'phuongthuc_khac' => []
            ]
        ]);
    }

    private function mapDeltaToProb(float $delta): float
    {
        // Logistic mapping for smoother probability
        $k = 1.5; // sensitivity
        $p = 1.0 / (1.0 + exp(-$k * $delta));
        // Keep within [0.02, 0.99] to avoid extremes
        if ($p < 0.02) $p = 0.02;
        if ($p > 0.99) $p = 0.99;
        return $p;
    }

    private function mapDeltaToVerdict(float $delta): string
    {
        if ($delta >= 1.5) return 'Rất cao';
        if ($delta >= 0.5) return 'Cao';
        if ($delta >= -0.5) return 'Cân bằng';
        if ($delta >= -1.49) return 'Thấp';
        return 'Rất thấp';
    }

    private function mapProbToLevel(float $prob): string
    {
        if ($prob >= 0.90) return 'An toàn';
        if ($prob >= 0.70) return 'Nên thử';
        if ($prob >= 0.40) return 'Cân nhắc';
        return 'Khó';
    }

    // ---------------- Trend Analysis API ----------------
    /**
     * Get score trends for a specific school and major across multiple years
     */
    public function xuHuongDiemChuan(Request $request): JsonResponse
    {
        try {
            $idtruong = $request->integer('idtruong');
            $manganh = $request->string('manganh');
            $tuNam = $request->integer('tu_nam', 2020);
            $denNam = $request->integer('den_nam', 2024);
            $idxettuyen = $request->integer('idxettuyen');
            $tohop = $request->string('tohop');

            // Build query from the trend view
            $q = DB::table('v_diemchuan_xuhuong')
                ->whereBetween('namxettuyen', [$tuNam, $denNam])
                ->orderBy('tentruong')
                ->orderBy('tennganh')
                ->orderBy('namxettuyen');

            // Apply filters
            if ($idtruong) {
                $q->where('idtruong', $idtruong);
            }
            if ($manganh) {
                $q->where('manganh', $manganh);
            }
            if ($idxettuyen) {
                $q->where('idxettuyen', $idxettuyen);
            }
            if ($tohop) {
                $q->where('tohopmon', 'like', '%' . $tohop . '%');
            }

            $trends = $q->get();

            // Group by school and major for better organization
            $grouped = [];
            foreach ($trends as $trend) {
                $key = $trend->idtruong . '_' . $trend->manganh;
                if (!isset($grouped[$key])) {
                    $grouped[$key] = [
                        'idtruong' => $trend->idtruong,
                        'tentruong' => $trend->tentruong,
                        'manganh' => $trend->manganh,
                        'tennganh' => $trend->tennganh,
                        'data' => []
                    ];
                }
                $grouped[$key]['data'][] = [
                    'namxettuyen' => $trend->namxettuyen,
                    'diemchuan' => (float) $trend->diemchuan,
                    'tohopmon' => $trend->tohopmon,
                    'diem_nam_truoc' => $trend->diem_nam_truoc ? (float) $trend->diem_nam_truoc : null,
                    'bien_dong' => $trend->bien_dong ? (float) $trend->bien_dong : null,
                    'xu_huong' => $trend->xu_huong
                ];
            }

            return response()->json([
                'success' => true,
                'data' => array_values($grouped),
                'summary' => [
                    'total_records' => count($trends),
                    'schools_count' => count(array_unique(array_column($trends->toArray(), 'idtruong'))),
                    'majors_count' => count(array_unique(array_column($trends->toArray(), 'manganh'))),
                    'year_range' => [$tuNam, $denNam]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy xu hướng điểm chuẩn: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get trend statistics overview
     */
    public function thongKeXuHuong(Request $request): JsonResponse
    {
        try {
            $nam = $request->integer('nam', 2024);

            // Get trend statistics for the specified year
            $stats = DB::table('v_diemchuan_xuhuong')
                ->select('xu_huong', DB::raw('COUNT(*) as so_luong'), DB::raw('ROUND(AVG(bien_dong), 2) as bien_dong_tb'))
                ->where('namxettuyen', $nam)
                ->whereNotNull('bien_dong')
                ->groupBy('xu_huong')
                ->orderByDesc('so_luong')
                ->get();

            // Get top majors with strongest trends
            $tangManh = DB::table('v_diemchuan_xuhuong')
                ->where('namxettuyen', $nam)
                ->where('xu_huong', 'Tăng mạnh')
                ->orderByDesc('bien_dong')
                ->limit(5)
                ->get(['tentruong', 'tennganh', 'bien_dong']);

            $giamManh = DB::table('v_diemchuan_xuhuong')
                ->where('namxettuyen', $nam)
                ->where('xu_huong', 'Giảm mạnh')
                ->orderBy('bien_dong')
                ->limit(5)
                ->get(['tentruong', 'tennganh', 'bien_dong']);

            return response()->json([
                'success' => true,
                'data' => [
                    'nam' => $nam,
                    'tong_quan' => $stats,
                    'tang_manh_nhat' => $tangManh,
                    'giam_manh_nhat' => $giamManh
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy thống kê xu hướng: ' . $e->getMessage()
            ], 500);
        }
    }
}


