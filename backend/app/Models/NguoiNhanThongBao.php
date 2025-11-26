<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class NguoiNhanThongBao extends Model
{
    use HasFactory;

    protected $table = 'nguoinhan_thongbao';
    protected $primaryKey = 'id';

    protected $fillable = [
        'idthongbao',
        'idnguoinhan',
        'idvaitro',
        'trangthai',
        'thoigiangui_thucte',
        'thoigianxem',
        'ghichu_loi',
        'ngayxoa'
    ];

    protected $casts = [
        'thoigiangui_thucte' => 'datetime',
        'thoigianxem' => 'datetime',
        'ngayxoa' => 'datetime'
    ];

    /**
     * Mối quan hệ với thông báo
     */
    public function thongBao()
    {
        return $this->belongsTo(ThongBao::class, 'idthongbao', 'idthongbao');
    }

    /**
     * Mối quan hệ với người nhận
     */
    public function nguoiNhan()
    {
        return $this->belongsTo(NguoiDung::class, 'idnguoinhan', 'idnguoidung');
    }

    /**
     * Mối quan hệ với vai trò
     */
    public function vaiTro()
    {
        return $this->belongsTo(VaiTro::class, 'idvaitro', 'idvaitro');
    }

    /**
     * Scope để lọc theo trạng thái
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('trangthai', $status);
    }

    /**
     * Scope để lọc theo người nhận
     */
    public function scopeByRecipient($query, $recipientId)
    {
        return $query->where('idnguoinhan', $recipientId);
    }

    /**
     * Scope để lọc theo vai trò
     */
    public function scopeByRole($query, $roleId)
    {
        return $query->where('idvaitro', $roleId);
    }

    /**
     * Scope để lọc chưa đọc
     */
    public function scopeUnread($query)
    {
        return $query->where('trangthai', 1);
    }

    /**
     * Scope để lọc đã đọc
     */
    public function scopeRead($query)
    {
        return $query->where('trangthai', 2);
    }

    /**
     * Scope để lọc chưa gửi
     */
    public function scopeNotSent($query)
    {
        return $query->where('trangthai', 0);
    }

    /**
     * Lấy trạng thái dạng text
     */
    public function getStatusTextAttribute()
    {
        switch ($this->trangthai) {
            case 0:
                return 'Chưa gửi';
            case 1:
                return 'Chưa đọc';
            case 2:
                return 'Đã đọc';
            case 3:
                return 'Gửi thất bại';
            default:
                return 'Không xác định';
        }
    }

    /**
     * Kiểm tra xem đã đọc chưa
     */
    public function isRead()
    {
        return $this->trangthai === 2;
    }

    /**
     * Kiểm tra xem đã gửi chưa
     */
    public function isSent()
    {
        return $this->trangthai >= 1;
    }

    /**
     * Đánh dấu đã đọc
     */
    public function markAsRead()
    {
        $this->update([
            'trangthai' => 2,
            'thoigianxem' => Carbon::now()
        ]);
    }

    /**
     * Đánh dấu đã gửi
     */
    public function markAsSent()
    {
        $this->update([
            'trangthai' => 1,
            'thoigiangui_thucte' => Carbon::now()
        ]);
    }

    /**
     * Đánh dấu gửi thất bại
     */
    public function markAsFailed($errorNote = null)
    {
        $this->update([
            'trangthai' => 3,
            'ghichu' => $errorNote
        ]);
    }

    /**
     * Xóa mềm
     */
    public function softDelete()
    {
        $this->update(['trangthai' => -1]);
    }
}
