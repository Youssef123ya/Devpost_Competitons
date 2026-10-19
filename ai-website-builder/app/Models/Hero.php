<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hero extends Model
{
    protected $fillable = [
        'user_id',
        'layout_style',
        'title',
        'subtitle',
        'description',
        'background_image',
        'cta_text',
        'cta_url',
        'cta_2_text',
        'cta_2_url',
        'cta_3_text',
        'cta_3_url',
        'custom_styles',
        'generated_code'
    ];

    protected $casts = [
        'custom_styles' => 'array'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function serviceSection()
    {
        return $this->hasOne(ServiceSection::class)->latestOfMany();
    }

    public function whyChooseUs()
    {
        return $this->hasOne(WhyChooseUs::class)->latestOfMany();
    }

    public function work()
    {
        return $this->hasOne(Work::class)->latestOfMany();
    }

    public function navbar()
    {
        return $this->hasOne(Navbar::class)->latestOfMany();
    }

    public function skillSection()
    {
        return $this->hasOne(SkillSection::class)->latestOfMany();
    }

    public function aboutSection()
    {
        return $this->hasOne(AboutSection::class)->latestOfMany();
    }

    public function contactSection()
    {
        return $this->hasOne(ContactSection::class)->latestOfMany();
    }

    public function footerSection()
    {
        return $this->hasOne(FooterSection::class)->latestOfMany();
    }
}

