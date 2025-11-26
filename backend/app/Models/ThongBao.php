<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ThongBao extends Model
{
    use HasFactory;

    protected $table = 'thongbao';
    protected $primaryKey = 'idthongbao';
    public $timestamps = false; // Sử dụng ngaytao và ngaycapnhat thay vì created_at và updated_at

    protected $fillable = [
        'tieude',
        'noidung',
        'nguoitao_id',
        'idnguoinhan',
        'thoigiangui_dukien',
        'kieuguithongbao',
        'ngaytao',
        'ngaycapnhat'
    ];

    protected $casts = [
        'thoigiangui_dukien' => 'datetime',
        'ngaytao' => 'datetime',
        'ngaycapnhat' => 'datetime'
    ];

    /**
     * Mối quan hệ với người gửi
     */
    public function nguoiGui()
    {
        return $this->belongsTo(NguoiDung::class, 'nguoitao_id', 'idnguoidung');
    }

    /**
     * Mối quan hệ với người nhận thông báo
     */
    public function nguoiNhan()
    {
        return $this->belongsTo(NguoiDung::class, 'idnguoinhan', 'idnguoidung');
    }

    /**
     * Lấy tất cả thông báo có cùng nội dung (cùng id gốc)
     */
    public function getOriginalNotification()
    {
        return $this->where('tieude', $this->tieude)
                   ->where('noidung', $this->noidung)
                   ->where('nguoitao_id', $this->nguoitao_id)
                   ->where('ngaytao', $this->ngaytao)
                   ->whereNull('idnguoinhan')
                   ->first();
    }

    /**
     * Lấy tất cả người nhận của thông báo gốc
     */
    public function getAllRecipients()
    {
        return $this->where('tieude', $this->tieude)
                   ->where('noidung', $this->noidung)
                   ->where('nguoitao_id', $this->nguoitao_id)
                   ->where('ngaytao', $this->ngaytao)
                   ->whereNotNull('idnguoinhan')
                   ->get();
    }

    /**
     * Scope để lấy thông báo theo trạng thái
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('kieuguithongbao', $status);
    }

    /**
     * Scope để lấy thông báo theo người gửi
     */
    public function scopeBySender($query, $senderId)
    {
        return $query->where('nguoitao_id', $senderId);
    }

    /**
     * Scope để lấy thông báo trong khoảng thời gian
     */
    public function scopeByDateRange($query, $fromDate, $toDate)
    {
        return $query->whereBetween('ngaytao', [$fromDate, $toDate]);
    }

    /**
     * Lấy số lượng người nhận
     */
    public function getRecipientCountAttribute()
    {
        return $this->getAllRecipients()->count();
    }

    /**
     * Lấy số lượng người đã đọc
     */
    public function getReadCountAttribute()
    {
        return $this->getAllRecipients()->where('trangthai', 2)->count();
    }

    /**
     * Lấy số lượng người chưa đọc
     */
    public function getUnreadCountAttribute()
    {
        return $this->getAllRecipients()->where('trangthai', 1)->count();
    }

    /**
     * Kiểm tra xem thông báo đã được gửi chưa
     */
    public function isSent()
    {
        return $this->kieuguithongbao === 'ngay';
    }

    /**
     * Kiểm tra xem thông báo đã được lên lịch chưa
     */
    public function isScheduled()
    {
        return $this->kieuguithongbao === 'lenlich';
    }

    /**
     * Kiểm tra xem thông báo có lỗi không
     */
    public function isFailed()
    {
        return $this->kieuguithongbao === 'failed';
    }

    /**
     * Đánh dấu thông báo là đã gửi
     */
    public function markAsSent()
    {
        $this->update(['kieuguithongbao' => 'ngay']);
    }

    /**
     * Đánh dấu thông báo là thất bại
     */
    public function markAsFailed()
    {
        $this->update(['kieuguithongbao' => 'failed']);
    }

    /**
     * Hủy thông báo
     */
    public function cancel()
    {
        $this->update(['kieuguithongbao' => 'cancelled']);
    }
}

