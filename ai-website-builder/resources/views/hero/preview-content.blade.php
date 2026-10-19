@php
    // Calculate bg URL
    $ctrl = app(\App\Http\Controllers\HeroController::class);
    $reflection = new \ReflectionMethod($ctrl, 'buildStylesCss');
    $reflection->setAccessible(true);
    $bgUrlGen = null;
    if ($hero->layout_style !== 'split') {
        if ($hero->background_image) {
            if (str_starts_with($hero->background_image, 'http') || str_starts_with($hero->background_image, '/images/') || str_starts_with($hero->background_image, '/storage/')) {
                $bgUrlGen = $hero->background_image;
            } else {
                $bgUrlGen = '/storage/' . ltrim($hero->background_image, '/');
            }
        } elseif ($hero->background_image_url) {
            $bgUrlGen = $hero->background_image_url;
        }
    }
    $styleHtml = $reflection->invoke($ctrl, $hero->custom_styles ?? [], $bgUrlGen);
@endphp
<div class="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden relative group hero-preview-wrapper" data-bg-url="{{ $bgUrlGen ?? '' }}">
    <div
        class="absolute top-0 left-0 w-full h-8 bg-slate-800 flex items-center px-4 gap-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
        <div class="w-3 h-3 rounded-full bg-red-500"></div>
        <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div class="w-3 h-3 rounded-full bg-green-500"></div>
    </div>
    

    {!! $styleHtml !!}

    <div id="hero-canvas-inner" class="w-full h-full overflow-y-auto custom-scrollbar hero-preview-content">
        {!! $hero->generated_code !!}
    </div>
</div>