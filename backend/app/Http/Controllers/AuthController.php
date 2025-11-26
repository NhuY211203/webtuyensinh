<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Models\NguoiDung;
use App\Models\NhomNganh;
use App\Models\LichTuVan;
use App\Models\ThongBaoLich;
use App\Models\ThongBao;
use App\Models\GhiChuBuoiTuVan;
use App\Models\TepMinhChungBuoiTuVan;
use App\Models\YeuCauDoiLich;
use App\Models\DiemBoiDuong;
use App\Models\ThanhToan;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        // Validation rules
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:nguoidung,email|max:255',
            'hoten' => 'required|string|max:255',
            'matkhau' => 'required|string|min:6|max:255',
            'sodienthoai' => 'nullable|string|regex:/^[0-9]{10,11}$/|unique:nguoidung,sodienthoai',
            'diachi' => 'nullable|string|max:500',
            'ngaysinh' => 'nullable|date|before:today',
            'gioitinh' => 'nullable|in:Nam,Nữ',
        ], [
            'email.required' => 'Email là bắt buộc',
            'email.email' => 'Email không đúng định dạng',
            'email.unique' => 'Email này đã được sử dụng',
            'email.max' => 'Email không được quá 255 ký tự',
            'hoten.required' => 'Họ và tên là bắt buộc',
            'hoten.max' => 'Họ và tên không được quá 255 ký tự',
            'matkhau.required' => 'Mật khẩu là bắt buộc',
            'matkhau.min' => 'Mật khẩu phải có ít nhất 6 ký tự',
            'matkhau.max' => 'Mật khẩu không được quá 255 ký tự',
            'sodienthoai.regex' => 'Số điện thoại phải có 10-11 chữ số',
            'sodienthoai.unique' => 'Số điện thoại này đã được sử dụng',
            'ngaysinh.date' => 'Ngày sinh không đúng định dạng',
            'ngaysinh.before' => 'Ngày sinh phải trước ngày hiện tại',
            'gioitinh.in' => 'Giới tính phải là Nam hoặc Nữ',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Tạo tài khoản với vai trò "Thành Viên" (idvaitro = 2)
            $nguoiDung = NguoiDung::create([
                'idvaitro' => 2, // Thành Viên
                'taikhoan' => $request->email, // Dùng email làm tài khoản
                'matkhau' => $request->matkhau, // Sẽ được hash tự động
                'email' => $request->email,
                'hoten' => $request->hoten,
                'sodienthoai' => $request->sodienthoai,
                'diachi' => $request->diachi,
                'ngaysinh' => $request->ngaysinh,
                'gioitinh' => $request->gioitinh,
                'trangthai' => 1, // Kích hoạt
                'ngaytao' => Carbon::now(),
                'ngaycapnhat' => Carbon::now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Đăng ký tài khoản thành công',
                'data' => [
                    'id' => $nguoiDung->idnguoidung,
                    'email' => $nguoiDung->email,
                    'hoten' => $nguoiDung->hoten,
                    'vaitro' => 'Thành Viên'
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi tạo tài khoản',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request): JsonResponse
    {
        // Debug: Log request data
        \Log::info('Login request:', $request->all());
        
        // Validation
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'matkhau' => 'required|string',
        ]);

        if ($validator->fails()) {
            \Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $nguoiDung = NguoiDung::where('email', $request->email)->first();
            
            \Log::info('User found:', $nguoiDung ? $nguoiDung->toArray() : 'null');

            if (!$nguoiDung) {
                \Log::warning('User not found for email:', ['email' => $request->email]);
                return response()->json([
                    'success' => false,
                    'message' => 'Email không tồn tại'
                ], 401);
            }

            $passwordMatch = password_verify($request->matkhau, $nguoiDung->matkhau);
            \Log::info('Password verification:', ['match' => $passwordMatch]);
            
            if (!$passwordMatch) {
                \Log::warning('Password mismatch for user:', ['email' => $nguoiDung->email]);
                return response()->json([
                    'success' => false,
                    'message' => 'Mật khẩu không đúng'
                ], 401);
            }

            if ($nguoiDung->trangthai != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tài khoản đã bị khóa'
                ], 401);
            }

            // Lấy tên vai trò từ bảng vaitro
            $vaiTro = \App\Models\VaiTro::where('idvaitro', $nguoiDung->idvaitro)->first();
            $tenVaiTro = $vaiTro ? $vaiTro->tenvaitro : 'Thành viên';

            // Set session for authentication
            session(['user_id' => $nguoiDung->idnguoidung]);
            session(['user_email' => $nguoiDung->email]);
            session(['user_name' => $nguoiDung->hoten]);

            return response()->json([
                'success' => true,
                'message' => 'Đăng nhập thành công',
                'data' => [
                    'id' => $nguoiDung->idnguoidung,
                    'idvaitro' => $nguoiDung->idvaitro,
                    'email' => $nguoiDung->email,
                    'hoten' => $nguoiDung->hoten,
                    'vaitro' => $tenVaiTro
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi đăng nhập',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getUsers(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('perPage', 20);
            $page = $request->get('page', 1);
            
            $users = NguoiDung::with('vaiTro')
                ->select(
                    'idnguoidung',
                    'email',
                    'hoten',
                    'sodienthoai',
                    'diachi',
                    'ngaysinh',
                    'gioitinh',
                    'idvaitro',
                    'trangthai',
                    'ngaytao'
                )
                ->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'data' => $users->items(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
                'per_page' => $users->perPage()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy danh sách người dùng',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getStats(): JsonResponse
    {
        try {
            $totalUsers = NguoiDung::count();
            $activeUsers = NguoiDung::where('trangthai', 1)->count();
            $newUsersThisWeek = NguoiDung::where('ngaytao', '>=', now()->subWeek())->count();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_users' => $totalUsers,
                    'active_users' => $activeUsers,
                    'new_users_week' => $newUsersThisWeek,
                    'success_rate' => $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100) : 0
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy thống kê',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:nguoidung,idnguoidung',
            'hoten' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'sodienthoai' => 'nullable|string|regex:/^[0-9]{9,12}$/',
            'diachi' => 'nullable|string|max:500',
            'ngaysinh' => 'nullable|date',
            'gioitinh' => 'nullable|in:Nam,Nữ,Khác',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = NguoiDung::findOrFail($request->id);
            $user->hoten = $request->hoten ?? $user->hoten;
            $user->email = $request->email ?? $user->email;
            $user->sodienthoai = $request->sodienthoai ?? $user->sodienthoai;
            $user->diachi = $request->diachi ?? $user->diachi;
            $user->ngaysinh = $request->ngaysinh ?? $user->ngaysinh;
            $user->gioitinh = $request->gioitinh ?? $user->gioitinh;
            $user->ngaycapnhat = now();
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật hồ sơ thành công',
                'data' => $user->only(['idnguoidung','email','hoten','sodienthoai','diachi','ngaysinh','gioitinh'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể cập nhật hồ sơ',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:nguoidung,idnguoidung',
            'current_password' => 'required|string|min:6',
            'new_password' => 'required|string|min:6',
            'confirm_password' => 'required|string|min:6',
        ], [
            'current_password.required' => 'Vui lòng nhập mật khẩu hiện tại',
            'new_password.required' => 'Vui lòng nhập mật khẩu mới',
            'confirm_password.required' => 'Vui lòng xác nhận mật khẩu mới',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = NguoiDung::find($request->id);
            if (!$user) {
                // Fallback: nếu dùng bảng users mặc định
                $laravelUser = \App\Models\User::find($request->id);
                if ($laravelUser) {
                    // Kiểm tra bằng Hash::check với cột password
                    $match = \Illuminate\Support\Facades\Hash::check($request->current_password, $laravelUser->password);
                    if (!$match) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Mật khẩu hiện tại không đúng',
                        ], 400);
                    }
                    if ($request->current_password === $request->new_password) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Mật khẩu mới không được trùng với mật khẩu hiện tại',
                        ], 400);
                    }
                    if ($request->new_password !== $request->confirm_password) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Xác nhận mật khẩu không khớp',
                        ], 400);
                    }
                    // Cập nhật mật khẩu cho bảng users (đã có cast hashed)
                    $laravelUser->password = $request->new_password;
                    $laravelUser->save();
                    return response()->json([
                        'success' => true,
                        'message' => 'Đổi mật khẩu thành công',
                    ]);
                }
                // Nếu không có ở cả hai bảng
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy người dùng',
                ], 404);
            }

            // Kiểm tra mật khẩu hiện tại (bảng nguoidung)
            $match = \Illuminate\Support\Facades\Hash::check($request->current_password, $user->matkhau);
            if (!$match) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mật khẩu hiện tại không đúng',
                ], 400);
            }

            // Mật khẩu mới không được trùng mật khẩu cũ
            if ($request->current_password === $request->new_password) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mật khẩu mới không được trùng với mật khẩu hiện tại',
                ], 400);
            }

            // Xác nhận mật khẩu
            if ($request->new_password !== $request->confirm_password) {
                return response()->json([
                    'success' => false,
                    'message' => 'Xác nhận mật khẩu không khớp',
                ], 400);
            }

            // Cập nhật mật khẩu (mutator sẽ tự hash)
            $user->matkhau = $request->new_password;
            $user->ngaycapnhat = now();
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Đổi mật khẩu thành công',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể đổi mật khẩu',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function verifyPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer',
            'current_password' => 'required|string|min:1',
        ]);
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = NguoiDung::find($request->id);
            if ($user) {
                $match = \Illuminate\Support\Facades\Hash::check($request->current_password, $user->matkhau);
                return response()->json(['success' => true, 'valid' => $match]);
            }

            $laravelUser = \App\Models\User::find($request->id);
            if ($laravelUser) {
                $match = \Illuminate\Support\Facades\Hash::check($request->current_password, $laravelUser->password);
                return response()->json(['success' => true, 'valid' => $match]);
            }

            return response()->json(['success' => false, 'message' => 'Không tìm thấy người dùng'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xác thực mật khẩu',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy danh sách tư vấn viên theo nhóm ngành học
     */
    public function getConsultantsByMajorGroup(Request $request): JsonResponse
    {
        try {
            $idnhomnganh = $request->get('idnhomnganh');
            
            // Nếu không có idnhomnganh, trả về tất cả tư vấn viên
            $query = NguoiDung::where('idvaitro', 4) // idvaitro = 4 là tư vấn viên
                ->where('trangthai', 1) // Chỉ lấy tài khoản đang hoạt động
                ->with(['nhomNganh', 'vaiTro']);

            if ($idnhomnganh) {
                $query->where('idnhomnganh', $idnhomnganh);
            }

            $consultants = $query->select(
                'idnguoidung',
                'hoten',
                'email',
                'sodienthoai',
                'idnhomnganh',
                'idvaitro'
            )->get();

            // Format response
            $formattedConsultants = $consultants->map(function ($consultant) {
                return [
                    'id' => $consultant->idnguoidung,
                    'hoten' => $consultant->hoten,
                    'email' => $consultant->email,
                    'sodienthoai' => $consultant->sodienthoai,
                    'nhomnganh' => $consultant->nhomNganh ? [
                        'id' => $consultant->nhomNganh->idnhomnganh,
                        'ten' => $consultant->nhomNganh->tennhom ?? 'Chưa xác định'
                    ] : null,
                    'vaitro' => $consultant->vaiTro ? $consultant->vaiTro->tenvaitro : 'Tư vấn viên'
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách tư vấn viên thành công',
                'data' => $formattedConsultants,
                'total' => $formattedConsultants->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy danh sách tư vấn viên',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách nhóm ngành với số lượng tư vấn viên
     */
    public function getMajorGroupsWithConsultantCount(): JsonResponse
    {
        try {
            $majorGroups = NhomNganh::leftJoin('nguoidung', function($join) {
                $join->on('nhomnganh.idnhomnganh', '=', 'nguoidung.idnhomnganh')
                     ->where('nguoidung.idvaitro', 4) // Tư vấn viên
                     ->where('nguoidung.trangthai', 1); // Đang hoạt động
            })
            ->select(
                'nhomnganh.idnhomnganh',
                'nhomnganh.manhom',
                'nhomnganh.tennhom',
                \DB::raw('COUNT(nguoidung.idnguoidung) as so_tu_van_vien')
            )
            ->groupBy('nhomnganh.idnhomnganh', 'nhomnganh.manhom', 'nhomnganh.tennhom')
            ->orderBy('nhomnganh.tennhom')
            ->get();

            $formattedGroups = $majorGroups->map(function ($group) {
                return [
                    'id' => $group->idnhomnganh,
                    'manhom' => $group->manhom,
                    'tennhom' => $group->tennhom,
                    'so_tu_van_vien' => (int) $group->so_tu_van_vien
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách nhóm ngành thành công',
                'data' => $formattedGroups
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy danh sách nhóm ngành',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cập nhật quyền người dùng
     */
    public function updateUserRole(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:nguoidung,idnguoidung',
            'role' => 'required|string|in:Thành viên,Tư vấn viên,Người phụ trách,Admin'
        ], [
            'id.required' => 'ID người dùng là bắt buộc',
            'id.exists' => 'Người dùng không tồn tại',
            'role.required' => 'Vai trò là bắt buộc',
            'role.in' => 'Vai trò không hợp lệ'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Mapping tên vai trò sang ID
            $roleMapping = [
                'Thành viên' => 2,
                'Tư vấn viên' => 4,
                'Người phụ trách' => 3,
                'Admin' => 1
            ];

            $roleId = $roleMapping[$request->role];
            
            $user = NguoiDung::findOrFail($request->id);
            $user->idvaitro = $roleId;
            $user->ngaycapnhat = now();
            $user->save();

            // Lấy thông tin vai trò mới
            $vaiTro = VaiTro::find($roleId);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật quyền người dùng thành công',
                'data' => [
                    'id' => $user->idnguoidung,
                    'hoten' => $user->hoten,
                    'vaitro' => $vaiTro ? $vaiTro->tenvaitro : $request->role
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi cập nhật quyền người dùng',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cập nhật trạng thái người dùng (khóa/mở)
     */
    public function updateUserStatus(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:nguoidung,idnguoidung',
            'status' => 'required|integer|in:0,1'
        ], [
            'id.required' => 'ID người dùng là bắt buộc',
            'id.exists' => 'Người dùng không tồn tại',
            'status.required' => 'Trạng thái là bắt buộc',
            'status.in' => 'Trạng thái không hợp lệ'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = NguoiDung::findOrFail($request->id);
            $user->trangthai = $request->status;
            $user->ngaycapnhat = now();
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật trạng thái người dùng thành công',
                'data' => [
                    'id' => $user->idnguoidung,
                    'hoten' => $user->hoten,
                    'trangthai' => $user->trangthai
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi cập nhật trạng thái người dùng',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get consultation schedules for a consultant
     */
    public function getConsultationSchedules(Request $request): JsonResponse
    {
        try {
            $consultantId = $request->input('consultant_id');
            $date = $request->input('date');
            $status = $request->input('status'); // Thêm parameter status
            $duyetlich = $request->input('duyetlich'); // Thêm parameter duyetlich (1=Chờ duyệt, 2=Đã duyệt, 3=Từ chối)
            $bookedOnly = $request->input('booked_only'); // Filter chỉ lịch đã có người đăng ký
            
            // Debug logging
            \Log::info('Getting consultation schedules:', [
                'consultant_id' => $consultantId,
                'date' => $date,
                'status' => $status,
                'duyetlich' => $duyetlich,
                'booked_only' => $bookedOnly
            ]);
            
            $query = LichTuVan::with(['nguoiDung', 'nguoiDat', 'nguoiDuyet'])
                ->byConsultant($consultantId);
            
            // Filter theo trạng thái nếu có
            if ($status !== null) {
                $query->where('trangthai', $status);
                \Log::info('Applied status filter:', ['status' => $status]);
            }
            
            // Filter theo trạng thái duyệt lịch nếu có (chỉ áp dụng khi không phải filter booked_only)
            if ($duyetlich !== null && $duyetlich !== '' && !$bookedOnly) {
                $query->where('duyetlich', $duyetlich);
                \Log::info('Applied duyetlich filter:', ['duyetlich' => $duyetlich]);
            }
            
            // Filter chỉ lịch đã có người đăng ký
            if ($bookedOnly) {
                $query->whereNotNull('idnguoidat');
                \Log::info('Applied booked_only filter');
            }
            
            if ($date) {
                $query->byDate($date);
            } else {
                // Chỉ áp dụng filter upcoming() khi không phải filter booked_only
                // Vì tab "Đã đăng ký" cần hiển thị cả lịch đã qua
                if (!$bookedOnly) {
                    $query->upcoming();
                }
            }
            
            $schedules = $query->orderBy('ngayhen')
                ->orderBy('giobatdau')
                ->get();
            
            // Debug: Log kết quả
            \Log::info('Found schedules:', [
                'count' => $schedules->count(),
                'schedules' => $schedules->map(function($schedule) {
                    return [
                        'id' => $schedule->idlichtuvan,
                        'trangthai' => $schedule->trangthai,
                        'ngayhen' => $schedule->ngayhen,
                        'giobatdau' => $schedule->giobatdau
                    ];
                })
            ]);
            
            // Nếu client yêu cầu format đơn giản cho UI tư vấn viên
            $format = $request->input('format');
            if ($format === 'simple') {
                $items = $schedules->map(function($s) {
                    return [
                        'id' => $s->idlichtuvan,
                        'bookerId' => $s->idnguoidat,
                        'bookerName' => optional($s->nguoiDat)->hoten,
                        'date' => $s->ngayhen ? $s->ngayhen->format('Y-m-d') : null,
                        'start' => $s->giobatdau ? $s->giobatdau->format('H:i') : null,
                        'end' => $s->ketthuc ? $s->ketthuc->format('H:i') : null,
                        'method' => $s->molavande ?? null,
                        'status' => (int) $s->trangthai,
                    ];
                });
                return response()->json(['success' => true, 'data' => $items]);
            }

            // Đảm bảo relationships được serialize đúng cách
            $schedulesData = $schedules->map(function($schedule) {
                // Kiểm tra xem có yêu cầu thay đổi lịch đang chờ duyệt không
                $pendingChangeRequest = YeuCauDoiLich::where('idlichtuvan', $schedule->idlichtuvan)
                    ->where('trangthai_duyet', 1) // 1 = Chờ duyệt
                    ->orderBy('thoigian_gui', 'desc')
                    ->first();

                return [
                    'idlichtuvan' => $schedule->idlichtuvan,
                    'idnguoidung' => $schedule->idnguoidung,
                    'idnguoidat' => $schedule->idnguoidat,
                    'tieude' => $schedule->tieude,
                    'noidung' => $schedule->noidung,
                    'chudetuvan' => $schedule->chudetuvan,
                    'molavande' => $schedule->molavande,
                    'ngayhen' => $schedule->ngayhen ? $schedule->ngayhen->format('Y-m-d') : null,
                    'giohen' => $schedule->giohen ? $schedule->giohen->format('H:i:s') : null,
                    'giobatdau' => $schedule->giobatdau ? $schedule->giobatdau->format('H:i') : null,
                    'ketthuc' => $schedule->ketthuc ? $schedule->ketthuc->format('H:i') : null,
                    'tinhtrang' => $schedule->tinhtrang,
                    'trangthai' => $schedule->trangthai,
                    'duyetlich' => $schedule->duyetlich,
                    'idnguoiduyet' => $schedule->idnguoiduyet,
                    'ngayduyet' => $schedule->ngayduyet ? $schedule->ngayduyet->format('Y-m-d H:i:s') : null,
                    'ghichu' => $schedule->ghichu,
                    'danhdanhgiadem' => $schedule->danhdanhgiadem,
                    'nhanxet' => $schedule->nhanxet,
                    'nguoiDung' => $schedule->nguoiDung ? [
                        'idnguoidung' => $schedule->nguoiDung->idnguoidung,
                        'hoten' => $schedule->nguoiDung->hoten,
                        'email' => $schedule->nguoiDung->email,
                    ] : null,
                    'nguoiDat' => $schedule->nguoiDat ? [
                        'idnguoidung' => $schedule->nguoiDat->idnguoidung,
                        'hoten' => $schedule->nguoiDat->hoten,
                        'email' => $schedule->nguoiDat->email,
                    ] : null,
                    'nguoiDuyet' => $schedule->nguoiDuyet ? [
                        'idnguoidung' => $schedule->nguoiDuyet->idnguoidung,
                        'hoten' => $schedule->nguoiDuyet->hoten,
                        'email' => $schedule->nguoiDuyet->email,
                    ] : null,
                    'hasPendingChangeRequest' => $pendingChangeRequest ? true : false,
                    'pendingChangeRequestId' => $pendingChangeRequest ? $pendingChangeRequest->iddoilich : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $schedulesData
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy lịch tư vấn',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy điểm đổi thưởng của người dùng
     */
    public function getMyRewardPoints(Request $request): JsonResponse
    {
        try {
            $userId = $request->input('user_id');

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Thiếu user_id'
                ], 400);
            }

            // Lấy tất cả điểm bồi đắp của người dùng
            $points = DiemBoiDuong::with(['lichTuVan', 'yeuCauDoiLich', 'nguoiTao'])
                ->where('idnguoidung', $userId)
                ->orderBy('ngay_tao', 'desc')
                ->get();

            // Tính tổng hợp
            $tongDiem = $points->sum('so_diem');
            $tongDiemChuaDung = $points->where('trang_thai', 1)->sum('so_diem');
            $tongDiemDaDung = $points->where('trang_thai', 2)->sum('so_diem');
            $soLuongChuaDung = $points->where('trang_thai', 1)->count();
            $soLuongDaDung = $points->where('trang_thai', 2)->count();

            $data = $points->map(function ($point) {
                return [
                    'iddiem_boi_duong' => $point->iddiem_boi_duong,
                    'so_diem' => (float) $point->so_diem,
                    'trang_thai' => (int) $point->trang_thai,
                    'trang_thai_text' => $point->trang_thai == 1 ? 'Chưa sử dụng' : ($point->trang_thai == 2 ? 'Đã sử dụng' : 'Đã hết hạn'),
                    'ngay_tao' => $point->ngay_tao ? $point->ngay_tao->format('Y-m-d H:i:s') : null,
                    'ngay_tao_formatted' => $point->ngay_tao ? $point->ngay_tao->format('d/m/Y H:i') : null,
                    'idlichtuvan' => $point->idlichtuvan,
                    'lichtuvan' => $point->lichTuVan ? [
                        'idlichtuvan' => $point->lichTuVan->idlichtuvan,
                        'tieude' => $point->lichTuVan->tieude,
                        'ngayhen' => $point->lichTuVan->ngayhen ? $point->lichTuVan->ngayhen->format('d/m/Y') : null,
                    ] : null,
                    'iddoilich' => $point->iddoilich,
                    'nguoi_tao' => $point->nguoiTao ? [
                        'idnguoidung' => $point->nguoiTao->idnguoidung,
                        'hoten' => $point->nguoiTao->hoten,
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'summary' => [
                    'tong_diem' => (float) $tongDiem,
                    'tong_diem_chua_dung' => (float) $tongDiemChuaDung,
                    'tong_diem_da_dung' => (float) $tongDiemDaDung,
                    'so_luong_chua_dung' => $soLuongChuaDung,
                    'so_luong_da_dung' => $soLuongDaDung,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Lỗi khi lấy điểm đổi thưởng:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy điểm đổi thưởng',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Thống kê số buổi tư vấn, doanh thu và số lần thay đổi lịch của các tư vấn viên
     */
    public function getConsultantStatistics(Request $request): JsonResponse
    {
        try {
            $dateFrom = $request->input('date_from');
            $dateTo = $request->input('date_to');
            $consultantId = $request->input('consultant_id'); // Lọc theo tư vấn viên cụ thể

            // Lấy tất cả tư vấn viên
            $consultantsQuery = NguoiDung::where('idvaitro', 4); // 4 = Tư vấn viên
            
            if ($consultantId) {
                $consultantsQuery->where('idnguoidung', $consultantId);
            }

            $consultants = $consultantsQuery->get();

            $statistics = $consultants->map(function ($consultant) use ($dateFrom, $dateTo) {
                // Đếm số buổi tư vấn đã đặt (trangthai = 2: Đã đặt) hoặc đã hoàn thành (trangthai = 4: Hoàn thành)
                $schedulesQuery = LichTuVan::where('idnguoidung', $consultant->idnguoidung)
                    ->whereIn('trangthai', [2, 4]) // 2 = Đã đặt, 4 = Hoàn thành
                    ->whereNotNull('idnguoidat'); // Đã có người đặt

                if ($dateFrom) {
                    $schedulesQuery->where('ngayhen', '>=', $dateFrom);
                }
                if ($dateTo) {
                    $schedulesQuery->where('ngayhen', '<=', $dateTo);
                }

                $schedules = $schedulesQuery->get();
                $soBuoiTuVan = $schedules->count();

                // Tính doanh thu từ các buổi tư vấn (tất cả các lịch đã đặt)
                $scheduleIds = $schedules->pluck('idlichtuvan');
                
                // Tính doanh thu từ tất cả các giao dịch liên quan đến các lịch này
                // Lấy tất cả các giao dịch, không lọc theo trạng thái (để xem tất cả)
                $allPayments = \App\Models\ThanhToan::whereIn('id_lichtuvan', $scheduleIds)->get();
                
                // Tính doanh thu từ các giao dịch đã thanh toán thành công
                $paidPayments = $allPayments->filter(function ($payment) {
                    // Chấp nhận các trạng thái: DaThanhToan, Da Thanh Toan, hoặc các biến thể
                    $status = strtolower(trim($payment->trang_thai ?? ''));
                    return in_array($status, ['dathanhtoan', 'da thanh toan', 'thanhtoan', 'thanh toan']);
                });
                
                $tongDoanhThu = $paidPayments->sum(function ($payment) {
                    // Ưu tiên dùng so_tien_thuc_thu nếu có
                    if (isset($payment->so_tien_thuc_thu) && $payment->so_tien_thuc_thu > 0) {
                        return (float)$payment->so_tien_thuc_thu;
                    }
                    // Nếu không có, tính từ so_tien - so_tien_giam - phi_giao_dich
                    $amount = (float)($payment->so_tien ?? 0);
                    $discount = (float)($payment->so_tien_giam ?? 0);
                    $fee = (float)($payment->phi_giao_dich ?? 0);
                    return $amount - $discount - $fee;
                });
                
                // Debug log để kiểm tra
                if ($soBuoiTuVan > 0 && $tongDoanhThu == 0) {
                    \Log::info('Thống kê doanh thu - Có lịch nhưng không có doanh thu:', [
                        'consultant_id' => $consultant->idnguoidung,
                        'so_buoi' => $soBuoiTuVan,
                        'schedule_ids' => $scheduleIds->toArray(),
                        'total_payments' => $allPayments->count(),
                        'paid_payments' => $paidPayments->count(),
                        'payment_statuses' => $allPayments->pluck('trang_thai')->unique()->toArray(),
                    ]);
                }

                // Đếm số lần thay đổi lịch (yêu cầu đã được duyệt - trangthai_duyet = 2)
                $changeRequestsQuery = YeuCauDoiLich::whereHas('lichTuVan', function ($q) use ($consultant) {
                    $q->where('idnguoidung', $consultant->idnguoidung);
                })
                ->where('trangthai_duyet', 2); // Đã duyệt

                if ($dateFrom) {
                    $changeRequestsQuery->where('thoigian_duyet', '>=', $dateFrom . ' 00:00:00');
                }
                if ($dateTo) {
                    $changeRequestsQuery->where('thoigian_duyet', '<=', $dateTo . ' 23:59:59');
                }

                $soLanThayDoiLich = $changeRequestsQuery->count();

                // Tính tiền công (có thể trừ theo số lần thay đổi lịch)
                // Giả sử mỗi buổi tư vấn = 500,000 VND, mỗi lần thay đổi lịch trừ 150,000 VND
                $tienCongMoiBuoi = 500000; // 500k mỗi buổi
                $truTienMoiLanDoiLich = 150000; // 150k mỗi lần đổi lịch
                $tongTienCong = ($soBuoiTuVan * $tienCongMoiBuoi) - ($soLanThayDoiLich * $truTienMoiLanDoiLich);

                return [
                    'idnguoidung' => $consultant->idnguoidung,
                    'hoten' => $consultant->hoten,
                    'email' => $consultant->email,
                    'so_buoi_tu_van' => $soBuoiTuVan,
                    'tong_doanh_thu' => round($tongDoanhThu, 2),
                    'so_lan_thay_doi_lich' => $soLanThayDoiLich,
                    'tong_tien_cong' => max(0, round($tongTienCong, 2)), // Đảm bảo không âm
                    'tien_cong_moi_buoi' => $tienCongMoiBuoi,
                    'tru_tien_moi_lan_doi_lich' => $truTienMoiLanDoiLich,
                ];
            });

            // Tính tổng hợp
            $tongHop = [
                'tong_so_tu_van_vien' => $statistics->count(),
                'tong_so_buoi_tu_van' => $statistics->sum('so_buoi_tu_van'),
                'tong_doanh_thu' => round($statistics->sum('tong_doanh_thu'), 2),
                'tong_so_lan_thay_doi_lich' => $statistics->sum('so_lan_thay_doi_lich'),
                'tong_tien_cong' => round($statistics->sum('tong_tien_cong'), 2),
            ];

            return response()->json([
                'success' => true,
                'data' => $statistics,
                'summary' => $tongHop,
            ]);
        } catch (\Exception $e) {
            \Log::error('Lỗi khi lấy thống kê tư vấn viên:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy thống kê',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy tất cả lịch tư vấn (dành cho quản lý)
     */
    public function getAllConsultationSchedules(Request $request): JsonResponse
    {
        try {
            $dateFrom = $request->input('date_from');
            $dateTo = $request->input('date_to');
            $status = $request->input('status'); // trangthai: 1=Trống, 2=Đã đặt, 3=Đã hủy, 4=Hoàn thành
            $duyetlich = $request->input('duyetlich'); // 1=Chờ duyệt, 2=Đã duyệt, 3=Từ chối
            $consultantId = $request->input('consultant_id');
            $search = $request->input('search'); // Tìm kiếm theo tên, email, tiêu đề
            $timeFilter = $request->input('time_filter', 'all'); // all, past, upcoming
            
            $query = LichTuVan::with(['nguoiDung', 'nguoiDat', 'nguoiDuyet', 'ghiChu', 'tepMinhChung']);
            
            // Chỉ hiển thị các lịch tư vấn đã có người đặt
            $query->whereNotNull('idnguoidat');
            
            // Filter theo ngày
            if ($dateFrom) {
                $query->where('ngayhen', '>=', $dateFrom);
            }
            if ($dateTo) {
                $query->where('ngayhen', '<=', $dateTo);
            }
            
            // Filter theo thời gian (quá khứ/sắp tới)
            if ($timeFilter === 'past') {
                $query->where('ngayhen', '<', Carbon::today());
            } elseif ($timeFilter === 'upcoming') {
                $query->where('ngayhen', '>=', Carbon::today());
            }
            
            // Filter theo trạng thái
            if ($status !== null && $status !== '') {
                $query->where('trangthai', $status);
            }
            
            // Filter theo trạng thái duyệt
            if ($duyetlich !== null && $duyetlich !== '') {
                $query->where('duyetlich', $duyetlich);
            }
            
            // Filter theo tư vấn viên
            if ($consultantId) {
                $query->where('idnguoidung', $consultantId);
            }
            
            // Tìm kiếm
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('tieude', 'like', "%{$search}%")
                      ->orWhere('noidung', 'like', "%{$search}%")
                      ->orWhereHas('nguoiDung', function($subQ) use ($search) {
                          $subQ->where('hoten', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                      })
                      ->orWhereHas('nguoiDat', function($subQ) use ($search) {
                          $subQ->where('hoten', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }
            
            $schedules = $query->orderBy('ngayhen', 'desc')
                ->orderBy('giobatdau', 'desc')
                ->paginate($request->get('per_page', 20));
            
            $data = $schedules->map(function($schedule) {
                // Đếm số lượng ghi chú (cả NHAP và CHOT)
                $ghiChuCount = $schedule->ghiChu ? $schedule->ghiChu->count() : 0;
                $hasGhiChu = $ghiChuCount > 0;
                
                // Đếm số lượng minh chứng
                $minhChungCount = $schedule->tepMinhChung ? $schedule->tepMinhChung->count() : 0;
                $hasMinhChung = $minhChungCount > 0;
                
                return [
                    'idlichtuvan' => $schedule->idlichtuvan,
                    'tieude' => $schedule->tieude,
                    'noidung' => $schedule->noidung,
                    'chudetuvan' => $schedule->chudetuvan,
                    'molavande' => $schedule->molavande,
                    'ngayhen' => $schedule->ngayhen ? $schedule->ngayhen->format('Y-m-d') : null,
                    'giohen' => $schedule->giohen ? $schedule->giohen->format('H:i') : null,
                    'giobatdau' => $schedule->giobatdau ? $schedule->giobatdau->format('H:i') : null,
                    'ketthuc' => $schedule->ketthuc ? $schedule->ketthuc->format('H:i') : null,
                    'tinhtrang' => $schedule->tinhtrang,
                    'trangthai' => (int) $schedule->trangthai,
                    'duyetlich' => (int) $schedule->duyetlich,
                    'ghichu' => $schedule->ghichu,
                    'hasGhiChu' => $hasGhiChu,
                    'ghiChuCount' => $ghiChuCount,
                    'hasMinhChung' => $hasMinhChung,
                    'minhChungCount' => $minhChungCount,
                    'nguoiDung' => $schedule->nguoiDung ? [
                        'idnguoidung' => $schedule->nguoiDung->idnguoidung,
                        'hoten' => $schedule->nguoiDung->hoten,
                        'email' => $schedule->nguoiDung->email,
                    ] : null,
                    'nguoiDat' => $schedule->nguoiDat ? [
                        'idnguoidung' => $schedule->nguoiDat->idnguoidung,
                        'hoten' => $schedule->nguoiDat->hoten,
                        'email' => $schedule->nguoiDat->email,
                    ] : null,
                    'nguoiDuyet' => $schedule->nguoiDuyet ? [
                        'idnguoidung' => $schedule->nguoiDuyet->idnguoidung,
                        'hoten' => $schedule->nguoiDuyet->hoten,
                        'email' => $schedule->nguoiDuyet->email,
                    ] : null,
                    'ngayduyet' => $schedule->ngayduyet ? $schedule->ngayduyet->format('Y-m-d H:i:s') : null,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $data,
                'pagination' => [
                    'current_page' => $schedules->currentPage(),
                    'last_page' => $schedules->lastPage(),
                    'per_page' => $schedules->perPage(),
                    'total' => $schedules->total(),
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting all consultation schedules:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy danh sách lịch tư vấn',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new consultation schedule
     */
    public function createConsultationSchedule(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'consultant_id' => 'required|exists:nguoidung,idnguoidung',
            'date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'meeting_link' => 'nullable|url',
            'meeting_platform' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000'
        ], [
            'consultant_id.required' => 'ID tư vấn viên là bắt buộc',
            'consultant_id.exists' => 'Tư vấn viên không tồn tại',
            'date.required' => 'Ngày là bắt buộc',
            'date.date' => 'Ngày không đúng định dạng',
            'date.after_or_equal' => 'Ngày phải từ hôm nay trở đi',
            'start_time.required' => 'Giờ bắt đầu là bắt buộc',
            'start_time.date_format' => 'Giờ bắt đầu không đúng định dạng',
            'end_time.required' => 'Giờ kết thúc là bắt buộc',
            'end_time.date_format' => 'Giờ kết thúc không đúng định dạng',
            'end_time.after' => 'Giờ kết thúc phải sau giờ bắt đầu',
            'meeting_link.url' => 'Link phòng họp không đúng định dạng',
            'meeting_platform.max' => 'Nền tảng không được quá 100 ký tự',
            'notes.max' => 'Ghi chú không được quá 1000 ký tự'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check for time conflicts
            $conflict = LichTuVan::where('idnguoidung', $request->consultant_id)
                ->where('ngayhen', $request->date)
                ->where(function($query) use ($request) {
                    $query->whereBetween('giobatdau', [$request->start_time, $request->end_time])
                          ->orWhereBetween('ketthuc', [$request->start_time, $request->end_time])
                          ->orWhere(function($q) use ($request) {
                              $q->where('giobatdau', '<=', $request->start_time)
                                ->where('ketthuc', '>=', $request->end_time);
                          });
                })
                ->exists();

            if ($conflict) {
                return response()->json([
                    'success' => false,
                    'message' => 'Khung giờ này đã bị trùng với lịch khác'
                ], 409);
            }

            // Map request data to lichtuvan table structure
            $scheduleData = [
                'idnguoidung' => $request->consultant_id,
                'tieude' => 'Lịch tư vấn ' . $request->date,
                'noidung' => $request->notes,
                'chudetuvan' => 'Tư vấn tuyển sinh',
                'molavande' => $request->meeting_platform,
                'ngayhen' => $request->date,
                'giohen' => $request->start_time,
                'giobatdau' => $request->start_time,
                'ketthuc' => $request->end_time,
                'tinhtrang' => 'Chờ xử lý',
                'trangthai' => '1', // 1 = lịch trống
                'danhdanhgiadem' => $request->meeting_link,
                'nhanxet' => $request->notes
            ];

            $schedule = LichTuVan::create($scheduleData);

            return response()->json([
                'success' => true,
                'message' => 'Tạo lịch tư vấn thành công',
                'data' => $schedule->load('nguoiDung')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi tạo lịch tư vấn',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a consultation schedule
     */
    public function updateConsultationSchedule(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'date' => 'sometimes|date|after_or_equal:today',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i|after:start_time',
            'status' => 'sometimes|in:1,2,3,4', // 1=trống, 2=đã đặt, 3=hủy, 4=hoàn thành
            'meeting_link' => 'nullable|url',
            'meeting_platform' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000'
        ], [
            'date.date' => 'Ngày không đúng định dạng',
            'date.after_or_equal' => 'Ngày phải từ hôm nay trở đi',
            'start_time.date_format' => 'Giờ bắt đầu không đúng định dạng',
            'end_time.date_format' => 'Giờ kết thúc không đúng định dạng',
            'end_time.after' => 'Giờ kết thúc phải sau giờ bắt đầu',
            'status.in' => 'Trạng thái không hợp lệ',
            'meeting_link.url' => 'Link phòng họp không đúng định dạng',
            'meeting_platform.max' => 'Nền tảng không được quá 100 ký tự',
            'notes.max' => 'Ghi chú không được quá 1000 ký tự'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $schedule = LichTuVan::findOrFail($id);

            // Check for time conflicts if time is being updated
            if ($request->has('start_time') || $request->has('end_time') || $request->has('date')) {
                $conflict = LichTuVan::where('idnguoidung', $schedule->idnguoidung)
                    ->where('idlichtuvan', '!=', $id)
                    ->where('ngayhen', $request->date ?? $schedule->ngayhen)
                    ->where(function($query) use ($request, $schedule) {
                        $startTime = $request->start_time ?? $schedule->giobatdau;
                        $endTime = $request->end_time ?? $schedule->ketthuc;
                        $query->whereBetween('giobatdau', [$startTime, $endTime])
                              ->orWhereBetween('ketthuc', [$startTime, $endTime])
                              ->orWhere(function($q) use ($startTime, $endTime) {
                                  $q->where('giobatdau', '<=', $startTime)
                                    ->where('ketthuc', '>=', $endTime);
                              });
                    })
                    ->exists();

                if ($conflict) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Khung giờ này đã bị trùng với lịch khác'
                    ], 409);
                }
            }

            // Map request data to lichtuvan table structure
            $updateData = [];
            if ($request->has('date')) {
                $updateData['ngayhen'] = $request->date;
            }
            if ($request->has('start_time')) {
                $updateData['giobatdau'] = $request->start_time;
                $updateData['giohen'] = $request->start_time;
            }
            if ($request->has('end_time')) {
                $updateData['ketthuc'] = $request->end_time;
            }
            if ($request->has('status')) {
                $updateData['trangthai'] = $request->status;
            }
            if ($request->has('meeting_link')) {
                $updateData['danhdanhgiadem'] = $request->meeting_link;
            }
            if ($request->has('meeting_platform')) {
                $updateData['molavande'] = $request->meeting_platform;
            }
            if ($request->has('notes')) {
                $updateData['noidung'] = $request->notes;
                $updateData['nhanxet'] = $request->notes;
            }

            $schedule->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật lịch tư vấn thành công',
                'data' => $schedule->load('nguoiDung')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi cập nhật lịch tư vấn',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a consultation schedule
     */
    public function deleteConsultationSchedule($id): JsonResponse
    {
        try {
            $schedule = LichTuVan::findOrFail($id);
            
            // Only allow deletion if not booked or completed (status 2 or 4)
            if (in_array($schedule->trangthai, ['2', '4'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể xóa lịch đã được đặt hoặc hoàn thành'
                ], 403);
            }

            $schedule->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xóa lịch tư vấn thành công'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi xóa lịch tư vấn',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function bookConsultationSchedule(Request $request, $id): JsonResponse
    {
        try {
            // Debug: Log request data
            \Log::info('Book consultation request:', [
                'id' => $id,
                'request_data' => $request->all(),
                'user_id' => $request->input('user_id')
            ]);

            $schedule = LichTuVan::findOrFail($id);
            
            // Debug: Log current schedule data
            \Log::info('Current schedule data:', [
                'id' => $schedule->idlichtuvan,
                'trangthai' => $schedule->trangthai,
                'idnguoidung' => $schedule->idnguoidung,
                'idnguoidat' => $schedule->idnguoidat
            ]);
            
            // Check if schedule is available (status = 1)
            if ($schedule->trangthai != '1') {
                \Log::warning('Schedule not available:', ['trangthai' => $schedule->trangthai]);
                return response()->json([
                    'success' => false,
                    'message' => 'Lịch tư vấn này không còn trống'
                ], 400);
            }

            // Get current user ID from request
            $userId = $request->input('user_id');
            \Log::info('User ID from request:', ['user_id' => $userId]);
            
            if (!$userId) {
                \Log::error('No user ID provided');
                return response()->json([
                    'success' => false,
                    'message' => 'Thiếu thông tin người dùng'
                ], 400);
            }

            // Update schedule status to booked (2) and set idnguoidat
            $updateData = [
                'trangthai' => '2', // Đã đặt lịch
                'idnguoidat' => $userId,
                'tinhtrang' => 'Đã đặt lịch'
            ];
            
            // Debug: Log update data before execution
            \Log::info('Attempting to update schedule with data:', $updateData);
            
            // Try to update the schedule
            $updateResult = $schedule->update($updateData);
            \Log::info('Update result:', ['success' => $updateResult]);
            
            // Tạo reminders 24h/2h/15p cho lịch vừa được đặt
            try {
                $this->createRemindersForSchedule($schedule);
            } catch (\Throwable $e) {
                \Log::warning('Create reminders failed', ['error' => $e->getMessage()]);
            }

            // Debug: Log updated schedule data
            $updatedSchedule = LichTuVan::find($id);
            \Log::info('Updated schedule data:', [
                'id' => $updatedSchedule->idlichtuvan,
                'trangthai' => $updatedSchedule->trangthai,
                'idnguoidung' => $updatedSchedule->idnguoidung,
                'idnguoidat' => $updatedSchedule->idnguoidat
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Đặt lịch tư vấn thành công',
                'data' => $updatedSchedule
            ]);

        } catch (\Exception $e) {
            \Log::error('Book consultation error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi đặt lịch tư vấn',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sinh reminders 24h/2h/15p cho lịch đã duyệt/đã đặt.
     */
    private function createRemindersForSchedule(LichTuVan $schedule): void
    {
        $offsets = [1440, 120, 15];
        $dateStr = $schedule->ngayhen instanceof Carbon ? $schedule->ngayhen->format('Y-m-d') : (string)$schedule->ngayhen;
        $timeStr = $schedule->giobatdau ? ($schedule->giobatdau instanceof Carbon ? $schedule->giobatdau->format('H:i') : (string)$schedule->giobatdau) : ($schedule->giohen instanceof Carbon ? $schedule->giohen->format('H:i') : (string)$schedule->giohen);
        if (!$timeStr) { $timeStr = '00:00'; }
        $startAt = Carbon::createFromFormat('Y-m-d H:i', $dateStr.' '.$timeStr);

        foreach ($offsets as $off) {
            $sendAt = $startAt->copy()->subMinutes($off);
            if ($sendAt->isPast()) { continue; }

            $key = $schedule->idlichtuvan.'-'.$off;
            $exists = ThongBaoLich::where('khoa_idempotent', $key)->exists();
            if ($exists) { continue; }

            ThongBaoLich::create([
                'idlichtuvan' => $schedule->idlichtuvan,
                'loai' => 'reminder',
                'offset_phut' => $off,
                'thoigian_gui' => $sendAt->format('Y-m-d H:i:s'),
                'trangthai' => 'pending',
                'khoa_idempotent' => $key,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }
    }

    /**
     * Lấy các lịch đã đặt của một người dùng (idnguoidat)
     * Trả về các trường tối thiểu để hiển thị ở dashboard người dùng
     */
    public function getMyAppointments(Request $request): JsonResponse
    {
        try {
            $userId = $request->input('user_id');

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Thiếu user_id'
                ], 400);
            }

            // Chỉ lấy các lịch: đã đặt (trangthai = 2)
            // Kèm thông tin tư vấn viên và nhóm ngành
            $schedules = LichTuVan::with(['nguoiDung.nhomNganh'])
                ->where('idnguoidat', $userId)
                ->where('trangthai', '2')
                // Chỉ lấy lịch chưa qua hạn (ngày sau hôm nay, hoặc hôm nay mà giờ kết thúc còn sau hiện tại)
                ->where(function($q) {
                    $q->where('ngayhen', '>', now()->toDateString())
                      ->orWhere(function($q2) {
                          $q2->where('ngayhen', now()->toDateString())
                             ->where('ketthuc', '>', now()->format('H:i:s'));
                      });
                })
                ->orderBy('ngayhen')
                ->orderBy('giobatdau')
                ->get();

            $data = $schedules->map(function ($schedule) {
                return [
                    'id' => $schedule->idlichtuvan,
                    'advisorId' => $schedule->idnguoidung,
                    'groupName' => optional(optional($schedule->nguoiDung)->nhomNganh)->tennhom ?? 'Chưa phân nhóm',
                    'advisorName' => optional($schedule->nguoiDung)->hoten ?? 'N/A',
                    'date' => $schedule->ngayhen ? $schedule->ngayhen->format('Y-m-d') : null,
                    'start' => $schedule->giobatdau ? $schedule->giobatdau->format('H:i') : null,
                    'end' => $schedule->ketthuc ? $schedule->ketthuc->format('H:i') : null,
                    'method' => $schedule->molavande ?? 'Trực tiếp',
                    'joinLink' => $schedule->danhdanhgiadem ?? null,
                    'approveStatus' => (int) ($schedule->duyetlich ?? 1),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy lịch đã đặt: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy danh sách lịch tư vấn cho staff duyệt
     */
    public function getConsultationSchedulesForApproval(Request $request): JsonResponse
    {
        try {
            $query = LichTuVan::with(['nguoiDung.nhomNganh'])
                ->select([
                    'idlichtuvan',
                    'idnguoidung', 
                    'tieude',
                    'noidung',
                    'chudetuvan',
                    'molavande',
                    'ngayhen',
                    'giohen',
                    'giobatdau',
                    'ketthuc',
                    'tinhtrang',
                    'trangthai',
                    'duyetlich',
                    'idnguoiduyet',
                    'ngayduyet',
                    'ghichu'
                ]);

            // Filter by quarter and year
            if ($request->filled('quarter') && $request->filled('year')) {
                $quarter = $request->string('quarter');
                $year = $request->integer('year');
                $months = [];
                
                switch ($quarter) {
                    case 'Q1': $months = [1, 2, 3]; break;
                    case 'Q2': $months = [4, 5, 6]; break;
                    case 'Q3': $months = [7, 8, 9]; break;
                    case 'Q4': $months = [10, 11, 12]; break;
                }
                
                if (!empty($months)) {
                    $query->whereYear('ngayhen', $year)
                          ->whereMonth('ngayhen', $months);
                }
            }

            // Filter by major group
            if ($request->filled('groupId')) {
                $groupId = $request->integer('groupId');
                $query->whereHas('nguoiDung', function($q) use ($groupId) {
                    $q->where('idnhomnganh', $groupId);
                });
            }

            // Filter by consultant
            if ($request->filled('advisorId')) {
                $query->where('idnguoidung', $request->integer('advisorId'));
            }

            // Filter by approval status
            if ($request->filled('status')) {
                $query->where('duyetlich', $request->integer('status'));
            }

            // Filter by method
            if ($request->filled('method')) {
                $query->where('molavande', $request->string('method'));
            }

            // Only show valid time slots
            if ($request->boolean('onlyValid', true)) {
                $query->where(function($q) {
                    $q->where('ngayhen', '>', now()->toDateString())
                      ->orWhere(function($q2) {
                          $q2->where('ngayhen', now()->toDateString())
                             ->where('ketthuc', '>', now()->format('H:i:s'));
                      });
                });
            }

            // Search
            if ($request->filled('search')) {
                $search = $request->string('search');
                $query->where(function($q) use ($search) {
                    $q->where('tieude', 'like', "%{$search}%")
                      ->orWhere('noidung', 'like', "%{$search}%")
                      ->orWhereHas('nguoiDung', function($q2) use ($search) {
                          $q2->where('hoten', 'like', "%{$search}%")
                             ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            $schedules = $query->orderBy('ngayhen')
                              ->orderBy('giohen')
                              ->get();

            // Transform data for frontend
            $transformed = $schedules->map(function($schedule) {
                return [
                    'id' => $schedule->idlichtuvan,
                    'advisorId' => $schedule->idnguoidung,
                    'advisorName' => $schedule->nguoiDung->hoten ?? 'N/A',
                    'groupId' => $schedule->nguoiDung->idnhomnganh ?? null,
                    'groupName' => $schedule->nguoiDung->nhomNganh->tennhom ?? 'Chưa phân nhóm',
                    'date' => $schedule->ngayhen->format('Y-m-d'),
                    'start' => $schedule->giobatdau->format('H:i'),
                    'end' => $schedule->ketthuc->format('H:i'),
                    'method' => $schedule->molavande ?? 'Trực tiếp',
                    'note' => $schedule->noidung ?? '',
                    'title' => $schedule->tieude ?? '',
                    'topic' => $schedule->chudetuvan ?? '',
                    'duyetlich' => $schedule->duyetlich ?? 1, // 1=pending, 2=approved, 0=rejected
                    'approverId' => $schedule->idnguoiduyet,
                    'approverName' => null, // Would need to join with approver user
                    'approvedAt' => $schedule->ngayduyet,
                    'approveNote' => $schedule->ghichu ?? '',
                    'status' => $schedule->tinhtrang ?? 'Chờ xử lý',
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $transformed
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách lịch tư vấn: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Duyệt/từ chối lịch tư vấn
     */
    public function approveConsultationSchedule(Request $request): JsonResponse
    {
        try {
            \Log::info('Approval request received', [
                'request_data' => $request->all(),
                'headers' => $request->headers->all()
            ]);

            $request->validate([
                'scheduleIds' => 'required|array',
                'scheduleIds.*' => 'integer',
                'action' => 'required|in:approve,reject',
                'note' => 'nullable|string|max:500',
                'approverId' => 'nullable|integer|exists:nguoidung,idnguoidung'
            ]);

            $scheduleIds = $request->array('scheduleIds');
            $action = $request->string('action');
            $note = $request->string('note');
            // Get approver ID from request or use default
            $approverId = $request->input('approverId', 34);
            
            // Validate that the approver ID exists in the database
            $approverExists = \App\Models\NguoiDung::where('idnguoidung', $approverId)->exists();
            if (!$approverExists) {
                $approverId = 34; // Fallback to default admin
            }

            \Log::info('Processing approval', [
                'scheduleIds' => $scheduleIds,
                'action' => $action,
                'action_type' => gettype($action),
                'action_length' => strlen($action),
                'action_trimmed' => trim($action),
                'note' => $note,
                'request_approverId' => $request->input('approverId'),
                'approver_exists' => $approverExists,
                'final_approverId' => $approverId
            ]);

            $updatedCount = 0;

            foreach ($scheduleIds as $scheduleId) {
                $schedule = LichTuVan::find($scheduleId);
                if ($schedule && $schedule->duyetlich == 1) { // Only process pending schedules
                    \Log::info('Processing schedule', [
                        'id' => $scheduleId, 
                        'current_duyetlich' => $schedule->duyetlich,
                        'action' => $action,
                        'action_trimmed' => trim($action),
                        'is_approve' => (trim($action) === 'approve' || $action === 'approve')
                    ]);
                    
                    if (trim($action) === 'approve' || $action === 'approve') {
                        // Duyệt: set duyetlich = 2
                        \Log::info('Approving schedule', ['id' => $scheduleId, 'action' => $action]);
                        $schedule->update([
                            'duyetlich' => 2,
                            'idnguoiduyet' => $approverId,
                            'ngayduyet' => now(),
                            'ghichu' => $note
                        ]);
                        \Log::info('Schedule approved', ['id' => $scheduleId, 'duyetlich' => 2]);
                    } else {
                        // Từ chối: set duyetlich = 3
                        \Log::info('Rejecting schedule', ['id' => $scheduleId, 'action' => $action]);
                        $schedule->update([
                            'duyetlich' => 3,
                            'idnguoiduyet' => $approverId,
                            'ngayduyet' => now(),
                            'ghichu' => $note
                        ]);
                        \Log::info('Schedule rejected', ['id' => $scheduleId, 'duyetlich' => 3]);
                    }
                    $updatedCount++;
                    \Log::info('Updated schedule', ['id' => $scheduleId, 'action' => $action, 'duyetlich' => $schedule->duyetlich]);
                }
            }

            \Log::info('Approval completed', ['updatedCount' => $updatedCount]);

            return response()->json([
                'success' => true,
                'message' => $action === 'approve' 
                    ? "Đã duyệt {$updatedCount} lịch tư vấn" 
                    : "Đã từ chối {$updatedCount} lịch tư vấn",
                'updatedCount' => $updatedCount
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Approval error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xử lý: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy tư vấn viên được nhóm theo nhóm ngành cho filter
     */
    public function getConsultantsGroupedByMajor(Request $request): JsonResponse
    {
        try {
            $consultants = NguoiDung::where('idvaitro', 4) // Tư vấn viên
                ->where('trangthai', 1) // Đang hoạt động
                ->with(['nhomNganh'])
                ->orderBy('hoten')
                ->get();

            // Nhóm theo nhóm ngành
            $grouped = $consultants->groupBy(function ($consultant) {
                return $consultant->nhomNganh ? $consultant->nhomNganh->tennhom : 'Chưa phân nhóm';
            });

            $result = [];
            foreach ($grouped as $groupName => $consultants) {
                $result[] = [
                    'groupName' => $groupName,
                    'consultants' => $consultants->map(function ($consultant) {
                        return [
                            'id' => $consultant->idnguoidung,
                            'name' => $consultant->hoten,
                            'email' => $consultant->email,
                            'groupId' => $consultant->idnhomnganh,
                            'groupName' => $consultant->nhomNganh ? $consultant->nhomNganh->tennhom : 'Chưa phân nhóm'
                        ];
                    })->toArray()
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách tư vấn viên: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy tất cả tư vấn viên cho staff quản lý
     */
    public function getAllConsultants(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('perPage', 20);
            $page = $request->get('page', 1);
            $search = $request->get('search', '');
            $status = $request->get('status', 'all');
            $nganhFilter = $request->get('nganh', 'all');
            

            $query = NguoiDung::where('idvaitro', 4) // Tư vấn viên
                ->with(['nhomNganh', 'vaiTro']);

            // Tìm kiếm theo tên hoặc email
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('hoten', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Lọc theo trạng thái
            if ($status !== 'all') {
                $query->where('trangthai', $status === 'Hoạt động' ? 1 : 0);
            }

            // Lọc theo nhóm ngành
            if ($nganhFilter !== 'all') {
                $query->where('idnhomnganh', $nganhFilter);
            }

            $consultants = $query->select(
                'idnguoidung',
                'hoten',
                'email',
                'sodienthoai',
                'diachi',
                'ngaysinh',
                'gioitinh',
                'idnhomnganh',
                'idvaitro',
                'trangthai',
                'ngaytao',
                'ngaycapnhat'
            )->paginate($perPage, ['*'], 'page', $page);

            // Format response
            $formattedConsultants = $consultants->map(function ($consultant) {
                return [
                    'id' => $consultant->idnguoidung,
                    'name' => $consultant->hoten,
                    'email' => $consultant->email,
                    'phone' => $consultant->sodienthoai,
                    'nganhHoc' => $consultant->nhomNganh ? $consultant->nhomNganh->tennhom : 'Chưa xác định',
                    'nganhHocId' => $consultant->idnhomnganh, // ID nhóm ngành để edit
                    'address' => $consultant->diachi,
                    'birthday' => $consultant->ngaysinh,
                    'gender' => $consultant->gioitinh,
                    'status' => $consultant->trangthai == 1 ? 'Hoạt động' : 'Tạm dừng',
                    'ngaytao' => $consultant->ngaytao,
                    'ngaycapnhat' => $consultant->ngaycapnhat
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedConsultants,
                'current_page' => $consultants->currentPage(),
                'last_page' => $consultants->lastPage(),
                'total' => $consultants->total(),
                'per_page' => $consultants->perPage()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy danh sách tư vấn viên',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy thông tin chi tiết tư vấn viên
     */
    public function getConsultantById($id): JsonResponse
    {
        try {
            $consultant = NguoiDung::where('idnguoidung', $id)
                ->where('idvaitro', 4)
                ->with(['nhomNganh', 'vaiTro'])
                ->first();

            if (!$consultant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy tư vấn viên'
                ], 404);
            }

            $formattedConsultant = [
                'id' => $consultant->idnguoidung,
                'name' => $consultant->hoten,
                'email' => $consultant->email,
                'phone' => $consultant->sodienthoai,
                'address' => $consultant->diachi,
                'birthday' => $consultant->ngaysinh,
                'gender' => $consultant->gioitinh,
                'nganhHoc' => $consultant->nhomNganh ? [
                    'id' => $consultant->nhomNganh->idnhomnganh,
                    'name' => $consultant->nhomNganh->tennhom
                ] : null,
                'status' => $consultant->trangthai == 1 ? 'Hoạt động' : 'Tạm dừng',
                'ngaytao' => $consultant->ngaytao,
                'ngaycapnhat' => $consultant->ngaycapnhat
            ];

            return response()->json([
                'success' => true,
                'data' => $formattedConsultant
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy thông tin tư vấn viên',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tạo tư vấn viên mới
     */
    public function createConsultant(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:nguoidung,email|max:255',
            'phone' => 'required|string|regex:/^[0-9]{10,11}$/|unique:nguoidung,sodienthoai',
            'nganhHoc' => 'required|integer|exists:nhomnganh,idnhomnganh',
            'status' => 'required|in:Hoạt động,Tạm dừng',
            'address' => 'nullable|string|max:500',
            'birthday' => 'nullable|date|before:today',
            'gender' => 'nullable|in:Nam,Nữ,Khác'
        ], [
            'name.required' => 'Họ tên là bắt buộc',
            'name.string' => 'Họ tên phải là chuỗi ký tự',
            'name.max' => 'Họ tên không được quá 255 ký tự',
            'email.required' => 'Email là bắt buộc',
            'email.email' => 'Email không đúng định dạng',
            'email.unique' => 'Email này đã được sử dụng',
            'email.max' => 'Email không được quá 255 ký tự',
            'phone.required' => 'Số điện thoại là bắt buộc',
            'phone.regex' => 'Số điện thoại phải có 10-11 chữ số',
            'phone.unique' => 'Số điện thoại này đã được sử dụng',
            'nganhHoc.required' => 'Nhóm ngành là bắt buộc',
            'nganhHoc.integer' => 'Nhóm ngành phải là số nguyên',
            'nganhHoc.exists' => 'Nhóm ngành không tồn tại',
            'status.required' => 'Trạng thái là bắt buộc',
            'status.in' => 'Trạng thái không hợp lệ',
            'address.string' => 'Địa chỉ phải là chuỗi ký tự',
            'address.max' => 'Địa chỉ không được quá 500 ký tự',
            'birthday.date' => 'Ngày sinh không đúng định dạng',
            'birthday.before' => 'Ngày sinh phải trước ngày hiện tại',
            'gender.in' => 'Giới tính không hợp lệ'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $consultant = NguoiDung::create([
                'idvaitro' => 4, // Tư vấn viên
                'idnhomnganh' => $request->nganhHoc,
                'taikhoan' => $request->email,
                'matkhau' => '123456', // Mật khẩu mặc định
                'email' => $request->email,
                'hoten' => $request->name,
                'sodienthoai' => $request->phone,
                'diachi' => $request->address,
                'ngaysinh' => $request->birthday,
                'gioitinh' => $request->gender,
                'trangthai' => $request->status === 'Hoạt động' ? 1 : 0,
                'ngaytao' => now(),
                'ngaycapnhat' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tạo tư vấn viên thành công',
                'data' => [
                    'id' => $consultant->idnguoidung,
                    'name' => $consultant->hoten,
                    'email' => $consultant->email,
                    'phone' => $consultant->sodienthoai,
                    'status' => $consultant->trangthai == 1 ? 'Hoạt động' : 'Tạm dừng'
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi tạo tư vấn viên',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cập nhật tư vấn viên
     */
    public function updateConsultant(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'phone' => 'sometimes|string|regex:/^[0-9]{10,11}$/',
            'nganhHoc' => 'sometimes|integer|exists:nhomnganh,idnhomnganh',
            'status' => 'sometimes|in:Hoạt động,Tạm dừng',
            'address' => 'nullable|string|max:500',
            'birthday' => 'nullable|date|before:today',
            'gender' => 'nullable|in:Nam,Nữ,Khác'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $consultant = NguoiDung::where('idnguoidung', $id)
                ->where('idvaitro', 4)
                ->first();

            if (!$consultant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy tư vấn viên'
                ], 404);
            }

            // Kiểm tra email trùng lặp nếu có thay đổi
            if ($request->has('email') && $request->email !== $consultant->email) {
                $existingEmail = NguoiDung::where('email', $request->email)
                    ->where('idnguoidung', '!=', $id)
                    ->exists();
                if ($existingEmail) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Email này đã được sử dụng'
                    ], 422);
                }
            }

            // Kiểm tra số điện thoại trùng lặp nếu có thay đổi
            if ($request->has('phone') && $request->phone !== $consultant->sodienthoai) {
                $existingPhone = NguoiDung::where('sodienthoai', $request->phone)
                    ->where('idnguoidung', '!=', $id)
                    ->exists();
                if ($existingPhone) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Số điện thoại này đã được sử dụng'
                    ], 422);
                }
            }

            // Cập nhật thông tin
            $updateData = [];
            if ($request->has('name')) $updateData['hoten'] = $request->name;
            if ($request->has('email')) $updateData['email'] = $request->email;
            if ($request->has('phone')) $updateData['sodienthoai'] = $request->phone;
            if ($request->has('nganhHoc')) $updateData['idnhomnganh'] = $request->nganhHoc;
            if ($request->has('status')) $updateData['trangthai'] = $request->status === 'Hoạt động' ? 1 : 0;
            if ($request->has('address')) $updateData['diachi'] = $request->address;
            if ($request->has('birthday')) $updateData['ngaysinh'] = $request->birthday;
            if ($request->has('gender')) $updateData['gioitinh'] = $request->gender;
            
            $updateData['ngaycapnhat'] = now();

            $consultant->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật tư vấn viên thành công',
                'data' => [
                    'id' => $consultant->idnguoidung,
                    'name' => $consultant->hoten,
                    'email' => $consultant->email,
                    'phone' => $consultant->sodienthoai,
                    'status' => $consultant->trangthai == 1 ? 'Hoạt động' : 'Tạm dừng'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi cập nhật tư vấn viên',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Xóa tư vấn viên
     */
    public function deleteConsultant($id): JsonResponse
    {
        try {
            $consultant = NguoiDung::where('idnguoidung', $id)
                ->where('idvaitro', 4)
                ->first();

            if (!$consultant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy tư vấn viên'
                ], 404);
            }

            // Kiểm tra xem tư vấn viên có lịch tư vấn đang hoạt động không
            $activeSchedules = LichTuVan::where('idnguoidung', $id)
                ->whereIn('trangthai', ['1', '2']) // Trống hoặc đã đặt
                ->exists();

            if ($activeSchedules) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể xóa tư vấn viên có lịch tư vấn đang hoạt động'
                ], 403);
            }

            $consultant->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xóa tư vấn viên thành công'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi xóa tư vấn viên',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cập nhật trạng thái tư vấn viên
     */
    public function updateConsultantStatus(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:Hoạt động,Tạm dừng'
        ], [
            'status.required' => 'Trạng thái là bắt buộc',
            'status.in' => 'Trạng thái không hợp lệ'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $consultant = NguoiDung::where('idnguoidung', $id)
                ->where('idvaitro', 4)
                ->first();

            if (!$consultant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy tư vấn viên'
                ], 404);
            }

            $consultant->trangthai = $request->status === 'Hoạt động' ? 1 : 0;
            $consultant->ngaycapnhat = now();
            $consultant->save();

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật trạng thái tư vấn viên thành công',
                'data' => [
                    'id' => $consultant->idnguoidung,
                    'name' => $consultant->hoten,
                    'status' => $consultant->trangthai == 1 ? 'Hoạt động' : 'Tạm dừng'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi cập nhật trạng thái tư vấn viên',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách buổi tư vấn có thể ghi chú cho tư vấn viên
     */
    public function getConsultationNotes(Request $request): JsonResponse
    {
        try {
            \Log::info('getConsultationNotes called', [
                'consultant_id' => $request->input('consultant_id'),
                'date_filter' => $request->input('date_filter'),
                'filter_upcoming' => $request->input('filter_upcoming'),
                'view_mode' => $request->input('view_mode'), // 'input' hoặc 'view'
            ]);

            $consultantId = $request->input('consultant_id');
            $dateFilter = $request->input('date_filter'); // 'today', '7days', 'month'
            $filterUpcoming = $request->input('filter_upcoming', false); // Chỉ lọc ngày hôm nay và các ngày chưa hết hạn
            $viewMode = $request->input('view_mode', 'input'); // 'input' hoặc 'view', mặc định là 'input'

            if (!$consultantId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Thiếu consultant_id'
                ], 400);
            }

            // Load relationships tùy theo view_mode
            $withRelations = [
                'nguoiDat', 
                'ghiChuChot',
                'tepMinhChung'
            ];
            
            // Ở chế độ "view", load tất cả ghi chú (NHAP và CHOT)
            // Ở chế độ "input", chỉ load NHAP
            if ($viewMode === 'view') {
                $withRelations['ghiChu'] = function($q) {
                    // Load tất cả ghi chú (NHAP và CHOT)
                    $q->whereIn('trang_thai', ['NHAP', 'CHOT']);
                };
            } else {
                $withRelations['ghiChu'] = function($q) {
                    $q->where('trang_thai', 'NHAP');
                };
            }
            
            $query = LichTuVan::with($withRelations)->byConsultant($consultantId);

            // Ở chế độ "Nhập ghi chú", chỉ hiển thị các lịch đã có thí sinh đặt với tình trạng "Đã đặt lịch"
            if ($viewMode === 'input') {
                $query->whereNotNull('idnguoidat') // Đã có thí sinh đặt lịch
                      ->where('tinhtrang', 'Đã đặt lịch') // Tình trạng là "Đã đặt lịch"
                      ->where('duyetlich', 2); // Chỉ hiển thị buổi đã duyệt để nhập ghi chú
            }

            // Filter theo thời gian (chỉ áp dụng nếu có chọn filter)
            // Ở chế độ "view", có thể hiển thị tất cả thời gian nếu không chọn filter
            if ($dateFilter === 'today') {
                $query->where('ngayhen', Carbon::today());
            } elseif ($dateFilter === '7days') {
                $query->where('ngayhen', '>=', Carbon::today())
                      ->where('ngayhen', '<=', Carbon::today()->addDays(7));
            } elseif ($dateFilter === 'month') {
                $query->whereMonth('ngayhen', Carbon::now()->month)
                      ->whereYear('ngayhen', Carbon::now()->year);
            }
            // Nếu dateFilter là empty hoặc 'all', không filter theo thời gian (hiển thị tất cả)

            // Filter chỉ lọc ngày hôm nay và các ngày chưa hết hạn (ngày >= hôm nay)
            // Chỉ áp dụng ở chế độ "input" (Nhập ghi chú)
            // Ở chế độ "view" (Xem ghi chú đã gửi), hiển thị tất cả ghi chú, kể cả quá khứ
            if ($filterUpcoming && $viewMode === 'input') {
                $query->where('ngayhen', '>=', Carbon::today());
            }

            $sessions = $query->orderBy('ngayhen', 'desc')
                             ->orderBy('giobatdau', 'desc')
                             ->get();

            \Log::info('Sessions found before mapping', [
                'count' => $sessions->count(),
                'view_mode' => $viewMode,
                'session_ids' => $sessions->pluck('idlichtuvan')->toArray()
            ]);

            $data = $sessions->map(function($session) use ($viewMode) {
                // Ở chế độ "view", lấy ghi chú từ collection ghiChu (có thể là NHAP hoặc CHOT)
                // Ở chế độ "input", vẫn dùng ghiChuChot relationship
                if ($viewMode === 'view') {
                    // Lấy CHOT từ collection nếu có, nếu không thì lấy từ relationship
                    $ghiChuChotFromCollection = $session->ghiChu->where('trang_thai', 'CHOT')->first();
                    $ghiChuChot = $ghiChuChotFromCollection ?: $session->ghiChuChot;
                } else {
                    $ghiChuChot = $session->ghiChuChot;
                }
                
                \Log::info('Processing session', [
                    'session_id' => $session->idlichtuvan,
                    'view_mode' => $viewMode,
                    'ghi_chu_count' => $session->ghiChu ? $session->ghiChu->count() : 0,
                    'ghi_chu_statuses' => $session->ghiChu ? $session->ghiChu->pluck('trang_thai')->toArray() : [],
                    'has_ghi_chu_chot' => !is_null($ghiChuChot),
                    'ghi_chu_chot_id' => $ghiChuChot ? $ghiChuChot->id_ghichu : null,
                    'ghi_chu_chot_trang_thai' => $ghiChuChot ? $ghiChuChot->trang_thai : null,
                ]);
                $canEdit = true;
                
                // Kiểm tra thời hạn sửa
                if ($ghiChuChot && $ghiChuChot->thoi_han_sua_den) {
                    try {
                        $canEdit = Carbon::now()->lt($ghiChuChot->thoi_han_sua_den);
                    } catch (\Exception $e) {
                        \Log::warning('Error checking thoi_han_sua_den', ['error' => $e->getMessage()]);
                    }
                }

                // Kiểm tra điều kiện nhập ghi chú (từ 15 phút trước giờ bắt đầu đến 48h sau giờ kết thúc)
                $canAddNote = false;
                if ($session->ngayhen && $session->giobatdau && $session->ketthuc) {
                    try {
                        $ngayhenStr = $session->ngayhen instanceof \Carbon\Carbon 
                            ? $session->ngayhen->format('Y-m-d')
                            : (is_string($session->ngayhen) ? $session->ngayhen : null);
                        
                        $giobatdauStr = $session->giobatdau instanceof \Carbon\Carbon 
                            ? $session->giobatdau->format('H:i:s')
                            : (is_string($session->giobatdau) ? substr($session->giobatdau, 0, 8) : null);
                        
                        $ketthucStr = $session->ketthuc instanceof \Carbon\Carbon 
                            ? $session->ketthuc->format('H:i:s')
                            : (is_string($session->ketthuc) ? substr($session->ketthuc, 0, 8) : null);

                        if ($ngayhenStr && $giobatdauStr && $ketthucStr) {
                            $startTime = Carbon::parse($ngayhenStr . ' ' . $giobatdauStr);
                            $endTime = Carbon::parse($ngayhenStr . ' ' . $ketthucStr);
                            $startWindow = $startTime->copy()->subMinutes(15);
                            $endWindow = $endTime->copy()->addHours(48);
                            $now = Carbon::now();
                            $canAddNote = $now->gte($startWindow) && $now->lte($endWindow);
                        }
                    } catch (\Exception $e) {
                        \Log::warning('Error calculating canAddNote', ['error' => $e->getMessage()]);
                    }
                }

                // Format date/time an toàn
                $ngayhen = null;
                if ($session->ngayhen) {
                    try {
                        $ngayhen = $session->ngayhen instanceof \Carbon\Carbon 
                            ? $session->ngayhen->format('Y-m-d')
                            : (is_string($session->ngayhen) ? $session->ngayhen : null);
                    } catch (\Exception $e) {
                        \Log::warning('Error formatting ngayhen', ['error' => $e->getMessage()]);
                    }
                }

                $giobatdau = null;
                if ($session->giobatdau) {
                    try {
                        $giobatdau = $session->giobatdau instanceof \Carbon\Carbon 
                            ? $session->giobatdau->format('H:i')
                            : (is_string($session->giobatdau) ? substr($session->giobatdau, 0, 5) : null);
                    } catch (\Exception $e) {
                        \Log::warning('Error formatting giobatdau', ['error' => $e->getMessage()]);
                    }
                }

                $ketthuc = null;
                if ($session->ketthuc) {
                    try {
                        $ketthuc = $session->ketthuc instanceof \Carbon\Carbon 
                            ? $session->ketthuc->format('H:i')
                            : (is_string($session->ketthuc) ? substr($session->ketthuc, 0, 5) : null);
                    } catch (\Exception $e) {
                        \Log::warning('Error formatting ketthuc', ['error' => $e->getMessage()]);
                    }
                }

                $ghiChuNhap = $session->ghiChu->where('trang_thai', 'NHAP')->first();
                
                // Ở chế độ "view", nếu chỉ có NHAP (không có CHOT), vẫn hiển thị NHAP như là ghi chú đã gửi
                // Để frontend hiển thị đúng, nếu chỉ có NHAP thì đặt vào ghi_chu_chot (vì frontend check ghi_chu_chot để hiển thị)
                if ($viewMode === 'view' && !$ghiChuChot && $ghiChuNhap) {
                    // Nếu chỉ có NHAP, dùng NHAP như là ghi chú đã gửi
                    $ghiChuChot = $ghiChuNhap;
                    $ghiChuNhap = null; // Không hiển thị NHAP riêng nữa vì đã đặt vào ghi_chu_chot
                }
                
                // Log để debug
                \Log::debug('Session ghi chú data', [
                    'session_id' => $session->idlichtuvan,
                    'view_mode' => $viewMode,
                    'has_ghi_chu_collection' => $session->ghiChu ? $session->ghiChu->count() : 0,
                    'ghi_chu_statuses' => $session->ghiChu ? $session->ghiChu->pluck('trang_thai')->toArray() : [],
                    'has_ghi_chu_chot' => !is_null($ghiChuChot),
                    'has_ghi_chu_nhap' => !is_null($ghiChuNhap),
                    'ghi_chu_chot_id' => $ghiChuChot ? $ghiChuChot->id_ghichu : null,
                    'ghi_chu_chot_trang_thai' => $ghiChuChot ? $ghiChuChot->trang_thai : null,
                    'ghi_chu_nhap_id' => $ghiChuNhap ? $ghiChuNhap->id_ghichu : null,
                ]);

                return [
                    'id' => $session->idlichtuvan,
                    'tieude' => $session->tieude,
                    'chudetuvan' => $session->chudetuvan,
                    'molavande' => $session->molavande,
                    'ngayhen' => $ngayhen,
                    'giobatdau' => $giobatdau,
                    'ketthuc' => $ketthuc,
                    'tinhtrang' => $session->tinhtrang,
                    'duyetlich' => $session->duyetlich,
                    'nhanxet' => $session->nhanxet,
                    'thisinhten' => $session->nguoiDat ? $session->nguoiDat->hoten : null,
                    'ghi_chu_chot' => $ghiChuChot ? [
                        'id' => $ghiChuChot->id_ghichu,
                        'noi_dung' => $ghiChuChot->noi_dung,
                        'ket_luan_nganh' => $ghiChuChot->ket_luan_nganh,
                        'muc_quan_tam' => $ghiChuChot->muc_quan_tam,
                        'diem_du_kien' => $ghiChuChot->diem_du_kien,
                        'yeu_cau_bo_sung' => $ghiChuChot->yeu_cau_bo_sung,
                        'chia_se_voi_thisinh' => $ghiChuChot->chia_se_voi_thisinh,
                        'trang_thai' => $ghiChuChot->trang_thai,
                        'thoi_han_sua_den' => $ghiChuChot->thoi_han_sua_den ? $ghiChuChot->thoi_han_sua_den->format('Y-m-d H:i:s') : null,
                    ] : null,
                    'ghi_chu_nhap' => $ghiChuNhap ? [
                        'id' => $ghiChuNhap->id_ghichu,
                        'noi_dung' => $ghiChuNhap->noi_dung,
                        'ket_luan_nganh' => $ghiChuNhap->ket_luan_nganh,
                        'muc_quan_tam' => $ghiChuNhap->muc_quan_tam,
                        'diem_du_kien' => $ghiChuNhap->diem_du_kien,
                        'yeu_cau_bo_sung' => $ghiChuNhap->yeu_cau_bo_sung,
                        'chia_se_voi_thisinh' => $ghiChuNhap->chia_se_voi_thisinh,
                        'trang_thai' => $ghiChuNhap->trang_thai,
                    ] : null,
                    'can_edit' => $canEdit,
                    'can_add_note' => $canAddNote,
                    'so_minh_chung' => $session->tepMinhChung ? $session->tepMinhChung->where('la_minh_chung', 1)->count() : 0,
                ];
            });

            // Filter dữ liệu theo view_mode
            if ($viewMode === 'input') {
                // Ở chế độ "Nhập ghi chú", loại bỏ:
                // 1. Các session chỉ có ghi chú NHAP (chưa có chốt)
                // 2. Các session có ghi chú CHOT nhưng quá thời hạn sửa (can_edit = false)
                // 3. Các session quá thời hạn nhập ghi chú (can_add_note = false) khi chưa có ghi chú
                $data = $data->filter(function($session) {
                    // Nếu chỉ có ghi_chu_nhap mà không có ghi_chu_chot → loại bỏ (chỉ có nháp)
                    if (!empty($session['ghi_chu_nhap']) && empty($session['ghi_chu_chot'])) {
                        return false;
                    }
                    
                    // Nếu có ghi_chu_chot nhưng can_edit = false → loại bỏ (quá thời hạn sửa)
                    if (!empty($session['ghi_chu_chot']) && $session['can_edit'] === false) {
                        return false;
                    }
                    
                    // Nếu chưa có ghi chú nào (không có cả nháp và chốt) nhưng can_add_note = false → loại bỏ (quá thời hạn nhập)
                    if (empty($session['ghi_chu_nhap']) && empty($session['ghi_chu_chot']) && $session['can_add_note'] === false) {
                        return false;
                    }
                    
                    return true;
                });
            } elseif ($viewMode === 'view') {
                // Ở chế độ "Xem ghi chú đã gửi", hiển thị TẤT CẢ các session có ghi chú (NHAP hoặc CHOT)
                // Không phân biệt CHOT hay NHAP, chỉ cần có ghi chú là hiển thị
                $beforeFilterCount = $data->count();
                $data = $data->filter(function($session) {
                    // Hiển thị nếu có ghi_chu_chot HOẶC ghi_chu_nhap (bất kỳ loại nào)
                    $hasGhiChu = !empty($session['ghi_chu_chot']) || !empty($session['ghi_chu_nhap']);
                    if (!$hasGhiChu) {
                        \Log::debug('Filtering out session without any ghi chu', [
                            'session_id' => $session['id'] ?? null,
                            'has_ghi_chu_chot' => !empty($session['ghi_chu_chot']),
                            'has_ghi_chu_nhap' => !empty($session['ghi_chu_nhap']),
                            'ghi_chu_chot_data' => $session['ghi_chu_chot'] ?? null,
                            'ghi_chu_nhap_data' => $session['ghi_chu_nhap'] ?? null
                        ]);
                    } else {
                        \Log::debug('Session has ghi chu - will display', [
                            'session_id' => $session['id'] ?? null,
                            'has_ghi_chu_chot' => !empty($session['ghi_chu_chot']),
                            'has_ghi_chu_nhap' => !empty($session['ghi_chu_nhap']),
                            'ghi_chu_chot_id' => $session['ghi_chu_chot']['id'] ?? null,
                            'ghi_chu_nhap_id' => $session['ghi_chu_nhap']['id'] ?? null
                        ]);
                    }
                    return $hasGhiChu;
                });
                \Log::info('Filtered for view mode', [
                    'before_filter' => $beforeFilterCount,
                    'after_filter' => $data->count(),
                    'removed_count' => $beforeFilterCount - $data->count(),
                    'session_ids_with_ghi_chu' => $data->pluck('id')->toArray()
                ]);
            }

            \Log::info('getConsultationNotes success', [
                'count' => $data->count(),
                'view_mode' => $viewMode,
                'filtered_count' => $data->count(),
                'session_ids' => $data->pluck('id')->toArray()
            ]);

            return response()->json([
                'success' => true,
                'data' => $data->values() // Reset keys sau khi filter
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in getConsultationNotes', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy danh sách ghi chú',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy chi tiết ghi chú của một buổi tư vấn
     */
    public function getNoteBySession(Request $request, $sessionId): JsonResponse
    {
        try {
            \Log::info('getNoteBySession called', ['sessionId' => $sessionId]);
            
            $session = LichTuVan::with([
                'nguoiDat', 
                'ghiChu' => function($q) {
                    $q->with('tepMinhChung');
                },
                'tepMinhChung'
            ])->findOrFail($sessionId);

            // Load ghiChuChot riêng vì nó là hasOne với điều kiện
            $ghiChuChot = GhiChuBuoiTuVan::where('id_lichtuvan', $sessionId)
                ->where('trang_thai', 'CHOT')
                ->first();
            
            $ghiChuNhap = $session->ghiChu->where('trang_thai', 'NHAP')->first();

            // Format date/time an toàn
            $ngayhen = null;
            if ($session->ngayhen) {
                try {
                    $ngayhen = $session->ngayhen instanceof \Carbon\Carbon 
                        ? $session->ngayhen->format('Y-m-d')
                        : (is_string($session->ngayhen) ? $session->ngayhen : null);
                } catch (\Exception $e) {
                    \Log::warning('Error formatting ngayhen', ['error' => $e->getMessage()]);
                }
            }

            $giobatdau = null;
            if ($session->giobatdau) {
                try {
                    $giobatdau = $session->giobatdau instanceof \Carbon\Carbon 
                        ? $session->giobatdau->format('H:i')
                        : (is_string($session->giobatdau) ? substr($session->giobatdau, 0, 5) : null);
                } catch (\Exception $e) {
                    \Log::warning('Error formatting giobatdau', ['error' => $e->getMessage()]);
                }
            }

            $ketthuc = null;
            if ($session->ketthuc) {
                try {
                    $ketthuc = $session->ketthuc instanceof \Carbon\Carbon 
                        ? $session->ketthuc->format('H:i')
                        : (is_string($session->ketthuc) ? substr($session->ketthuc, 0, 5) : null);
                } catch (\Exception $e) {
                    \Log::warning('Error formatting ketthuc', ['error' => $e->getMessage()]);
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'session' => [
                        'id' => $session->idlichtuvan,
                        'tieude' => $session->tieude,
                        'chudetuvan' => $session->chudetuvan,
                        'molavande' => $session->molavande,
                        'ngayhen' => $ngayhen,
                        'giobatdau' => $giobatdau,
                        'ketthuc' => $ketthuc,
                        'tinhtrang' => $session->tinhtrang,
                        'duyetlich' => $session->duyetlich,
                        'nhanxet' => $session->nhanxet,
                        'thisinhten' => $session->nguoiDat ? $session->nguoiDat->hoten : null,
                        'danhdanhgiadem' => $session->danhdanhgiadem,
                    ],
                    'ghi_chu_chot' => $ghiChuChot,
                    'ghi_chu_nhap' => $ghiChuNhap,
                    'minh_chung' => $session->tepMinhChung->map(function($file) {
                        return [
                            'id_file' => $file->id_file,
                            'id_ghichu' => $file->id_ghichu,
                            'id_lichtuvan' => $file->id_lichtuvan,
                            'ten_file' => $file->ten_file,
                            'loai_file' => $file->loai_file,
                            'mo_ta' => $file->mo_ta,
                            'duong_dan' => $file->duong_dan,
                            'la_minh_chung' => $file->la_minh_chung,
                            'created_at' => $file->created_at ? $file->created_at->format('Y-m-d H:i:s') : null,
                        ];
                    }),
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            \Log::error('Session not found', ['sessionId' => $sessionId, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy buổi tư vấn',
                'error' => $e->getMessage()
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error in getNoteBySession', [
                'sessionId' => $sessionId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy ghi chú',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lưu nháp ghi chú
     */
    public function saveNoteDraft(Request $request): JsonResponse
    {
        try {
            \Log::info('saveNoteDraft called', [
                'id_lichtuvan' => $request->input('id_lichtuvan'),
                'has_new_evidences' => $request->has('new_evidences'),
                'new_evidences_count' => is_array($request->input('new_evidences')) ? count($request->input('new_evidences')) : 0,
                'all_keys' => array_keys($request->all()),
                'has_files' => $request->hasFile('new_evidences'),
                'all_files' => array_keys($request->allFiles()),
            ]);

            $validator = Validator::make($request->all(), [
                'id_lichtuvan' => 'required|exists:lichtuvan,idlichtuvan',
                'id_tuvanvien' => 'required|exists:nguoidung,idnguoidung',
                'noi_dung' => 'nullable|string',
                'ket_luan_nganh' => 'nullable|string|max:255',
                'muc_quan_tam' => 'nullable|integer|min:1|max:5',
                'diem_du_kien' => 'nullable|numeric|min:0|max:30',
                'yeu_cau_bo_sung' => 'nullable|string|max:255',
                'chia_se_voi_thisinh' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                \Log::error('Validation failed in saveNoteDraft', ['errors' => $validator->errors()->toArray()]);
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Kiểm tra buổi đã duyệt chưa
            $session = LichTuVan::findOrFail($request->id_lichtuvan);
            if ($session->duyetlich != 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'Buổi tư vấn chưa được duyệt'
                ], 403);
            }

            // Tìm hoặc tạo bản nháp
            $ghiChuNhap = GhiChuBuoiTuVan::where('id_lichtuvan', $request->id_lichtuvan)
                ->where('trang_thai', 'NHAP')
                ->first();

            $shareWithCandidate = filter_var($request->input('chia_se_voi_thisinh', $ghiChuNhap ? $ghiChuNhap->chia_se_voi_thisinh : false), FILTER_VALIDATE_BOOLEAN);

            if ($ghiChuNhap) {
                $ghiChuNhap->update([
                    'noi_dung' => $request->noi_dung ?? $ghiChuNhap->noi_dung,
                    'ket_luan_nganh' => $request->ket_luan_nganh ?? $ghiChuNhap->ket_luan_nganh,
                    'muc_quan_tam' => $request->muc_quan_tam ?? $ghiChuNhap->muc_quan_tam,
                    'diem_du_kien' => $request->diem_du_kien ?? $ghiChuNhap->diem_du_kien,
                    'yeu_cau_bo_sung' => $request->yeu_cau_bo_sung ?? $ghiChuNhap->yeu_cau_bo_sung,
                    'chia_se_voi_thisinh' => $shareWithCandidate,
                ]);
            } else {
                $ghiChuNhap = GhiChuBuoiTuVan::create([
                    'id_lichtuvan' => $request->id_lichtuvan,
                    'id_tuvanvien' => $request->id_tuvanvien,
                    'noi_dung' => $request->noi_dung ?? '',
                    'ket_luan_nganh' => $request->ket_luan_nganh ?? null,
                    'muc_quan_tam' => $request->muc_quan_tam ?? null,
                    'diem_du_kien' => $request->diem_du_kien ?? null,
                    'yeu_cau_bo_sung' => $request->yeu_cau_bo_sung ?? null,
                    'chia_se_voi_thisinh' => $shareWithCandidate,
                    'trang_thai' => 'NHAP',
                ]);
            }

            // Xóa minh chứng nếu có yêu cầu
            $removeEvidenceIds = $request->input('remove_evidence_ids', []);
            $removeEvidenceIds = array_filter(array_map('intval', (array)$removeEvidenceIds));
            if (!empty($removeEvidenceIds)) {
                TepMinhChungBuoiTuVan::where('id_lichtuvan', $request->id_lichtuvan)
                    ->whereIn('id_file', $removeEvidenceIds)
                    ->delete();
            }

            // Thêm minh chứng mới nếu có
            // Parse nested array từ FormData - Laravel có thể parse thành nested array hoặc flat keys
            $allRequest = $request->all();
            \Log::info('All request data keys', ['keys' => array_keys($allRequest)]);
            
            // Thử lấy trực tiếp từ request (nếu Laravel đã parse)
            $newEvidences = $request->input('new_evidences', []);
            
            // Nếu không có hoặc không phải array, thử parse từ flat keys
            if (!is_array($newEvidences) || count($newEvidences) === 0) {
                $newEvidences = [];
                $evidenceIndexes = [];
                
                // Tìm tất cả keys có pattern new_evidences[X][field] hoặc new_evidences.X.field
                foreach ($allRequest as $key => $value) {
                    // Pattern 1: new_evidences[0][ten_file]
                    if (preg_match('/^new_evidences\[(\d+)\]\[(.+)\]$/', $key, $matches)) {
                        $index = (int)$matches[1];
                        $field = $matches[2];
                        if (!isset($newEvidences[$index])) {
                            $newEvidences[$index] = [];
                            $evidenceIndexes[] = $index;
                        }
                        $newEvidences[$index][$field] = $value;
                    }
                    // Pattern 2: new_evidences.0.ten_file (Laravel dot notation)
                    elseif (preg_match('/^new_evidences\.(\d+)\.(.+)$/', $key, $matches)) {
                        $index = (int)$matches[1];
                        $field = $matches[2];
                        if (!isset($newEvidences[$index])) {
                            $newEvidences[$index] = [];
                            $evidenceIndexes[] = $index;
                        }
                        $newEvidences[$index][$field] = $value;
                    }
                }
                
                // Sắp xếp theo index
                ksort($newEvidences);
            }
            
            \Log::info('Processing new evidences', [
                'count' => is_array($newEvidences) ? count($newEvidences) : 0,
                'new_evidences' => $newEvidences,
                'all_keys' => array_keys($allRequest),
                'request_input_new_evidences' => $request->input('new_evidences'),
                'all_files_keys' => array_keys($request->allFiles()),
                'all_files_count' => count($request->allFiles()),
            ]);

            if (count($newEvidences) > 0) {
                \Log::info('Found new evidences to process', ['count' => count($newEvidences)]);
                $savedCount = 0;
                $skippedCount = 0;
                foreach ($newEvidences as $index => $ev) {
                    \Log::info("Processing evidence index $index", [
                        'data' => $ev,
                        'has_ten_file' => isset($ev['ten_file']),
                        'has_loai_file' => isset($ev['loai_file']),
                        'has_duong_dan' => isset($ev['duong_dan']),
                        'has_file_key' => isset($ev['file']),
                    ]);
                    
                    $tenFile = $ev['ten_file'] ?? null;
                    $loaiFile = $ev['loai_file'] ?? null;
                    $moTa = $ev['mo_ta'] ?? null;
                    $duongDan = $ev['duong_dan'] ?? null;
                    $laMinhChung = isset($ev['la_minh_chung']) ? filter_var($ev['la_minh_chung'], FILTER_VALIDATE_BOOLEAN) : true;

                    \Log::info("Evidence data extracted", [
                        'ten_file' => $tenFile,
                        'loai_file' => $loaiFile,
                        'duong_dan' => $duongDan,
                        'has_file' => $request->hasFile("new_evidences.$index.file"),
                    ]);

                    if (!$tenFile || !$loaiFile) {
                        $skippedCount++;
                        \Log::warning("Skipping evidence: missing ten_file or loai_file", [
                            'index' => $index,
                            'ten_file' => $tenFile,
                            'loai_file' => $loaiFile,
                            'ev_data' => $ev,
                        ]);
                        continue;
                    }

                    if (!in_array($loaiFile, ['hinh_anh', 'video', 'pdf', 'link'])) {
                        $skippedCount++;
                        \Log::warning("Skipping evidence: invalid loai_file", [
                            'index' => $index,
                            'loai_file' => $loaiFile,
                            'valid_options' => ['hinh_anh', 'video', 'pdf', 'link'],
                        ]);
                        continue;
                    }

                    // Kiểm tra file upload - thử nhiều cách vì Laravel có thể parse khác nhau
                    $uploadedFile = null;
                    $allFiles = $request->allFiles();
                    
                    // Tìm file trong tất cả các keys có thể
                    foreach ($allFiles as $fileKey => $file) {
                        // Kiểm tra các pattern có thể
                        if (preg_match('/^new_evidences\[(\d+)\]\[file\]$/', $fileKey, $matches)) {
                            $fileIndex = (int)$matches[1];
                            if ($fileIndex === $index) {
                                $uploadedFile = is_array($file) ? $file[0] : $file;
                                break;
                            }
                        } elseif (preg_match('/^new_evidences\.(\d+)\.file$/', $fileKey, $matches)) {
                            $fileIndex = (int)$matches[1];
                            if ($fileIndex === $index) {
                                $uploadedFile = is_array($file) ? $file[0] : $file;
                                break;
                            }
                        }
                    }
                    
                    // Nếu vẫn chưa tìm thấy, thử cách trực tiếp
                    if (!$uploadedFile) {
                        $uploadedFile = $request->file("new_evidences.$index.file");
                    }
                    if (!$uploadedFile) {
                        $uploadedFile = $request->file("new_evidences[$index].file");
                    }
                    
                    \Log::info("Checking for uploaded file", [
                        'index' => $index,
                        'has_file_dot' => $request->hasFile("new_evidences.$index.file"),
                        'has_file_bracket' => $request->hasFile("new_evidences[$index].file"),
                        'uploaded_file' => $uploadedFile ? $uploadedFile->getClientOriginalName() : null,
                        'all_files_keys' => array_keys($allFiles),
                        'all_files_count' => count($allFiles),
                    ]);
                    
                    // Xử lý file upload nếu có
                    if ($uploadedFile) {
                        try {
                            $originalName = $uploadedFile->getClientOriginalName();
                            $sanitizedName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);
                            $fileName = time() . '_' . $sanitizedName;

                            if (!Storage::disk('public')->exists('evidence')) {
                                Storage::disk('public')->makeDirectory('evidence');
                            }

                            $path = $uploadedFile->storeAs('evidence', $fileName, 'public');
                            if (!$path) {
                                throw new \Exception('Không thể lưu file vào storage');
                            }

                            $duongDan = asset('storage/' . $path);

                            if (!$tenFile || trim($tenFile) === '') {
                                $tenFile = $originalName;
                            }
                            
                            \Log::info("File uploaded successfully", ['path' => $path, 'url' => $duongDan]);
                        } catch (\Exception $uploadException) {
                            $skippedCount++;
                            \Log::error('Upload draft evidence error: '.$uploadException->getMessage(), [
                                'index' => $index,
                                'ten_file' => $tenFile,
                                'trace' => $uploadException->getTraceAsString()
                            ]);
                            continue;
                        }
                    } 
                    // Nếu không có file upload, kiểm tra URL
                    else {
                        // Chỉ skip nếu không có file VÀ không có URL hợp lệ
                        if (!$duongDan || trim($duongDan) === '' || $duongDan === 'https://...' || strpos($duongDan, 'https://...') !== false) {
                            $skippedCount++;
                            \Log::warning("Skipping evidence: no file and no valid URL", [
                                'index' => $index,
                                'ten_file' => $tenFile,
                                'loai_file' => $loaiFile,
                                'duong_dan' => $duongDan,
                                'has_uploaded_file' => false,
                            ]);
                            continue;
                        }
                    }
                    
                    // Đảm bảo duongDan đã được set (từ file upload hoặc URL)
                    if (!$duongDan || trim($duongDan) === '') {
                        $skippedCount++;
                        \Log::warning("Skipping evidence: duongDan is still empty after processing", [
                            'index' => $index,
                            'ten_file' => $tenFile,
                            'loai_file' => $loaiFile,
                            'has_uploaded_file' => $uploadedFile ? true : false,
                            'ev_data' => $ev,
                        ]);
                        continue;
                    }

                    try {
                        $dataToInsert = [
                            'id_lichtuvan' => $request->id_lichtuvan,
                            'id_ghichu' => $ghiChuNhap->id_ghichu ?? null,
                            'duong_dan' => $duongDan,
                            'ten_file' => $tenFile,
                            'loai_file' => $loaiFile,
                            'mo_ta' => $moTa ?? null,
                            'la_minh_chung' => $laMinhChung ? 1 : 0,
                            'nguoi_tai_len' => $request->id_tuvanvien,
                        ];
                        
                        \Log::info("Attempting to create evidence record", [
                            'data' => $dataToInsert,
                            'ghiChuNhap_id' => $ghiChuNhap->id_ghichu ?? null,
                        ]);
                        
                        $evidenceRecord = TepMinhChungBuoiTuVan::create($dataToInsert);
                        
                        $savedCount++;
                        \Log::info("Evidence saved successfully", [
                            'id_file' => $evidenceRecord->id_file,
                            'ten_file' => $tenFile,
                            'id_ghichu' => $ghiChuNhap->id_ghichu ?? null,
                            'duong_dan' => $duongDan,
                        ]);
                    } catch (\Illuminate\Database\QueryException $e) {
                        $skippedCount++;
                        \Log::error("Database error saving evidence", [
                            'index' => $index,
                            'error' => $e->getMessage(),
                            'sql' => $e->getSql(),
                            'bindings' => $e->getBindings(),
                            'ten_file' => $tenFile,
                            'data_attempted' => $dataToInsert ?? null,
                            'trace' => $e->getTraceAsString(),
                        ]);
                    } catch (\Exception $e) {
                        $skippedCount++;
                        \Log::error("Error saving evidence", [
                            'index' => $index,
                            'error' => $e->getMessage(),
                            'error_class' => get_class($e),
                            'ten_file' => $tenFile,
                            'data_attempted' => $dataToInsert ?? null,
                            'trace' => $e->getTraceAsString(),
                        ]);
                    }
                }
                \Log::info("Total evidences processed", [
                    'saved' => $savedCount, 
                    'skipped' => $skippedCount,
                    'total' => count($newEvidences),
                    'ghiChuNhap_id' => $ghiChuNhap->id_ghichu ?? null,
                ]);
            } else {
                \Log::info("No new evidences to save", [
                    'all_keys' => array_keys($allRequest),
                    'all_files' => array_keys($request->allFiles()),
                ]);
            }

            // Cập nhật minh chứng cũ (chưa có id_ghichu) để gán id_ghichu
            if ($ghiChuNhap && $ghiChuNhap->id_ghichu) {
                $updatedCount = TepMinhChungBuoiTuVan::where('id_lichtuvan', $request->id_lichtuvan)
                    ->whereNull('id_ghichu')
                    ->update(['id_ghichu' => $ghiChuNhap->id_ghichu]);
                \Log::info("Updated existing evidences with id_ghichu", ['count' => $updatedCount]);
            }

            \Log::info('saveNoteDraft success', [
                'id_lichtuvan' => $request->id_lichtuvan,
                'id_ghichu' => $ghiChuNhap->id_ghichu ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Gửi thành công',
                'data' => [
                    'id_ghichu' => $ghiChuNhap->id_ghichu ?? null,
                    'ghi_chu' => $ghiChuNhap
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in saveNoteDraft', [
                'id_lichtuvan' => $request->input('id_lichtuvan'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lưu nháp: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Chốt biên bản ghi chú
     */
    public function finalizeNote(Request $request): JsonResponse
    {
        try {
            \Log::info('finalizeNote called', [
                'id_lichtuvan' => $request->input('id_lichtuvan'),
                'has_noi_dung' => $request->has('noi_dung'),
                'noi_dung_length' => $request->has('noi_dung') ? strlen($request->input('noi_dung')) : 0,
                'ket_luan_nganh' => $request->input('ket_luan_nganh'),
            ]);

            $validator = Validator::make($request->all(), [
                'id_lichtuvan' => 'required|exists:lichtuvan,idlichtuvan',
                'id_tuvanvien' => 'required|exists:nguoidung,idnguoidung',
                'noi_dung' => 'required|string|min:20',
                'ket_luan_nganh' => 'required|string|max:255',
                'muc_quan_tam' => 'nullable|integer|min:1|max:5',
                'diem_du_kien' => 'nullable|numeric|min:0|max:30',
                'yeu_cau_bo_sung' => 'nullable|string|max:255',
                'chia_se_voi_thisinh' => 'nullable|boolean',
                'tom_tat' => 'nullable|string|max:255', // Tóm tắt cho nhanxet
            ]);

            if ($validator->fails()) {
                \Log::error('Validation failed in finalizeNote', [
                    'errors' => $validator->errors()->toArray(),
                    'request_data' => $request->except(['new_evidences'])
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Kiểm tra buổi đã duyệt
            $session = LichTuVan::findOrFail($request->id_lichtuvan);
            if ($session->duyetlich != 2) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Buổi tư vấn chưa được duyệt'
                ], 403);
            }

            // Xóa bản nháp cũ nếu có
            GhiChuBuoiTuVan::where('id_lichtuvan', $request->id_lichtuvan)
                ->where('trang_thai', 'NHAP')
                ->delete();

            // Kiểm tra đã có bản CHỐT chưa
            $ghiChuChot = GhiChuBuoiTuVan::where('id_lichtuvan', $request->id_lichtuvan)
                ->where('trang_thai', 'CHOT')
                ->first();

            $tomTat = $request->tom_tat ?? substr($request->noi_dung, 0, 200);
            
            // Kiểm tra nếu là "Gửi" (lock ngay) hay "Chốt" (cho phép sửa 48h)
            // Nếu có param 'lock_immediately' = true, set thoi_han_sua_den = now() để khóa ngay
            $lockImmediately = filter_var($request->input('lock_immediately', false), FILTER_VALIDATE_BOOLEAN);
            $shareWithCandidate = filter_var($request->input('chia_se_voi_thisinh', false), FILTER_VALIDATE_BOOLEAN);
            $thoiHanSua = $lockImmediately ? Carbon::now() : Carbon::now()->addHours(48);

            if ($ghiChuChot) {
                // Cập nhật bản CHỐT hiện có
                $ghiChuChot->update([
                    'noi_dung' => $request->noi_dung,
                    'ket_luan_nganh' => $request->ket_luan_nganh,
                    'muc_quan_tam' => $request->muc_quan_tam,
                    'diem_du_kien' => $request->diem_du_kien,
                    'yeu_cau_bo_sung' => $request->yeu_cau_bo_sung,
                    'chia_se_voi_thisinh' => $shareWithCandidate,
                    'thoi_han_sua_den' => $thoiHanSua,
                ]);
            } else {
                // Tạo bản CHỐT mới
                $ghiChuChot = GhiChuBuoiTuVan::create([
                    'id_lichtuvan' => $request->id_lichtuvan,
                    'id_tuvanvien' => $request->id_tuvanvien,
                    'noi_dung' => $request->noi_dung,
                    'ket_luan_nganh' => $request->ket_luan_nganh,
                    'muc_quan_tam' => $request->muc_quan_tam,
                    'diem_du_kien' => $request->diem_du_kien,
                    'yeu_cau_bo_sung' => $request->yeu_cau_bo_sung,
                    'chia_se_voi_thisinh' => $shareWithCandidate,
                    'trang_thai' => 'CHOT',
                    'thoi_han_sua_den' => $thoiHanSua,
                ]);
            }

            // Xóa minh chứng nếu có yêu cầu
            $removeEvidenceIds = $request->input('remove_evidence_ids', []);
            $removeEvidenceIds = array_filter(array_map('intval', (array)$removeEvidenceIds));
            if (!empty($removeEvidenceIds)) {
                TepMinhChungBuoiTuVan::where('id_lichtuvan', $request->id_lichtuvan)
                    ->whereIn('id_file', $removeEvidenceIds)
                    ->delete();
            }

            // Thêm minh chứng mới nếu có
            $newEvidences = $request->input('new_evidences', []);
            if (is_array($newEvidences) && count($newEvidences) > 0) {
                foreach ($newEvidences as $index => $ev) {
                    $tenFile = $ev['ten_file'] ?? null;
                    $loaiFile = $ev['loai_file'] ?? null;
                    $moTa = $ev['mo_ta'] ?? null;
                    $duongDan = $ev['duong_dan'] ?? null;
                    $laMinhChung = isset($ev['la_minh_chung']) ? filter_var($ev['la_minh_chung'], FILTER_VALIDATE_BOOLEAN) : true;

                    if (!$tenFile || !$loaiFile) {
                        continue;
                    }

                    if (!in_array($loaiFile, ['hinh_anh', 'video', 'pdf', 'link'])) {
                        continue;
                    }

                    $uploadedFile = $request->file("new_evidences.$index.file");
                    if ($uploadedFile) {
                        try {
                            $originalName = $uploadedFile->getClientOriginalName();
                            $sanitizedName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);
                            $fileName = time() . '_' . $sanitizedName;

                            if (!Storage::disk('public')->exists('evidence')) {
                                Storage::disk('public')->makeDirectory('evidence');
                            }

                            $path = $uploadedFile->storeAs('evidence', $fileName, 'public');
                            if (!$path) {
                                throw new \Exception('Không thể lưu file vào storage');
                            }

                            $duongDan = asset('storage/' . $path);

                            if (!$tenFile || trim($tenFile) === '') {
                                $tenFile = $originalName;
                            }
                        } catch (\Exception $uploadException) {
                            \Log::error('Upload evidence error: '.$uploadException->getMessage());
                            continue;
                        }
                    } elseif (!$duongDan) {
                        // Nếu không có file và không có URL thì bỏ qua
                        continue;
                    }

                    TepMinhChungBuoiTuVan::create([
                        'id_lichtuvan' => $request->id_lichtuvan,
                        'id_ghichu' => $ghiChuChot->id_ghichu ?? null,
                        'duong_dan' => $duongDan,
                        'ten_file' => $tenFile,
                        'loai_file' => $loaiFile,
                        'mo_ta' => $moTa,
                        'la_minh_chung' => $laMinhChung,
                        'nguoi_tai_len' => $request->id_tuvanvien,
                    ]);
                }
            }

            // Cập nhật minh chứng cũ (chưa có id_ghichu) để gán id_ghichu
            TepMinhChungBuoiTuVan::where('id_lichtuvan', $request->id_lichtuvan)
                ->whereNull('id_ghichu')
                ->update(['id_ghichu' => $ghiChuChot->id_ghichu]);

            // Cập nhật lichtuvan
            $session->update([
                'nhanxet' => $tomTat,
                'tinhtrang' => 'Đã kết thúc',
            ]);

            DB::commit();

            \Log::info('finalizeNote success', [
                'id_lichtuvan' => $request->input('id_lichtuvan'),
                'id_ghichu' => $ghiChuChot->id_ghichu
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Chốt biên bản thành công',
                'data' => [
                    'id_ghichu' => $ghiChuChot->id_ghichu,
                    'ghi_chu' => $ghiChuChot
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error in finalizeNote', [
                'id_lichtuvan' => $request->input('id_lichtuvan'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi chốt biên bản: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách minh chứng
     */
    public function getEvidenceFiles(Request $request, $sessionId): JsonResponse
    {
        try {
            $files = TepMinhChungBuoiTuVan::where('id_lichtuvan', $sessionId)
                ->orWhereHas('ghiChu', function($q) use ($sessionId) {
                    $q->where('id_lichtuvan', $sessionId);
                })
                ->with('nguoiTaiLen')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $files
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy danh sách minh chứng',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Thêm minh chứng
     */
    public function addEvidenceFile(Request $request): JsonResponse
    {
        try {
            \Log::info('Add evidence file request:', [
                'has_file' => $request->hasFile('file'),
                'all_data' => $request->except(['file']),
                'file_name' => $request->hasFile('file') ? $request->file('file')->getClientOriginalName() : null,
            ]);

            // Validation rules - hỗ trợ cả file upload và URL
            $rules = [
                'id_lichtuvan' => 'required|exists:lichtuvan,idlichtuvan',
                'ten_file' => 'required|string|max:255',
                'loai_file' => 'required|in:hinh_anh,video,pdf,link',
                'nguoi_tai_len' => 'required|exists:nguoidung,idnguoidung',
            ];

            // Chỉ validate id_ghichu nếu có giá trị
            if ($request->has('id_ghichu') && $request->id_ghichu) {
                $rules['id_ghichu'] = 'exists:ghi_chu_buoituvan,id_ghichu';
            }

            // Chỉ validate file nếu có upload
            if ($request->hasFile('file')) {
                $rules['file'] = 'file|mimes:jpg,jpeg,png,gif,pdf,mp4,avi,mov|max:10240';
            } else {
                // Nếu không có file, duong_dan là bắt buộc
                $rules['duong_dan'] = 'required|string|max:255';
            }

            $validator = Validator::make($request->all(), $rules, [
                'id_lichtuvan.required' => 'ID buổi tư vấn là bắt buộc',
                'id_lichtuvan.exists' => 'Buổi tư vấn không tồn tại',
                'ten_file.required' => 'Tên file là bắt buộc',
                'loai_file.required' => 'Loại file là bắt buộc',
                'loai_file.in' => 'Loại file không hợp lệ',
                'duong_dan.required' => 'Vui lòng cung cấp file hoặc đường dẫn URL',
                'file.file' => 'File không hợp lệ',
                'file.mimes' => 'File phải là: jpg, jpeg, png, gif, pdf, mp4, avi, mov',
                'file.max' => 'File không được vượt quá 10MB',
                'nguoi_tai_len.required' => 'ID người tải lên là bắt buộc',
                'nguoi_tai_len.exists' => 'Người dùng không tồn tại',
            ]);

            if ($validator->fails()) {
                \Log::error('Validation failed:', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 422);
            }

            $duongDan = null;
            $tenFile = $request->ten_file;

            // Nếu có file upload
            if ($request->hasFile('file')) {
                try {
                    $uploadedFile = $request->file('file');
                    $originalName = $uploadedFile->getClientOriginalName();
                    
                    // Tạo tên file unique (sanitize tên file)
                    $sanitizedName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);
                    $fileName = time() . '_' . $sanitizedName;
                    
                    // Đảm bảo thư mục tồn tại
                    if (!Storage::disk('public')->exists('evidence')) {
                        Storage::disk('public')->makeDirectory('evidence');
                    }
                    
                    // Lưu file vào storage
                    $path = $uploadedFile->storeAs('evidence', $fileName, 'public');
                    
                    if (!$path) {
                        throw new \Exception('Không thể lưu file vào storage');
                    }
                    
                    // Lấy URL đầy đủ
                    $duongDan = asset('storage/' . $path);
                    
                    // Nếu chưa có tên file, dùng tên gốc
                    if (!$tenFile || trim($tenFile) === '') {
                        $tenFile = $originalName;
                    }
                    
                    \Log::info('File uploaded successfully:', ['path' => $path, 'url' => $duongDan]);
                } catch (\Exception $e) {
                    \Log::error('Error uploading file: ' . $e->getMessage());
                    return response()->json([
                        'success' => false,
                        'message' => 'Lỗi khi upload file: ' . $e->getMessage()
                    ], 500);
                }
            } else {
                // Sử dụng URL từ request
                $duongDan = $request->duong_dan;
            }

            // Tự động lấy id_ghichu từ ghi chú nếu không được truyền
            $idGhiChu = null;
            if ($request->has('id_ghichu') && $request->id_ghichu) {
                $idGhiChu = $request->id_ghichu;
            } else {
                // Tìm ghi chú NHÁP hoặc CHỐT của buổi này
                $ghiChu = GhiChuBuoiTuVan::where('id_lichtuvan', $request->id_lichtuvan)
                    ->whereIn('trang_thai', ['NHAP', 'CHOT'])
                    ->orderByRaw("CASE WHEN trang_thai = 'CHOT' THEN 1 ELSE 2 END")
                    ->first();
                if ($ghiChu) {
                    $idGhiChu = $ghiChu->id_ghichu;
                }
            }

            // Chuẩn bị dữ liệu để insert
            $dataToInsert = [
                'id_lichtuvan' => $request->id_lichtuvan,
                'duong_dan' => $duongDan,
                'ten_file' => $tenFile,
                'loai_file' => $request->loai_file,
                'mo_ta' => $request->mo_ta ?: null,
                'la_minh_chung' => $request->has('la_minh_chung') ? (bool)$request->la_minh_chung : true,
                'nguoi_tai_len' => $request->nguoi_tai_len,
            ];

            // Thêm id_ghichu nếu có
            if ($idGhiChu) {
                $dataToInsert['id_ghichu'] = $idGhiChu;
            }

            \Log::info('Creating evidence record:', $dataToInsert);

            // Tạo record trong database
            $file = TepMinhChungBuoiTuVan::create($dataToInsert);

            return response()->json([
                'success' => true,
                'message' => 'Thêm minh chứng thành công',
                'data' => $file
            ]);

        } catch (\Exception $e) {
            \Log::error('Error adding evidence file: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi thêm minh chứng',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Xóa minh chứng
     */
    public function deleteEvidenceFile($fileId): JsonResponse
    {
        try {
            $file = TepMinhChungBuoiTuVan::findOrFail($fileId);
            $file->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xóa minh chứng thành công'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi xóa minh chứng',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tạo yêu cầu thay đổi lịch tư vấn
     */
    public function requestChangeSchedule(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'ngaymoi' => 'required|date|after_or_equal:today',
                'giomoi' => 'required|date_format:H:i',
                'lydo_doilich' => 'required|string|max:1000',
                'idnguoidung' => 'required|integer|exists:nguoidung,idnguoidung',
            ], [
                'ngaymoi.required' => 'Vui lòng chọn ngày mới',
                'ngaymoi.date' => 'Ngày mới không hợp lệ',
                'ngaymoi.after_or_equal' => 'Ngày mới không được là ngày đã qua',
                'giomoi.required' => 'Vui lòng chọn giờ mới',
                'giomoi.date_format' => 'Giờ mới không hợp lệ',
                'lydo_doilich.required' => 'Vui lòng nhập lý do thay đổi lịch',
                'lydo_doilich.max' => 'Lý do không được vượt quá 1000 ký tự',
                'idnguoidung.required' => 'ID người dùng là bắt buộc',
                'idnguoidung.exists' => 'Người dùng không tồn tại',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Kiểm tra lịch tư vấn có tồn tại không
            $schedule = LichTuVan::findOrFail($id);

            // Kiểm tra lịch đã có người đặt chưa
            if (!$schedule->idnguoidat) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lịch này chưa có người đặt, không thể yêu cầu thay đổi'
                ], 400);
            }

            // Danh sách 4 ca học cố định
            $timeSlots = [
                ['start' => '07:00', 'end' => '09:00'],
                ['start' => '09:05', 'end' => '11:05'],
                ['start' => '13:05', 'end' => '15:05'],
                ['start' => '15:10', 'end' => '17:10'],
            ];

            // Kiểm tra giờ mới có phải là một trong 4 ca học không
            $selectedSlot = null;
            foreach ($timeSlots as $slot) {
                if ($request->giomoi === $slot['start']) {
                    $selectedSlot = $slot;
                    break;
                }
            }

            if (!$selectedSlot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Giờ mới phải là một trong các ca học: 07:00-09:00, 09:05-11:05, 13:05-15:05, 15:10-17:10'
                ], 400);
            }

            // Kiểm tra không được trùng với các ca đã đặt lịch
            // Lấy tất cả lịch đã có người đặt hoặc đã duyệt trong ngày mới
            $conflictingSchedules = LichTuVan::where('idnguoidung', $schedule->idnguoidung)
                ->where('ngayhen', $request->ngaymoi)
                ->where('idlichtuvan', '!=', $id) // Loại trừ lịch hiện tại
                ->where(function($query) use ($selectedSlot) {
                    $query->where(function($q) use ($selectedSlot) {
                        // Kiểm tra trùng giờ bắt đầu hoặc kết thúc
                        $q->where('giobatdau', $selectedSlot['start'])
                          ->orWhere('ketthuc', $selectedSlot['end']);
                    })
                    ->orWhere(function($q) use ($selectedSlot) {
                        // Kiểm tra ca mới nằm trong khoảng thời gian của ca đã có
                        $q->where('giobatdau', '<', $selectedSlot['start'])
                          ->where('ketthuc', '>', $selectedSlot['start']);
                    })
                    ->orWhere(function($q) use ($selectedSlot) {
                        // Kiểm tra ca đã có nằm trong khoảng thời gian của ca mới
                        $q->where('giobatdau', '>', $selectedSlot['start'])
                          ->where('giobatdau', '<', $selectedSlot['end']);
                    });
                })
                ->where(function($query) {
                    // Chỉ kiểm tra lịch đã có người đặt hoặc đã duyệt
                    $query->whereNotNull('idnguoidat')
                          ->orWhere('duyetlich', 2); // 2 = Đã duyệt
                })
                ->exists();

            if ($conflictingSchedules) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ca học này đã được đặt lịch. Vui lòng chọn ca học khác.'
                ], 409);
            }

            // Tạo yêu cầu thay đổi lịch
            $yeuCau = YeuCauDoiLich::create([
                'idlichtuvan' => $id,
                'ngaymoi' => $request->ngaymoi,
                'giomoi' => $request->giomoi,
                'lydo_doilich' => $request->lydo_doilich,
                'nguoigui_yeucau' => $request->idnguoidung,
                'thoigian_gui' => Carbon::now(),
                'trangthai_duyet' => 1, // 1 = Chờ duyệt
            ]);

            \Log::info('Yêu cầu thay đổi lịch đã được tạo:', [
                'iddoilich' => $yeuCau->iddoilich,
                'idlichtuvan' => $id,
                'nguoigui_yeucau' => $request->idnguoidung
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Yêu cầu thay đổi lịch đã được gửi thành công',
                'data' => $yeuCau
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy lịch tư vấn'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Lỗi khi tạo yêu cầu thay đổi lịch:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi tạo yêu cầu thay đổi lịch',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy yêu cầu thay đổi lịch theo idlichtuvan
     */
    public function getChangeRequestsBySchedule($id): JsonResponse
    {
        try {
            $changeRequests = YeuCauDoiLich::with(['nguoiGuiYeuCau', 'nguoiDuyet'])
                ->where('idlichtuvan', $id)
                ->orderBy('thoigian_gui', 'desc')
                ->get();

            $data = $changeRequests->map(function($request) {
                return [
                    'iddoilich' => $request->iddoilich,
                    'idlichtuvan' => $request->idlichtuvan,
                    'ngaymoi' => $request->ngaymoi ? $request->ngaymoi->format('Y-m-d') : null,
                    'giomoi' => $request->giomoi ? $request->giomoi->format('H:i') : null,
                    'lydo_doilich' => $request->lydo_doilich,
                    'nguoigui_yeucau' => $request->nguoigui_yeucau,
                    'nguoiGuiYeuCau' => $request->nguoiGuiYeuCau ? [
                        'idnguoidung' => $request->nguoiGuiYeuCau->idnguoidung,
                        'hoten' => $request->nguoiGuiYeuCau->hoten,
                        'email' => $request->nguoiGuiYeuCau->email,
                    ] : null,
                    'thoigian_gui' => $request->thoigian_gui ? $request->thoigian_gui->format('Y-m-d H:i:s') : null,
                    'trangthai_duyet' => $request->trangthai_duyet,
                    'nguoiduyet' => $request->nguoiduyet,
                    'nguoiDuyet' => $request->nguoiDuyet ? [
                        'idnguoidung' => $request->nguoiDuyet->idnguoidung,
                        'hoten' => $request->nguoiDuyet->hoten,
                        'email' => $request->nguoiDuyet->email,
                    ] : null,
                    'thoigian_duyet' => $request->thoigian_duyet ? $request->thoigian_duyet->format('Y-m-d H:i:s') : null,
                    'ghichu_duyet' => $request->ghichu_duyet,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            \Log::error('Lỗi khi lấy yêu cầu thay đổi lịch:', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy yêu cầu thay đổi lịch',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách yêu cầu thay đổi lịch (cho staff)
     */
    public function getScheduleChangeRequests(Request $request): JsonResponse
    {
        try {
            $status = $request->input('status'); // pending, approved, rejected, all
            
            $query = YeuCauDoiLich::with(['lichTuVan.nguoiDat', 'lichTuVan.nguoiDung', 'nguoiGuiYeuCau', 'nguoiDuyet']);
            
            // Filter theo trạng thái
            if ($status === 'pending') {
                $query->where('trangthai_duyet', 1);
            } elseif ($status === 'approved') {
                $query->where('trangthai_duyet', 2);
            } elseif ($status === 'rejected') {
                $query->where('trangthai_duyet', 3);
            }
            // Nếu status là 'all' hoặc null, lấy tất cả
            
            $requests = $query->orderBy('thoigian_gui', 'desc')->get();
            
            $data = $requests->map(function($request) {
                return [
                    'iddoilich' => $request->iddoilich,
                    'idlichtuvan' => $request->idlichtuvan,
                    'ngaymoi' => $request->ngaymoi ? $request->ngaymoi->format('Y-m-d') : null,
                    'giomoi' => $request->giomoi ? $request->giomoi->format('H:i') : null,
                    'lydo_doilich' => $request->lydo_doilich,
                    'nguoigui_yeucau' => $request->nguoigui_yeucau,
                    'nguoiGuiYeuCau' => $request->nguoiGuiYeuCau ? [
                        'idnguoidung' => $request->nguoiGuiYeuCau->idnguoidung,
                        'hoten' => $request->nguoiGuiYeuCau->hoten,
                        'email' => $request->nguoiGuiYeuCau->email,
                    ] : null,
                    'thoigian_gui' => $request->thoigian_gui ? $request->thoigian_gui->format('Y-m-d H:i:s') : null,
                    'trangthai_duyet' => $request->trangthai_duyet,
                    'nguoiduyet' => $request->nguoiduyet,
                    'nguoiDuyet' => $request->nguoiDuyet ? [
                        'idnguoidung' => $request->nguoiDuyet->idnguoidung,
                        'hoten' => $request->nguoiDuyet->hoten,
                        'email' => $request->nguoiDuyet->email,
                    ] : null,
                    'thoigian_duyet' => $request->thoigian_duyet ? $request->thoigian_duyet->format('Y-m-d H:i:s') : null,
                    'ghichu_duyet' => $request->ghichu_duyet,
                    'lichTuVan' => $request->lichTuVan ? [
                        'idlichtuvan' => $request->lichTuVan->idlichtuvan,
                        'ngayhen' => $request->lichTuVan->ngayhen ? $request->lichTuVan->ngayhen->format('Y-m-d') : null,
                        'giobatdau' => $request->lichTuVan->giobatdau ? $request->lichTuVan->giobatdau->format('H:i') : null,
                        'ketthuc' => $request->lichTuVan->ketthuc ? $request->lichTuVan->ketthuc->format('H:i') : null,
                        'nguoiDat' => $request->lichTuVan->nguoiDat ? [
                            'idnguoidung' => $request->lichTuVan->nguoiDat->idnguoidung,
                            'hoten' => $request->lichTuVan->nguoiDat->hoten,
                            'email' => $request->lichTuVan->nguoiDat->email,
                        ] : null,
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            \Log::error('Lỗi khi lấy danh sách yêu cầu thay đổi lịch:', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy danh sách yêu cầu thay đổi lịch',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Duyệt yêu cầu thay đổi lịch
     */
    public function approveScheduleChangeRequest(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'ghichu_duyet' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 422);
            }

            $changeRequest = YeuCauDoiLich::with(['lichTuVan', 'nguoiGuiYeuCau'])->findOrFail($id);

            // Kiểm tra yêu cầu đã được duyệt/từ chối chưa
            if ($changeRequest->trangthai_duyet !== 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Yêu cầu này đã được xử lý rồi'
                ], 400);
            }

            // Lấy ID người duyệt từ request hoặc session
            $approverId = $request->input('approver_id') ?? session('userId') ?? 6;

            DB::beginTransaction();

            try {
                // Cập nhật trạng thái yêu cầu
                $changeRequest->update([
                    'trangthai_duyet' => 2, // 2 = Đã duyệt
                    'nguoiduyet' => $approverId,
                    'thoigian_duyet' => Carbon::now(),
                    'ghichu_duyet' => $request->ghichu_duyet,
                ]);

                // Lấy giá trị giomoi dạng string (H:i) để so khớp với mảng
                // Sử dụng getRawOriginal để lấy giá trị gốc từ database, tránh ảnh hưởng của cast
                $giomoiRaw = $changeRequest->getRawOriginal('giomoi');
                
                // Chuyển đổi từ '09:05:00' hoặc '09:05' thành '09:05' (format H:i)
                if (!empty($giomoiRaw)) {
                    // Nếu có giây (dạng '09:05:00'), lấy 5 ký tự đầu
                    $giomoiFormatted = strlen($giomoiRaw) >= 5 ? substr($giomoiRaw, 0, 5) : $giomoiRaw;
                } else {
                    // Fallback: thử lấy từ attribute đã cast
                    if ($changeRequest->giomoi instanceof \Carbon\Carbon) {
                        $giomoiFormatted = $changeRequest->giomoi->format('H:i');
                    } elseif (is_string($changeRequest->giomoi)) {
                        $giomoiFormatted = substr($changeRequest->giomoi, 0, 5);
                    } else {
                        $giomoiFormatted = '09:05'; // Giá trị mặc định
                    }
                }
                
                // Tính giờ kết thúc dựa trên ca học
                $timeSlots = [
                    '07:00' => '09:00',
                    '09:05' => '11:05',
                    '13:05' => '15:05',
                    '15:10' => '17:10',
                ];
                $endTime = $timeSlots[$giomoiFormatted] ?? '09:00';

                // Cập nhật lịch tư vấn với thông tin mới
                $schedule = $changeRequest->lichTuVan;
                if ($schedule) {
                    $schedule->update([
                        'ngayhen' => $changeRequest->ngaymoi,
                        'giohen' => $giomoiFormatted . ':00', // Thêm giây để phù hợp với định dạng database
                        'giobatdau' => $giomoiFormatted . ':00',
                        'ketthuc' => $endTime . ':00',
                    ]);

                    // Nếu lịch đã có người đăng ký, tạo điểm bồi đắp 100 điểm cho người đó
                    if ($schedule->idnguoidat) {
                        DiemBoiDuong::create([
                            'idnguoidung' => $schedule->idnguoidat,
                            'idlichtuvan' => $schedule->idlichtuvan,
                            'iddoilich' => $changeRequest->iddoilich,
                            'so_diem' => 100.00,
                            'trang_thai' => 1, // 1 = Chưa sử dụng
                            'nguoi_tao' => $approverId,
                        ]);

                        // Tạo thông báo cho người đã đăng ký lịch về việc nhận điểm bồi đắp
                        $nguoiDat = NguoiDung::find($schedule->idnguoidat);
                        if ($nguoiDat) {
                            $nguoiDuyet = NguoiDung::find($approverId);
                            $tenNguoiDuyet = $nguoiDuyet ? $nguoiDuyet->hoten : 'Quản trị viên';
                            
                            $tieudeDiem = 'Bạn đã nhận 100 điểm bồi đắp';
                            $noidungDiem = "Lịch tư vấn của bạn đã bị thay đổi bởi {$tenNguoiDuyet}.\n\n";
                            $noidungDiem .= "Để bù đắp sự bất tiện, bạn đã nhận được 100 điểm bồi đắp.\n";
                            $noidungDiem .= "Bạn có thể sử dụng điểm này cho các dịch vụ của hệ thống.";
                            
                            ThongBao::create([
                                'tieude' => $tieudeDiem,
                                'noidung' => $noidungDiem,
                                'nguoitao_id' => $approverId,
                                'idnguoinhan' => $schedule->idnguoidat,
                                'thoigiangui_dukien' => Carbon::now(),
                                'kieuguithongbao' => 'ngay', // Gửi ngay
                                'ngaytao' => Carbon::now(),
                                'ngaycapnhat' => Carbon::now(),
                            ]);
                            
                            \Log::info('Đã tạo thông báo điểm bồi đắp cho người đăng ký lịch:', [
                                'idnguoidung' => $schedule->idnguoidat,
                                'idlichtuvan' => $schedule->idlichtuvan,
                                'iddoilich' => $changeRequest->iddoilich
                            ]);
                        }

                        \Log::info('Đã tạo điểm bồi đắp cho người dùng bị đổi lịch:', [
                            'idnguoidung' => $schedule->idnguoidat,
                            'idlichtuvan' => $schedule->idlichtuvan,
                            'iddoilich' => $changeRequest->iddoilich,
                            'so_diem' => 100.00
                        ]);
                    }
                }

                // Tạo thông báo cho người yêu cầu thay đổi lịch
                if ($changeRequest->nguoiGuiYeuCau) {
                    $nguoiDuyet = NguoiDung::find($approverId);
                    $tenNguoiDuyet = $nguoiDuyet ? $nguoiDuyet->hoten : 'Quản trị viên';
                    
                    // Lấy thông tin lịch mới
                    $ngayMoi = $changeRequest->ngaymoi ? Carbon::parse($changeRequest->ngaymoi)->format('d/m/Y') : '';
                    
                    $tieude = 'Yêu cầu thay đổi lịch tư vấn đã được duyệt';
                    $noidung = "Yêu cầu thay đổi lịch tư vấn của bạn đã được {$tenNguoiDuyet} duyệt.\n\n";
                    $noidung .= "Lịch mới:\n";
                    $noidung .= "- Ngày: {$ngayMoi}\n";
                    $noidung .= "- Thời gian: {$giomoiFormatted} - {$endTime}\n";
                    if ($request->ghichu_duyet) {
                        $noidung .= "\nGhi chú: {$request->ghichu_duyet}";
                    }
                    
                    ThongBao::create([
                        'tieude' => $tieude,
                        'noidung' => $noidung,
                        'nguoitao_id' => $approverId,
                        'idnguoinhan' => $changeRequest->nguoigui_yeucau,
                        'thoigiangui_dukien' => Carbon::now(),
                        'kieuguithongbao' => 'ngay', // Gửi ngay
                        'ngaytao' => Carbon::now(),
                        'ngaycapnhat' => Carbon::now(),
                    ]);
                    
                    \Log::info('Đã tạo thông báo cho người yêu cầu thay đổi lịch:', [
                        'iddoilich' => $changeRequest->iddoilich,
                        'idnguoinhan' => $changeRequest->nguoigui_yeucau,
                        'nguoiduyet' => $approverId
                    ]);
                }

                DB::commit();

                \Log::info('Yêu cầu thay đổi lịch đã được duyệt:', [
                    'iddoilich' => $changeRequest->iddoilich,
                    'idlichtuvan' => $schedule->idlichtuvan ?? null,
                    'nguoiduyet' => $approverId
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Đã duyệt yêu cầu thay đổi lịch thành công',
                    'data' => $changeRequest
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy yêu cầu thay đổi lịch'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Lỗi khi duyệt yêu cầu thay đổi lịch:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi duyệt yêu cầu thay đổi lịch',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Từ chối yêu cầu thay đổi lịch
     */
    public function rejectScheduleChangeRequest(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'ghichu_duyet' => 'required|string|max:1000',
            ], [
                'ghichu_duyet.required' => 'Vui lòng nhập lý do từ chối',
                'ghichu_duyet.max' => 'Lý do không được vượt quá 1000 ký tự',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 422);
            }

            $changeRequest = YeuCauDoiLich::findOrFail($id);

            // Kiểm tra yêu cầu đã được duyệt/từ chối chưa
            if ($changeRequest->trangthai_duyet !== 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Yêu cầu này đã được xử lý rồi'
                ], 400);
            }

            // Lấy ID người duyệt từ request hoặc session
            $approverId = $request->input('approver_id') ?? session('userId') ?? 6;

            // Cập nhật trạng thái yêu cầu
            $changeRequest->update([
                'trangthai_duyet' => 3, // 3 = Bị từ chối
                'nguoiduyet' => $approverId,
                'thoigian_duyet' => Carbon::now(),
                'ghichu_duyet' => $request->ghichu_duyet,
            ]);

            \Log::info('Yêu cầu thay đổi lịch đã bị từ chối:', [
                'iddoilich' => $changeRequest->iddoilich,
                'nguoiduyet' => $approverId
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Đã từ chối yêu cầu thay đổi lịch',
                'data' => $changeRequest
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy yêu cầu thay đổi lịch'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Lỗi khi từ chối yêu cầu thay đổi lịch:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi từ chối yêu cầu thay đổi lịch',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
