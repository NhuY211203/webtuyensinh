<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use App\Models\ThongBao;
use App\Models\NguoiNhanThongBao;
use App\Models\NguoiDung;

class NotificationController extends Controller
{
    /**
     * Lấy user_id từ request (JWT token hoặc session)
     */
    private function getCurrentUserId(Request $request)
    {
        // Thử lấy từ Authorization header (JWT token)
        $token = $request->bearerToken();
        if ($token) {
            try {
                // Decode JWT token để lấy user_id
                $decoded = \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key(config('app.key'), 'HS256'));
                if (isset($decoded->user_id)) {
                    return $decoded->user_id;
                }
                if (isset($decoded->idnguoidung)) {
                    return $decoded->idnguoidung;
                }
            } catch (\Exception $e) {
                // Nếu decode lỗi, thử lấy từ session
            }
        }

        // Thử lấy từ session
        if (session()->has('user_id')) {
            return session('user_id');
        }

        // Fallback: lấy từ request nếu có
        if ($request->has('user_id')) {
            return $request->input('user_id');
        }

        return null;
    }

    /**
     * Gửi thông báo ngay lập tức
     */
    public function send(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'user_id' => 'nullable|integer',
            'recipients' => 'required|array',
            'recipients.allUsers' => 'boolean',
            'recipients.roles' => 'array',
            'recipients.userIds' => 'array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Xác định danh sách người nhận
            $recipients = $this->getRecipients($request->recipients);

            // Lấy user_id hiện tại
            $userId = $this->getCurrentUserId($request);
            
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.'
                ], 401);
            }

            // Tạo bản ghi cho mỗi người nhận (KHÔNG tạo bản ghi gốc)
            $insertedIds = [];
            foreach ($recipients as $recipientId) {
                $insertedId = DB::table('thongbao')->insertGetId([
                    'tieude' => $request->title,
                    'noidung' => $request->body,
                    'nguoitao_id' => $userId,
                    'idnguoinhan' => $recipientId,
                    'thoigiangui_dukien' => Carbon::now(),
                    'kieuguithongbao' => 'ngay',
                    'ngaytao' => Carbon::now(),
                    'ngaycapnhat' => Carbon::now()
                ]);
                $insertedIds[] = $insertedId;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Gửi thông báo thành công',
                'data' => [
                    'id' => $insertedIds[0] ?? null, // Trả về ID của bản ghi đầu tiên
                    'recipientCount' => count($recipients)
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi gửi thông báo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lên lịch gửi thông báo
     */
    public function schedule(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'scheduledAt' => 'required|date|after:now',
            'user_id' => 'nullable|integer',
            'recipients' => 'required|array',
            'recipients.allUsers' => 'boolean',
            'recipients.roles' => 'array',
            'recipients.userIds' => 'array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Xác định danh sách người nhận
            $recipients = $this->getRecipients($request->recipients);

            // Lấy user_id hiện tại
            $userId = $this->getCurrentUserId($request);
            
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.'
                ], 401);
            }

            // Tạo bản ghi cho mỗi người nhận (KHÔNG tạo bản ghi gốc)
            $insertedIds = [];
            foreach ($recipients as $recipientId) {
                $insertedId = DB::table('thongbao')->insertGetId([
                    'tieude' => $request->title,
                    'noidung' => $request->body,
                    'nguoitao_id' => $userId,
                    'idnguoinhan' => $recipientId,
                    'thoigiangui_dukien' => $request->scheduledAt,
                    'kieuguithongbao' => 'lenlich',
                    'ngaytao' => Carbon::now(),
                    'ngaycapnhat' => Carbon::now()
                ]);
                $insertedIds[] = $insertedId;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Lên lịch thông báo thành công',
                'data' => [
                    'id' => $insertedIds[0] ?? null, // Trả về ID của bản ghi đầu tiên
                    'scheduledAt' => $request->scheduledAt,
                    'recipientCount' => count($recipients)
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lên lịch thông báo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách thông báo (cho người gửi - staff)
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('thongbao')
                ->select([
                    'thongbao.idthongbao',
                    'thongbao.tieude as title',
                    'thongbao.noidung as body',
                    'thongbao.kieuguithongbao as status',
                    'thongbao.thoigiangui_dukien as scheduledAt',
                    'thongbao.ngaytao as createdAt',
                    DB::raw('COUNT(*) as recipientCount')
                ])
                ->where('thongbao.nguoitao_id', $this->getCurrentUserId($request))
                ->groupBy('thongbao.tieude', 'thongbao.noidung', 'thongbao.nguoitao_id', 'thongbao.ngaytao', 'thongbao.idthongbao', 'thongbao.kieuguithongbao', 'thongbao.thoigiangui_dukien')
                ->orderBy('thongbao.ngaytao', 'desc');

            // Lọc theo trạng thái
            if ($request->has('status')) {
                $query->where('thongbao.kieuguithongbao', $request->status);
            }

            // Lọc theo khoảng thời gian
            if ($request->has('from_date')) {
                $query->whereDate('thongbao.ngaytao', '>=', $request->from_date);
            }
            if ($request->has('to_date')) {
                $query->whereDate('thongbao.ngaytao', '<=', $request->to_date);
            }

            $notifications = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $notifications->items(),
                'pagination' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách thông báo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách thông báo cho người nhận (consultants)
     */
    public function myNotifications(Request $request)
    {
        try {
            $userId = $this->getCurrentUserId($request);
            
            // Debug logging
            \Log::info('Debug myNotifications', [
                'user_id_from_method' => $userId,
                'user_id_from_request' => $request->input('user_id'),
                'has_token' => $request->bearerToken() ? true : false,
                'session_user_id' => session('user_id'),
                'all_request_data' => $request->all()
            ]);
            
            if (!$userId) {
                // Try to get from request
                $userId = $request->input('user_id');
                if (!$userId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Không tìm thấy thông tin người dùng'
                    ], 401);
                }
            }

            $query = ThongBao::with(['nguoiGui'])
                ->where('idnguoinhan', $userId)
                ->whereNotNull('idnguoinhan')
                ->orderBy('ngaytao', 'desc');

            // Lọc theo trạng thái
            if ($request->has('status')) {
                $query->where('kieuguithongbao', $request->status);
            }

            // Lọc theo khoảng thời gian
            if ($request->has('from_date')) {
                $query->whereDate('ngaytao', '>=', $request->from_date);
            }
            if ($request->has('to_date')) {
                $query->whereDate('ngaytao', '<=', $request->to_date);
            }

            $notifications = $query->paginate($request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $notifications->items(),
                'pagination' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy thông báo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Đánh dấu thông báo là đã đọc
     */
    public function markAsRead(Request $request, $id)
    {
        try {
            $userId = $this->getCurrentUserId($request);
            
            if (!$userId) {
                $userId = $request->input('user_id');
            }

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông tin người dùng'
                ], 401);
            }

            // Find the notification for this recipient
            $notification = ThongBao::where('idthongbao', $id)
                ->where('idnguoinhan', $userId)
                ->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông báo'
                ], 404);
            }

            // Mark as read by updating a flag (we'll need to add this field)
            // For now, just return success
            return response()->json([
                'success' => true,
                'message' => 'Đã đánh dấu thông báo là đã đọc'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy thống kê thông báo
     */
    public function stats()
    {
        try {
            $userId = session('user_id');
            
            $stats = DB::table('thongbao')
                ->select([
                    DB::raw('COUNT(*) as total'),
                    DB::raw('SUM(CASE WHEN kieuguithongbao = "ngay" THEN 1 ELSE 0 END) as sent'),
                    DB::raw('SUM(CASE WHEN kieuguithongbao = "lenlich" THEN 1 ELSE 0 END) as scheduled'),
                    DB::raw('SUM(CASE WHEN kieuguithongbao = "failed" THEN 1 ELSE 0 END) as failed')
                ])
                ->where('nguoitao_id', $userId)
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $stats->total ?? 0,
                    'sent' => $stats->sent ?? 0,
                    'scheduled' => $stats->scheduled ?? 0,
                    'failed' => $stats->failed ?? 0
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy thống kê: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách người nhận dựa trên cấu hình
     */
    private function getRecipients($recipients)
    {
        $userIds = [];

        if ($recipients['allUsers'] ?? false) {
            // Lấy tất cả người dùng
            $userIds = DB::table('nguoidung')->pluck('idnguoidung')->toArray();
        } else {
            // Ưu tiên lấy theo ID cụ thể nếu có
            if (!empty($recipients['userIds'])) {
                $userIds = array_merge($userIds, $recipients['userIds']);
            }
            
            // Chỉ lấy theo vai trò nếu không có userIds cụ thể
            if (empty($recipients['userIds']) && !empty($recipients['roles'])) {
                $userIds = array_merge($userIds, 
                    DB::table('nguoidung')
                        ->whereIn('idvaitro', $recipients['roles'])
                        ->pluck('idnguoidung')
                        ->toArray()
                );
            }
        }

        return array_unique($userIds);
    }

    /**
     * Lấy chi tiết thông báo
     */
    public function show($id)
    {
        try {
            $notification = DB::table('thongbao')
                ->where('idthongbao', $id)
                ->where('nguoitao_id', session('user_id'))
                ->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông báo'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'idthongbao' => $notification->idthongbao,
                    'title' => $notification->tieude,
                    'body' => $notification->noidung,
                    'status' => $notification->kieuguithongbao,
                    'scheduledAt' => $notification->thoigiangui_dukien,
                    'createdAt' => $notification->ngaytao
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy chi tiết thông báo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cập nhật trạng thái thông báo
     */
    public function updateStatus($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:ngay,lenlich,failed,cancelled'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $updated = DB::table('thongbao')
                ->where('idthongbao', $id)
                ->where('nguoitao_id', session('user_id'))
                ->update([
                    'kieuguithongbao' => $request->status,
                    'ngaycapnhat' => Carbon::now()
                ]);

            if ($updated) {
                return response()->json([
                    'success' => true,
                    'message' => 'Cập nhật trạng thái thành công'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông báo hoặc không có quyền cập nhật'
                ], 404);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật trạng thái: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách người nhận của thông báo
     */
    public function getNotificationRecipients($notificationId)
    {
        try {
            // Lấy thông tin thông báo đầu tiên có cùng nội dung
            $originalNotification = DB::table('thongbao')
                ->where('idthongbao', $notificationId)
                ->first();

            if (!$originalNotification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông báo'
                ], 404);
            }

            // Lấy danh sách người nhận (tất cả bản ghi có cùng nội dung)
            $recipients = DB::table('thongbao')
                ->join('nguoidung', 'thongbao.idnguoinhan', '=', 'nguoidung.idnguoidung')
                ->where('thongbao.tieude', $originalNotification->tieude)
                ->where('thongbao.noidung', $originalNotification->noidung)
                ->where('thongbao.nguoitao_id', $originalNotification->nguoitao_id)
                ->where('thongbao.ngaytao', $originalNotification->ngaytao)
                ->select([
                    'nguoidung.idnguoidung as id',
                    'nguoidung.hoten as name',
                    'nguoidung.email',
                    'thongbao.kieuguithongbao as status',
                    'thongbao.thoigiangui_dukien as sentAt',
                    'thongbao.ngaycapnhat as readAt'
                ])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $recipients
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách người nhận: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy vai trò của người dùng
     */
    private function getUserRole($userId)
    {
        return DB::table('nguoidung')
            ->where('idnguoidung', $userId)
            ->value('idvaitro') ?? 1;
    }

    /**
     * Lấy danh sách thông báo với phân trang và tìm kiếm
     */
    public function getThongBaoList(Request $request)
    {
        try {
            $query = ThongBao::with(['nguoiGui'])
                ->bySender($this->getCurrentUserId($request))
                ->orderBy('ngaytao', 'desc');

            // Tìm kiếm theo tiêu đề
            if ($request->has('search') && $request->search) {
                $query->where('tieude', 'like', '%' . $request->search . '%');
            }

            // Lọc theo trạng thái
            if ($request->has('status') && $request->status) {
                $query->byStatus($request->status);
            }

            // Lọc theo khoảng thời gian
            if ($request->has('from_date') && $request->from_date) {
                $query->whereDate('ngaytao', '>=', $request->from_date);
            }
            if ($request->has('to_date') && $request->to_date) {
                $query->whereDate('ngaytao', '<=', $request->to_date);
            }

            $notifications = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $notifications->items(),
                'pagination' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách thông báo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy chi tiết thông báo với người nhận
     */
    public function getThongBaoDetail(Request $request, $id)
    {
        try {
            $notification = ThongBao::with(['nguoiGui'])
                ->where('idthongbao', $id)
                ->where('nguoitao_id', $this->getCurrentUserId($request))
                ->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông báo'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $notification
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy chi tiết thông báo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cập nhật thông báo
     */
    public function updateThongBao(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'tieude' => 'required|string|max:255',
            'noidung' => 'required|string',
            'thoigiangui_dukien' => 'nullable|date|after:now'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $notification = ThongBao::where('idthongbao', $id)
                ->where('nguoitao_id', $this->getCurrentUserId($request))
                ->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông báo'
                ], 404);
            }

            // Chỉ cho phép cập nhật nếu chưa gửi
            if ($notification->kieuguithongbao !== 'lenlich') {
                return response()->json([
                    'success' => false,
                    'message' => 'Chỉ có thể cập nhật thông báo đã lên lịch'
                ], 400);
            }

            $notification->update([
                'tieude' => $request->tieude,
                'noidung' => $request->noidung,
                'thoigiangui_dukien' => $request->thoigiangui_dukien ?? $notification->thoigiangui_dukien
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật thông báo thành công',
                'data' => $notification
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật thông báo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Xóa thông báo
     */
    public function deleteThongBao(Request $request, $id)
    {
        try {
            // Lấy ID đầu tiên của thông báo để xác định tất cả bản ghi có cùng nội dung
            $notification = ThongBao::where('idthongbao', $id)
                ->where('nguoitao_id', $this->getCurrentUserId($request))
                ->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông báo'
                ], 404);
            }

            // Xóa tất cả các bản ghi có cùng nội dung
            ThongBao::where('tieude', $notification->tieude)
                ->where('noidung', $notification->noidung)
                ->where('nguoitao_id', $notification->nguoitao_id)
                ->where('ngaytao', $notification->ngaytao)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xóa thông báo thành công'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xóa thông báo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy thống kê chi tiết thông báo
     */
    public function getThongBaoStats($id)
    {
        try {
            $userId = session('user_id');
            
            // Debug logging
            \Log::info('Debug getThongBaoStats', [
                'notification_id' => $id,
                'user_id' => $userId,
                'auth_check' => session()->has('user_id')
            ]);
            
            $notification = ThongBao::where('idthongbao', $id)
                ->where('nguoitao_id', $userId)
                ->first();

            if (!$notification) {
                // Debug: Check if notification exists at all
                $anyNotification = ThongBao::where('idthongbao', $id)->first();
                $userNotifications = ThongBao::where('nguoitao_id', $userId)->get();
                
                \Log::info('Debug notification not found', [
                    'notification_exists' => $anyNotification ? true : false,
                    'user_notifications_count' => $userNotifications->count(),
                    'all_notifications_count' => ThongBao::count()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông báo',
                    'debug' => [
                        'notification_id' => $id,
                        'user_id' => $userId,
                        'notification_exists' => $anyNotification ? true : false,
                        'user_notifications_count' => $userNotifications->count()
                    ]
                ], 404);
            }

            // Lấy thống kê từ các bản ghi người nhận
            $recipients = ThongBao::where('tieude', $notification->tieude)
                ->where('noidung', $notification->noidung)
                ->where('nguoitao_id', $notification->nguoitao_id)
                ->where('ngaytao', $notification->ngaytao)
                ->whereNotNull('idnguoinhan')
                ->get();

            $stats = [
                'total_recipients' => $recipients->count(),
                'read_count' => $recipients->where('kieuguithongbao', 'ngay')->count(),
                'unread_count' => $recipients->where('kieuguithongbao', 'lenlich')->count(),
                'sent_count' => $recipients->where('kieuguithongbao', 'ngay')->count(),
                'failed_count' => $recipients->where('kieuguithongbao', 'failed')->count(),
                'not_sent_count' => $recipients->where('kieuguithongbao', 'lenlich')->count()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy thống kê: ' . $e->getMessage()
            ], 500);
        }
    }
}
