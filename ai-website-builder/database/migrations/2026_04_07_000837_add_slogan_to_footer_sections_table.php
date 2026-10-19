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
        Schema::table('footer_sections', function (Blueprint $table) {
            $table->foreignId('hero_id')->after('id')->constrained()->onDelete('cascade');
            $table->string('title')->nullable()->after('hero_id');
            $table->text('slogan')->nullable()->after('title');
            $table->json('links')->nullable()->after('slogan');
            $table->json('buttons')->nullable()->after('links');
            $table->json('social_links')->nullable()->after('buttons');
            $table->string('layout_style')->default('simple')->after('social_links');
            $table->json('custom_styles')->nullable()->after('layout_style');
            $table->text('generated_code')->nullable()->after('custom_styles');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('footer_sections', function (Blueprint $table) {
            $table->dropForeign(['hero_id']);
            $table->dropColumn([
                'hero_id',
                'title',
                'slogan',
                'links',
                'buttons',
                'social_links',
                'layout_style',
                'custom_styles',
                'generated_code'
            ]);
        });
    }
};
