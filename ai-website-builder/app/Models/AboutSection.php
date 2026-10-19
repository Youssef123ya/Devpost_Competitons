<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AboutSection extends Model
{
    protected $fillable = [
        'hero_id',
        'title',
        'subtitle',
        'description',
        'image',
        'layout_style',
        'custom_styles',
        'generated_code',
    ];

    protected $casts = [
        'custom_styles' => 'array',
    ];

    public function hero()
    {
        return $this->belongsTo(Hero::class);
    }
}
