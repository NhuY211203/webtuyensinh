<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TestPaymentController extends Controller
{
    /**
     * Test tạo QR code ZaloPay đơn giản
     */
    public function testZaloPayQR(Request $request): JsonResponse
    {
        try {
            // Cấu hình ZaloPay từ .env
            $appId = env('ZALOPAY_APP_ID');
            $key1 = env('ZALOPAY_KEY1');
            $endpoint = env('ZALOPAY_ENDPOINT', 'https://sb-openapi.zalopay.vn/v2/create');
            $callbackUrl = env('ZALOPAY_CALLBACK_URL');

            if (!$appId || !$key1) {
                return response()->json([
                    'success' => false,
                    'message' => 'ZaloPay chưa được cấu hình đúng'
                ], 500);
            }

            // Tạo dữ liệu test
            $amount = 50000; // 50k VND
            $orderId = 'TEST_' . time();
            
            // Tạo app_trans_id theo format ZaloPay: YYMMDD_xxxxxx
            $date = date('ymd');
            $random = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            $appTransId = $date . '_' . $random;
            
            // Tạo embed_data và item
            $embedData = json_encode([
                'orderId' => $orderId,
                'test' => true
            ]);
            
            $item = json_encode([
                [
                    'itemid' => 'test_item',
                    'itemname' => 'Test Payment',
                    'itemprice' => $amount,
                    'itemquantity' => 1
                ]
            ]);
            
            $appTime = round(microtime(true) * 1000);
            $appUser = (string) $appId;
            
            // Tạo MAC signature
            $dataString = $appId . '|' . $appTransId . '|' . $appUser . '|' . $amount . '|' . $appTime . '|' . $embedData . '|' . $item;
            $mac = hash_hmac('sha256', $dataString, $key1);
            
            // Tạo request data
            $requestData = [
                'app_id' => (string) $appId,
                'app_trans_id' => $appTransId,
                'app_user' => $appUser,
                'amount' => $amount,
                'app_time' => $appTime,
                'embed_data' => $embedData,
                'item' => $item,
                'description' => 'Test thanh toán ZaloPay',
                'bank_code' => 'zalopayapp',
                'callback_url' => $callbackUrl,
                'mac' => $mac
            ];
            
            Log::info('ZaloPay Test Request', [
                'endpoint' => $endpoint,
                'app_id' => $appId,
                'app_trans_id' => $appTransId,
                'amount' => $amount
            ]);
            
            // Gửi request với SSL verification disabled
            $response = Http::withOptions([
                'verify' => false,
                'timeout' => 30,
            ])->asForm()->post($endpoint, $requestData);
            
            if ($response->successful()) {
                $result = $response->json();
                $returnCode = $result['return_code'] ?? null;
                
                Log::info('ZaloPay Test Response', [
                    'return_code' => $returnCode,
                    'response' => $result
                ]);
                
                if ($returnCode == 1) {
                    // Thành công
                    $orderUrl = $result['order_url'] ?? null;
                    
                    return response()->json([
                        'success' => true,
                        'message' => 'Tạo QR test thành công',
                        'data' => [
                            'orderId' => $orderId,
                            'appTransId' => $appTransId,
                            'qrCodeUrl' => $orderUrl,
                            'qrCodeData' => $orderUrl,
                            'amount' => $amount,
                            'expiryAt' => now()->addMinutes(15)->toISOString(),
                            'isZaloPayQR' => true,
                            'zalopayResponse' => $result
                        ]
                    ]);
                } else {
                    // ZaloPay trả về lỗi
                    return response()->json([
                        'success' => false,
                        'message' => 'ZaloPay API lỗi: ' . ($result['return_message'] ?? 'Unknown error'),
                        'zalopayResponse' => $result
                    ], 400);
                }
            } else {
                // HTTP error
                Log::error('ZaloPay HTTP Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Lỗi kết nối ZaloPay API: HTTP ' . $response->status(),
                    'error' => $response->body()
                ], 500);
            }
            
        } catch (\Exception $e) {
            Log::error('Test ZaloPay QR Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }
}