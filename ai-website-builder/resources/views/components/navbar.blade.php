<!-- Custom Navbar -->
<div id="navbar-container" class="fixed top-0 left-0 w-full flex justify-between items-center px-8 py-6 z-50 transition-all duration-300">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-2 text-indigo-600 font-bold text-xl hover:text-indigo-500 transition">
       
        SEAMLESS
    </a>

    <!-- Centered Menu (FIXED CENTER) -->
    <nav class="absolute left-1/2 -translate-x-1/2 flex gap-2 bg-gray-100 rounded-full px-2 py-1 shadow">
        <a href="/" class="px-4 py-1 rounded-full font-medium text-base transition-all duration-200 {{ request()->is('/') ? 'bg-indigo-500 text-white' : 'text-gray-700 hover:bg-indigo-100' }}">Home</a>
        <a href="/#about" class="px-4 py-1 rounded-full font-medium text-base text-gray-700 hover:bg-indigo-100">About</a>
        <a href="/#showcases" class="px-4 py-1 rounded-full font-medium text-base text-gray-700 hover:bg-indigo-100">Showcases</a>
        <a href="/#guides" class="px-4 py-1 rounded-full font-medium text-base text-gray-700 hover:bg-indigo-100">Guides</a>
    </nav>

    <!-- Login/User -->
    @if (Route::has('login'))
        <div>
        @auth
            <div class="flex items-center gap-3">
                <a href="{{ route('plans.index') }}" class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold border border-indigo-100 hover:bg-indigo-100 transition shadow-sm" title="Your Credits">
                    <i class="fa-solid fa-coins text-amber-500"></i>
                    <span id="nav-credits-display">{{ Auth::user()->is_admin ? 'Unlimited' : Auth::user()->credits }}</span>
                </a>
                <div class="relative" id="user-dropdown">
                    <button onclick="toggleUserDropdown(event)" class="flex items-center gap-2 px-6 py-2 rounded-full bg-indigo-500 text-white font-medium shadow hover:bg-indigo-600 transition focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0a3.75 3.75 0 0 1 7.5 0zM4.5 20.25v-1.5A2.25 2.25 0 0 1 6.75 16.5h10.5a2.25 2.25 0 0 1 2.25 2.25v1.5" />
                        </svg>
                        {{ Auth::user()->full_name }}
                        <svg id="user-dropdown-icon" class="w-4 h-4 ml-1 transition-transform" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                    </button>
                    <div id="user-dropdown-menu" class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 hidden transition ease-out duration-200 opacity-0 scale-95">
                        <a href="{{ url('/dashboard') }}" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">Dashboard</a>
                        @if(Auth::user()->is_admin)
                            <a href="{{ route('admin.orders.index') }}" class="block px-4 py-2 text-indigo-600 font-bold hover:bg-indigo-50">Review Payments</a>
                        @endif
                        <div class="border-t border-gray-100 my-1"></div>
                        <form method="POST" action="{{ route('logout') }}" class="m-0">
                            @csrf
                            <button type="submit" class="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">Logout</button>
                        </form>
                    </div>
                </div>
            </div>
        @else
            <div class="flex items-center gap-4">
                <a href="{{ route('login') }}" class="px-6 py-2 rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-sm font-bold shadow-sm transition">Log in</a>
                @if (Route::has('register'))
                    <a href="{{ route('register') }}" class="px-6 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow transition">Register</a>
                @endif
            </div>
        @endauth
        </div>
    @endif
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const dropdown = document.getElementById('user-dropdown');
    const menu = document.getElementById('user-dropdown-menu');
    const icon = document.getElementById('user-dropdown-icon');
    
    if (dropdown && menu) {
        window.toggleUserDropdown = function(e) {
            e.stopPropagation();
            const isOpen = !menu.classList.contains('hidden');
            if (isOpen) {
                menu.classList.add('hidden');
                menu.classList.remove('opacity-100', 'scale-100');
                icon.classList.remove('rotate-180');
            } else {
                menu.classList.remove('hidden');
                setTimeout(() => {
                    menu.classList.add('opacity-100', 'scale-100');
                    menu.classList.remove('opacity-0', 'scale-95');
                }, 10);
                icon.classList.add('rotate-180');
            }
        };
        
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target)) {
                menu.classList.add('hidden');
                menu.classList.remove('opacity-100', 'scale-100');
                icon.classList.remove('rotate-180');
            }
        });
    }

    const navbar = document.getElementById('navbar-container');
    if (navbar) {
        const handleScroll = function() {
            if (window.scrollY > 10) {
                navbar.classList.add('bg-white/80', 'backdrop-blur-xl', 'py-4', 'border-b', 'border-slate-200/50', 'shadow-md');
                navbar.classList.remove('py-6');
            } else {
                navbar.classList.remove('bg-white/80', 'backdrop-blur-xl', 'py-4', 'border-b', 'border-slate-200/50', 'shadow-md');
                navbar.classList.add('py-6');
            }
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
    }
});
</script>
