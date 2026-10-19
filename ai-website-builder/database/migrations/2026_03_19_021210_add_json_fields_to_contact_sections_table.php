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
        Schema::table('contact_sections', function (Blueprint $table) {
            $table->longText('form_fields')->nullable();
            $table->longText('ctas')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contact_sections', function (Blueprint $table) {
            $table->dropColumn(['form_fields', 'ctas']);
        });
    }
};
