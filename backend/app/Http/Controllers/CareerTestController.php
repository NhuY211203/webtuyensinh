<?php

namespace App\Http\Controllers;

use App\Models\NhomNganh;
use App\Services\CareerTestService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CareerTestController extends Controller
{
    protected CareerTestService $service;

    public function __construct(CareerTestService $service)
    {
        $this->service = $service;
    }

    public function questions(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'totalQuestions' => $this->service->expectedQuestionCount(),
                'groups' => $this->service->getGroups(),
                'questions' => $this->service->getQuestions(),
            ],
        ]);
    }

    public function submit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'answers' => 'required|array|min:1',
        ]);

        $optionIds = $this->extractOptionIds($validated['answers']);
        if (empty($optionIds)) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy lựa chọn hợp lệ trong danh sách trả lời.',
            ], 422);
        }

        $result = $this->service->score($optionIds);
        $rawScores = $result['scores'];
        $scores = $rawScores;

        if (!empty($result['excludedGroups'])) {
            foreach (array_keys($result['excludedGroups']) as $code) {
                unset($scores[$code]);
            }
        }

        if (empty($scores)) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể chấm điểm vì các lựa chọn không hợp lệ hoặc bị bộ lọc học lực loại bỏ.',
                'data' => [
                    'ignoredOptions' => $result['ignoredOptions'],
                    'filteredGroups' => $this->formatFilteredGroups($result['excludedGroups'] ?? [], $this->service->getGroups()),
                ],
            ], 422);
        }

        $topCodes = $this->service->topGroups($scores);
        $groupMeta = $this->service->getGroups();

        $manhomMap = [];
        foreach ($topCodes as $code) {
            $manhom = $groupMeta[$code]['manhom'] ?? null;
            if ($manhom) {
                $manhomMap[$code] = $manhom;
            }
        }

        $records = empty($manhomMap)
            ? collect()
            : NhomNganh::whereIn('manhom', array_values($manhomMap))->get()->keyBy('manhom');

        $groupDetails = [];
        foreach ($topCodes as $code) {
            $meta = $groupMeta[$code] ?? [];
            $manhom = $meta['manhom'] ?? null;
            $record = $manhom && $records->has($manhom) ? $records->get($manhom) : null;

            $groupDetails[] = $this->formatGroupResult(
                $code,
                $scores[$code],
                $meta,
                $record
            );
        }

        return response()->json([
            'success' => true,
            'data' => [
                'primaryGroup' => $groupDetails[0] ?? null,
                'secondaryGroups' => array_slice($groupDetails, 1),
                'scores' => $scores,
                'rawScores' => $rawScores,
                'filteredGroups' => $this->formatFilteredGroups($result['excludedGroups'] ?? [], $groupMeta),
                'expectedQuestions' => $this->service->expectedQuestionCount(),
                'answered' => count($optionIds),
                'ignoredOptions' => $result['ignoredOptions'],
            ],
        ]);
    }

    protected function extractOptionIds(array $answers): array
    {
        $optionIds = [];

        foreach ($answers as $answer) {
            if (is_string($answer)) {
                $optionIds[] = $answer;
                continue;
            }

            if (is_array($answer)) {
                $optionIds[] = $answer['optionId'] ?? $answer['id'] ?? null;
                continue;
            }
        }

        return array_values(array_filter($optionIds));
    }

    protected function formatGroupResult(string $code, int $score, array $meta, $record = null): array
    {
        return [
            'code' => $code,
            'score' => $score,
            'label' => $record->tennhom ?? ($meta['label'] ?? $code),
            'manhom' => $record->manhom ?? ($meta['manhom'] ?? null),
            'description' => $record->mota ?? ($meta['description'] ?? null),
            'database' => $record ? [
                'id' => $record->idnhomnganh,
                'tennhom' => $record->tennhom,
                'mota' => $record->mota,
                'trangthai' => $record->trangthai,
            ] : null,
        ];
    }

    protected function formatFilteredGroups(array $filteredCodes, array $groupMeta): array
    {
        $formatted = [];
        foreach ($filteredCodes as $code => $reasons) {
            $meta = $groupMeta[$code] ?? [];
            $formatted[] = [
                'code' => $code,
                'label' => $meta['label'] ?? $code,
                'reasons' => $reasons,
            ];
        }

        return $formatted;
    }
}

