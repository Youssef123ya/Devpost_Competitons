<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Dashboard - {{ config('app.name', 'Laravel') }}</title>
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
    <div class="w-full px-6 md:px-12 mt-32 flex flex-col md:flex-row gap-8 pb-20">
        
        <!-- Sidebar -->
        <aside class="w-full md:w-64 lg:w-72 shrink-0">
            <h1 class="text-[40px] font-bold indigo-brand tracking-tight mb-12">Dashboard</h1>
            
            <div class="bg-[#fcfcfd] rounded-2xl p-6 h-auto md:h-[calc(100vh-280px)] flex flex-col">
                
                <!-- Plan & Credits Widget -->
                <div class="mb-8 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 rounded-xl relative overflow-hidden shadow-sm">
                    <div class="absolute -right-6 -top-6 text-indigo-100 opacity-50 transform rotate-12">
                        <i class="fa-solid fa-gem text-6xl"></i>
                    </div>
                    <div class="relative z-10">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Current Plan</span>
                            <span class="px-2.5 py-1 text-[10px] bg-indigo-600 text-white font-bold rounded-md shadow-sm">{{ auth()->user()->is_admin ? 'Admin' : 'Premium' }}</span>
                        </div>
                        <div class="flex items-end gap-2 mb-4">
                            <span class="text-4xl font-black text-slate-800 leading-none">{{ auth()->user()->is_admin ? 'Unlimited' : auth()->user()->credits }}</span>
                            @if(!auth()->user()->is_admin)
                                <span class="text-xs font-medium text-slate-500 mb-1">credits left</span>
                            @endif
                        </div>
                        <a href="{{ route('plans.index') }}" class="block w-full py-2.5 text-center text-xs font-bold bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 rounded-lg transition-all shadow-sm">
                            Upgrade Plan
                        </a>
                    </div>
                </div>

                <!-- Menu -->
                <div class="mb-8">
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose mb-3 px-3">Menu</p>
                    <nav class="space-y-1.5">
                        <a href="{{ route('dashboard') }}" class="flex items-center gap-3 px-3 py-2.5 bg-white text-indigo-brand rounded-xl font-medium text-sm border border-gray-100 shadow-sm transition-all">
                            <div class="w-6 h-6 rounded-md bg-indigo-brand text-white flex items-center justify-center text-[10px]">
                                <i class="fa-solid fa-chart-simple"></i>
                            </div>
                            Your Websites
                        </a>
                        <a href="{{ route('profile.edit', ['tab' => 'data']) }}" class="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl font-medium text-sm transition-all border border-transparent">
                            <i class="fa-regular fa-file-lines w-6 text-center text-[15px]"></i>
                            Edit Your data
                        </a>
                        <a href="{{ route('profile.edit', ['tab' => 'security']) }}" class="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl font-medium text-sm transition-all border border-transparent">
                            <i class="fa-regular fa-comment-dots w-6 text-center text-[15px]"></i>
                            Security
                        </a>
                    </nav>
                </div>

                <!-- Others -->
                <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose mb-3 px-3">Others</p>
                    <nav class="space-y-1.5">
                        <a href="{{ route('profile.edit', ['tab' => 'accounts']) }}" class="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl font-medium text-sm transition-all border border-transparent">
                            <i class="fa-solid fa-user w-6 text-center text-[15px]"></i>
                            Accounts
                        </a>
                        <a href="{{ route('profile.edit', ['tab' => 'help']) }}" class="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl font-medium text-sm transition-all border border-transparent">
                            <i class="fa-solid fa-circle-info w-6 text-center text-[15px]"></i>
                            Help
                        </a>
                    </nav>
                </div>
            </div>
        </aside>

        <!-- Main Content Area -->
        <main class="flex-1">
            <div class="mt-20 lg:mt-[98px]"></div>
            
            <div class="bg-[#fafafa] rounded-[24px] w-full min-h-[500px] md:h-[calc(100vh-320px)] flex flex-col justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden">
                
                @if($heroes->isEmpty())
                    <!-- Empty State -->
                    <div class="w-full h-full flex flex-col items-center justify-center text-center p-8">
                        <div class="max-w-lg mx-auto z-10 relative space-y-2">
                            <h2 class="text-[20px] font-semibold text-gray-500">Don't have a website yet?</h2>
                            <p class="text-[#888888] font-medium text-[16px] mb-8 leading-snug max-w-sm mx-auto p-1">
                                Start building your online presence today with a simple and professional website.
                            </p>
                            <div class="pt-6">
                                <a href="{{ route('website.type') }}" class="inline-block px-8 py-3 bg-indigo-brand hover-bg-indigo-brand text-white font-medium text-sm rounded-full transition-all tracking-wide">
                                    Create your first website now
                                </a>
                            </div>
                        </div>
                    </div>
                @else
                    <!-- Exiting Websites State -->
                    <div class="w-full absolute inset-0 overflow-y-auto p-10">
                        <div class="flex justify-between items-center mb-8">
                            <h2 class="text-xl font-semibold text-gray-800">Your Websites</h2>
                            <div class="flex gap-3">
                                <form action="{{ route('hero.destroyAll') }}" method="POST" onsubmit="return confirm('Are you sure you want to delete ALL your websites? This action cannot be undone.');">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm rounded-full transition-all shadow-sm border border-red-200">
                                        <i class="fa-solid fa-trash-can mr-1"></i> Delete All
                                    </button>
                                </form>
                                <a href="{{ route('website.type') }}" class="px-6 py-2.5 bg-indigo-brand hover-bg-indigo-brand text-white font-medium text-sm rounded-full transition-all shadow-sm">
                                    + Create New
                                </a>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                            @foreach($heroes as $hero)
                                <div class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col">
                                    <!-- Header / Preview Placeholder -->
                                    <div class="h-28 bg-gradient-to-br from-indigo-500 to-purple-600 relative p-6 flex flex-col justify-between">
                                        <div class="flex justify-between items-start">
                                            <span class="px-2 py-1 text-[10px] font-medium bg-white/20 backdrop-blur-sm text-white rounded-lg border border-white/10">
                                                {{ ucfirst($hero->layout_style) }} Layout
                                            </span>
                                            <div class="flex gap-2">
                                                <a href="{{ route('website.preview', $hero->id) }}" target="_blank" class="p-1.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg transition-colors" title="View Full Website">
                                                    <i class="fa-solid fa-eye text-xs"></i>
                                                </a>
                                            </div>
                                        </div>
                                        <h3 class="text-lg font-bold text-white truncate">{{ $hero->title }}</h3>
                                    </div>

                                    <!-- Content -->
                                    <div class="p-5 flex-1 flex flex-col gap-4">
                                        <div class="space-y-3">
                                            <h4 class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sections</h4>
                                            
                                            <!-- Navbar Section -->
                                            <div class="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-6 h-6 rounded bg-teal-100 flex items-center justify-center text-teal-600">
                                                        <i class="fa-solid fa-bars text-[10px]"></i>
                                                    </div>
                                                    <span class="text-xs font-medium text-gray-700">Navbar</span>
                                                </div>
                                                @if($hero->navbar)
                                                    <a href="{{ route('navbar.generate', $hero->navbar->id) }}" class="text-[10px] font-medium text-indigo-600 hover:text-indigo-500">Edit</a>
                                                @else
                                                    <a href="{{ route('navbar.create', $hero->id) }}" class="text-[10px] font-medium text-emerald-600">Add</a>
                                                @endif
                                            </div>

                                            <div class="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-6 h-6 rounded bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                        <i class="fa-solid fa-house text-[10px]"></i>
                                                    </div>
                                                    <span class="text-xs font-medium text-gray-700">Hero</span>
                                                </div>
                                                <a href="{{ route('hero.generate', $hero->id) }}" class="text-[10px] font-medium text-indigo-600 hover:text-indigo-500">Edit</a>
                                            </div>

                                            <div class="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-6 h-6 rounded bg-rose-100 flex items-center justify-center text-rose-600">
                                                        <i class="fa-solid fa-user text-[10px]"></i>
                                                    </div>
                                                    <span class="text-xs font-medium text-gray-700">About Me</span>
                                                </div>
                                                @if($hero->aboutSection)
                                                    <a href="{{ route('about.generate', $hero->aboutSection->id) }}" class="text-[10px] font-medium text-indigo-600 hover:text-indigo-500">Edit</a>
                                                @else
                                                    <a href="{{ route('about.create', $hero->id) }}" class="text-[10px] font-medium text-emerald-600">Add</a>
                                                @endif
                                            </div>

                                            <div class="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-6 h-6 rounded bg-orange-100 flex items-center justify-center text-orange-600">
                                                        <i class="fa-solid fa-bolt text-[10px]"></i>
                                                    </div>
                                                    <span class="text-xs font-medium text-gray-700">Skills</span>
                                                </div>
                                                @if($hero->skillSection)
                                                    <a href="{{ route('skills.generate', $hero->skillSection->id) }}" class="text-[10px] font-medium text-indigo-600 hover:text-indigo-500">Edit</a>
                                                @else
                                                    <a href="{{ route('skills.create', $hero->id) }}" class="text-[10px] font-medium text-emerald-600">Add</a>
                                                @endif
                                            </div>

                                            <div class="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-6 h-6 rounded bg-purple-100 flex items-center justify-center text-purple-600">
                                                        <i class="fa-solid fa-layer-group text-[10px]"></i>
                                                    </div>
                                                    <span class="text-xs font-medium text-gray-700">Services</span>
                                                </div>
                                                @if($hero->serviceSection)
                                                    <a href="{{ route('services.generate', $hero->serviceSection->id) }}" class="text-[10px] font-medium text-indigo-600 hover:text-indigo-500">Edit</a>
                                                @else
                                                    <a href="{{ route('services.create', $hero->id) }}" class="text-[10px] font-medium text-emerald-600">Add</a>
                                                @endif
                                            </div>
                                            
                                            <!-- Why Choose Us -->
                                            <div class="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                                                        <i class="fa-solid fa-shield-halved text-[10px]"></i>
                                                    </div>
                                                    <span class="text-xs font-medium text-gray-700">Why Choose</span>
                                                </div>
                                                @if($hero->whyChooseUs)
                                                    <a href="{{ route('why-choose-us.generate', $hero->whyChooseUs->id) }}" class="text-[10px] font-medium text-indigo-600 hover:text-indigo-500">Edit</a>
                                                @else
                                                    <a href="{{ route('why-choose-us.create', $hero->id) }}" class="text-[10px] font-medium text-emerald-600">Add</a>
                                                @endif
                                            </div>
                                            
                                            <!-- Our Work Section -->
                                            <div class="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                        <i class="fa-solid fa-folder-open text-[10px]"></i>
                                                    </div>
                                                    <span class="text-xs font-medium text-gray-700">Our Work</span>
                                                </div>
                                                @if($hero->work)
                                                    <a href="{{ route('work.generate', $hero->work->id) }}" class="text-[10px] font-medium text-indigo-600 hover:text-indigo-500">Edit</a>
                                                @else
                                                    <a href="{{ route('work.create', $hero->id) }}" class="text-[10px] font-medium text-emerald-600">Add</a>
                                                @endif
                                            </div>
                                            
                                            <!-- Footer Section -->
                                            <div class="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-slate-700">
                                                        <i class="fa-solid fa-shoe-prints text-[10px]"></i>
                                                    </div>
                                                    <span class="text-xs font-medium text-gray-700">Footer</span>
                                                </div>
                                                @if($hero->footerSection)
                                                    <a href="{{ route('footer.generate', $hero->footerSection->id) }}" class="text-[10px] font-medium text-indigo-600 hover:text-indigo-500">Edit</a>
                                                @else
                                                    <a href="{{ route('footer.create', $hero->id) }}" class="text-[10px] font-medium text-emerald-600">Add</a>
                                                @endif
                                            </div>
                                            
                                            <!-- Contact Section -->
                                            <div class="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-6 h-6 rounded bg-sky-100 flex items-center justify-center text-sky-600">
                                                        <i class="fa-solid fa-envelope text-[10px]"></i>
                                                    </div>
                                                    <span class="text-xs font-medium text-gray-700">Contact</span>
                                                </div>
                                                @if($hero->contactSection)
                                                    <a href="{{ route('contact.generate', $hero->contactSection->id) }}" class="text-[10px] font-medium text-indigo-600 hover:text-indigo-500">Edit</a>
                                                @else
                                                    <a href="{{ route('contact.create', $hero->id) }}" class="text-[10px] font-medium text-emerald-600">Add</a>
                                                @endif
                                            </div>
                                        </div>

                                        <div class="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-[10px]">
                                            <span class="text-gray-400">Created {{ $hero->created_at->diffForHumans() }}</span>
                                            <form action="{{ route('hero.destroy', $hero->id) }}" method="POST" onsubmit="return confirm('Are you sure you want to delete this website? this action cannot be undone.');">
                                                @csrf
                                                @method('DELETE')
                                                <button type="submit" class="text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors">
                                                    <i class="fa-solid fa-trash text-[10px]"></i> Delete
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </div>
                @endif
                
            </div>
        </main>
    </div>

</body>
</html>
