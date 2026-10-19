<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SkillSection extends Model
{
    protected $fillable = [
        'hero_id',
        'layout_style',
        'section_title',
        'section_subtitle',
        'skills_data',
        'custom_styles',
        'generated_code'
    ];

    protected $casts = [
        'skills_data' => 'array',
        'custom_styles' => 'array'
    ];

    public function hero()
    {
        return $this->belongsTo(Hero::class);
    }
}
