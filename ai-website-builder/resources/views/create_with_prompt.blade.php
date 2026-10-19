<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Create with Prompt — AI Test</title>
    <script src="/js/tailwind.js"></script>
    <style>body{font-family: 'Instrument Sans', sans-serif;}</style>
    </head>
<body class="bg-white text-slate-900 antialiased">
    <x-navbar />

    <main class="max-w-4xl mx-auto p-6 mt-24">
        <h1 class="text-4xl font-extrabold mb-4">Create with Prompt (Free Test)</h1>
        <p class="text-sm text-slate-500 mb-6">اكتب برومبت وصف الموقع وسيتم توليد نتيجة تجريبية (مجاناً).</p>

        <form action="{{ route('prompt.submit') }}" method="POST" class="space-y-4">
            @csrf
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Your prompt</label>
                <textarea name="prompt" rows="6" required
                    class="w-full border rounded p-3 text-sm bg-white focus:outline-indigo-500">{{ old('prompt', $prompt ?? '') }}</textarea>
                @error('prompt')<p class="text-red-600 text-sm mt-1">{{ $message }}</p>@enderror
            </div>
            <div class="flex items-center gap-3">
                <button type="submit" class="px-6 py-3 bg-emerald-600 text-white rounded-full font-bold">Build Website (AI)</button>
                <a href="/" class="text-sm text-slate-500">Back to Home</a>
            </div>
        </form>

        @if(!empty($generated))
            <div class="mt-6">
                {!! $generated !!}
            </div>
        @endif
    </main>

</body>
</html>
