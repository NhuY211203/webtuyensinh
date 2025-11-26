<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\ThanhToan;
use App\Models\DiemBoiDuong;

class PaymentController extends Controller
{
    /**
     * Tạo QR code thanh toán ZaloPay
     * POST /api/payments/generate-zalopay-qr
     */
    public function generateZaloPayQR(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'invoiceId' => 'required|integer',
                'scheduleId' => 'required|integer', // id_lichtuvan
                'userId' => 'required|integer', // id_nguoidung
                'pointsUsed' => 'nullable|integer|min:0',
                'discountAmount' => 'nullable|numeric|min:0',
            ]);

            $invoiceId = $request->integer('invoiceId');
            $scheduleId = $request->integer('scheduleId');
            $userId = $request->integer('userId');
            $pointsUsed = $request->integer('pointsUsed', 0);
            $discountAmount = $request->float('discountAmount', 0);
            
            // Tạo orderId từ schedule ID
            $orderId = 'ORD_' . time() . '_' . $scheduleId;
            
            // Cấu hình ZaloPay từ .env
            $appId = env('ZALOPAY_APP_ID');
            $key1 = env('ZALOPAY_KEY1');
            $key2 = env('ZALOPAY_KEY2');
            $endpoint = env('ZALOPAY_ENDPOINT', 'https://sb-openapi.zalopay.vn/v2/create');
            $callbackUrl = env('ZALOPAY_CALLBACK_URL');
            
            if (!$appId || !$key1 || !$key2) {
                return response()->json([
                    'success' => false,
                    'message' => 'ZaloPay chưa được cấu hình. Vui lòng kiểm tra file .env'
                ], 500);
            }

            // Tính toán số tiền
            $consultationFee = 500000; // Phí tư vấn
            $serviceFee = 50000; // Phí dịch vụ
            $totalBeforeDiscount = $consultationFee + $serviceFee; // Tổng trước giảm: 550000
            $amount = max(0, $totalBeforeDiscount - $discountAmount); // Tổng sau giảm giá
            
            // Tạo app_trans_id theo format ZaloPay: YYMMDD_xxxxxx
            $date = date('ymd');
            $random = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            $appTransId = $date . '_' . $random;
            
            // Tạo record trong bảng thanhtoan trước khi gọi ZaloPay
            $thanhToan = ThanhToan::create([
                'id_lichtuvan' => $scheduleId,
                'id_nguoidung' => $userId,
                'phuongthuc' => 'ZaloPayOA',
                'ma_phieu' => $orderId,
                'so_tien' => $totalBeforeDiscount, // Tổng tiền gốc
                'don_vi_tien' => 'VND',
                'so_tien_giam' => $discountAmount, // Số tiền giảm từ điểm
                'phi_giao_dich' => $serviceFee,
                'trang_thai' => 'KhoiTao',
                'ma_giao_dich_app' => $appTransId,
                'du_lieu_yeu_cau' => json_encode([
                    'pointsUsed' => $pointsUsed,
                    'discountAmount' => $discountAmount
                ])
            ]);
            
            Log::info('Created ThanhToan record', [
                'id_thanhtoan' => $thanhToan->id_thanhtoan,
                'ma_phieu' => $orderId,
                'ma_giao_dich_app' => $appTransId
            ]);
            
            // Tạo embed_data (phải là JSON string)
            $embedDataObj = [
                'orderId' => $orderId,
                'invoiceId' => $invoiceId,
                'id_thanhtoan' => $thanhToan->id_thanhtoan
            ];
            $embedData = json_encode($embedDataObj);
            
            // Tạo item (phải là JSON string array)
            $itemObj = [
                [
                    'item_name' => 'Phí tư vấn tư vấn tuyển sinh' . ($discountAmount > 0 ? ' (Đã giảm ' . number_format($discountAmount) . ' VND)' : ''),
                    'item_quantity' => 1,
                    'item_price' => $amount // Số tiền sau khi giảm giá
                ]
            ];
            $item = json_encode($itemObj);
            
            // Tạo app_time (timestamp milliseconds)
            $appTime = round(microtime(true) * 1000);
            
            // app_user: Nếu có ZaloPay User ID thì dùng, nếu không thì dùng app_id
            // ZaloPay cho phép dùng app_id nếu không có user ID cụ thể
            $appUser = (string) $appId; // Dùng app_id theo ZaloPay docs
            
            // Tạo data string để ký MAC theo format: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
            $dataString = "{$appId}|{$appTransId}|{$appUser}|{$amount}|{$appTime}|{$embedData}|{$item}";
            
            // Ký MAC bằng HMAC-SHA256 với key1
            $mac = hash_hmac('sha256', $dataString, $key1);
            
            // Gọi API ZaloPay với format đúng
            $requestData = [
                'app_id' => (string) $appId,
                'app_user' => $appUser,
                'app_time' => (string) $appTime,
                'amount' => (string) $amount,
                'app_trans_id' => $appTransId,
                'embed_data' => $embedData,
                'item' => $item,
                'description' => 'Thanh toán phí tư vấn tuyển sinh',
                'bank_code' => 'zalopayapp',
                'callback_url' => $callbackUrl,
                'mac' => $mac
            ];
            
            Log::info('ZaloPay Request', [
                'endpoint' => $endpoint,
                'request_data' => $requestData,
                'data_string' => $dataString,
                'mac' => $mac,
                'app_id' => $appId,
                'app_user' => $appUser,
                'app_trans_id' => $appTransId
            ]);
            
            // Gửi request với Content-Type: application/x-www-form-urlencoded
            $response = Http::asForm()->post($endpoint, $requestData);
            
            $result = null;
            $return_code = null;
            $return_message = 'Không có response từ ZaloPay';
            
            if ($response->successful()) {
                $result = $response->json();
                $return_code = $result['return_code'] ?? null;
                $return_message = $result['return_message'] ?? 'Không có thông báo lỗi';
                
                Log::info('ZaloPay Response', [
                    'response' => $result,
                    'return_code' => $return_code,
                    'return_message' => $return_message
                ]);
            } else {
                Log::error('ZaloPay HTTP Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Lỗi kết nối đến ZaloPay API: HTTP ' . $response->status(),
                    'error' => [
                        'status' => $response->status(),
                        'body' => $response->body()
                    ]
                ], 500);
            }
            
            // Cập nhật response từ ZaloPay vào database
            $thanhToan->update([
                'du_lieu_phan_hoi' => json_encode($result)
            ]);
            
            if ($return_code !== 1) {
                // Cập nhật trạng thái thất bại (sử dụng giá trị enum hợp lệ)
                $thanhToan->update([
                    'trang_thai' => 'KhoiTao', // Giữ nguyên hoặc dùng giá trị enum hợp lệ
                    'ly_do_that_bai' => $return_message ?: 'Giao dịch thất bại từ ZaloPay'
                ]);
                
                Log::error('ZaloPay API Error', [
                    'return_code' => $return_code,
                    'return_message' => $return_message,
                    'full_response' => $result,
                    'orderId' => $orderId,
                    'app_trans_id' => $appTransId,
                    'id_thanhtoan' => $thanhToan->id_thanhtoan
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => $return_message ?: 'Giao dịch thất bại',
                    'error' => $result,
                    'debug' => [
                        'return_code' => $return_code,
                        'return_message' => $return_message
                    ]
                ], 500);
            }
            
            // Lấy order_url từ ZaloPay
            $orderUrl = $result['order_url'] ?? null;
            
            if (!$orderUrl) {
                $thanhToan->update([
                    'trang_thai' => 'KhoiTao', // Giữ nguyên hoặc dùng giá trị enum hợp lệ
                    'ly_do_that_bai' => 'Không nhận được order_url từ ZaloPay'
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Không nhận được order_url từ ZaloPay'
                ], 500);
            }
            
            // Tính thời gian hết hạn (15 phút)
            $expiryAt = now()->addMinutes(15);
            
            // Cập nhật thông tin QR và trạng thái vào database
            // Lấy enum values từ database để đảm bảo giá trị đúng
            $enumValues = DB::select("SHOW COLUMNS FROM thanhtoan WHERE Field = 'trang_thai'");
            $enumStr = $enumValues[0]->Type ?? '';
            
            // Parse enum values từ string như: enum('KhoiTao','Cho Thanh Toan','DaThanh Toan',...)
            preg_match("/enum\((.*)\)/", $enumStr, $matches);
            $validStatuses = [];
            if (!empty($matches[1])) {
                $validStatuses = array_map(function($val) {
                    return trim($val, "'\"");
                }, explode(',', $matches[1]));
            }
            
            // Sử dụng giá trị enum hợp lệ (thử 'Cho Thanh Toan' hoặc 'ChoThanhToan')
            $statusToUse = 'KhoiTao'; // Default
            if (in_array('Cho Thanh Toan', $validStatuses)) {
                $statusToUse = 'Cho Thanh Toan';
            } elseif (in_array('ChoThanhToan', $validStatuses)) {
                $statusToUse = 'ChoThanhToan';
            } elseif (!empty($validStatuses)) {
                // Sử dụng giá trị đầu tiên khác 'KhoiTao' nếu có
                foreach ($validStatuses as $status) {
                    if ($status !== 'KhoiTao') {
                        $statusToUse = $status;
                        break;
                    }
                }
            }
            
            // Cập nhật thông tin
            $thanhToan->update([
                'trang_thai' => $statusToUse,
                'duong_dan_qr' => $orderUrl,
                'duong_dan_thanh_toan' => $orderUrl,
                'noi_dung' => 'Thanh toán phí tư vấn tuyển sinh'
            ]);
            
            Log::info('ZaloPay QR Created Successfully', [
                'id_thanhtoan' => $thanhToan->id_thanhtoan,
                'ma_phieu' => $orderId,
                'order_url' => $orderUrl
            ]);
            
            // Trả về response với QR code data
            return response()->json([
                'success' => true,
                'message' => 'Tạo QR code thành công',
                'data' => [
                    'orderId' => $orderId,
                    'paymentId' => $thanhToan->id_thanhtoan,
                    'qrCodeUrl' => $orderUrl,
                    'qrCodeData' => $orderUrl, // Frontend sẽ tạo QR từ URL này
                    'expiryAt' => $expiryAt->toISOString(),
                    'amount' => $amount,
                    'isZaloPayQR' => true,
                    'zalopayAppTransId' => $appTransId
                ]
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Generate ZaloPay QR Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi tạo QR code: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Kiểm tra trạng thái thanh toán
     * GET /api/payments/status/:orderId
     */
    public function checkPaymentStatus(string $orderId): JsonResponse
    {
        try {
            // Query từ database theo ma_phieu (orderId)
            $thanhToan = ThanhToan::where('ma_phieu', $orderId)->first();
            
            if (!$thanhToan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy giao dịch với orderId: ' . $orderId
                ], 404);
            }
            
            // Map trạng thái từ database sang frontend
            $statusMap = [
                'KhoiTao' => 'pending',
                'ChoThanhToan' => 'pending',
                'Cho Thanh Toan' => 'pending',
                'DaThanhToan' => 'paid',
                'Da Thanh Toan' => 'paid',
                'ThatBai' => 'failed',
                'Thất Bại' => 'failed',
                'Huy' => 'cancelled',
                'Hủy' => 'cancelled'
            ];
            
            $status = $statusMap[$thanhToan->trang_thai] ?? 'pending';
            
            return response()->json([
                'success' => true,
                'data' => [
                    'orderId' => $orderId,
                    'paymentId' => $thanhToan->id_thanhtoan,
                    'status' => $status, // pending | paid | expired | cancelled | failed
                    'paidAt' => $thanhToan->thoi_gian_thanh_toan ? $thanhToan->thoi_gian_thanh_toan->toISOString() : null,
                    'paymentMethod' => 'zalopay',
                    'trang_thai' => $thanhToan->trang_thai
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Check Payment Status Error', [
                'error' => $e->getMessage(),
                'orderId' => $orderId
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi kiểm tra trạng thái: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Callback từ ZaloPay
     * POST /api/payments/zalopay/callback
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
            
            // Lấy data và mac từ request
            $dataStr = $request->input('data'); // String JSON, KHÔNG parse trước
            $receivedMac = $request->input('mac');
            $type = $request->integer('type', 0);
            
            // Verify MAC bằng key2
            $calculatedMac = hash_hmac('sha256', $dataStr, $key2);
            
            if ($receivedMac !== $calculatedMac) {
                Log::warning('ZaloPay Callback MAC Mismatch', [
                    'received' => $receivedMac,
                    'calculated' => $calculatedMac
                ]);
                
                return response()->json([
                    'return_code' => -1,
                    'return_message' => 'mac not equal'
                ]);
            }
            
            // Parse JSON sau khi verify MAC
            $paymentData = json_decode($dataStr, true);
            
            if (!$paymentData) {
                return response()->json([
                    'return_code' => -1,
                    'return_message' => 'Invalid data format'
                ]);
            }
            
            $appTransId = $paymentData['app_trans_id'] ?? null;
            $amount = $paymentData['amount'] ?? 0;
            $transactionId = $paymentData['zp_trans_id'] ?? null;
            
            if (!$appTransId) {
                Log::warning('ZaloPay Callback missing app_trans_id', [
                    'payment_data' => $paymentData
                ]);
                
                return response()->json([
                    'return_code' => -1,
                    'return_message' => 'Missing app_trans_id'
                ]);
            }
            
            // Tìm thanh toán theo ma_giao_dich_app (app_trans_id)
            $thanhToan = ThanhToan::where('ma_giao_dich_app', $appTransId)->first();
            
            if (!$thanhToan) {
                Log::warning('ZaloPay Callback: Payment not found', [
                    'app_trans_id' => $appTransId,
                    'payment_data' => $paymentData
                ]);
                
                return response()->json([
                    'return_code' => -1,
                    'return_message' => 'Payment not found'
                ]);
            }
            
            // Cập nhật response vào database
            $thanhToan->update([
                'du_lieu_phan_hoi' => $dataStr
            ]);
            
            // Kiểm tra type: 1 = thanh toán thành công
            if ($type === 1) {
                // Lấy enum values để tìm giá trị 'DaThanhToan' hoặc 'Da Thanh Toan'
                $enumValues = DB::select("SHOW COLUMNS FROM thanhtoan WHERE Field = 'trang_thai'");
                $enumStr = $enumValues[0]->Type ?? '';
                preg_match("/enum\((.*)\)/", $enumStr, $matches);
                $validStatuses = [];
                if (!empty($matches[1])) {
                    $validStatuses = array_map(function($val) {
                        return trim($val, "'\"");
                    }, explode(',', $matches[1]));
                }
                
                // Tìm giá trị enum cho "Đã thanh toán"
                $paidStatus = 'KhoiTao';
                if (in_array('DaThanhToan', $validStatuses)) {
                    $paidStatus = 'DaThanhToan';
                } elseif (in_array('Da Thanh Toan', $validStatuses)) {
                    $paidStatus = 'Da Thanh Toan';
                } else {
                    // Tìm giá trị có chứa "Thanh" hoặc "Da"
                    foreach ($validStatuses as $status) {
                        if (stripos($status, 'da') !== false || stripos($status, 'thanh') !== false) {
                            $paidStatus = $status;
                            break;
                        }
                    }
                }
                
                // Cập nhật trạng thái thanh toán thành công
                DB::beginTransaction();
                try {
                    $thanhToan->update([
                        'trang_thai' => $paidStatus,
                        'ma_giao_dich_zp' => $transactionId,
                        'thoi_gian_thanh_toan' => now()
                    ]);
                    
                    // Xử lý sử dụng điểm nếu có
                    $duLieuYeuCau = json_decode($thanhToan->du_lieu_yeu_cau ?? '{}', true);
                    $pointsUsed = $duLieuYeuCau['pointsUsed'] ?? 0;
                    
                    if ($pointsUsed > 0) {
                        // Lấy các điểm bồi đắp chưa sử dụng của người dùng, sắp xếp theo ngày tạo
                        $pointsToUse = DiemBoiDuong::where('idnguoidung', $thanhToan->id_nguoidung)
                            ->where('trang_thai', 1) // Chưa sử dụng
                            ->orderBy('ngay_tao', 'asc') // Sử dụng điểm cũ trước
                            ->limit($pointsUsed)
                            ->get();
                        
                        $totalPointsUsed = 0;
                        foreach ($pointsToUse as $point) {
                            // Đánh dấu điểm đã sử dụng
                            $point->update([
                                'trang_thai' => 2, // Đã sử dụng
                                'ngay_su_dung' => now()
                            ]);
                            $totalPointsUsed++;
                            
                            // Nếu đã đủ số điểm cần dùng, dừng lại
                            if ($totalPointsUsed >= $pointsUsed) {
                                break;
                            }
                        }
                        
                        Log::info('Đã sử dụng điểm bồi đắp cho thanh toán', [
                            'id_thanhtoan' => $thanhToan->id_thanhtoan,
                            'points_used' => $totalPointsUsed,
                            'user_id' => $thanhToan->id_nguoidung
                        ]);
                    }
                    
                    DB::commit();
                } catch (\Exception $e) {
                    DB::rollBack();
                    Log::error('Lỗi khi xử lý sử dụng điểm:', [
                        'error' => $e->getMessage(),
                        'id_thanhtoan' => $thanhToan->id_thanhtoan
                    ]);
                    // Vẫn tiếp tục, không throw exception để không ảnh hưởng đến callback
                }
                
                Log::info('ZaloPay Payment Success - Updated Database', [
                    'id_thanhtoan' => $thanhToan->id_thanhtoan,
                    'app_trans_id' => $appTransId,
                    'amount' => $amount,
                    'transaction_id' => $transactionId,
                    'trang_thai' => $paidStatus
                ]);
                
                // TODO: Có thể trigger event để tự động đặt lịch tư vấn ở đây
            } else {
                // Type khác 1: thanh toán thất bại hoặc pending
                Log::info('ZaloPay Payment Not Success', [
                    'id_thanhtoan' => $thanhToan->id_thanhtoan,
                    'type' => $type,
                    'app_trans_id' => $appTransId
                ]);
            }
            
            return response()->json([
                'return_code' => 1,
                'return_message' => 'OK'
            ]);
            
        } catch (\Exception $e) {
            Log::error('ZaloPay Callback Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'return_code' => -1,
                'return_message' => 'Server error: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Lịch sử thanh toán rút gọn cho người dùng
     * GET /api/payments/history?userId=...
     */
    public function history(Request $request): JsonResponse
    {
        try {
            $userId = (int) $request->input('userId');
            $sessionUserId = (int) (session('user_id') ?? 0);

            $query = ThanhToan::query()->orderByDesc('thoi_gian_tao');
            if ($userId) {
                $query->where('id_nguoidung', $userId);
            } elseif ($sessionUserId) {
                $query->where('id_nguoidung', $sessionUserId);
            }

            $rows = $query->limit(50)->get();

            $mapStatus = function ($dbStatus) {
                return match ($dbStatus) {
                    'DaThanhToan', 'Da Thanh Toan' => 'Đã thanh toán',
                    'ThatBai', 'Thất Bại' => 'Thất bại',
                    'Huy', 'Hủy' => 'Đã hủy',
                    default => 'Chờ thanh toán',
                };
            };

            $data = $rows->map(function ($r) use ($mapStatus) {
                $code = $r->ma_giao_dich_zp ?: $r->ma_giao_dich_app ?: $r->ma_phieu;
                return [
                    'ma_giao_dich' => $code,
                    'ngay_thanh_toan' => optional($r->thoi_gian_thanh_toan)->format('Y-m-d H:i:s'),
                    'so_tien' => (float) $r->so_tien,
                    'phuong_thuc' => $r->phuongthuc,
                    'trang_thai' => $mapStatus($r->trang_thai),
                    'noi_dung' => $r->noi_dung,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('Payments history error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy lịch sử thanh toán',
            ], 500);
        }
    }
}

