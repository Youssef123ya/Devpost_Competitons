<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhyChooseUs extends Model
{
    protected $table = 'why_choose_us';

    protected $fillable = [
        'hero_id',
        'title',
        'subtitle',
        'description',
        'layout_style',
        'reasons_data',
        'generated_code',
        'custom_styles'
    ];

    protected $casts = [
        'reasons_data' => 'array',
        'custom_styles' => 'array'
    ];

    public function hero()
    {
        return $this->belongsTo(Hero::class);
    }
}
