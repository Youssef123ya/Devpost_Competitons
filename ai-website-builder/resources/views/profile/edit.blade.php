<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Edit Profile - {{ config('app.name', 'Laravel') }}</title>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800" rel="stylesheet" />
    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="/js/tailwind.js"></script>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #ffffff; }
        .indigo-brand { color: #5a55f9; }
        .bg-indigo-brand { background-color: #5a55f9; }
        .hover-bg-indigo-brand:hover { background-color: #4a45e9; }
    </style>
</head>
<body class="text-slate-800 antialiased min-h-screen flex flex-col">

    <!-- Navbar -->
    <x-navbar />

    <!-- Main Layout -->
    @php
        $tab = request('tab', 'data');
    @endphp
    <div class="w-full px-6 md:px-12 mt-32 flex flex-col md:flex-row gap-8 pb-20">
        
        <!-- Sidebar -->
        <aside class="w-full md:w-64 lg:w-72 shrink-0">
            <h1 class="text-[40px] font-bold indigo-brand tracking-tight mb-12">Dashboard</h1>
            
            <div class="bg-[#fcfcfd] rounded-2xl p-6 h-auto md:h-[calc(100vh-280px)]">
                <!-- Menu -->
                <div class="mb-8">
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose mb-3 px-3">Menu</p>
                    <nav class="space-y-1.5">
                        <a href="{{ route('dashboard') }}" class="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl font-medium text-sm transition-all border border-transparent">
                            <i class="fa-solid fa-chart-simple w-6 text-center text-[15px]"></i>
                            Your Websites
                        </a>
                        
                        <!-- Edit Your Data Link -->
                        @if($tab === 'data')
                            <a href="{{ route('profile.edit', ['tab' => 'data']) }}" class="flex items-center gap-3 px-3 py-2.5 bg-white text-indigo-brand rounded-xl font-medium text-sm transition-all border border-gray-100 shadow-sm shadow-[0_2px_8px_rgba(90,85,249,0.06)]">
                                <div class="w-6 h-6 rounded-md bg-indigo-brand text-white flex items-center justify-center text-[10px]">
                                    <i class="fa-solid fa-file-lines"></i>
                                </div>
                                Edit Your data
                            </a>
                        @else
                            <a href="{{ route('profile.edit', ['tab' => 'data']) }}" class="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl font-medium text-sm transition-all border border-transparent">
                                <i class="fa-regular fa-file-lines w-6 text-center text-[15px]"></i>
                                Edit Your data
                            </a>
                        @endif
                        
                        <!-- Security Link -->
                        @if($tab === 'security')
                            <a href="{{ route('profile.edit', ['tab' => 'security']) }}" class="flex items-center gap-3 px-3 py-2.5 bg-white text-indigo-brand rounded-xl font-medium text-sm transition-all border border-gray-100 shadow-sm shadow-[0_2px_8px_rgba(90,85,249,0.06)]">
                                <div class="w-6 h-6 rounded-md bg-indigo-brand text-white flex items-center justify-center text-[10px]">
                                    <i class="fa-solid fa-comment-dots"></i>
                                </div>
                                Security
                            </a>
                        @else
                            <a href="{{ route('profile.edit', ['tab' => 'security']) }}" class="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl font-medium text-sm transition-all border border-transparent">
                                <i class="fa-regular fa-comment-dots w-6 text-center text-[15px]"></i>
                                Security
                            </a>
                        @endif
                    </nav>
                </div>

                <!-- Others -->
                <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose mb-3 px-3">Others</p>
                    <nav class="space-y-1.5">
                        <!-- Accounts Link -->
                        @if($tab === 'accounts')
                            <a href="{{ route('profile.edit', ['tab' => 'accounts']) }}" class="flex items-center gap-3 px-3 py-2.5 bg-white text-indigo-brand rounded-xl font-medium text-sm transition-all border border-gray-100 shadow-sm shadow-[0_2px_8px_rgba(90,85,249,0.06)]">
                                <div class="w-6 h-6 rounded-md bg-indigo-brand text-white flex items-center justify-center text-[10px]">
                                    <i class="fa-solid fa-user"></i>
                                </div>
                                Accounts
                            </a>
                        @else
                            <a href="{{ route('profile.edit', ['tab' => 'accounts']) }}" class="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl font-medium text-sm transition-all border border-transparent">
                                <i class="fa-solid fa-user w-6 text-center text-[15px]"></i>
                                Accounts
                            </a>
                        @endif

                        <!-- Help Link -->
                        @if($tab === 'help')
                            <a href="{{ route('profile.edit', ['tab' => 'help']) }}" class="flex items-center gap-3 px-3 py-2.5 bg-white text-indigo-brand rounded-xl font-medium text-sm transition-all border border-gray-100 shadow-sm shadow-[0_2px_8px_rgba(90,85,249,0.06)]">
                                <div class="w-6 h-6 rounded-md bg-indigo-brand text-white flex items-center justify-center text-[10px]">
                                    <i class="fa-solid fa-circle-info"></i>
                                </div>
                                Help
                            </a>
                        @else
                            <a href="{{ route('profile.edit', ['tab' => 'help']) }}" class="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl font-medium text-sm transition-all border border-transparent">
                                <i class="fa-solid fa-circle-info w-6 text-center text-[15px]"></i>
                                Help
                            </a>
                        @endif
                    </nav>
                </div>
            </div>
        </aside>

        <!-- Main Content Area -->
        <main class="flex-1">
            <div class="mt-20 lg:mt-[98px]"></div>
            
            <div class="bg-[#fafafa] rounded-[24px] w-full min-h-[500px] md:h-[calc(100vh-320px)] shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] relative overflow-y-auto p-12">
                <div class="max-w-xl space-y-6">
                    @if($tab === 'data')
                        @include('profile.partials.update-profile-information-form')
                    @elseif($tab === 'security')
                        @include('profile.partials.update-password-form')
                        @include('profile.partials.delete-user-form')
                    @elseif($tab === 'accounts')
                        <section class="space-y-6 pt-2">
                            <header>
                                <h2 class="text-[22px] font-semibold text-gray-900 tracking-tight">Connected Accounts</h2>
                                <p class="mt-1.5 text-[11px] text-[#888888] font-medium max-w-sm leading-relaxed">
                                    Manage your connected social accounts and team members. (This section is currently under construction.)
                                </p>
                            </header>
                            <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center">
                                <i class="fa-solid fa-users text-4xl text-indigo-300 mb-3"></i>
                                <h3 class="text-sm font-bold text-indigo-900">Team Feature Coming Soon!</h3>
                                <p class="text-xs text-indigo-600 mt-1">Soon you will be able to add collaborators to your websites.</p>
                            </div>
                        </section>
                    @elseif($tab === 'help')
                        <section class="space-y-6 pt-2">
                            <header>
                                <h2 class="text-[22px] font-semibold text-gray-900 tracking-tight">Help & Support</h2>
                                <p class="mt-1.5 text-[11px] text-[#888888] font-medium max-w-sm leading-relaxed">
                                    Need assistance? Review our FAQs or contact our technical support.
                                </p>
                            </header>
                            <div class="space-y-3">
                                <div class="bg-white border text-sm border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <h4 class="font-bold text-gray-800">How do I publish my website?</h4>
                                    <p class="text-xs text-gray-500 mt-1 leading-relaxed">Click the "Preview" button from your websites dashboard, and your live URL will be ready to share.</p>
                                </div>
                                <div class="bg-white border text-sm border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <h4 class="font-bold text-gray-800">Can I reset my password?</h4>
                                    <p class="text-xs text-gray-500 mt-1 leading-relaxed">Yes, head over to the Security tab to change your password securely.</p>
                                </div>
                            </div>
                            <div class="pt-4">
                                <a href="mailto:support@example.com" class="inline-flex px-6 py-2.5 bg-gray-800 hover:bg-black text-white text-sm font-medium rounded-full gap-2 transition-colors shadow-sm">
                                    <i class="fa-solid fa-envelope mt-0.5"></i> Email Support
                                </a>
                            </div>
                        </section>
                    @endif
                </div>
            </div>
        </main>
    </div>

</body>
</html>
