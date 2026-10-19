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
        Schema::create('service_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hero_id')->constrained('heroes')->onDelete('cascade');
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->json('services_data'); // Stores array of {title, description, icon}
            $table->string('layout_style')->default('grid-3'); // grid-3, grid-4, cards, list
            $table->longText('generated_code')->nullable();
            $table->json('custom_styles')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_sections');
    }
};
