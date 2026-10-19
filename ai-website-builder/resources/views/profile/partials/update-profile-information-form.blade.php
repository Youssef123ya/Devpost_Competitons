<section>
    <form id="send-verification" method="post" action="{{ route('verification.send') }}">
        @csrf
    </form>

    <form method="post" action="{{ route('profile.update') }}" class="space-y-6">
        @csrf
        @method('patch')

        <div class="space-y-2">
            <label for="first_name" class="block text-[11px] font-bold text-gray-400">Your Name</label>
            <input id="first_name" name="first_name" type="text" class="block w-full bg-[#f4f4f4] border-0 rounded-xl px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-[#5a55f9]" value="{{ old('first_name', $user->first_name ?? $user->name ?? '') }}" required autofocus autocomplete="name" />
            <x-input-error class="mt-2" :messages="$errors->get('first_name')" />
        </div>

        <div class="space-y-2">
            <label for="email" class="block text-[11px] font-bold text-gray-400">Email</label>
            <input id="email" name="email" type="email" class="block w-full bg-[#f4f4f4] border-0 rounded-xl px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-[#5a55f9]" value="{{ old('email', $user->email) }}" required autocomplete="username" />
            <x-input-error class="mt-2" :messages="$errors->get('email')" />

            @if ($user instanceof \Illuminate\Contracts\Auth\MustVerifyEmail && ! $user->hasVerifiedEmail())
                <div>
                    <p class="text-sm mt-2 text-gray-800">
                        {{ __('Your email address is unverified.') }}

                        <button form="send-verification" class="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            {{ __('Click here to re-send the verification email.') }}
                        </button>
                    </p>

                    @if (session('status') === 'verification-link-sent')
                        <p class="mt-2 font-medium text-sm text-green-600">
                            {{ __('A new verification link has been sent to your email address.') }}
                        </p>
                    @endif
                </div>
            @endif
        </div>
        
        <div class="space-y-2">
            <label for="phone" class="block text-[11px] font-bold text-gray-400">Phone Number</label>
            <input id="phone" name="phone" type="text" class="block w-full bg-[#f4f4f4] border-0 rounded-xl px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-[#5a55f9]" value="{{ old('phone', $user->phone ?? '') }}" />
        </div>

        <div class="space-y-2">
            <label for="about" class="block text-[11px] font-bold text-gray-400">About your self</label>
            <textarea id="about" name="about" rows="4" class="block w-full bg-[#f4f4f4] border-0 rounded-xl px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-[#5a55f9] resize-none">{{ old('about', $user->about ?? '') }}</textarea>
        </div>

        <div class="flex items-center gap-4 pt-4">
            <button type="submit" class="px-6 py-2.5 bg-[#5a55f9] text-white rounded-full font-medium text-sm hover:bg-[#4a45e9] transition-colors shadow-[0_4px_12px_rgba(90,85,249,0.2)]">
                {{ __('Save Changes') }}
            </button>

            @if (session('status') === 'profile-updated')
                <p
                    x-data="{ show: true }"
                    x-show="show"
                    x-transition
                    x-init="setTimeout(() => show = false, 2000)"
                    class="text-sm text-green-600 font-medium"
                >{{ __('Saved.') }}</p>
            @endif
        </div>
    </form>
</section>
