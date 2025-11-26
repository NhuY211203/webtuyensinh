<?php

namespace App\Services;

use Illuminate\Support\Arr;

class CareerTestService
{
    protected array $questions;
    protected array $groups;
    protected array $optionMeta = [];

    public function __construct()
    {
        $config = config('career_test', []);
        $this->questions = $config['questions'] ?? [];
        $this->groups = $config['groups'] ?? [];
        $this->buildOptionMeta();
    }

    public function getQuestions(): array
    {
        return $this->questions;
    }

    public function getGroups(): array
    {
        return $this->groups;
    }

    public function score(array $optionIds): array
    {
        $scores = [];
        $ignored = [];
        $excluded = [];

        foreach ($optionIds as $optionId) {
            $meta = $this->optionMeta[$optionId] ?? null;
            if ($meta === null) {
                $ignored[] = $optionId;
                continue;
            }

            foreach ($meta['groups'] as $groupCode) {
                $scores[$groupCode] = ($scores[$groupCode] ?? 0) + 1;
            }

            $effects = $meta['effects'] ?? [];
            if (!empty($effects['exclude_groups'])) {
                $reason = $effects['reason'] ?? 'Không phù hợp với năng lực hiện tại.';
                foreach ($effects['exclude_groups'] as $groupCode) {
                    $excluded[$groupCode][] = $reason;
                }
            }
        }

        arsort($scores);

        return [
            'scores' => $scores,
            'ignoredOptions' => $ignored,
            'excludedGroups' => $this->normalizeExcluded($excluded),
        ];
    }

    public function expectedQuestionCount(): int
    {
        return count($this->questions);
    }

    public function groupMeta(string $code): array
    {
        return $this->groups[$code] ?? [];
    }

    public function topGroups(array $scores, int $limit = 3): array
    {
        return array_slice(array_keys($scores), 0, $limit);
    }

    protected function buildOptionMeta(): void
    {
        foreach ($this->questions as $question) {
            foreach ($question['options'] as $option) {
                $optionId = $option['id'];
                $this->optionMeta[$optionId] = [
                    'groups' => Arr::wrap($option['groups'] ?? []),
                    'effects' => $option['effects'] ?? [],
                ];
            }
        }
    }

    protected function normalizeExcluded(array $excluded): array
    {
        foreach ($excluded as $group => $reasons) {
            $excluded[$group] = array_values(array_unique($reasons));
        }
        return $excluded;
    }
}

