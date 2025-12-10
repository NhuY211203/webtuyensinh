<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VaiTroController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ChatSupportController;
use App\Http\Controllers\ThongKeController;
use App\Http\Controllers\TruongDaiHocController;
use App\Http\Controllers\CoSoTruongController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\NganhHocController;
use App\Http\Controllers\NhomNganhController;
use App\Http\Controllers\NganhTruongController;
use App\Http\Controllers\PhuongThucXetTuyenController;
use App\Http\Controllers\TinTuyenSinhController;
use App\Http\Controllers\CareerTestController;
use App\Http\Controllers\KyThiDGNLController;
use App\Http\Controllers\AdmissionInfoController;
use App\Http\Controllers\TinhDiemHocBaController;
use App\Http\Controllers\TinhDiemTotNghiepController;
use App\Http\Controllers\DeAnTuyenSinhController;

// Cache 5 phút (300s) cho các API ít thay đổi
Route::get('/vaitro', [VaiTroController::class, 'index'])->middleware('cache.response:300');
Route::get('/stats', [StatsController::class, 'index'])->middleware('cache.response:60');
Route::get('/truongdaihoc', [CatalogController::class, 'truong'])->middleware('cache.response:600');
Route::get('/nganhhoc', [CatalogController::class, 'nganh'])->middleware('cache.response:600');
Route::get('/majors-all', [CatalogController::class, 'majorsAll'])->middleware('cache.response:600');
Route::get('/majors', [CatalogController::class, 'majors'])->middleware('cache.response:600');
Route::get('/nhomnganh', [CatalogController::class, 'nhomNganh'])->middleware('cache.response:600');
Route::get('/tohop-xettuyen', [CatalogController::class, 'tohop'])->middleware('cache.response:600');
Route::get('/majors-by-combo', [CatalogController::class, 'majorsByCombo'])->middleware('cache.response:300');
Route::get('/phuong-thuc', [CatalogController::class, 'phuongthuc'])->middleware('cache.response:600');
Route::get('/years', [CatalogController::class, 'years'])->middleware('cache.response:600');
Route::get('/diemchuan', [CatalogController::class, 'diemchuan'])->middleware('cache.response:180');
// Put export route BEFORE dynamic {id} to avoid route collision
Route::get('/diemchuan/export', [CatalogController::class, 'exportDiemchuan']);
Route::get('/diemchuan/xuhuong', [CatalogController::class, 'xuHuongDiemChuan'])->middleware('cache.response:300');
Route::get('/diemchuan/thongke-xuhuong', [CatalogController::class, 'thongKeXuHuong'])->middleware('cache.response:300');
Route::get('/diemchuan/{id}', [CatalogController::class, 'diemchuanDetail']);
Route::post('/diemchuan', [CatalogController::class, 'storeDiemchuan']);
Route::post('/diemchuan/import', [CatalogController::class, 'importDiemchuan']);
Route::post('/predict', [CatalogController::class, 'predict']);

Route::prefix('career-test')->group(function () {
    Route::get('/questions', [CareerTestController::class, 'questions']);
    Route::post('/submit', [CareerTestController::class, 'submit']);
});

// Kỳ thi ĐGNL (bộ bảng kythi_dgnl_*)
Route::prefix('kythi-dgnl')->group(function () {
    Route::get('/exams', [KyThiDGNLController::class, 'exams']);
    Route::get('/attempts', [KyThiDGNLController::class, 'attempts']);
    Route::post('/attempts', [KyThiDGNLController::class, 'storeAttempt']);
    Route::get('/attempt-details', [KyThiDGNLController::class, 'attemptDetails']);
    Route::get('/questions', [KyThiDGNLController::class, 'questions']);
    Route::get('/options', [KyThiDGNLController::class, 'options']);
    Route::get('/sections', [KyThiDGNLController::class, 'sections']);
    Route::get('/topics', [KyThiDGNLController::class, 'topics']);
});

// Admin quản lý ĐGNL
use App\Http\Controllers\AdminDGNLController;
use App\Http\Controllers\AdminDGNLSectionController;
use App\Http\Controllers\AdminDGNLQuestionController;

Route::prefix('admin/dgnl-exams')->group(function () {
    Route::get('/', [AdminDGNLController::class, 'index']);
    Route::post('/', [AdminDGNLController::class, 'store']);
    Route::get('/template', [AdminDGNLController::class, 'exportTemplate']);
    Route::get('/{id}', [AdminDGNLController::class, 'show']);
    Route::put('/{id}', [AdminDGNLController::class, 'update']);
    Route::delete('/{id}', [AdminDGNLController::class, 'destroy']);
    Route::post('/{id}/duplicate', [AdminDGNLController::class, 'duplicate']);
    Route::get('/{id}/statistics', [AdminDGNLController::class, 'statistics']);
    Route::post('/{id}/import', [AdminDGNLController::class, 'import']);
    Route::get('/{id}/export', [AdminDGNLController::class, 'export']);
    
    // Sections
    Route::get('/{idkythi}/sections', [AdminDGNLSectionController::class, 'index']);
    Route::post('/{idkythi}/sections', [AdminDGNLSectionController::class, 'store']);
    Route::put('/sections/{id}', [AdminDGNLSectionController::class, 'update']);
    Route::delete('/sections/{id}', [AdminDGNLSectionController::class, 'destroy']);
    
    // Questions
    Route::get('/{idkythi}/questions', [AdminDGNLQuestionController::class, 'index']);
    Route::post('/{idkythi}/questions', [AdminDGNLQuestionController::class, 'store']);
    Route::get('/questions/{id}', [AdminDGNLQuestionController::class, 'show']);
    // New split update methods
    Route::put('/questions/{id}/basic', [AdminDGNLQuestionController::class, 'updateBasic']);
    Route::put('/questions/{id}/options', [AdminDGNLQuestionController::class, 'updateOptions']);
    // Remove old monolithic update route
    // Route::put('/questions/{id}', [AdminDGNLQuestionController::class, 'update']);
    Route::delete('/questions/{id}', [AdminDGNLQuestionController::class, 'destroy']);
    Route::post('/questions/{id}/duplicate', [AdminDGNLQuestionController::class, 'duplicate']);
});

// Thông tin tuyển sinh & quy chế
Route::get('/admission-info', [AdmissionInfoController::class, 'index']);
Route::get('/admission-info/quyche', [AdmissionInfoController::class, 'quyChe']);

// Tính điểm xét tuyển học bạ
Route::prefix('tinh-diem-hoc-ba')->group(function () {
    // Danh mục
    Route::get('/phuong-thuc-xet-hoc-ba', [TinhDiemHocBaController::class, 'getPhuongThucXetHocBa']);
    Route::get('/doi-tuong-uu-tien', [TinhDiemHocBaController::class, 'getDoiTuongUuTien']);
    Route::get('/khu-vuc-uu-tien', [TinhDiemHocBaController::class, 'getKhuVucUuTien']);
    Route::get('/mon-hoc', [TinhDiemHocBaController::class, 'getMonHoc']);
    Route::get('/quy-dinh-diem-uu-tien', [TinhDiemHocBaController::class, 'getQuyDinhDiemUuTien']);
    Route::get('/cau-hinh-mon-nhan-he-so', [TinhDiemHocBaController::class, 'getCauHinhMonNhanHeSo']);
    
    // Điểm học bạ
    Route::get('/diem-hoc-ba', [TinhDiemHocBaController::class, 'getDiemHocBa']);
    Route::post('/diem-hoc-ba', [TinhDiemHocBaController::class, 'saveDiemHocBa']);
    
    // Tính điểm
    Route::post('/tinh-diem', [TinhDiemHocBaController::class, 'tinhDiemHocBa']);
    Route::get('/ket-qua', [TinhDiemHocBaController::class, 'getKetQuaTinhDiem']);
    
    // Gợi ý ngành học và trường
    Route::post('/goi-y-nganh-truong', [TinhDiemHocBaController::class, 'goiYNganhTruong']);
});

// Tính điểm tốt nghiệp THPT
Route::prefix('tinh-diem-tot-nghiep')->group(function () {
    // Danh mục
    Route::get('/mon-thi-tot-nghiep', [TinhDiemTotNghiepController::class, 'getMonThiTotNghiep']);
    Route::get('/mon-hoc', [TinhDiemTotNghiepController::class, 'getMonHoc']);
    
    // Điểm thi tốt nghiệp
    Route::get('/diem-thi-tot-nghiep', [TinhDiemTotNghiepController::class, 'getDiemThiTotNghiep']);
    Route::post('/diem-thi-tot-nghiep', [TinhDiemTotNghiepController::class, 'saveDiemThiTotNghiep']);
    
    // Điểm môn học (lớp 10, 11, 12)
    Route::get('/diem-mon-hoc', [TinhDiemTotNghiepController::class, 'getDiemMonHocTotNghiep']);
    Route::post('/diem-mon-hoc', [TinhDiemTotNghiepController::class, 'saveDiemMonHocTotNghiep']);
    
    // Điểm khuyến khích
    Route::get('/diem-khuyen-khich', [TinhDiemTotNghiepController::class, 'getDiemKhuyenKhich']);
    Route::post('/diem-khuyen-khich', [TinhDiemTotNghiepController::class, 'saveDiemKhuyenKhich']);
    
    // Tính điểm
    Route::post('/tinh-diem', [TinhDiemTotNghiepController::class, 'tinhDiemTotNghiep']);
    Route::get('/ket-qua', [TinhDiemTotNghiepController::class, 'getKetQuaTinhDiemTotNghiep']);
});

// Authentication routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/profile/update', [AuthController::class, 'updateProfile']);
Route::post('/password/change', [AuthController::class, 'changePassword']);
Route::post('/password/verify', [AuthController::class, 'verifyPassword']);

// User management routes (for admin/staff)
Route::get('/users', [AuthController::class, 'getUsers']);
Route::get('/admin-stats', [AuthController::class, 'getStats']);
Route::post('/users', [AuthController::class, 'createUser']);
Route::put('/users', [AuthController::class, 'updateUser']);
Route::post('/users/update-role', [AuthController::class, 'updateUserRole']);
Route::post('/test-json', function(\Illuminate\Http\Request $request) {
    return response()->json([
        'success' => true,
        'data' => [
            'all' => $request->all(),
            'json' => $request->json()->all(),
            'input' => $request->input(),
            'content_type' => $request->header('Content-Type'),
            'raw_content' => $request->getContent(),
            'php_input' => file_get_contents('php://input')
        ]
    ]);
});
Route::post('/users/update-status', [AuthController::class, 'updateUserStatus']);

// Consultant routes
Route::get('/consultants', [AuthController::class, 'getConsultantsByMajorGroup']);
Route::get('/consultants-grouped', [AuthController::class, 'getConsultantsGroupedByMajor']);
Route::get('/major-groups', [AuthController::class, 'getMajorGroupsWithConsultantCount']);

// Staff management routes for consultants
Route::get('/staff/consultants', [AuthController::class, 'getAllConsultants']);
Route::get('/staff/consultants/{id}', [AuthController::class, 'getConsultantById']);
Route::post('/staff/consultants', [AuthController::class, 'createConsultant']);
Route::put('/staff/consultants/{id}', [AuthController::class, 'updateConsultant']);
Route::delete('/staff/consultants/{id}', [AuthController::class, 'deleteConsultant']);
Route::put('/staff/consultants/{id}/status', [AuthController::class, 'updateConsultantStatus']);

// Consultation schedule routes
Route::get('/consultation-schedules', [AuthController::class, 'getConsultationSchedules']);
Route::get('/consultation-schedules/all', [AuthController::class, 'getAllConsultationSchedules']);
Route::get('/consultation-schedules-for-approval', [AuthController::class, 'getConsultationSchedulesForApproval']);
Route::post('/consultation-schedules', [AuthController::class, 'createConsultationSchedule']);
Route::post('/consultation-schedules/approve', [AuthController::class, 'approveConsultationSchedule']);
Route::put('/consultation-schedules/{id}', [AuthController::class, 'updateConsultationSchedule']);
Route::delete('/consultation-schedules/{id}', [AuthController::class, 'deleteConsultationSchedule']);
Route::post('/consultation-schedules/{id}/book', [AuthController::class, 'bookConsultationSchedule']);
Route::post('/consultation-schedules/{id}/request-change', [AuthController::class, 'requestChangeSchedule']);
Route::get('/consultation-schedules/{id}/change-requests', [AuthController::class, 'getChangeRequestsBySchedule']);
Route::get('/schedule-change-requests', [AuthController::class, 'getScheduleChangeRequests']);
Route::post('/schedule-change-requests/{id}/approve', [AuthController::class, 'approveScheduleChangeRequest']);
Route::post('/schedule-change-requests/{id}/reject', [AuthController::class, 'rejectScheduleChangeRequest']);
Route::get('/my-appointments', [AuthController::class, 'getMyAppointments']);
Route::get('/my-reward-points', [AuthController::class, 'getMyRewardPoints']);
Route::get('/staff/consultant-statistics', [AuthController::class, 'getConsultantStatistics']);

// Chat hỗ trợ giữa người dùng và người phụ trách
Route::post('/chat-support/get-or-create-room', [ChatSupportController::class, 'getOrCreateRoom']);
Route::get('/chat-support/messages', [ChatSupportController::class, 'getMessages']);
Route::post('/chat-support/send-message', [ChatSupportController::class, 'sendMessage']);
Route::post('/chat-support/mark-as-read', [ChatSupportController::class, 'markAsRead']);
Route::get('/chat-support/staff-rooms', [ChatSupportController::class, 'getRoomsForStaff']);
Route::post('/chat-support/upload-file', [ChatSupportController::class, 'uploadFile']);
Route::get('/chat-support/download-file', [ChatSupportController::class, 'downloadFile']);

// Consultation notes routes
Route::get('/consultation-notes', [AuthController::class, 'getConsultationNotes']);
Route::get('/consultation-notes/{sessionId}', [AuthController::class, 'getNoteBySession']);
Route::post('/consultation-notes/draft', [AuthController::class, 'saveNoteDraft']);
Route::post('/consultation-notes/finalize', [AuthController::class, 'finalizeNote']);
Route::get('/consultation-notes/{sessionId}/evidence', [AuthController::class, 'getEvidenceFiles']);
Route::post('/consultation-notes/evidence', [AuthController::class, 'addEvidenceFile']);
Route::delete('/consultation-notes/evidence/{fileId}', [AuthController::class, 'deleteEvidenceFile']);

// Chat routes
Route::get('/chat/contacts', [ChatController::class, 'contacts']);
Route::get('/chat/room', [ChatController::class, 'getOrCreateRoom']);
Route::get('/chat/messages', [ChatController::class, 'list']);
Route::post('/chat/messages', [ChatController::class, 'send']);

// Ratings routes (danhgia_lichtuvan)
use App\Http\Controllers\RatingsController;
Route::get('/ratings/by-schedule', [RatingsController::class, 'showBySchedule']);
Route::get('/ratings/by-consultant', [RatingsController::class, 'getByConsultant']);
Route::post('/ratings', [RatingsController::class, 'store']);
Route::put('/ratings/{id}', [RatingsController::class, 'update']);

// Test route
Route::get('/test-lichtuvan', function() {
    try {
        $count = \App\Models\LichTuVan::count();
        return response()->json(['success' => true, 'count' => $count, 'message' => 'LichTuVan model works']);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()]);
    }
});

// Test approval API
Route::post('/test-approve', function(\Illuminate\Http\Request $request) {
    try {
        $scheduleIds = $request->input('scheduleIds', []);
        $action = $request->input('action', 'approve');
        $note = $request->input('note', '');
        
        $updatedCount = 0;
        foreach ($scheduleIds as $scheduleId) {
            $schedule = \App\Models\LichTuVan::find($scheduleId);
            if ($schedule) {
                $duyetlich = $action === 'approve' ? 2 : 0;
                $schedule->update([
                    'duyetlich' => $duyetlich,
                    'idnguoiduyet' => 1,
                    'ngayduyet' => now(),
                    'ghichu' => $note
                ]);
                $updatedCount++;
            }
        }
        
        return response()->json([
            'success' => true,
            'message' => "Test: {$action} {$updatedCount} schedules",
            'updatedCount' => $updatedCount
        ]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()]);
    }
});

// Test user exists
Route::get('/test-user', function() {
    try {
        $user = \App\Models\NguoiDung::find(1);
        if ($user) {
            return response()->json(['success' => true, 'user' => $user->toArray(), 'message' => 'User exists']);
        } else {
            return response()->json(['success' => false, 'message' => 'User with ID 1 not found']);
        }
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()]);
    }
});

// List all users
Route::get('/test-users', function() {
    try {
        $users = \App\Models\NguoiDung::take(5)->get();
        return response()->json(['success' => true, 'users' => $users->toArray(), 'count' => $users->count()]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()]);
    }
});

// Create test user
Route::post('/test-create-user', function() {
    try {
        $user = \App\Models\NguoiDung::create([
            'idvaitro' => 1,
            'idnhomnganh' => 1,
            'taikhoan' => 'test_consultant',
            'matkhau' => '123456',
            'email' => 'test@example.com',
            'hoten' => 'Test Consultant',
            'sodienthoai' => '0123456789',
            'diachi' => 'Test Address',
            'ngaysinh' => '1990-01-01',
            'gioitinh' => 'Nam',
            'trangthai' => 'Hoạt động',
            'ngaytao' => now(),
            'ngaycapnhat' => now()
        ]);
        
        return response()->json(['success' => true, 'user' => $user->toArray(), 'message' => 'Test user created']);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()]);
    }
});

// Thống kê xu hướng ngành học
Route::get('/thongke/top-nganh-2024', [ThongKeController::class, 'topNganh2024']);
Route::get('/thongke/so-sanh-phuong-thuc', [ThongKeController::class, 'soSanhPhuongThuc']);
Route::get('/thongke/so-truong-theo-nganh', [ThongKeController::class, 'soTruongTheoNganh']);
Route::get('/thongke/theo-khu-vuc', [ThongKeController::class, 'theoKhuVuc']);
Route::get('/thongke/counts', [ThongKeController::class, 'counts']);
Route::get('/thongke/top-nganh-theo-phuong-thuc', [ThongKeController::class, 'topNganhTheoPhuongThuc']);
Route::get('/thongke/nhom-nganh', [ThongKeController::class, 'nhomNganh']);
Route::get('/thongke/xu-huong', [ThongKeController::class, 'thongKeXuHuong']);
Route::get('/thongke/phan-khuc-luong', [ThongKeController::class, 'thongKeMucLuong']);
Route::get('/thongke/top-nganh-xu-huong-luong', [ThongKeController::class, 'topNganhTheoXuHuongLuong']);
Route::get('/meta', [ThongKeController::class, 'meta']);

// Notification routes
Route::prefix('notifications')->group(function () {
    Route::post('/send', [NotificationController::class, 'send']);
    Route::post('/schedule', [NotificationController::class, 'schedule']);
    Route::get('/', [NotificationController::class, 'index']);
    Route::get('/my', [NotificationController::class, 'myNotifications']); // For consultants to view their notifications
    Route::get('/stats', [NotificationController::class, 'stats']);
    Route::post('/open-schedule-registration', [NotificationController::class, 'openScheduleRegistration']);
    Route::get('/check-schedule-registration-status', [NotificationController::class, 'checkScheduleRegistrationStatus']);
    Route::get('/{id}', [NotificationController::class, 'show']);
    Route::put('/{id}/status', [NotificationController::class, 'updateStatus']);
    Route::put('/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::get('/{id}/recipients', [NotificationController::class, 'getNotificationRecipients']);
});

// ThongBao model routes
Route::prefix('thongbao')->group(function () {
    Route::get('/', [NotificationController::class, 'getThongBaoList']);
    Route::get('/stats/{id}', [NotificationController::class, 'getThongBaoStats']);
    Route::get('/{id}', [NotificationController::class, 'getThongBaoDetail']);
    Route::put('/{id}', [NotificationController::class, 'updateThongBao']);
    Route::delete('/{id}', [NotificationController::class, 'deleteThongBao']);
});

// Test login endpoint
Route::post('/test-login', function(\Illuminate\Http\Request $request) {
    try {
        $email = $request->input('email', 'admin@test.com');
        $password = $request->input('password', '123456');
        
        $user = \App\Models\NguoiDung::where('email', $email)->first();
        
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found']);
        }
        
        if (!password_verify($password, $user->matkhau)) {
            return response()->json(['success' => false, 'message' => 'Wrong password']);
        }
        
        // Set session
        session(['user_id' => $user->idnguoidung]);
        session(['user_email' => $user->email]);
        session(['user_name' => $user->hoten]);
        
        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user_id' => $user->idnguoidung,
                'email' => $user->email,
                'name' => $user->hoten
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()]);
    }
});

// Debug routes for ThongBao
Route::get('/debug/thongbao', function() {
    try {
        $notifications = \App\Models\ThongBao::all();
        $users = \App\Models\NguoiDung::all();
        $recipients = \App\Models\NguoiNhanThongBao::all();
        
        return response()->json([
            'success' => true,
            'data' => [
                'notifications_count' => $notifications->count(),
                'users_count' => $users->count(),
                'recipients_count' => $recipients->count(),
                'notifications' => $notifications->toArray(),
                'users' => $users->toArray(),
                'recipients' => $recipients->toArray()
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()]);
    }
});

Route::get('/debug/thongbao/{id}', function($id) {
    try {
        $notification = \App\Models\ThongBao::find($id);
        $allNotifications = \App\Models\ThongBao::all();
        
        return response()->json([
            'success' => true,
            'data' => [
                'requested_id' => $id,
                'notification_found' => $notification ? true : false,
                'notification' => $notification,
                'all_notifications' => $allNotifications->toArray()
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()]);
    }
});

// TruongDaiHoc CRUD routes
Route::prefix('admin/truongdaihoc')->group(function () {
    Route::get('/', [TruongDaiHocController::class, 'index']);
    Route::get('/export', [TruongDaiHocController::class, 'export']);
    Route::get('/{id}', [TruongDaiHocController::class, 'show']);
    Route::post('/', [TruongDaiHocController::class, 'store']);
    Route::post('/import', [TruongDaiHocController::class, 'import']);
    Route::put('/{id}', [TruongDaiHocController::class, 'update']);
    Route::delete('/{id}', [TruongDaiHocController::class, 'destroy']);
    Route::delete('/bulk', [TruongDaiHocController::class, 'bulkDestroy']);
});

// CoSoTruong CRUD routes
Route::prefix('admin/cosotruong')->group(function () {
    Route::get('/', [CoSoTruongController::class, 'index']);
    Route::get('/{id}', [CoSoTruongController::class, 'show']);
    Route::post('/', [CoSoTruongController::class, 'store']);
    Route::put('/{id}', [CoSoTruongController::class, 'update']);
    Route::delete('/{id}', [CoSoTruongController::class, 'destroy']);
    Route::delete('/bulk', [CoSoTruongController::class, 'bulkDestroy']);
});

// NganhHoc CRUD routes
Route::prefix('admin/nganhhoc')->group(function () {
    Route::get('/', [NganhHocController::class, 'index']);
    Route::get('/{id}', [NganhHocController::class, 'show']);
    Route::post('/', [NganhHocController::class, 'store']);
    Route::post('/import', [NganhHocController::class, 'import']);
    Route::put('/{id}', [NganhHocController::class, 'update']);
    Route::delete('/{id}', [NganhHocController::class, 'destroy']);
    Route::delete('/bulk', [NganhHocController::class, 'bulkDestroy']);
});

// NhomNganh CRUD routes
Route::prefix('admin/nhomnganh')->group(function () {
    Route::get('/', [NhomNganhController::class, 'index']);
    Route::post('/', [NhomNganhController::class, 'store']);
    Route::put('/{id}', [NhomNganhController::class, 'update']);
    Route::delete('/{id}', [NhomNganhController::class, 'destroy']);
});

// NganhTruong routes (public)
Route::get('/nganh-truong', [NganhTruongController::class, 'index']);

// NganhTruong routes (admin)
Route::prefix('admin/nganh-truong')->group(function () {
    Route::get('/', [NganhTruongController::class, 'index']);
    Route::post('/', [NganhTruongController::class, 'store']);
    Route::put('/{id}', [NganhTruongController::class, 'update']);
    Route::delete('/{id}', [NganhTruongController::class, 'destroy']);
});

// PhuongThucXetTuyen routes
Route::prefix('admin/phuong-thuc-xet-tuyen')->group(function () {
    Route::get('/', [PhuongThucXetTuyenController::class, 'index']);
    Route::post('/', [PhuongThucXetTuyenController::class, 'store']);
    Route::put('/{id}', [PhuongThucXetTuyenController::class, 'update']);
    Route::delete('/{id}', [PhuongThucXetTuyenController::class, 'destroy']);
});

// TinTuyenSinh routes (Admin)
Route::prefix('admin/tin-tuyen-sinh')->group(function () {
    Route::get('/', [TinTuyenSinhController::class, 'index']);
    Route::get('/{id}', [TinTuyenSinhController::class, 'adminShow']); // Xem chi tiết (bao gồm cả tin chưa duyệt)
    Route::post('/', [TinTuyenSinhController::class, 'store']);
    Route::put('/{id}', [TinTuyenSinhController::class, 'update']);
    Route::delete('/{id}', [TinTuyenSinhController::class, 'destroy']);
});

// TinTuyenSinh routes (Public - chỉ lấy tin đã duyệt)
Route::get('/tin-tuyen-sinh', [TinTuyenSinhController::class, 'publicIndex']);
Route::get('/tin-tuyen-sinh/{id}', [TinTuyenSinhController::class, 'show']);

// Payment routes - ZaloPay integration
Route::prefix('payments')->group(function () {
    Route::post('/generate-zalopay-qr', [PaymentController::class, 'generateZaloPayQR']);
    Route::get('/status/{orderId}', [PaymentController::class, 'checkPaymentStatus']);
    Route::post('/zalopay/callback', [PaymentController::class, 'zalopayCallback']);
    Route::get('/history', [PaymentController::class, 'history']);
});

// ============================================
// DE AN TUYEN SINH - Tra cứu đề án tuyển sinh
// ============================================

// Đề án tuyển sinh
Route::prefix('de-an-tuyen-sinh')->group(function () {
    Route::get('/', [DeAnTuyenSinhController::class, 'getDeAnTuyenSinh']);
    Route::get('/{id}', [DeAnTuyenSinhController::class, 'getDeAnTuyenSinhDetail']);
    Route::post('/', [DeAnTuyenSinhController::class, 'createDeAnTuyenSinh']);
    Route::put('/{id}', [DeAnTuyenSinhController::class, 'updateDeAnTuyenSinh']);
    Route::delete('/{id}', [DeAnTuyenSinhController::class, 'deleteDeAnTuyenSinh']);
});

// Phương thức tuyển sinh chi tiết
Route::prefix('phuong-thuc-tuyen-sinh')->group(function () {
    Route::get('/', [DeAnTuyenSinhController::class, 'getPhuongThucChiTiet']);
    Route::get('/{id}', [DeAnTuyenSinhController::class, 'getPhuongThucChiTietDetail']);
    Route::post('/', [DeAnTuyenSinhController::class, 'createPhuongThucChiTiet']);
    Route::put('/{id}', [DeAnTuyenSinhController::class, 'updatePhuongThucChiTiet']);
    Route::delete('/{id}', [DeAnTuyenSinhController::class, 'deletePhuongThucChiTiet']);
});

// Bảng quy đổi điểm ngoại ngữ
Route::prefix('bang-quy-doi-diem-ngoai-ngu')->group(function () {
    Route::get('/', [DeAnTuyenSinhController::class, 'getBangQuyDoiDiemNgoaiNgu']);
    Route::post('/', [DeAnTuyenSinhController::class, 'createBangQuyDoiDiemNgoaiNgu']);
    Route::put('/{id}', [DeAnTuyenSinhController::class, 'updateBangQuyDoiDiemNgoaiNgu']);
    Route::delete('/{id}', [DeAnTuyenSinhController::class, 'deleteBangQuyDoiDiemNgoaiNgu']);
});

// Ngành theo phương thức
Route::prefix('nganh-theo-phuong-thuc')->group(function () {
    Route::get('/', [DeAnTuyenSinhController::class, 'getNganhTheoPhuongThuc']);
    Route::post('/', [DeAnTuyenSinhController::class, 'createNganhTheoPhuongThuc']);
    Route::put('/{id}', [DeAnTuyenSinhController::class, 'updateNganhTheoPhuongThuc']);
    Route::delete('/{id}', [DeAnTuyenSinhController::class, 'deleteNganhTheoPhuongThuc']);
});

// Xét tuyển thẳng
Route::prefix('xet-tuyen-thang')->group(function () {
    Route::get('/', [DeAnTuyenSinhController::class, 'getXetTuyenThang']);
    Route::post('/', [DeAnTuyenSinhController::class, 'createXetTuyenThang']);
    Route::put('/{id}', [DeAnTuyenSinhController::class, 'updateXetTuyenThang']);
    Route::delete('/{id}', [DeAnTuyenSinhController::class, 'deleteXetTuyenThang']);
});

// Hồ sơ xét tuyển
Route::prefix('ho-so-xet-tuyen')->group(function () {
    Route::get('/', [DeAnTuyenSinhController::class, 'getHoSoXetTuyen']);
    Route::post('/', [DeAnTuyenSinhController::class, 'createHoSoXetTuyen']);
    Route::put('/{id}', [DeAnTuyenSinhController::class, 'updateHoSoXetTuyen']);
    Route::delete('/{id}', [DeAnTuyenSinhController::class, 'deleteHoSoXetTuyen']);
});

// Quy định điểm ưu tiên đề án
Route::prefix('quy-dinh-diem-uu-tien-de-an')->group(function () {
    Route::get('/', [DeAnTuyenSinhController::class, 'getQuyDinhDiemUuTienDeAn']);
    Route::post('/', [DeAnTuyenSinhController::class, 'createQuyDinhDiemUuTienDeAn']);
    Route::put('/{id}', [DeAnTuyenSinhController::class, 'updateQuyDinhDiemUuTienDeAn']);
    Route::delete('/{id}', [DeAnTuyenSinhController::class, 'deleteQuyDinhDiemUuTienDeAn']);
});

// Thông tin bổ sung phương thức
Route::prefix('thong-tin-bo-sung-phuong-thuc')->group(function () {
    Route::get('/', [DeAnTuyenSinhController::class, 'getThongTinBoSungPhuongThuc']);
    Route::post('/', [DeAnTuyenSinhController::class, 'createThongTinBoSungPhuongThuc']);
    Route::put('/{id}', [DeAnTuyenSinhController::class, 'updateThongTinBoSungPhuongThuc']);
    Route::delete('/{id}', [DeAnTuyenSinhController::class, 'deleteThongTinBoSungPhuongThuc']);
});

// File đề án tuyển sinh
Route::prefix('file-de-an-tuyen-sinh')->group(function () {
    Route::get('/', [DeAnTuyenSinhController::class, 'getFileDeAnTuyenSinh']);
    Route::post('/', [DeAnTuyenSinhController::class, 'createFileDeAnTuyenSinh']);
    Route::put('/{id}', [DeAnTuyenSinhController::class, 'updateFileDeAnTuyenSinh']);
    Route::delete('/{id}', [DeAnTuyenSinhController::class, 'deleteFileDeAnTuyenSinh']);
});

// Giới thiệu trường
Route::prefix('gioi-thieu-truong')->group(function () {
    Route::get('/', [DeAnTuyenSinhController::class, 'getGioiThieuTruong']);
    Route::get('/{id}', [DeAnTuyenSinhController::class, 'getGioiThieuTruongDetail']);
    Route::post('/', [DeAnTuyenSinhController::class, 'createGioiThieuTruong']);
    Route::put('/{id}', [DeAnTuyenSinhController::class, 'updateGioiThieuTruong']);
    Route::delete('/{id}', [DeAnTuyenSinhController::class, 'deleteGioiThieuTruong']);
});


