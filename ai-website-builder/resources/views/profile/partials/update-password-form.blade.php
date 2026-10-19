<section>
    <header>
        <h2 class="text-[22px] font-semibold text-gray-900 tracking-tight">
            {{ __('Change your password') }}
        </h2>

        <p class="mt-1.5 text-[11px] text-[#888888] font-medium max-w-sm leading-relaxed">
            {{ __('We recommend using a strong and unique password to protect your account.') }}
        </p>
    </header>

    <form method="post" action="{{ route('password.update') }}" class="mt-8 space-y-5">
        @csrf
        @method('put')

        <div class="space-y-1.5">
            <label for="update_password_current_password" class="block text-[10px] font-bold text-gray-500">{{ __('Your Current Password') }}</label>
            <input id="update_password_current_password" name="current_password" type="password" class="block w-full bg-[#f4f4f4] border-0 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-[#5a55f9]" autocomplete="current-password" />
            <x-input-error :messages="$errors->updatePassword->get('current_password')" class="mt-2 text-xs" />
        </div>

        <div class="space-y-1.5">
            <label for="update_password_password" class="block text-[10px] font-bold text-gray-500">{{ __('Your new password') }}</label>
            <input id="update_password_password" name="password" type="password" class="block w-full bg-[#f4f4f4] border-0 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-[#5a55f9]" autocomplete="new-password" />
            <x-input-error :messages="$errors->updatePassword->get('password')" class="mt-2 text-xs" />
        </div>

        <div class="space-y-1.5">
            <label for="update_password_password_confirmation" class="block text-[10px] font-bold text-gray-500">{{ __('Confirm your password') }}</label>
            <input id="update_password_password_confirmation" name="password_confirmation" type="password" class="block w-full bg-[#f4f4f4] border-0 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-[#5a55f9]" autocomplete="new-password" />
            <x-input-error :messages="$errors->updatePassword->get('password_confirmation')" class="mt-2 text-xs" />
        </div>

        <div class="flex items-center gap-4 pt-3">
            <button type="submit" class="px-6 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white text-sm font-medium rounded-full flex items-center gap-2 transition-colors shadow-sm">
                <i class="fa-regular fa-bookmark"></i> {{ __('Save Changes') }}
            </button>

            @if (session('status') === 'password-updated')
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
