<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function index(): JsonResponse
    {
        $totalUniversities = (int) DB::table('truongdaihoc')->count();
        $totalMajors = (int) DB::table('nganhhoc')->count();

        $years = DB::table('diemchuanxettuyen')
            ->selectRaw('COUNT(DISTINCT namxettuyen) as yearsCount, MAX(namxettuyen) as latestYear')
            ->first();

        return response()->json([
            'universities' => $totalUniversities,
            'majors' => $totalMajors,
            'years' => (int) ($years->yearsCount ?? 0),
            'latestYear' => (int) ($years->latestYear ?? 0),
        ]);
    }
}



