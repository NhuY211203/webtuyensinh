<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoSoTruong extends Model
{
    protected $table = 'coso_truong';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'idtruong',
        'ten_coso',
        'khuvuc',
        'diachi_coso'
    ];

    /**
     * Relationship with TruongDaiHoc
     */
    public function truongDaiHoc()
    {
        return $this->belongsTo(TruongDaiHoc::class, 'idtruong', 'idtruong');
    }
}


