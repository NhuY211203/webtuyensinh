<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FileDeAnTuyenSinh extends Model
{
    protected $table = 'file_de_an_tuyen_sinh';
    protected $primaryKey = 'idfile';
    public $timestamps = true;

    protected $fillable = [
        'idde_an',
        'ten_file',
        'duong_dan',
        'loai_file',
        'kich_thuoc',
        'trang_thai',
    ];

    /**
     * Relationship with DeAnTuyenSinh
     */
    public function deAn()
    {
        return $this->belongsTo(DeAnTuyenSinh::class, 'idde_an', 'idde_an');
    }
}

