<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VaiTroController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\AuthController;

Route::get('/vaitro', [VaiTroController::class, 'index']);
Route::get('/stats', [StatsController::class, 'index']);
Route::get('/truongdaihoc', [CatalogController::class, 'truong']);
Route::get('/nganhhoc', [CatalogController::class, 'nganh']);
Route::get('/tohop-xettuyen', [CatalogController::class, 'tohop']);
Route::get('/diemchuan', [CatalogController::class, 'diemchuan']);

// Authentication routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// User management routes (for admin/staff)
Route::get('/users', [AuthController::class, 'getUsers']);
Route::get('/admin-stats', [AuthController::class, 'getStats']);


