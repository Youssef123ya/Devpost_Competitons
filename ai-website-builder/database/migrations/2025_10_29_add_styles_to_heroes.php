<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('heroes', function (Blueprint $table) {
            if (!Schema::hasColumn('heroes', 'layout_style')) {
                $table->string('layout_style')->default('centered');
            }
            if (!Schema::hasColumn('heroes', 'custom_styles')) {
                $table->json('custom_styles')->nullable();
            }
            if (!Schema::hasColumn('heroes', 'generated_code')) {
                $table->text('generated_code')->nullable();
            }
        });
    }

    public function down()
    {
        Schema::table('heroes', function (Blueprint $table) {
            $table->dropColumn(['layout_style', 'custom_styles', 'generated_code']);
        });
    }
};