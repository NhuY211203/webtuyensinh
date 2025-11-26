<?php

namespace App\Http\Controllers;

use App\Models\TinNhan;
use App\Models\LichTuVan;
use App\Models\NguoiDung;
use App\Models\PhongChat;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ChatController extends Controller
{
    // Tạo hoặc lấy phòng chat cho cặp tư vấn viên - người đặt
    private function ensureRoom(int $consultantId, int $userId, ?int $scheduleId = null): ?PhongChat
    {
        $room = PhongChat::where('idtuvanvien', $consultantId)
            ->where('idnguoidat', $userId)
            ->when($scheduleId, fn($q) => $q->where('idlichtuvan', $scheduleId))
            ->orderByDesc('idphongchat')
            ->first();
        if ($room) return $room;

        // Nếu có lịch gần nhất giữa 2 người thì gắn vào
        if (!$scheduleId) {
            $scheduleId = LichTuVan::where('idnguoidung', $consultantId)
                ->where('idnguoidat', $userId)
                ->where('trangthai', '2')
                ->orderByDesc('ngayhen')
                ->value('idlichtuvan');
        }
        return PhongChat::create([
            'idlichtuvan' => $scheduleId ?? 0,
            'idtuvanvien' => $consultantId,
            'idnguoidat' => $userId,
            'trang_thai' => 1,
            'ngay_tao' => now(),
            'ngay_cap_nhat' => now(),
        ]);
    }

    // Public API: lấy hoặc tạo phòng chat cho user với tư vấn viên
    public function getOrCreateRoom(Request $request): JsonResponse
    {
        $consultantId = $request->integer('consultant_id');
        $userId = $request->integer('user_id');
        $scheduleId = $request->integer('schedule_id');
        if (!$consultantId || !$userId) {
            return response()->json(['success' => false, 'message' => 'Thiếu tham số'], 400);
        }
        $room = $this->ensureRoom($consultantId, $userId, $scheduleId);
        return response()->json(['success' => true, 'data' => [
            'roomId' => $room->idphongchat,
            'consultantId' => $room->idtuvanvien,
            'userId' => $room->idnguoidat,
            'scheduleId' => $room->idlichtuvan,
        ]]);
    }

    // Danh sách người đã đặt (contacts) cho 1 tư vấn viên
    public function contacts(Request $request): JsonResponse
    {
        $consultantId = $request->integer('consultant_id');
        if (!$consultantId) {
            return response()->json(['success' => false, 'message' => 'Thiếu consultant_id'], 400);
        }

        // Lấy danh sách phòng chat đang có hoặc tạo mới dựa trên các lịch đã đặt
        $bookings = LichTuVan::where('idnguoidung', $consultantId)
            ->where('trangthai', '2')
            ->whereNotNull('idnguoidat')
            ->get(['idlichtuvan','idnguoidat']);

        $contacts = [];
        foreach ($bookings as $b) {
            $room = $this->ensureRoom($consultantId, (int)$b->idnguoidat, (int)$b->idlichtuvan);
            if ($room) {
                $contacts[$room->idnguoidat] = $room; // unique by user
            }
        }

        $data = collect($contacts)->values()->map(function($room) use ($consultantId) {
            $user = NguoiDung::find($room->idnguoidat);
            $last = TinNhan::where('idphongchat', $room->idphongchat)
                ->orderByDesc('ngay_tao')->first();
            return [
                'roomId' => $room->idphongchat,
                'userId' => $room->idnguoidat,
                'name' => $user->hoten ?? 'Người dùng',
                'lastMessage' => $last->noi_dung ?? null,
                'lastTime' => $last->ngay_tao ?? null,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    // Lấy tin nhắn giữa tư vấn viên và 1 người dùng
    public function list(Request $request): JsonResponse
    {
        $roomId = $request->integer('room_id');
        $before = $request->input('before');
        $limit = min(max($request->integer('limit', 30), 1), 100);

        if (!$roomId) {
            return response()->json(['success' => false, 'message' => 'Thiếu room_id'], 400);
        }

        $query = TinNhan::where('idphongchat', $roomId)
            ->orderByDesc('ngay_tao');
        if ($before) {
            $query->where('ngay_tao', '<', $before);
        }
        $rows = $query->limit($limit)->get()->reverse()->values();

        return response()->json(['success' => true, 'data' => $rows]);
    }

    // Gửi tin nhắn
    public function send(Request $request): JsonResponse
    {
        $roomId = $request->integer('room_id');
        $senderId = $request->integer('sender_id');
        $content = trim((string) $request->input('content'));
        if (!$roomId || !$senderId || $content==='') {
            return response()->json(['success' => false, 'message' => 'Thiếu dữ liệu'], 400);
        }

        $msg = TinNhan::create([
            'idphongchat' => $roomId,
            'idnguoigui' => $senderId,
            'noi_dung' => $content,
            'ngay_tao' => now(),
        ]);

        // cập nhật thời gian trong phòng chat
        PhongChat::where('idphongchat', $roomId)->update(['ngay_cap_nhat' => now()]);

        return response()->json(['success' => true, 'data' => $msg]);
    }
}


