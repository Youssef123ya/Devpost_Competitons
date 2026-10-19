<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactSection extends Model
{
    protected $guarded = [];

    protected $casts = [
        'form_fields'   => 'array',
        'ctas'          => 'array',
        'social_links'  => 'array',
        'custom_styles' => 'array',
    ];

    public function hero()
    {
        return $this->belongsTo(Hero::class);
    }
}
