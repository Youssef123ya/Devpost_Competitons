<x-guest-layout>
    <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
        <p class="text-slate-600 text-sm">Join us and start building your website</p>
    </div>

    <form method="POST" action="{{ route('register') }}" class="space-y-5">
        @csrf

        <!-- First Name -->
        <div>
            <label for="first_name" class="block text-sm font-medium text-slate-700 mb-2">{{ __('First Name') }}</label>
            <input id="first_name" type="text" name="first_name" value="{{ old('first_name') }}" required autofocus
                autocomplete="given-name" placeholder="John"
                class="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition" />
            @error('first_name')
                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
            @enderror
        </div>

        <!-- Last Name -->
        <div>
            <label for="last_name" class="block text-sm font-medium text-slate-700 mb-2">{{ __('Last Name') }}</label>
            <input id="last_name" type="text" name="last_name" value="{{ old('last_name') }}" required
                autocomplete="family-name" placeholder="Doe"
                class="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition" />
            @error('last_name')
                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
            @enderror
        </div>

        <!-- Email Address -->
        <div>
            <label for="email" class="block text-sm font-medium text-slate-700 mb-2">{{ __('Email Address') }}</label>
            <input id="email" type="email" name="email" value="{{ old('email') }}" required autocomplete="username"
                placeholder="your@email.com"
                class="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition" />
            @error('email')
                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
            @enderror
        </div>

        <!-- Password -->
        <div>
            <label for="password" class="block text-sm font-medium text-slate-700 mb-2">{{ __('Password') }}</label>
            <input id="password" type="password" name="password" required autocomplete="new-password"
                placeholder="••••••••"
                class="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition" />
            @error('password')
                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
            @enderror
            <p class="mt-2 text-xs text-slate-500">At least 8 characters recommended</p>
        </div>

        <!-- Confirm Password -->
        <div>
            <label for="password_confirmation"
                class="block text-sm font-medium text-slate-700 mb-2">{{ __('Confirm Password') }}</label>
            <input id="password_confirmation" type="password" name="password_confirmation" required
                autocomplete="new-password" placeholder="••••••••"
                class="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition" />
            @error('password_confirmation')
                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
            @enderror
        </div>

        <!-- Submit & Links -->
        <div class="flex flex-col gap-4 pt-4">
            <button type="submit"
                class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                    stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                {{ __('Create Account') }}
            </button>

            <p class="text-center text-sm text-slate-600">
                {{ __('Already have an account?') }}
                <a class="text-indigo-600 hover:text-indigo-500 font-medium transition" href="{{ route('login') }}">
                    {{ __('Sign in') }}
                </a>
            </p>
        </div>
    </form>
</x-guest-layout>