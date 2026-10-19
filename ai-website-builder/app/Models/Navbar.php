<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Navbar extends Model
{
    protected $fillable = [
        'hero_id',
        'layout_style',
        'links_data',
        'logo_image',
        'logo_text',
        'buttons_data',
        'custom_styles',
        'generated_code'
    ];

    protected $casts = [
        'links_data' => 'array',
        'buttons_data' => 'array',
        'custom_styles' => 'array',
    ];

    public function hero()
    {
        return $this->belongsTo(Hero::class);
    }
}
