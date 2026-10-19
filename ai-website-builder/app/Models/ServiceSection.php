<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceSection extends Model
{
    protected $fillable = [
        'hero_id',
        'title',
        'subtitle',
        'services_data',
        'layout_style',
        'generated_code',
        'custom_styles'
    ];

    protected $casts = [
        'services_data' => 'array',
        'custom_styles' => 'array'
    ];

    public function hero()
    {
        return $this->belongsTo(Hero::class);
    }
}
