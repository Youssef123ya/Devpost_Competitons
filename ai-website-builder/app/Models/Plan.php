<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'credits', 'price', 'is_active', 'sort_order'];
}
