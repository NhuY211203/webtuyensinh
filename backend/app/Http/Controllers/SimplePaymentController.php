<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SimplePaymentController extends Controller
{
    /**
     * Tạo QR code ZaloPay đơn giản (không cần database)
     */
    public function generateZaloPayQR(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'amount' => 'nullable|integer|min:1000', // Tối thiểu 1000 VND
                'description' => 'nullable|string|max:255',
            ]);

            $amount = $request->integer('amount', 50000); // Mặc định 50k
            $description = $request->string('description', 'Thanh toán qua ZaloPay');
            
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

            // Tạo orderId và app_trans_id
            $orderId = 'PAY_' . time() . '_' . rand(1000, 9999);
            $date = date('ymd');
            $random = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            $appTransId = $date . '_' . $random;
            
            // Tạo embed_data và item
            $embedData = json_encode([
                'orderId' => $orderId,
                'redirecturl' => env('ZALOPAY_REDIRECT_URL', 'http://localhost:5173/payment/success')
            ]);
            
            $item = json_encode([
                [
                    'itemid' => 'payment_item',
                    'itemname' => $description,
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
                'description' => $description,
                'bank_code' => 'zalopayapp',
                'callback_url' => $callbackUrl,
                'mac' => $mac
            ];
            
            Log::info('ZaloPay Simple Request', [
                'orderId' => $orderId,
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
                
                Log::info('ZaloPay Simple Response', [
                    'return_code' => $returnCode,
                    'response' => $result
                ]);
                
                if ($returnCode == 1) {
                    // Thành công
                    $orderUrl = $result['order_url'] ?? null;
                    
                    return response()->json([
                        'success' => true,
                        'message' => 'Tạo QR code thành công',
                        'data' => [
                            'orderId' => $orderId,
                            'appTransId' => $appTransId,
                            'qrCodeUrl' => $orderUrl,
                            'qrCodeData' => $orderUrl,
                            'amount' => $amount,
                            'description' => $description,
                            'expiryAt' => now()->addMinutes(15)->toISOString(),
                            'isZaloPayQR' => true,
                            'zpTransToken' => $result['zp_trans_token'] ?? null
                        ]
                    ]);
                } else {
                    // ZaloPay trả về lỗi
                    return response()->json([
                        'success' => false,
                        'message' => 'ZaloPay API lỗi: ' . ($result['return_message'] ?? 'Unknown error'),
                        'error_code' => $returnCode,
                        'zalopayResponse' => $result
                    ], 400);
                }
            } else {
                // HTTP error
                Log::error('ZaloPay Simple HTTP Error', [
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
            Log::error('Simple ZaloPay QR Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Callback từ ZaloPay (đơn giản)
     */
    public function zalopayCallback(Request $request): JsonResponse
    {
        try {
            $key2 = env('ZALOPAY_KEY2');
            
            if (!$key2) {
                return response()->json([
                    'return_code' => -1,
                    'return_message' => 'ZaloPay KEY2 chưa được cấu hình'
                ]);
            }

            $dataStr = $request->input('data', '');
            $receivedMac = $request->input('mac', '');
            
            // Verify MAC
            $calculatedMac = hash_hmac('sha256', $dataStr, $key2);
            
            if ($receivedMac !== $calculatedMac) {
                Log::warning('ZaloPay Simple Callback MAC Mismatch', [
                    'received' => $receivedMac,
                    'calculated' => $calculatedMac
                ]);
                
                return response()->json([
                    'return_code' => -1,
                    'return_message' => 'mac not equal'
                ]);
            }
            
            // Parse payment data
            $paymentData = json_decode($dataStr, true);
            $type = $request->input('type', '');
            
            Log::info('ZaloPay Simple Callback Success', [
                'type' => $type,
                'payment_data' => $paymentData,
                'full_request' => $request->all()
            ]);
            
            // Lưu trạng thái thanh toán vào cache để frontend có thể check
            if ($type == '1' && isset($paymentData['embed_data'])) {
                $embedData = json_decode($paymentData['embed_data'], true);
                $orderId = $embedData['orderId'] ?? null;
                
                if ($orderId) {
                    // Lưu trạng thái vào cache với TTL 1 giờ
                    \Cache::put("payment_status_{$orderId}", 'paid', 3600);
                    
                    Log::info('Payment Status Updated', [
                        'order_id' => $orderId,
                        'status' => 'paid'
                    ]);
                }
            }
            
            // Trả về success cho ZaloPay
            return response()->json([
                'return_code' => 1,
                'return_message' => 'success'
            ]);
            
        } catch (\Exception $e) {
            Log::error('ZaloPay Simple Callback Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'return_code' => 0,
                'return_message' => 'error'
            ]);
        }
    }
    
    /**
     * Kiểm tra trạng thái thanh toán
     */
    public function checkPaymentStatus($orderId): JsonResponse
    {
        try {
            // Kiểm tra trong cache
            $status = \Cache::get("payment_status_{$orderId}", 'pending');
            
            return response()->json([
                'success' => true,
                'data' => [
                    'orderId' => $orderId,
                    'status' => $status,
                    'paidAt' => $status === 'paid' ? now()->toISOString() : null,
                    'paymentMethod' => 'zalopay'
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Check Payment Status Error', [
                'order_id' => $orderId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Không thể kiểm tra trạng thái thanh toán'
            ], 500);
        }
    }
}