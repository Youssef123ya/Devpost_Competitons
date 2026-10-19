<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('navbars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hero_id')->constrained()->onDelete('cascade');
            $table->string('layout_style')->default('centered');
            $table->json('links_data')->nullable(); // Titles and URLs
            $table->string('logo_image')->nullable();
            $table->string('logo_text')->nullable();
            $table->json('buttons_data')->nullable(); // Array of buttons
            $table->json('custom_styles')->nullable();
            $table->longText('generated_code')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('navbars');
    }
};
