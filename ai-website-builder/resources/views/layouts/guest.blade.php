<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'AI Generator') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />

        <!-- Tailwind -->
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @else
            <script src="/js/tailwind.js"></script>
        @endif
        
        <style>
            body { font-family: 'Instrument Sans', system-ui, -apple-system, sans-serif; }
        </style>
    </head>
    <body class="bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
        <div class="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
            <!-- Background Effects -->
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-300/30 rounded-full blur-[120px]"></div>
                <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-300/30 rounded-full blur-[120px]"></div>
            </div>

           
            <!-- Main Content -->
            <div class="relative z-10 w-full max-w-md px-6">
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-900/10 p-8 border border-white/50">
                    {{ $slot }}
                </div>
            </div>
        </div>
    </body>
</html>
