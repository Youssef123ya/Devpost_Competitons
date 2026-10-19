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
        Schema::table('heroes', function (Blueprint $table) {
            $table->string('cta_2_text')->nullable()->after('cta_url');
            $table->string('cta_2_url')->nullable()->after('cta_2_text');
            $table->string('cta_3_text')->nullable()->after('cta_2_url');
            $table->string('cta_3_url')->nullable()->after('cta_3_text');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('heroes', function (Blueprint $table) {
            $table->dropColumn(['cta_2_text', 'cta_2_url', 'cta_3_text', 'cta_3_url']);
        });
    }
};
