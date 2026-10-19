@php
    $styles = $footer->custom_styles ?? [];
    $bg = $styles['bg_color'] ?? '#ffffff';
    $titleColor = $styles['title_color'] ?? '#111827';
    $sloganColor = $styles['slogan_color'] ?? '#4b5563';
    $linkColor = $styles['link_color'] ?? '#6366f1';
    $iconColor = $styles['icon_color'] ?? '#6366f1';

    $brandName = $footer->title ?? ($footer->hero->title ?? 'Portfolio');

    $links = $footer->links ?? [];
    if (empty($links)) {
        $links = [
            ['text' => 'Home', 'url' => '#'],
            ['text' => 'Portfolio', 'url' => '#'],
            ['text' => 'Contact', 'url' => '#'],
        ];
    }

    $socials = $footer->social_links ?? [];
    if (empty($socials)) {
        $socials = [
            ['icon' => 'fab fa-linkedin-in', 'url' => '#'],
            ['icon' => 'fab fa-facebook-f', 'url' => '#'],
            ['icon' => 'fab fa-github', 'url' => '#'],
            ['icon' => 'fab fa-twitter', 'url' => '#'],
            ['icon' => 'fab fa-instagram', 'url' => '#'],
        ];
    }


@endphp

<footer class="py-20 flex flex-col items-center justify-center font-sans transition-all"
    style="background-color: {{ $bg }}; text-align: center;">
    <div class="max-w-4xl mx-auto px-6 flex flex-col items-center">
        <!-- Logo or Title -->
        <div class="mb-3 inline-block">
            @if(isset($footer->logo) && $footer->logo)
                <img src="{{ asset('storage/' . $footer->logo) }}" alt="Brand Logo"
                    class="h-12 w-auto object-contain mx-auto">
            @else
                <h2 class="text-3xl md:text-4xl lg:text-[42px] font-bold tracking-tight" style="color: {{ $titleColor }};">
                    {{ $brandName }}
                </h2>
            @endif
        </div>

        <!-- Slogan -->
        @if($footer->slogan)
            <p class="text-lg md:text-[18px] mb-12 font-medium" style="color: {{ $sloganColor }};">
                {{ $footer->slogan }}
            </p>
        @endif

        <!-- Quick Links -->
        @if(!empty($links))
            <div class="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8">
                @foreach($links as $link)
                    <a href="{{ $link['url'] ?? '#' }}"
                        class="text-[16px] font-medium hover:opacity-100 transition-all duration-300"
                        style="color: {{ $linkColor }};">
                        {{ $link['text'] }}
                    </a>
                @endforeach
            </div>
        @endif

        <!-- Social Connect -->
        @if(!empty($socials))
            <div class="flex justify-center gap-7 mb-10">
                @foreach($socials as $s)
                    <a href="{{ $s['url'] ?? '#' }}" class="text-[22px] transition-all duration-300 hover:scale-110"
                        style="color: {{ $iconColor }};">
                        <i class="{{ $s['icon'] ?? 'fab fa-facebook-f' }}"></i>
                    </a>
                @endforeach
            </div>
        @endif

        <!-- Bottom Bar / Legal -->
        <div class="mt-2 text-center">
            <a href="#" class="text-[14px] opacity-70 hover:opacity-100 transition-opacity font-medium"
                style="color: {{ $sloganColor }};">
                Privacy & Legal
            </a>
        </div>
    </div>
</footer>