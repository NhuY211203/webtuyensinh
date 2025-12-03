<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\KyThiDGNL;
use App\Models\KyThiDGNLSection;
use App\Models\KyThiDGNLQuestion;
use App\Models\KyThiDGNLOption;
use App\Models\KyThiDGNLAttempt;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class AdminDGNLController extends Controller
{
    /**
     * Danh sách kỳ thi với tìm kiếm và phân trang
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = KyThiDGNL::query();

            // Tìm kiếm
            if ($request->has('keyword') && $request->keyword) {
                $keyword = $request->keyword;
                $query->where(function($q) use ($keyword) {
                    $q->where('makythi', 'like', "%{$keyword}%")
                      ->orWhere('tenkythi', 'like', "%{$keyword}%")
                      ->orWhere('to_chuc', 'like', "%{$keyword}%");
                });
            }

            // Lọc theo tổ chức
            if ($request->has('to_chuc') && $request->to_chuc) {
                $query->where('to_chuc', $request->to_chuc);
            }

            // Đếm tổng số câu hỏi cho mỗi kỳ thi
            $exams = $query->orderBy('created_at', 'desc')->get();
            
            foreach ($exams as $exam) {
                $exam->tong_so_cau_hoi = KyThiDGNLQuestion::whereHas('section', function($q) use ($exam) {
                    $q->where('idkythi', $exam->idkythi);
                })->count();
                
                $exam->tong_so_section = KyThiDGNLSection::where('idkythi', $exam->idkythi)->count();
            }

            return response()->json([
                'success' => true,
                'data' => $exams,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy danh sách kỳ thi',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Chi tiết kỳ thi
     */
    public function show($id): JsonResponse
    {
        try {
            $exam = KyThiDGNL::findOrFail($id);
            
            // Load sections với số câu hỏi
            $exam->sections = KyThiDGNLSection::where('idkythi', $id)
                ->orderBy('thu_tu')
                ->get()
                ->map(function($section) {
                    $section->so_cau_hoi = KyThiDGNLQuestion::where('idsection', $section->idsection)->count();
                    return $section;
                });

            return response()->json([
                'success' => true,
                'data' => $exam,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy kỳ thi',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Tạo kỳ thi mới
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'makythi' => 'required|string|max:50|unique:kythi_dgnl,makythi',
                'tenkythi' => 'required|string|max:255',
                'to_chuc' => 'nullable|string|max:255',
                'so_cau' => 'nullable|integer|min:0',
                'thoi_luong_phut' => 'nullable|integer|min:0',
                'hinh_thuc' => 'nullable|string|max:100',
                'mo_ta_tong_quat' => 'nullable|string',
                'ghi_chu' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $exam = KyThiDGNL::create($validator->validated());

            return response()->json([
                'success' => true,
                'data' => $exam,
                'message' => 'Tạo kỳ thi thành công',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể tạo kỳ thi',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật kỳ thi
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $exam = KyThiDGNL::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'makythi' => 'sometimes|required|string|max:50|unique:kythi_dgnl,makythi,' . $id . ',idkythi',
                'tenkythi' => 'sometimes|required|string|max:255',
                'to_chuc' => 'nullable|string|max:255',
                'so_cau' => 'nullable|integer|min:0',
                'thoi_luong_phut' => 'nullable|integer|min:0',
                'hinh_thuc' => 'nullable|string|max:100',
                'mo_ta_tong_quat' => 'nullable|string',
                'ghi_chu' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $exam->update($validator->validated());

            return response()->json([
                'success' => true,
                'data' => $exam,
                'message' => 'Cập nhật kỳ thi thành công',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể cập nhật kỳ thi',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa kỳ thi
     */
    public function destroy($id): JsonResponse
    {
        try {
            $exam = KyThiDGNL::findOrFail($id);

            // Kiểm tra xem có lượt làm bài nào không
            $attemptsCount = KyThiDGNLAttempt::where('idkythi', $id)->count();
            if ($attemptsCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể xóa kỳ thi vì đã có lượt làm bài',
                ], 400);
            }

            DB::transaction(function() use ($exam, $id) {
                // Xóa options
                $questionIds = KyThiDGNLQuestion::whereHas('section', function($q) use ($id) {
                    $q->where('idkythi', $id);
                })->pluck('idquestion');
                
                KyThiDGNLOption::whereIn('idquestion', $questionIds)->delete();
                
                // Xóa questions
                KyThiDGNLQuestion::whereHas('section', function($q) use ($id) {
                    $q->where('idkythi', $id);
                })->delete();
                
                // Xóa sections
                KyThiDGNLSection::where('idkythi', $id)->delete();
                
                // Xóa exam
                $exam->delete();
            });

            return response()->json([
                'success' => true,
                'message' => 'Xóa kỳ thi thành công',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa kỳ thi',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Copy/Duplicate kỳ thi
     */
    public function duplicate($id): JsonResponse
    {
        try {
            $exam = KyThiDGNL::findOrFail($id);
            
            return DB::transaction(function() use ($exam) {
                // Tạo kỳ thi mới
                $newExam = $exam->replicate();
                $newExam->makythi = $exam->makythi . '_COPY_' . time();
                $newExam->tenkythi = $exam->tenkythi . ' (Bản sao)';
                $newExam->save();

                // Copy sections
                $sections = KyThiDGNLSection::where('idkythi', $exam->idkythi)->get();
                $sectionMap = [];
                
                foreach ($sections as $section) {
                    $newSection = $section->replicate();
                    $newSection->idkythi = $newExam->idkythi;
                    $newSection->save();
                    $sectionMap[$section->idsection] = $newSection->idsection;
                }

                // Copy questions và options
                foreach ($sections as $section) {
                    $questions = KyThiDGNLQuestion::where('idsection', $section->idsection)->get();
                    
                    foreach ($questions as $question) {
                        $newQuestion = $question->replicate();
                        $newQuestion->idsection = $sectionMap[$section->idsection];
                        $newQuestion->save();

                        // Copy options
                        $options = KyThiDGNLOption::where('idquestion', $question->idquestion)->get();
                        foreach ($options as $option) {
                            $newOption = $option->replicate();
                            $newOption->idquestion = $newQuestion->idquestion;
                            $newOption->save();
                        }
                    }
                }

                return response()->json([
                    'success' => true,
                    'data' => $newExam,
                    'message' => 'Sao chép kỳ thi thành công',
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể sao chép kỳ thi',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Thống kê kỳ thi
     */
    public function statistics($id): JsonResponse
    {
        try {
            $exam = KyThiDGNL::findOrFail($id);
            
            $sections = KyThiDGNLSection::where('idkythi', $id)->get();
            $stats = [
                'tong_so_section' => $sections->count(),
                'tong_so_cau_hoi' => 0,
                'tong_so_luot_lam' => KyThiDGNLAttempt::where('idkythi', $id)->count(),
                'sections' => [],
            ];

            foreach ($sections as $section) {
                $soCau = KyThiDGNLQuestion::where('idsection', $section->idsection)->count();
                $stats['tong_so_cau_hoi'] += $soCau;
                $stats['sections'][] = [
                    'idsection' => $section->idsection,
                    'ten_section' => $section->ten_section,
                    'so_cau_hoi' => $soCau,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy thống kê',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Import từ Excel
     */
    public function import(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:xlsx,xls|max:10240', // 10MB
                'idkythi' => 'required|integer|exists:kythi_dgnl,idkythi',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'File không hợp lệ',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $file = $request->file('file');
            $idkythi = $request->idkythi;
            
            $spreadsheet = IOFactory::load($file->getRealPath());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();

            $imported = 0;
            $errors = [];

            DB::beginTransaction();
            try {
                // Bỏ qua dòng header (dòng 1)
                for ($i = 1; $i < count($rows); $i++) {
                    $row = $rows[$i];
                    
                    // Format: Mã section | Thứ tự | Loại câu | Nội dung | Độ khó | Điểm | 
                    //         Phương án 1 | Đúng/Sai | Lời giải | Phương án 2 | ...
                    
                    if (empty($row[0]) || empty($row[3])) continue; // Bỏ qua dòng trống

                    $maSection = $row[0];
                    $section = KyThiDGNLSection::where('idkythi', $idkythi)
                        ->where('ma_section', $maSection)
                        ->first();

                    if (!$section) {
                        $errors[] = "Dòng " . ($i + 1) . ": Không tìm thấy section với mã '{$maSection}'";
                        continue;
                    }

                    // Tạo câu hỏi
                    $question = KyThiDGNLQuestion::create([
                        'idsection' => $section->idsection,
                        'noi_dung' => $row[3] ?? '',
                        'loai_cau' => $row[2] ?? 'TRAC_NGHIEM',
                        'thu_tu' => $row[1] ?? 0,
                        'do_kho' => $row[4] ?? 'TRUNG_BINH',
                        'diem_mac_dinh' => $row[5] ?? 1,
                    ]);

                    // Thêm các phương án (từ cột 6 trở đi, mỗi 3 cột là 1 phương án)
                    $optionIndex = 6;
                    while ($optionIndex < count($row) && !empty($row[$optionIndex])) {
                        KyThiDGNLOption::create([
                            'idquestion' => $question->idquestion,
                            'noi_dung' => $row[$optionIndex] ?? '',
                            'is_correct' => strtolower($row[$optionIndex + 1] ?? '') === 'đúng' || $row[$optionIndex + 1] === '1',
                            'thu_tu' => ($optionIndex - 6) / 3 + 1,
                            'loi_giai' => $row[$optionIndex + 2] ?? null,
                        ]);
                        $optionIndex += 3;
                    }

                    $imported++;
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => "Import thành công {$imported} câu hỏi",
                    'data' => [
                        'imported' => $imported,
                        'errors' => $errors,
                    ],
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể import file',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export template Excel
     */
    public function exportTemplate(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        try {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Header
            $headers = [
                'Mã Section', 'Thứ tự', 'Loại câu', 'Nội dung câu hỏi', 'Độ khó', 'Điểm',
                'Phương án 1', 'Đúng/Sai', 'Lời giải',
                'Phương án 2', 'Đúng/Sai', 'Lời giải',
                'Phương án 3', 'Đúng/Sai', 'Lời giải',
                'Phương án 4', 'Đúng/Sai', 'Lời giải',
            ];

            $sheet->fromArray([$headers], null, 'A1');

            // Style header
            $sheet->getStyle('A1:P1')->getFont()->setBold(true);
            $sheet->getStyle('A1:P1')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FFE0E0E0');

            // Auto width
            foreach (range('A', 'P') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }

            $writer = new Xlsx($spreadsheet);
            $filename = 'DGNL_Import_Template_' . date('YmdHis') . '.xlsx';

            return response()->streamDownload(function() use ($writer) {
                $writer->save('php://output');
            }, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);
        } catch (\Exception $e) {
            Log::error('Error exporting template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Không thể tạo template',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export dữ liệu kỳ thi ra Excel
     */
    public function export($id): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $exam = KyThiDGNL::findOrFail($id);
        $sections = KyThiDGNLSection::where('idkythi', $id)->orderBy('thu_tu')->get();

        $spreadsheet = new Spreadsheet();

        // Sheet 1: Thông tin kỳ thi
        $sheet1 = $spreadsheet->getActiveSheet();
        $sheet1->setTitle('Thông tin kỳ thi');
        $sheet1->fromArray([
            ['Mã kỳ thi', 'Tên kỳ thi', 'Tổ chức', 'Số câu', 'Thời lượng (phút)', 'Hình thức', 'Mô tả'],
            [
                $exam->makythi,
                $exam->tenkythi,
                $exam->to_chuc,
                $exam->so_cau,
                $exam->thoi_luong_phut,
                $exam->hinh_thuc,
                $exam->mo_ta_tong_quat,
            ],
        ], null, 'A1');

        // Sheet 2: Sections
        $sheet2 = $spreadsheet->createSheet();
        $sheet2->setTitle('Sections');
        $sheet2->fromArray([
            ['Mã Section', 'Tên Section', 'Nhóm năng lực', 'Số câu', 'Thời lượng (phút)', 'Thứ tự', 'Mô tả'],
        ], null, 'A1');

        $sectionData = [];
        foreach ($sections as $section) {
            $sectionData[] = [
                $section->ma_section,
                $section->ten_section,
                $section->nhom_nang_luc,
                $section->so_cau,
                $section->thoi_luong_phut,
                $section->thu_tu,
                $section->mo_ta,
            ];
        }
        $sheet2->fromArray($sectionData, null, 'A2');

        // Sheet 3: Câu hỏi
        $sheet3 = $spreadsheet->createSheet();
        $sheet3->setTitle('Câu hỏi');
        $headers = [
            'Mã Section', 'Thứ tự', 'Loại câu', 'Nội dung câu hỏi', 'Độ khó', 'Điểm',
            'Phương án 1', 'Đúng/Sai', 'Lời giải',
            'Phương án 2', 'Đúng/Sai', 'Lời giải',
            'Phương án 3', 'Đúng/Sai', 'Lời giải',
            'Phương án 4', 'Đúng/Sai', 'Lời giải',
        ];
        $sheet3->fromArray([$headers], null, 'A1');

        $row = 2;
        foreach ($sections as $section) {
            $questions = KyThiDGNLQuestion::where('idsection', $section->idsection)
                ->orderBy('thu_tu')
                ->get();

            foreach ($questions as $question) {
                $options = KyThiDGNLOption::where('idquestion', $question->idquestion)
                    ->orderBy('thu_tu')
                    ->get();

                $rowData = [
                    $section->ma_section,
                    $question->thu_tu,
                    $question->loai_cau,
                    $question->noi_dung,
                    $question->do_kho,
                    $question->diem_mac_dinh,
                ];

                // Thêm các phương án
                for ($i = 0; $i < 4; $i++) {
                    if (isset($options[$i])) {
                        $rowData[] = $options[$i]->noi_dung;
                        $rowData[] = $options[$i]->is_correct ? 'Đúng' : 'Sai';
                        $rowData[] = $options[$i]->loi_giai ?? '';
                    } else {
                        $rowData[] = '';
                        $rowData[] = '';
                        $rowData[] = '';
                    }
                }

                $sheet3->fromArray([$rowData], null, "A{$row}");
                $row++;
            }
        }

        // Style
        foreach ([$sheet1, $sheet2, $sheet3] as $sheet) {
            $sheet->getStyle('A1:' . $sheet->getHighestColumn() . '1')->getFont()->setBold(true);
            $sheet->getStyle('A1:' . $sheet->getHighestColumn() . '1')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FFE0E0E0');
            
            foreach (range('A', $sheet->getHighestColumn()) as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'DGNL_' . $exam->makythi . '_' . date('YmdHis') . '.xlsx';

        return response()->streamDownload(function() use ($writer) {
            $writer->save('php://output');
        }, $filename);
    }
}

