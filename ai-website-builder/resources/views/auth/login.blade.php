<x-guest-layout>
    <!-- Session Status -->
    <x-auth-session-status class="mb-6" :status="session('status')" />

    <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
        <p class="text-slate-600 text-sm">Sign in to your account to continue</p>
    </div>

    <form method="POST" action="{{ route('login') }}" class="space-y-5">
        @csrf

        <!-- Email Address -->
        <div>
            <label for="email" class="block text-sm font-medium text-slate-700 mb-2">{{ __('Email Address') }}</label>
            <input id="email" type="email" name="email" value="{{ old('email') }}" required autofocus
                autocomplete="username" placeholder="your@email.com"
                class="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition" />
            @error('email')
                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
            @enderror
        </div>

        <!-- Password -->
        <div>
            <label for="password" class="block text-sm font-medium text-slate-700 mb-2">{{ __('Password') }}</label>
            <input id="password" type="password" name="password" required autocomplete="current-password"
                placeholder="••••••••"
                class="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition" />
            @error('password')
                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
            @enderror
        </div>

        <!-- Remember Me -->
        <div class="flex items-center">
            <input id="remember_me" type="checkbox" name="remember"
                class="rounded border-slate-300 text-indigo-600 shadow-sm focus:ring-2 focus:ring-indigo-500" />
            <label for="remember_me" class="ms-3 text-sm text-slate-600">
                {{ __('Remember me') }}
            </label>
        </div>

        <!-- Submit & Links -->
        <div class="flex flex-col gap-4 pt-4">
            <button type="submit"
                class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                    stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0a3.75 3.75 0 0 1 7.5 0zM4.5 20.25v-1.5A2.25 2.25 0 0 1 6.75 16.5h10.5a2.25 2.25 0 0 1 2.25 2.25v1.5" />
                </svg>
                {{ __('Sign In') }}
            </button>

            <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                @if (Route::has('password.request'))
                    <a class="text-indigo-600 hover:text-indigo-500 font-medium transition"
                        href="{{ route('password.request') }}">
                        {{ __('Forgot your password?') }}
                    </a>
                @endif

                @if (Route::has('register'))
                    <a class="text-slate-600 hover:text-slate-900 font-medium transition" href="{{ route('register') }}">
                        {{ __('Create an account') }}
                    </a>
                @endif
            </div>
        </div>
    </form>
</x-guest-layout>