<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hero_id')->constrained('heroes')->onDelete('cascade');
            $table->string('title')->default('Our Work');
            $table->string('subtitle')->default('Showcase of our projects');
            $table->text('description')->nullable();
            $table->string('layout_style')->default('grid');
            $table->longText('items_data')->default('[]');
            $table->longText('custom_styles')->nullable();
            $table->longText('generated_code')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work');
    }
};
