<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DebugController extends Controller
{
    /**
     * Kiểm tra cấu hình ZaloPay
     */
    public function checkZaloPayConfig(): JsonResponse
    {
        return response()->json([
            'zalopay_config' => [
                'app_id' => env('ZALOPAY_APP_ID'),
                'key1_exists' => !empty(env('ZALOPAY_KEY1')),
                'key2_exists' => !empty(env('ZALOPAY_KEY2')),
                'endpoint' => env('ZALOPAY_ENDPOINT'),
                'callback_url' => env('ZALOPAY_CALLBACK_URL'),
            ],
            'php_info' => [
                'curl_enabled' => function_exists('curl_init'),
                'openssl_enabled' => extension_loaded('openssl'),
                'php_version' => PHP_VERSION,
            ]
        ]);
    }
    
    /**
     * Tạo QR code đơn giản không cần ZaloPay
     */
    public function generateSimpleQR(): JsonResponse
    {
        $orderId = 'SIMPLE_' . time();
        $amount = 50000;
        
        // Tạo URL giả lập
        $fakeUrl = "https://zalopay.vn/pay?order=" . $orderId . "&amount=" . $amount;
        
        return response()->json([
            'success' => true,
            'message' => 'Tạo QR đơn giản thành công',
            'data' => [
                'orderId' => $orderId,
                'qrCodeUrl' => $fakeUrl,
                'qrCodeData' => $fakeUrl,
                'amount' => $amount,
                'expiryAt' => now()->addMinutes(15)->toISOString(),
                'isZaloPayQR' => false,
                'note' => 'Đây là QR giả lập để test frontend'
            ]
        ]);
    }
    
    /**
     * Test callback để mô phỏng ZaloPay callback
     */
    public function testCallback($orderId): JsonResponse
    {
        try {
            // Mô phỏng callback thành công
            \Cache::put("payment_status_{$orderId}", 'paid', 3600);
            
            return response()->json([
                'success' => true,
                'message' => "Đã test callback thành công cho order {$orderId}",
                'data' => [
                    'orderId' => $orderId,
                    'status' => 'paid'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi test callback: ' . $e->getMessage()
            ], 500);
        }
    }
}