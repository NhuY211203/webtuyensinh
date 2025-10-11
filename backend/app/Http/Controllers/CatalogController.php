<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\TruongDaiHoc;
use App\Models\NganhHoc;
use App\Models\ToHopXetTuyen;
use App\Models\DiemChuanXetTuyen;

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

    public function nganh(Request $request): JsonResponse
    {
        $q = NganhHoc::query();
        if ($request->filled('keyword')) {
            $kw = '%'.$request->string('keyword')->trim().'%' ;
            $q->where('tennganh', 'like', $kw)->orWhere('manganh', 'like', $kw);
        }
        return response()->json($q->paginate((int) $request->integer('perPage', 20)));
    }

    public function tohop(Request $request): JsonResponse
    {
        $q = ToHopXetTuyen::query();
        if ($request->filled('keyword')) {
            $kw = '%'.$request->string('keyword')->trim().'%' ;
            $q->where('ma_to_hop', 'like', $kw)->orWhere('mo_ta', 'like', $kw);
        }
        return response()->json($q->paginate((int) $request->integer('perPage', 20)));
    }

    public function diemchuan(Request $request): JsonResponse
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
        if ($request->filled('tohop')) $q->where('diemchuanxettuyen.tohopmon', 'like', '%'.$request->string('tohop').'%');
        if ($request->filled('keyword')) {
            $kw = '%'.$request->string('keyword')->trim().'%';
            $q->where(function($query) use ($kw) {
                $query->where('truongdaihoc.tentruong', 'like', $kw)
                      ->orWhere('nganhhoc.tennganh', 'like', $kw)
                      ->orWhere('diemchuanxettuyen.tohopmon', 'like', $kw);
            });
        }
        
        return response()->json($q->orderByDesc('diemchuanxettuyen.namxettuyen')->paginate((int) $request->integer('perPage', 20)));
    }
}


