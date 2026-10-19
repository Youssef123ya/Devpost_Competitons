<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FooterSection extends Model
{
    protected $guarded = [];

    protected $casts = [
        'links'         => 'array',
        'buttons'       => 'array',
        'social_links'  => 'array',
        'custom_styles' => 'array',
    ];

    public function hero()
    {
        return $this->belongsTo(Hero::class);
    }
}
