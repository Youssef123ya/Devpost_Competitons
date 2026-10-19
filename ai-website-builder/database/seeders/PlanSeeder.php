<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        Plan::truncate();
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

        Plan::create([
            'name' => 'Starter Package',
            'slug' => 'starter',
            'description' => '100 credits for quick page generations.',
            'credits' => 100,
            'price' => 5.00,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        Plan::create([
            'name' => 'Growth Package',
            'slug' => 'growth',
            'description' => '250 credits for single websites.',
            'credits' => 250,
            'price' => 10.00,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        Plan::create([
            'name' => 'Pro Package',
            'slug' => 'pro',
            'description' => '600 credits for professional portfolios.',
            'credits' => 600,
            'price' => 20.00,
            'is_active' => true,
            'sort_order' => 2,
        ]);

        Plan::create([
            'name' => 'Agency Package',
            'slug' => 'agency',
            'description' => '2000 credits for agencies & power users.',
            'credits' => 2000,
            'price' => 49.00,
            'is_active' => true,
            'sort_order' => 3,
        ]);
    }
}
