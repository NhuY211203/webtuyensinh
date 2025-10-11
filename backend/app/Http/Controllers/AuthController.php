<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Models\NguoiDung;
use Carbon\Carbon;

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

            return response()->json([
                'success' => true,
                'message' => 'Đăng nhập thành công',
                'data' => [
                    'id' => $nguoiDung->idnguoidung,
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
                ->select('idnguoidung', 'email', 'hoten', 'sodienthoai', 'idvaitro', 'trangthai', 'ngaytao')
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
}
