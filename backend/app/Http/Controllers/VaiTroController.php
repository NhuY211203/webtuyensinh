<?php

namespace App\Http\Controllers;

use App\Models\VaiTro;
use Illuminate\Http\JsonResponse;

class VaiTroController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = VaiTro::query()
            ->orderBy('idvaitro')
            ->get();

        return response()->json($roles);
    }
}


