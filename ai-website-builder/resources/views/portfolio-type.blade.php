<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Portfolio Type — AI Builder</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="/js/tailwind.js"></script>
    <style>
        body { font-family: 'Outfit', sans-serif; }

        .type-card {
            border: 2px solid transparent;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }
        .type-card::before {
            content: '';
            position: absolute;
            inset: 0;
            background: var(--card-accent);
            opacity: 0;
            transition: opacity 0.3s;
        }
        .type-card:hover {
            transform: translateY(-6px);
            border-color: var(--card-border);
            box-shadow: 0 20px 40px -10px var(--card-shadow);
        }
        .type-card:hover::before { opacity: 0.05; }
        .type-card.selected {
            border-color: var(--card-border) !important;
            box-shadow: 0 20px 40px -10px var(--card-shadow);
            transform: translateY(-4px);
        }
        .type-card.selected::before { opacity: 0.08; }
        .type-card.selected .check-badge { opacity: 1 !important; transform: scale(1) !important; }

        .check-badge {
            opacity: 0;
            transform: scale(0.5);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .continue-btn {
            transition: all 0.3s ease;
        }
        .continue-btn:not(:disabled):hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 30px -8px rgba(93, 95, 239, 0.5);
        }
        .continue-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        @keyframes float-in {
            from { opacity: 0; transform: translateY(30px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .float-in { animation: float-in 0.6s ease-out forwards; }
        .float-in-delay-1 { animation: float-in 0.6s 0.1s ease-out both; }
        .float-in-delay-2 { animation: float-in 0.6s 0.2s ease-out both; }
        .float-in-delay-3 { animation: float-in 0.6s 0.3s ease-out both; }
        .float-in-delay-4 { animation: float-in 0.6s 0.4s ease-out both; }
        .float-in-delay-5 { animation: float-in 0.6s 0.5s ease-out both; }
        .float-in-delay-6 { animation: float-in 0.6s 0.6s ease-out both; }
        .float-in-delay-7 { animation: float-in 0.6s 0.7s ease-out both; }

        /* Other input slide-in */
        #other-input-wrapper {
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            transition: max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1),
                        opacity 0.35s ease,
                        margin 0.35s ease;
            margin-bottom: 0;
        }
        #other-input-wrapper.show {
            max-height: 120px;
            opacity: 1;
            margin-bottom: 2rem;
        }
        #otherInput {
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        #otherInput:focus {
            border-color: #64748b;
            box-shadow: 0 0 0 3px rgba(100,116,139,0.15);
            outline: none;
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen flex flex-col">

    {{-- Background blobs --}}
    <div class="fixed top-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-100/60 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
    <div class="fixed bottom-[-10%] right-[-5%] w-[350px] h-[350px] bg-purple-100/40 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

    <x-navbar />

    {{-- Main --}}
    <main class="flex-1 flex flex-col items-center justify-center px-6 py-12 mt-20">

        {{-- Title --}}
        <div class="text-center mb-12 float-in-delay-1">
            <h1 class="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
                What type of work<br>do you <span class="text-indigo-600">showcase?</span>
            </h1>
            <p class="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
                Choose your field so we can tailor the perfect portfolio experience for you.
            </p>
        </div>

        {{-- Cards Grid --}}
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-5xl mb-10">

            @php
            $types = [
                [
                    'value' => 'developer',
                    'label' => 'Developer',
                    'icon'  => 'fa-solid fa-code',
                    'desc'  => 'Web, Mobile & Software',
                    'color' => '#6366f1',
                    'bg'    => '#eff6ff',
                    'delay' => '2',
                ],
                [
                    'value' => 'designer',
                    'label' => 'Designer',
                    'icon'  => 'fa-solid fa-pen-nib',
                    'desc'  => 'UI/UX & Graphic Design',
                    'color' => '#ec4899',
                    'bg'    => '#fdf2f8',
                    'delay' => '3',
                ],
                [
                    'value' => 'photographer',
                    'label' => 'Photographer',
                    'icon'  => 'fa-solid fa-camera',
                    'desc'  => 'Studio & Commercial',
                    'color' => '#f97316',
                    'bg'    => '#fff7ed',
                    'delay' => '4',
                ],
                [
                    'value' => 'videographer',
                    'label' => 'Videographer',
                    'icon'  => 'fa-solid fa-video',
                    'desc'  => 'Film & Content Creator',
                    'color' => '#ef4444',
                    'bg'    => '#fef2f2',
                    'delay' => '5',
                ],
                [
                    'value' => 'writer',
                    'label' => 'Writer',
                    'icon'  => 'fa-solid fa-feather-pointed',
                    'desc'  => 'Copywriter & Blogger',
                    'color' => '#14b8a6',
                    'bg'    => '#f0fdfa',
                    'delay' => '2',
                ],
                [
                    'value' => 'marketer',
                    'label' => 'Marketer',
                    'icon'  => 'fa-solid fa-bullhorn',
                    'desc'  => 'Digital & Growth',
                    'color' => '#8b5cf6',
                    'bg'    => '#f5f3ff',
                    'delay' => '3',
                ],
                [
                    'value' => 'architect',
                    'label' => 'Architect',
                    'icon'  => 'fa-solid fa-building-columns',
                    'desc'  => 'Interior & Spatial',
                    'color' => '#0ea5e9',
                    'bg'    => '#f0f9ff',
                    'delay' => '4',
                ],
                [
                    'value' => 'other',
                    'label' => 'Other',
                    'icon'  => 'fa-solid fa-sparkles',
                    'desc'  => 'Something unique',
                    'color' => '#64748b',
                    'bg'    => '#f8fafc',
                    'delay' => '5',
                ],
            ];
            @endphp

            @foreach($types as $type)
            <div class="type-card float-in-delay-{{ $type['delay'] }} bg-white rounded-[1.75rem] p-6 flex flex-col items-center text-center gap-3 select-none"
                 style="--card-accent: {{ $type['color'] }}; --card-border: {{ $type['color'] }}; --card-shadow: {{ $type['color'] }}40;"
                 data-value="{{ $type['value'] }}"
                 onclick="selectType(this)">

                {{-- Check badge --}}
                <div class="check-badge absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                     style="background: {{ $type['color'] }};">
                    <i class="fa-solid fa-check text-white text-[10px]"></i>
                </div>

                {{-- Icon circle --}}
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-1 transition-transform duration-300"
                     style="background: {{ $type['bg'] }};">
                    <i class="{{ $type['icon'] }} text-xl" style="color: {{ $type['color'] }};"></i>
                </div>

                {{-- Label --}}
                <div>
                    <h3 class="text-base font-bold text-slate-800">{{ $type['label'] }}</h3>
                    <p class="text-[11px] text-slate-400 mt-0.5 leading-snug">{{ $type['desc'] }}</p>
                </div>
            </div>
            @endforeach
        </div>

        {{-- "Other" custom input --}}
        <div id="other-input-wrapper" class="w-full max-w-xl">
            <div class="bg-white rounded-2xl border-2 border-slate-200 p-5 flex flex-col gap-3">
                <label class="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <i class="fa-solid fa-sparkles text-slate-400"></i>
                    Tell us about your portfolio
                </label>
                <input
                    type="text"
                    id="otherInput"
                    placeholder="e.g. 3D Artist, Musician, Fashion Stylist..."
                    maxlength="60"
                    class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-800 text-base font-medium bg-slate-50 placeholder-slate-300"
                    oninput="handleOtherInput()"
                >
                <p class="text-[11px] text-slate-400">Be specific — this helps us personalize your portfolio better.</p>
            </div>
        </div>

        {{-- Continue Button --}}
        <div class="float-in-delay-6 flex flex-col items-center gap-3">
            <button id="continueBtn"
                    onclick="handleContinue()"
                    disabled
                    class="continue-btn px-12 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
                Continue
            </button>
            <p class="text-xs text-slate-400" id="selectionHint">Select your portfolio type to continue</p>
        </div>

    </main>

    <script>
        let selectedType = null;

        function selectType(card) {
            // Deselect previous
            document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));

            // Select new
            card.classList.add('selected');
            selectedType = card.dataset.value;

            const wrapper = document.getElementById('other-input-wrapper');
            const otherInput = document.getElementById('otherInput');
            const btn = document.getElementById('continueBtn');
            const hint = document.getElementById('selectionHint');
            const label = card.querySelector('h3').textContent;

            if (selectedType === 'other') {
                // Show the custom input
                wrapper.classList.add('show');
                setTimeout(() => otherInput.focus(), 400);

                // Only enable Continue if they've typed something
                btn.disabled = otherInput.value.trim() === '';
                hint.textContent = 'Describe your portfolio type to continue';
            } else {
                // Hide the custom input
                wrapper.classList.remove('show');
                otherInput.value = '';

                btn.disabled = false;
                hint.textContent = `"${label}" selected — click Continue to proceed`;
            }
        }

        function handleOtherInput() {
            const val = document.getElementById('otherInput').value.trim();
            const btn = document.getElementById('continueBtn');
            const hint = document.getElementById('selectionHint');

            if (selectedType === 'other') {
                btn.disabled = val === '';
                hint.textContent = val
                    ? `"${val}" — click Continue to proceed`
                    : 'Describe your portfolio type to continue';
            }
        }

        function handleContinue() {
            if (!selectedType) return;

            let typeValue = selectedType;
            if (selectedType === 'other') {
                const custom = document.getElementById('otherInput').value.trim();
                if (!custom) return;
                typeValue = custom; // Use what they typed
            }

            const url = new URL("{{ route('website.setup') }}", window.location.origin);
            url.searchParams.set('portfolio_type', typeValue);
            window.location.href = url.toString();
        }

        // Allow pressing Enter in the input to continue
        document.getElementById('otherInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') handleContinue();
        });
    </script>

</body>
</html>
