<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use App\Models\KyThiDGNLQuestion;
use App\Models\KyThiDGNLOption;
use App\Models\KyThiDGNLSection;

class AdminDGNLQuestionController extends Controller
{
    /**
     * Danh sách câu hỏi (có thể lọc theo section)
     */
    public function index(Request $request, $idkythi): JsonResponse
    {
        try {
            $query = KyThiDGNLQuestion::whereHas('section', function($q) use ($idkythi) {
                $q->where('idkythi', $idkythi);
            })->with(['section', 'options']);

            // Lọc theo section
            if ($request->has('idsection') && $request->idsection) {
                $query->where('idsection', $request->idsection);
            }

            // Tìm kiếm
            if ($request->has('keyword') && $request->keyword) {
                $keyword = $request->keyword;
                $query->where('noi_dung', 'like', "%{$keyword}%");
            }

            $questions = $query->orderBy('thu_tu')->get();

            return response()->json([
                'success' => true,
                'data' => $questions,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy danh sách câu hỏi',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Chi tiết câu hỏi
     */
    public function show($id): JsonResponse
    {
        try {
            $question = KyThiDGNLQuestion::with(['section', 'options'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $question,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy câu hỏi',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Tạo câu hỏi mới
     */
    public function store(Request $request, $idkythi): JsonResponse
    {
        try {
            // Xử lý options nếu là JSON string
            $data = $request->all();
            if (isset($data['options']) && is_string($data['options'])) {
                $data['options'] = json_decode($data['options'], true);
            }
            // Pre-normalize booleans for validator
            if (isset($data['options']) && is_array($data['options'])) {
                foreach ($data['options'] as $k => $opt) {
                    $data['options'][$k]['is_correct'] = filter_var($opt['is_correct'] ?? false, FILTER_VALIDATE_BOOLEAN);
                }
            }
            // Normalize loai_cau & do_kho to match DB enums
            $allowedTypes = ['single_choice','multiple_choice','true_false'];
            if (!isset($data['loai_cau']) || !in_array($data['loai_cau'], $allowedTypes, true)) {
                $data['loai_cau'] = 'single_choice';
            }
            $allowedDifficulties = ['easy','medium','hard'];
            if (!isset($data['do_kho']) || !in_array($data['do_kho'], $allowedDifficulties, true)) {
                $data['do_kho'] = 'medium';
            }
            // Normalize numeric fields
            if (array_key_exists('diem_mac_dinh', $data)) {
                if ($data['diem_mac_dinh'] === '' || $data['diem_mac_dinh'] === null) {
                    unset($data['diem_mac_dinh']);
                } else {
                    $data['diem_mac_dinh'] = (float) str_replace(',', '.', (string) $data['diem_mac_dinh']);
                }
            }
            if (array_key_exists('thu_tu', $data)) {
                $data['thu_tu'] = ($data['thu_tu'] === '' || $data['thu_tu'] === null) ? 0 : (int) $data['thu_tu'];
            }

            $validator = Validator::make($data, [
                'idsection' => 'required|integer|exists:kythi_dgnl_sections,idsection',
                'noi_dung' => 'required|string',
                'loai_cau' => 'nullable|string|max:50',
                'thu_tu' => 'nullable|integer|min:0',
                'do_kho' => 'nullable|string|max:50',
                'diem_mac_dinh' => 'nullable|numeric|min:0',
                'options' => 'required|array|min:2',
                'options.*.noi_dung' => 'required|string',
                'options.*.is_correct' => 'required|boolean',
                'options.*.thu_tu' => 'nullable|integer|min:0',
                'options.*.loi_giai' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed: ' . json_encode($validator->errors()));
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Kiểm tra section thuộc kỳ thi
            $section = KyThiDGNLSection::where('idkythi', $idkythi)
                ->where('idsection', $data['idsection'])
                ->first();

            if (!$section) {
                return response()->json([
                    'success' => false,
                    'message' => 'Section không thuộc kỳ thi này',
                ], 422);
            }

            // Kiểm tra có ít nhất 1 đáp án đúng
            $options = is_array($data['options']) ? $data['options'] : [];
            $hasCorrect = collect($options)->contains(function($option) {
                return isset($option['is_correct']) && (bool)filter_var($option['is_correct'], FILTER_VALIDATE_BOOLEAN);
            });
            if (!$hasCorrect) {
                return response()->json([
                    'success' => false,
                    'message' => 'Phải có ít nhất 1 đáp án đúng',
                ], 422);
            }

            return DB::transaction(function() use ($data) {
                $question = KyThiDGNLQuestion::create([
                    'idsection' => $data['idsection'],
                    'noi_dung' => $data['noi_dung'],
                    'loai_cau' => $data['loai_cau'],
                    'thu_tu' => $data['thu_tu'],
                    'do_kho' => $data['do_kho'],
                    'diem_mac_dinh' => $data['diem_mac_dinh'] ?? 1,
                ]);

                // Tạo các phương án
                foreach ($data['options'] as $index => $option) {
                    KyThiDGNLOption::create([
                        'idquestion' => $question->idquestion,
                        'noi_dung' => $option['noi_dung'],
                        'is_correct' => filter_var($option['is_correct'] ?? false, FILTER_VALIDATE_BOOLEAN),
                        'thu_tu' => $option['thu_tu'] ?? ($index + 1),
                        'loi_giai' => $option['loi_giai'] ?? null,
                    ]);
                }

                $question->load('options');

                return response()->json([
                    'success' => true,
                    'data' => $question,
                    'message' => 'Tạo câu hỏi thành công',
                ], 201);
            });
        } catch (\Exception $e) {
            Log::error('Error creating question: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Không thể tạo câu hỏi',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật câu hỏi
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $question = KyThiDGNLQuestion::findOrFail($id);

            // Xử lý options nếu là JSON string
            $data = $request->all();
            if (isset($data['options']) && is_string($data['options'])) {
                $data['options'] = json_decode($data['options'], true);
            }

            // Chuẩn hóa giá trị số (tránh trường hợp '10,00' hoặc NaN)
            if (array_key_exists('diem_mac_dinh', $data)) {
                if ($data['diem_mac_dinh'] === null || $data['diem_mac_dinh'] === '' || is_nan((float)$data['diem_mac_dinh'])) {
                    unset($data['diem_mac_dinh']);
                } else {
                    $data['diem_mac_dinh'] = (float)str_replace(',', '.', (string)$data['diem_mac_dinh']);
                }
            }
            if (array_key_exists('thu_tu', $data)) {
                if ($data['thu_tu'] === null || $data['thu_tu'] === '') {
                    unset($data['thu_tu']);
                } else {
                    $data['thu_tu'] = (int)$data['thu_tu'];
                }
            }

            $validator = Validator::make($data, [
                'idsection' => 'sometimes|required|integer|exists:kythi_dgnl_sections,idsection',
                'noi_dung' => 'sometimes|required|string',
                'loai_cau' => 'nullable|string|max:50',
                'thu_tu' => 'nullable|integer|min:0',
                'do_kho' => 'nullable|string|max:50',
                'diem_mac_dinh' => 'nullable|numeric|min:0',
                'options' => 'sometimes|required|array|min:2',
                'options.*.noi_dung' => 'required|string',
                'options.*.is_correct' => 'required|boolean',
                'options.*.thu_tu' => 'nullable|integer|min:0',
                'options.*.loi_giai' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed: ' . json_encode($validator->errors()));
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Kiểm tra có ít nhất 1 đáp án đúng nếu có options
            if (isset($data['options'])) {
                $hasCorrect = collect($data['options'])->contains(function($option) {
                    return isset($option['is_correct']) && ($option['is_correct'] === true || $option['is_correct'] === 'true' || $option['is_correct'] === 1);
                });
                if (!$hasCorrect) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Phải có ít nhất 1 đáp án đúng',
                    ], 422);
                }
            }

            return DB::transaction(function() use ($question, $data) {
                $question->update(array_intersect_key($data, array_flip([
                    'idsection', 'noi_dung', 'loai_cau', 'thu_tu', 'do_kho', 'diem_mac_dinh'
                ])));

                // Cập nhật options nếu có
                if (isset($data['options'])) {
                    // Xóa options cũ
                    KyThiDGNLOption::where('idquestion', $question->idquestion)->delete();

                    // Tạo options mới
                    foreach ($data['options'] as $index => $option) {
                        KyThiDGNLOption::create([
                            'idquestion' => $question->idquestion,
                            'noi_dung' => $option['noi_dung'],
                            'is_correct' => filter_var($option['is_correct'] ?? false, FILTER_VALIDATE_BOOLEAN),
                            'thu_tu' => $option['thu_tu'] ?? ($index + 1),
                            'loi_giai' => $option['loi_giai'] ?? null,
                        ]);
                    }
                }

                $question->load('options');

                return response()->json([
                    'success' => true,
                    'data' => $question,
                    'message' => 'Cập nhật câu hỏi thành công',
                ]);
            });
        } catch (\Exception $e) {
            Log::error('Error updating question: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Không thể cập nhật câu hỏi',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật thông tin cơ bản (không đụng đáp án)
     */
    public function updateBasic(Request $request, $id): JsonResponse
    {
        try {
            $q = KyThiDGNLQuestion::findOrFail($id);
            $data = $request->all();

            // Normalize enums
            $allowedTypes = ['single_choice','multiple_choice','true_false'];
            if (!isset($data['loai_cau']) || !in_array($data['loai_cau'], $allowedTypes, true)) {
                $data['loai_cau'] = 'single_choice';
            }
            $allowedDifficulties = ['easy','medium','hard'];
            if (!isset($data['do_kho']) || !in_array($data['do_kho'], $allowedDifficulties, true)) {
                $data['do_kho'] = 'medium';
            }
            // Normalize numeric
            if (array_key_exists('diem_mac_dinh', $data)) {
                if ($data['diem_mac_dinh'] === '' || $data['diem_mac_dinh'] === null) {
                    unset($data['diem_mac_dinh']);
                } else {
                    $data['diem_mac_dinh'] = (float) str_replace(',', '.', (string) $data['diem_mac_dinh']);
                }
            }
            if (array_key_exists('thu_tu', $data)) {
                $data['thu_tu'] = ($data['thu_tu'] === '' || $data['thu_tu'] === null) ? 0 : (int) $data['thu_tu'];
            }

            $validator = Validator::make($data, [
                'idsection'     => 'sometimes|required|integer|exists:kythi_dgnl_sections,idsection',
                'noi_dung'      => 'sometimes|required|string',
                'loai_cau'      => 'required|string|max:50',
                'do_kho'        => 'required|string|max:50',
                'thu_tu'        => 'nullable|integer|min:0',
                'diem_mac_dinh' => 'nullable|numeric|min:0',
            ]);
            if ($validator->fails()) {
                return response()->json(['success'=>false,'message'=>'Dữ liệu không hợp lệ','errors'=>$validator->errors()],422);
            }

            $q->update(array_intersect_key($data, array_flip(['idsection','noi_dung','loai_cau','do_kho','thu_tu','diem_mac_dinh'])));

            return response()->json(['success'=>true,'data'=>$q,'message'=>'Cập nhật thông tin câu hỏi thành công']);
        } catch (\Throwable $e) {
            return response()->json(['success'=>false,'message'=>'Không thể cập nhật câu hỏi','error'=>$e->getMessage()],500);
        }
    }

    /**
     * Cập nhật đáp án (xóa-tạo lại options)
     */
    public function updateOptions(Request $request, $id): JsonResponse
    {
        try {
            $q = KyThiDGNLQuestion::findOrFail($id);
            $data = $request->all();

            if (isset($data['options']) && is_string($data['options'])) {
                $data['options'] = json_decode($data['options'], true);
            }
            $options = is_array($data['options'] ?? null) ? $data['options'] : [];
            // Keep only options with content
            $options = array_values(array_filter($options, fn($o) => trim((string)($o['noi_dung'] ?? '')) !== ''));
            foreach ($options as $k => $opt) {
                $options[$k]['is_correct'] = filter_var($opt['is_correct'] ?? false, FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make(['options'=>$options], [
                'options'              => 'required|array|min:2',
                'options.*.noi_dung'   => 'required|string',
                'options.*.is_correct' => 'required|boolean',
                'options.*.thu_tu'     => 'nullable|integer|min:0',
                'options.*.loi_giai'   => 'nullable|string',
            ]);
            if ($validator->fails()) {
                return response()->json(['success'=>false,'message'=>'Dữ liệu đáp án không hợp lệ','errors'=>$validator->errors()],422);
            }
            $hasCorrect = collect($options)->contains(fn($o)=> $o['is_correct']===true);
            if (!$hasCorrect) {
                return response()->json(['success'=>false,'message'=>'Phải có ít nhất 1 đáp án đúng'],422);
            }

            return DB::transaction(function() use ($q, $options){
                KyThiDGNLOption::where('idquestion', $q->idquestion)->delete();
                foreach ($options as $i => $opt) {
                    KyThiDGNLOption::create([
                        'idquestion' => $q->idquestion,
                        'noi_dung'   => trim($opt['noi_dung']),
                        'is_correct' => $opt['is_correct'],
                        'thu_tu'     => $opt['thu_tu'] ?? ($i+1),
                        'loi_giai'   => $opt['loi_giai'] ?? null,
                    ]);
                }
                $q->load('options');
                return response()->json(['success'=>true,'data'=>$q,'message'=>'Cập nhật đáp án thành công']);
            });
        } catch (\Throwable $e) {
            return response()->json(['success'=>false,'message'=>'Không thể cập nhật đáp án','error'=>$e->getMessage()],500);
        }
    }

    /**
     * Xóa câu hỏi
     */
    public function destroy($id): JsonResponse
    {
        try {
            $question = KyThiDGNLQuestion::findOrFail($id);

            DB::transaction(function() use ($question) {
                // Xóa options
                KyThiDGNLOption::where('idquestion', $question->idquestion)->delete();
                // Xóa question
                $question->delete();
            });

            return response()->json([
                'success' => true,
                'message' => 'Xóa câu hỏi thành công',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa câu hỏi',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Copy/Duplicate câu hỏi
     */
    public function duplicate($id): JsonResponse
    {
        try {
            $question = KyThiDGNLQuestion::with('options')->findOrFail($id);

            return DB::transaction(function() use ($question) {
                $newQuestion = $question->replicate();
                $newQuestion->save();

                // Copy options
                foreach ($question->options as $option) {
                    $newOption = $option->replicate();
                    $newOption->idquestion = $newQuestion->idquestion;
                    $newOption->save();
                }

                $newQuestion->load('options');

                return response()->json([
                    'success' => true,
                    'data' => $newQuestion,
                    'message' => 'Sao chép câu hỏi thành công',
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể sao chép câu hỏi',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

