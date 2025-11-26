<?php

namespace App\Http\Controllers;

use App\Models\PhongChatSupport;
use App\Models\TinNhanSupport;
use App\Models\NguoiDung;
use App\Models\ThongBao;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Cloudinary\Cloudinary as CloudinaryClient;

class ChatSupportController extends Controller
{
    /**
     * Tạo hoặc lấy phòng chat hỗ trợ giữa người dùng và người phụ trách
     */
    public function getOrCreateRoom(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idnguoidung' => 'required|integer|exists:nguoidung,idnguoidung',
                'idnguoi_phu_trach' => 'nullable|integer|exists:nguoidung,idnguoidung',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 422);
            }

            $userId = $request->integer('idnguoidung');
            $staffId = $request->integer('idnguoi_phu_trach');

            // Nếu không có staffId, lấy người phụ trách đầu tiên (hoặc có thể random/assign)
            if (!$staffId) {
                // Tìm người phụ trách thông qua relationship với vaitro
                // idvaitro = 3 thường là "Người phụ trách" (cần kiểm tra lại trong database)
                $staff = NguoiDung::whereHas('vaiTro', function($query) {
                    $query->where('tenvaitro', 'Người phụ trách');
                })->first();
                
                // Nếu không tìm thấy qua relationship, thử tìm theo idvaitro = 3
                if (!$staff) {
                    $staff = NguoiDung::where('idvaitro', 3)->first();
                }
                
                // Nếu vẫn không tìm thấy, thử idvaitro = 4 (có thể là staff)
                if (!$staff) {
                    $staff = NguoiDung::where('idvaitro', 4)->first();
                }
                
                if (!$staff) {
                    \Log::error('Không tìm thấy người phụ trách trong database');
                    return response()->json([
                        'success' => false,
                        'message' => 'Không tìm thấy người phụ trách. Vui lòng liên hệ quản trị viên.'
                    ], 404);
                }
                $staffId = $staff->idnguoidung;
                \Log::info('Đã tìm thấy người phụ trách:', ['id' => $staffId, 'hoten' => $staff->hoten]);
            }

            // Tìm hoặc tạo phòng chat
            $room = PhongChatSupport::where('idnguoidung', $userId)
                ->where('idnguoi_phu_trach', $staffId)
                ->where('trang_thai', 1)
                ->first();

            if (!$room) {
                $room = PhongChatSupport::create([
                    'idnguoidung' => $userId,
                    'idnguoi_phu_trach' => $staffId,
                    'trang_thai' => 1,
                    'ngay_tao' => Carbon::now(),
                    'ngay_cap_nhat' => Carbon::now(),
                ]);
            }

            // Load relationships
            $room->load(['nguoiDung', 'nguoiPhuTrach']);

            return response()->json([
                'success' => true,
                'data' => [
                    'idphongchat_support' => $room->idphongchat_support,
                    'idnguoidung' => $room->idnguoidung,
                    'idnguoi_phu_trach' => $room->idnguoi_phu_trach,
                    'nguoiDung' => $room->nguoiDung ? [
                        'idnguoidung' => $room->nguoiDung->idnguoidung,
                        'hoten' => $room->nguoiDung->hoten,
                        'email' => $room->nguoiDung->email,
                    ] : null,
                    'nguoiPhuTrach' => $room->nguoiPhuTrach ? [
                        'idnguoidung' => $room->nguoiPhuTrach->idnguoidung,
                        'hoten' => $room->nguoiPhuTrach->hoten,
                        'email' => $room->nguoiPhuTrach->email,
                    ] : null,
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Lỗi khi tạo/lấy phòng chat hỗ trợ:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi tạo/lấy phòng chat',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Build Cloudinary client from env.
     */
    private function makeCloudinaryClient(): CloudinaryClient
    {
        $url = env('CLOUDINARY_URL');
        if ($url) {
            $parts = parse_url($url);
            $apiKey = $parts['user'] ?? null;
            $apiSecret = $parts['pass'] ?? null;
            $cloudName = $parts['host'] ?? null;
            if ($apiKey && $apiSecret && $cloudName) {
                return new CloudinaryClient([
                    'cloud' => [
                        'cloud_name' => $cloudName,
                        'api_key' => $apiKey,
                        'api_secret' => $apiSecret,
                    ],
                ]);
            }
        }
        $cloudName = env('CLOUDINARY_CLOUD_NAME');
        $apiKey = env('CLOUDINARY_API_KEY');
        $apiSecret = env('CLOUDINARY_API_SECRET');
        if ($cloudName && $apiKey && $apiSecret) {
            return new CloudinaryClient([
                'cloud' => [
                    'cloud_name' => $cloudName,
                    'api_key' => $apiKey,
                    'api_secret' => $apiSecret,
                ],
            ]);
        }
        throw new \RuntimeException('Cloudinary credentials are missing.');
    }

    /**
     * Upload file lên Cloudinary
     */
    public function uploadFile(Request $request): JsonResponse
    {
        try {
            // Kiểm tra file có tồn tại không
            if (!$request->hasFile('file')) {
                \Log::warning('Upload file: No file in request', [
                    'request_keys' => array_keys($request->all()),
                    'files' => $request->allFiles()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy file trong request',
                    'debug' => [
                        'has_file' => $request->hasFile('file'),
                        'request_keys' => array_keys($request->all()),
                    ]
                ], 422);
            }

            $file = $request->file('file');
            
            // Log thông tin file để debug
            \Log::info('Upload file request', [
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'client_mime' => $file->getClientMimeType(),
                'extension' => $file->getClientOriginalExtension(),
            ]);

            $validator = Validator::make($request->all(), [
                'file' => 'required|file|max:10240', // Max 10MB (10240 KB)
            ]);

            if ($validator->fails()) {
                \Log::warning('Upload file validation failed', [
                    'errors' => $validator->errors()->toArray(),
                    'file_size' => $file->getSize(),
                    'file_mime' => $file->getMimeType(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'File không hợp lệ',
                    'errors' => $validator->errors(),
                    'debug' => [
                        'file_size' => $file->getSize(),
                        'file_size_mb' => round($file->getSize() / 1024 / 1024, 2),
                        'mime_type' => $file->getMimeType(),
                    ]
                ], 422);
            }

            // Mở rộng danh sách MIME types được chấp nhận
            $allowedMimes = [
                // Images
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'image/webp',
                // Documents
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                // Text files
                'text/plain',
                'text/csv',
            ];
            
            $mimeType = $file->getMimeType();
            $clientMimeType = $file->getClientMimeType();
            $extension = strtolower($file->getClientOriginalExtension());
            
            // Kiểm tra MIME type hoặc extension
            $isValidMime = in_array($mimeType, $allowedMimes) || in_array($clientMimeType, $allowedMimes);
            $isValidExtension = in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv']);
            
            if (!$isValidMime && !$isValidExtension) {
                \Log::warning('Upload file: Invalid MIME type or extension', [
                    'mime_type' => $mimeType,
                    'client_mime' => $clientMimeType,
                    'extension' => $extension,
                    'allowed_mimes' => $allowedMimes,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Loại file không được hỗ trợ. Chỉ chấp nhận: ảnh (JPEG, PNG, GIF, WebP) và tài liệu (PDF, DOC, DOCX, XLS, XLSX, TXT, CSV)',
                    'debug' => [
                        'mime_type' => $mimeType,
                        'client_mime' => $clientMimeType,
                        'extension' => $extension,
                    ]
                ], 422);
            }

            $client = $this->makeCloudinaryClient();
            
            // Lấy tên file gốc và extension
            $originalFileName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $fileNameWithoutExt = pathinfo($originalFileName, PATHINFO_FILENAME);
            
            // Tạo tên file an toàn cho Cloudinary (loại bỏ ký tự đặc biệt)
            $safeFileName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $fileNameWithoutExt);
            $publicId = 'chat_support/' . $safeFileName . '_' . time();
            
            // Upload lên Cloudinary với public_id tùy chỉnh
            try {
                $result = $client->uploadApi()->upload($file->getRealPath(), [
                    'public_id' => $publicId,
                    'folder' => 'chat_support',
                    'resource_type' => 'auto',
                    'use_filename' => false, // Không dùng tên file gốc từ Cloudinary
                ]);

                \Log::info('File uploaded successfully to Cloudinary', [
                    'public_id' => $result['public_id'] ?? null,
                    'url' => $result['secure_url'] ?? null,
                    'original_filename' => $originalFileName,
                ]);
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'url' => $result['secure_url'],
                        'public_id' => $result['public_id'],
                        'resource_type' => $result['resource_type'],
                        'format' => $result['format'] ?? null,
                        'bytes' => $result['bytes'] ?? null,
                        'original_filename' => $originalFileName,
                    ]
                ]);
            } catch (\Exception $cloudinaryError) {
                \Log::error('Cloudinary upload error', [
                    'error' => $cloudinaryError->getMessage(),
                    'trace' => $cloudinaryError->getTraceAsString()
                ]);
                throw $cloudinaryError;
            }

        } catch (\Exception $e) {
            \Log::error('Lỗi khi upload file lên Cloudinary:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Không thể upload file. Vui lòng thử lại.',
                'error' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Download file với tên file gốc
     */
    public function downloadFile(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'url' => 'required|url',
                'filename' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 422);
            }

            $fileUrl = $request->input('url');
            $fileName = $request->input('filename');

            // Lấy file từ Cloudinary
            $ch = curl_init($fileUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $fileContent = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200 || $fileContent === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể tải file từ Cloudinary'
                ], 404);
            }

            // Lấy Content-Type từ response header hoặc từ extension
            $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $contentTypes = [
                'pdf' => 'application/pdf',
                'doc' => 'application/msword',
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'xls' => 'application/vnd.ms-excel',
                'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'gif' => 'image/gif',
                'webp' => 'image/webp',
                'txt' => 'text/plain',
                'csv' => 'text/csv',
            ];
            $contentType = $contentTypes[$extension] ?? 'application/octet-stream';

            return response()->streamDownload(function() use ($fileContent) {
                echo $fileContent;
            }, $fileName, [
                'Content-Type' => $contentType,
                'Content-Disposition' => 'attachment; filename="' . addslashes($fileName) . '"',
            ]);

        } catch (\Exception $e) {
            \Log::error('Lỗi khi download file:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi tải file',
                'error' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Lấy danh sách tin nhắn trong phòng chat hỗ trợ
     */
    public function getMessages(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idphongchat_support' => 'required|integer|exists:phong_chat_support,idphongchat_support',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 422);
            }

            $roomId = $request->integer('idphongchat_support');
            $limit = min(max($request->integer('limit', 50), 1), 100);

            $messages = TinNhanSupport::where('idphongchat_support', $roomId)
                ->whereNull('xoa_mem_luc')
                ->with('nguoiGui')
                ->orderBy('ngay_tao', 'asc')
                ->limit($limit)
                ->get();

            $data = $messages->map(function($message) {
                // Parse tên file từ tep_dinh_kem nếu có format: url|filename
                $fileUrl = $message->tep_dinh_kem;
                $fileName = null;
                
                if ($fileUrl && strpos($fileUrl, '|') !== false) {
                    $parts = explode('|', $fileUrl, 2);
                    $fileUrl = $parts[0];
                    $fileName = $parts[1] ?? null;
                }
                
                return [
                    'idtinnhan_support' => $message->idtinnhan_support,
                    'idphongchat_support' => $message->idphongchat_support,
                    'idnguoigui' => $message->idnguoigui,
                    'noi_dung' => $message->noi_dung,
                    'tep_dinh_kem' => $fileUrl,
                    'ten_file' => $fileName,
                    'da_xem' => $message->da_xem,
                    'ngay_xem' => $message->ngay_xem ? $message->ngay_xem->format('Y-m-d H:i:s') : null,
                    'ngay_tao' => $message->ngay_tao ? $message->ngay_tao->format('Y-m-d H:i:s') : null,
                    'nguoiGui' => $message->nguoiGui ? [
                        'idnguoidung' => $message->nguoiGui->idnguoidung,
                        'hoten' => $message->nguoiGui->hoten,
                        'email' => $message->nguoiGui->email,
                    ] : null,
                    'isImage' => $fileUrl && preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $fileUrl),
                    'isFile' => $fileUrl && !preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $fileUrl),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            \Log::error('Lỗi khi lấy tin nhắn hỗ trợ:', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy tin nhắn',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Gửi tin nhắn trong phòng chat hỗ trợ
     */
    public function sendMessage(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idphongchat_support' => 'required|integer|exists:phong_chat_support,idphongchat_support',
                'idnguoigui' => 'required|integer|exists:nguoidung,idnguoidung',
                'noi_dung' => 'nullable|string|max:5000',
                'tep_dinh_kem' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 422);
            }

            $roomId = $request->integer('idphongchat_support');
            $senderId = $request->integer('idnguoigui');
            $content = trim($request->input('noi_dung', ''));
            $fileUrl = $request->input('tep_dinh_kem');

            // Phải có nội dung hoặc file đính kèm
            if (empty($content) && empty($fileUrl)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vui lòng nhập nội dung hoặc đính kèm file'
                ], 422);
            }

            // Kiểm tra phòng chat có tồn tại và đang hoạt động không
            $room = PhongChatSupport::where('idphongchat_support', $roomId)
                ->where('trang_thai', 1)
                ->first();

            if (!$room) {
                return response()->json([
                    'success' => false,
                    'message' => 'Phòng chat không tồn tại hoặc đã bị đóng'
                ], 404);
            }

            // Kiểm tra người gửi có phải là người dùng hoặc người phụ trách trong phòng chat không
            if ($room->idnguoidung != $senderId && $room->idnguoi_phu_trach != $senderId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn không có quyền gửi tin nhắn trong phòng chat này'
                ], 403);
            }

            // Lưu tên file gốc nếu có trong request
            $originalFileName = $request->input('ten_file');
            $storedFileUrl = $fileUrl;
            if ($fileUrl && $originalFileName) {
                // Lưu format: url|filename để có thể parse lại sau
                $storedFileUrl = $fileUrl . '|' . $originalFileName;
            }
            
            // Tạo tin nhắn
            $message = TinNhanSupport::create([
                'idphongchat_support' => $roomId,
                'idnguoigui' => $senderId,
                'noi_dung' => $content ?: (empty($fileUrl) ? '' : '[Đã gửi file]'),
                'tep_dinh_kem' => $storedFileUrl,
                'da_xem' => 0,
                'ngay_tao' => Carbon::now(),
            ]);

            // Cập nhật thời gian cập nhật phòng chat
            $room->update([
                'ngay_cap_nhat' => Carbon::now()
            ]);

            // Tạo thông báo cho người phụ trách nếu tin nhắn không phải từ họ
            if ($room->idnguoi_phu_trach != $senderId) {
                try {
                    $nguoiGui = NguoiDung::find($senderId);
                    $tenNguoiGui = $nguoiGui ? $nguoiGui->hoten : 'Người dùng';
                    $noiDungRutGon = mb_substr($content, 0, 100) . (mb_strlen($content) > 100 ? '...' : '');
                    
                    // Tạo thông báo trong bảng thongbao
                    $thongBao = \App\Models\ThongBao::create([
                        'tieude' => 'Tin nhắn mới từ ' . $tenNguoiGui,
                        'noidung' => 'Bạn có tin nhắn mới trong chat hỗ trợ: ' . $noiDungRutGon,
                        'nguoitao_id' => $senderId,
                        'idnguoinhan' => $room->idnguoi_phu_trach,
                        'thoigiangui_dukien' => Carbon::now(),
                        'kieuguithongbao' => 'ngay', // Gửi ngay
                        'ngaytao' => Carbon::now(),
                        'ngaycapnhat' => Carbon::now(),
                    ]);
                    
                    \Log::info('Đã tạo thông báo cho người phụ trách:', [
                        'idthongbao' => $thongBao->idthongbao,
                        'idnguoinhan' => $room->idnguoi_phu_trach,
                        'idphongchat_support' => $roomId
                    ]);
                } catch (\Exception $e) {
                    \Log::warning('Không thể tạo thông báo cho người phụ trách:', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    // Không throw error, chỉ log warning vì thông báo không phải là bắt buộc
                }
            }

            // Load relationship
            $message->load('nguoiGui');

            return response()->json([
                'success' => true,
                'message' => 'Gửi tin nhắn thành công',
                'data' => [
                    'idtinnhan_support' => $message->idtinnhan_support,
                    'idphongchat_support' => $message->idphongchat_support,
                    'idnguoigui' => $message->idnguoigui,
                    'noi_dung' => $message->noi_dung,
                    'tep_dinh_kem' => $message->tep_dinh_kem,
                    'da_xem' => $message->da_xem,
                    'ngay_tao' => $message->ngay_tao ? $message->ngay_tao->format('Y-m-d H:i:s') : null,
                    'nguoiGui' => $message->nguoiGui ? [
                        'idnguoidung' => $message->nguoiGui->idnguoidung,
                        'hoten' => $message->nguoiGui->hoten,
                        'email' => $message->nguoiGui->email,
                    ] : null,
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Lỗi khi gửi tin nhắn hỗ trợ:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi gửi tin nhắn',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Đánh dấu tin nhắn đã xem
     */
    public function markAsRead(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'idphongchat_support' => 'required|integer|exists:phong_chat_support,idphongchat_support',
                'idnguoidung' => 'required|integer|exists:nguoidung,idnguoidung',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 422);
            }

            $roomId = $request->integer('idphongchat_support');
            $userId = $request->integer('idnguoidung');

            // Đánh dấu tất cả tin nhắn chưa xem (không phải của người dùng này) là đã xem
            TinNhanSupport::where('idphongchat_support', $roomId)
                ->where('idnguoigui', '!=', $userId)
                ->where('da_xem', 0)
                ->update([
                    'da_xem' => 1,
                    'ngay_xem' => Carbon::now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Đã đánh dấu tin nhắn là đã xem'
            ]);

        } catch (\Exception $e) {
            \Log::error('Lỗi khi đánh dấu tin nhắn đã xem:', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi đánh dấu tin nhắn',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách phòng chat hỗ trợ cho người phụ trách
     */
    public function getRoomsForStaff(Request $request): JsonResponse
    {
        try {
            $staffId = $request->integer('idnguoi_phu_trach');
            
            if (!$staffId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Thiếu ID người phụ trách'
                ], 400);
            }

            // Debug: Kiểm tra tất cả phòng chat trước
            $allRooms = PhongChatSupport::where('trang_thai', 1)->get();
            \Log::info('All active rooms in database', [
                'total_rooms' => $allRooms->count(),
                'rooms' => $allRooms->map(function($r) {
                    return [
                        'idphongchat_support' => $r->idphongchat_support,
                        'idnguoidung' => $r->idnguoidung,
                        'idnguoi_phu_trach' => $r->idnguoi_phu_trach,
                    ];
                })->toArray()
            ]);

            $rooms = PhongChatSupport::where('idnguoi_phu_trach', $staffId)
                ->where('trang_thai', 1)
                ->with(['nguoiDung', 'tinNhans' => function($query) {
                    $query->whereNull('xoa_mem_luc')
                        ->orderBy('ngay_tao', 'desc')
                        ->limit(1);
                }])
                ->orderBy('ngay_cap_nhat', 'desc')
                ->get();

            \Log::info('Found rooms for staff', [
                'staff_id' => $staffId,
                'rooms_count' => $rooms->count(),
                'room_ids' => $rooms->pluck('idphongchat_support')->toArray(),
                'room_details' => $rooms->map(function($r) {
                    return [
                        'idphongchat_support' => $r->idphongchat_support,
                        'idnguoidung' => $r->idnguoidung,
                        'idnguoi_phu_trach' => $r->idnguoi_phu_trach,
                        'has_nguoiDung' => $r->nguoiDung ? true : false,
                    ];
                })->toArray()
            ]);

            if ($rooms->count() === 0) {
                \Log::warning('No rooms found for staff', [
                    'staff_id' => $staffId,
                    'all_active_rooms_count' => $allRooms->count(),
                    'query' => PhongChatSupport::where('idnguoi_phu_trach', $staffId)
                        ->where('trang_thai', 1)
                        ->toSql(),
                    'bindings' => [$staffId, 1]
                ]);
            }

            $data = $rooms->map(function($room) {
                $lastMessage = $room->tinNhans->first();
                $unreadCount = TinNhanSupport::where('idphongchat_support', $room->idphongchat_support)
                    ->where('idnguoigui', '!=', $room->idnguoi_phu_trach)
                    ->where('da_xem', 0)
                    ->whereNull('xoa_mem_luc')
                    ->count();

                // Đảm bảo nguoiDung được load - thử nhiều cách
                if (!$room->nguoiDung) {
                    \Log::warning('Room without nguoiDung relationship - attempting to reload', [
                        'room_id' => $room->idphongchat_support,
                        'idnguoidung' => $room->idnguoidung
                    ]);
                    
                    // Thử load lại với fresh query
                    $room->load('nguoiDung');
                    
                    // Nếu vẫn không có, thử load trực tiếp từ database
                    if (!$room->nguoiDung && $room->idnguoidung) {
                        $nguoiDung = \App\Models\NguoiDung::find($room->idnguoidung);
                        if ($nguoiDung) {
                            $room->setRelation('nguoiDung', $nguoiDung);
                            \Log::info('Loaded nguoiDung directly from database', [
                                'idnguoidung' => $nguoiDung->idnguoidung,
                                'hoten' => $nguoiDung->hoten
                            ]);
                        } else {
                            \Log::error('Cannot find nguoiDung in database', [
                                'idnguoidung' => $room->idnguoidung
                            ]);
                        }
                    }
                }

                // Tạo nguoiDung object đảm bảo luôn có dữ liệu
                $nguoiDungData = null;
                if ($room->nguoiDung) {
                    $nguoiDungData = [
                        'idnguoidung' => $room->nguoiDung->idnguoidung,
                        'hoten' => $room->nguoiDung->hoten ?? 'Không có tên',
                        'email' => $room->nguoiDung->email ?? '',
                    ];
                } else {
                    // Fallback: lấy thông tin từ idnguoidung nếu có
                    if ($room->idnguoidung) {
                        $nguoiDungData = [
                            'idnguoidung' => $room->idnguoidung,
                            'hoten' => 'Người dùng #' . $room->idnguoidung,
                            'email' => '',
                        ];
                    }
                }

                $result = [
                    'idphongchat_support' => $room->idphongchat_support,
                    'idnguoidung' => $room->idnguoidung,
                    'idnguoi_phu_trach' => $room->idnguoi_phu_trach,
                    'nguoiDung' => $nguoiDungData,
                    'lastMessage' => $lastMessage ? [
                        'noi_dung' => $lastMessage->noi_dung,
                        'ngay_tao' => $lastMessage->ngay_tao ? $lastMessage->ngay_tao->format('Y-m-d H:i:s') : null,
                    ] : null,
                    'unreadCount' => $unreadCount,
                    'ngay_cap_nhat' => $room->ngay_cap_nhat ? $room->ngay_cap_nhat->format('Y-m-d H:i:s') : null,
                ];

                \Log::info('Mapped room data', [
                    'room_id' => $result['idphongchat_support'],
                    'idnguoidung' => $result['idnguoidung'],
                    'has_nguoiDung' => !empty($result['nguoiDung']),
                    'nguoiDung_name' => $result['nguoiDung']['hoten'] ?? 'N/A',
                    'unreadCount' => $result['unreadCount'],
                    'has_lastMessage' => !empty($result['lastMessage'])
                ]);

                return $result;
            });

            \Log::info('Returning rooms data to frontend', [
                'staff_id' => $staffId,
                'data_count' => count($data),
                'data' => $data
            ]);

            return response()->json([
                'success' => true,
                'data' => $data,
                'debug' => [
                    'staff_id' => $staffId,
                    'total_rooms_found' => $rooms->count(),
                    'data_count' => count($data)
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Lỗi khi lấy danh sách phòng chat cho staff:', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy danh sách phòng chat',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

