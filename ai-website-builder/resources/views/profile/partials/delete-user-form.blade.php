<section class="space-y-6 pt-2">
    <header>
        <h2 class="text-[22px] font-semibold text-gray-900 tracking-tight">
            {{ __('Deleating your account') }}
        </h2>

        <p class="mt-1.5 text-[11px] text-[#888888] font-medium max-w-sm leading-relaxed">
            {{ __('Deleting your account will permanently erase all your data. Please download any important information before proceeding.') }}
        </p>
    </header>

    <button
        x-data=""
        x-on:click.prevent="$dispatch('open-modal', 'confirm-user-deletion')"
        class="px-6 py-2.5 bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium rounded-full flex items-center gap-2 transition-colors shadow-sm w-max"
    >
        <i class="fa-solid fa-trash-can"></i> {{ __('Delete your account') }}
    </button>

    <x-modal name="confirm-user-deletion" :show="$errors->userDeletion->isNotEmpty()" focusable>
        <form method="post" action="{{ route('profile.destroy') }}" class="p-6 bg-white rounded-2xl">
            @csrf
            @method('delete')

            <h2 class="text-lg font-semibold text-gray-900 tracking-tight">
                {{ __('Are you sure you want to delete your account?') }}
            </h2>

            <p class="mt-2 text-[11px] text-[#888888] font-medium leading-relaxed">
                {{ __('Once your account is deleted, all of its resources and data will be permanently deleted. Please enter your password to confirm you would like to permanently delete your account.') }}
            </p>

            <div class="mt-6 flex flex-col gap-1.5">
                <label for="password" class="block text-[10px] font-bold text-gray-500">{{ __('Password') }}</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    class="block w-full bg-[#f4f4f4] border-0 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-[#5a55f9]"
                    placeholder="{{ __('Password') }}"
                />
                <x-input-error :messages="$errors->userDeletion->get('password')" class="mt-2 text-xs" />
            </div>

            <div class="mt-6 flex justify-end gap-3">
                <button type="button" x-on:click="$dispatch('close')" class="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-full transition-colors">
                    {{ __('Cancel') }}
                </button>

                <button type="submit" class="px-6 py-2.5 bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium rounded-full transition-colors shadow-sm">
                    {{ __('Delete Account') }}
                </button>
            </div>
        </form>
    </x-modal>
</section>
