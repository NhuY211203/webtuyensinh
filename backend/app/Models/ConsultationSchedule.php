<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ConsultationSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'consultant_id',
        'student_id',
        'date',
        'start_time',
        'end_time',
        'status',
        'meeting_link',
        'meeting_platform',
        'notes'
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
    ];

    // Relationships
    public function consultant()
    {
        return $this->belongsTo(NguoiDung::class, 'consultant_id');
    }

    public function student()
    {
        return $this->belongsTo(NguoiDung::class, 'student_id');
    }

    // Scopes
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    public function scopeBooked($query)
    {
        return $query->where('status', 'booked');
    }

    public function scopeByConsultant($query, $consultantId)
    {
        return $query->where('consultant_id', $consultantId);
    }

    public function scopeByDate($query, $date)
    {
        return $query->where('date', $date);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('date', '>=', Carbon::today());
    }

    // Accessors
    public function getTimeSlotAttribute()
    {
        return $this->start_time->format('H:i') . ' - ' . $this->end_time->format('H:i');
    }

    public function getIsAvailableAttribute()
    {
        return $this->status === 'available';
    }

    public function getIsBookedAttribute()
    {
        return $this->status === 'booked';
    }

    public function getIsCompletedAttribute()
    {
        return $this->status === 'completed';
    }

    public function getIsCancelledAttribute()
    {
        return $this->status === 'cancelled';
    }
}
