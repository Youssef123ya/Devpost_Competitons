<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Work extends Model
{
    use HasFactory;

    protected $table = 'work';

    protected $fillable = [
        'hero_id',
        'title',
        'subtitle',
        'description',
        'layout_style',
        'items_data',
        'custom_styles',
        'generated_code',
    ];

    protected $casts = [
        'items_data' => 'array',
        'custom_styles' => 'array',
        'generated_code' => 'string',
    ];

    public function hero()
    {
        return $this->belongsTo(Hero::class);
    }
}
