<x-app-layout>
    <div class="bg-slate-50 min-h-screen">
        <div class="container mx-auto px-4 py-12 max-w-6xl">
            <!-- Header Section -->
            <div class="text-center mb-12">
                <div class="flex items-center justify-center gap-4 flex-wrap mb-4">
                    <h1
                        class="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        Create Footer Section
                    </h1>
                </div>
                <p class="text-slate-500 max-w-2xl mx-auto italic">Customize your website's footer with links, brand
                    logo, and social media presence.</p>
            </div>

            <form action="{{ route('footer.store', $hero->id) }}" method="POST" enctype="multipart/form-data"
                id="footerForm" class="space-y-12">
                @csrf

                <!-- Content & Styling Grid -->
                <section class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                    <!-- Left Column: Footer content & Socials -->
                    <div class="space-y-12">

                        <!-- 1. Footer Content -->
                        <div class="space-y-6">
                            <div class="flex items-center justify-between">
                                <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    <span
                                        class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 text-sm font-bold">1</span>
                                    Footer Content
                                </h2>

                                <div class="flex items-center gap-2">
                                    @php $portfolioType = session('portfolio_type', ''); @endphp
                                    <button type="button" id="ai-fill-btn" onclick="fillFooterWithAI()"
                                        class="inline-flex items-center justify-center gap-1 px-3 py-1.5 min-w-[130px] bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700/70 shadow transition-colors">
                                        <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" />
                                        </svg>
                                        AI Fill
                                        <span
                                            class="text-[10px] text-slate-400">({{ ucfirst($portfolioType ?: 'Designer') }})</span>
                                    </button>
                                    <button type="button" id="ai-shuffle-btn" onclick="fillFooterWithAI(true)"
                                        class="hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-colors group">
                                        <svg class="w-3.5 h-3.5 group-hover:-rotate-180 transition-transform duration-500"
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Regenerate
                                    </button>
                                </div>
                            </div>

                            <div class="space-y-4">
                                <!-- Footer Title & Slogan -->
                                <div class="space-y-4 pb-4 border-b border-gray-100 mb-6 font-bold">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div class="space-y-1">
                                            <label class="block text-sm font-medium text-gray-700">Footer Title</label>
                                            <input type="text" name="title" id="footer_title"
                                                placeholder="e.g. Portfolio"
                                                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400 transition-all">
                                        </div>
                                        <div class="space-y-1">
                                            <label class="block text-sm font-medium text-gray-700">Slogan /
                                                Tagline</label>
                                            <input type="text" name="slogan" id="footer_slogan"
                                                placeholder="e.g. Build, Innovate, Transform"
                                                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400 transition-all">
                                        </div>
                                    </div>
                                </div>

                                <!-- Quick Links -->
                                <div class="space-y-4">
                                    <label class="block text-sm font-medium text-gray-700">Quick Links</label>
                                    <div id="links-container" class="space-y-3">
                                        <div class="grid grid-cols-2 gap-3 link-item">
                                            <div class="space-y-1">
                                                <label class="text-xs text-gray-500">Link 1</label>
                                                <input type="text" name="links[0][text]" id="link_text_0"
                                                    placeholder="e.g. Services"
                                                    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400 transition-all">
                                            </div>
                                            <div class="space-y-1">
                                                <label class="text-xs text-gray-500">URL</label>
                                                <div class="flex gap-2">
                                                    <input type="text" name="links[0][url]" id="link_url_0"
                                                        placeholder="e.g. #services"
                                                        class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400 transition-all">
                                                    <button type="button" onclick="addLink()"
                                                        class="text-xs font-semibold text-indigo-500 hover:text-indigo-600 whitespace-nowrap px-2">+
                                                        Add</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        class="mt-4 flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <label class="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" name="external_links" checked
                                                class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all">
                                            <span
                                                class="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Open
                                                Links in New Tab (External)</span>
                                        </label>
                                        <label class="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" name="sync_navbar" checked
                                                class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all">
                                            <span
                                                class="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Sync
                                                Links Automatically with Navbar</span>
                                        </label>
                                    </div>
                                </div>



                            </div>
                        </div>

                        <!-- 2. Social Links -->
                        <div class="space-y-6">
                            <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <span
                                    class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 text-sm font-bold">2</span>
                                Social Media Links
                            </h2>

                            <div id="socials-container" class="space-y-3">
                                <div class="social-item grid grid-cols-2 gap-3">
                                    <div class="space-y-1">
                                        <label class="text-xs text-gray-500">Social icon</label>
                                        <div class="relative">
                                            <select name="social_links[0][icon]"
                                                onchange="const icon = this.parentElement.querySelector('i'); const span = this.parentElement.querySelector('span'); icon.className = (this.value.includes('facebook') ? 'fa-brands fa-facebook-f text-indigo-600' : (this.value.includes('instagram') ? 'fa-brands fa-instagram text-pink-600' : (this.value.includes('linkedin') ? 'fa-brands fa-linkedin-in text-blue-600' : (this.value.includes('github') ? 'fa-brands fa-github text-gray-800' : 'fa-brands fa-twitter text-blue-400')))); span.textContent = this.options[this.selectedIndex].text;"
                                                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                                                <option value="fa-brands fa-facebook-f">Facebook Icon</option>
                                                <option value="fa-brands fa-instagram">Instagram Icon</option>
                                                <option value="fa-brands fa-twitter">Twitter Icon</option>
                                                <option value="fa-brands fa-linkedin-in">LinkedIn Icon</option>
                                                <option value="fa-brands fa-github">GitHub Icon</option>
                                            </select>
                                            <div
                                                class="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 gap-2 h-[46px]">
                                                <i class="fa-brands fa-facebook-f text-indigo-600"></i>
                                                <span class="text-xs font-semibold text-gray-600">Facebook Icon</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="space-y-1">
                                        <label class="text-xs text-gray-500">URL</label>
                                        <div class="flex gap-2">
                                            <input type="text" name="social_links[0][url]" id="social_url_0"
                                                placeholder="Profile Link"
                                                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400 transition-all">
                                            <button type="button" onclick="addSocial()"
                                                class="text-xs font-semibold text-indigo-500 hover:text-indigo-600 whitespace-nowrap px-2">+
                                                Add</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Styling Options -->
                    <div class="space-y-6">
                        <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <span
                                class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 text-sm font-bold">3</span>
                            Styling Options
                        </h2>

                        <div class="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-6">
                            <!-- Background Color -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Section Background</label>
                                <div class="flex items-center gap-3">
                                    <input type="color" name="styles[bg_color]" value="#ffffff"
                                        onchange="this.nextElementSibling.textContent = this.value.toUpperCase()"
                                        class="h-10 w-16 bg-transparent border-0 rounded cursor-pointer p-0">
                                    <span class="text-xs text-gray-500 font-mono">#FFFFFF</span>
                                </div>
                            </div>

                            <div class="border-t border-gray-200 my-4"></div>

                            <!-- Text & Links Colors -->
                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Footer BG</label>
                                    <input type="color" name="styles[nav_bg_color]" value="#f9fafb"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Link Color</label>
                                    <input type="color" name="styles[link_color]" value="#1f2937"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-medium text-gray-700">Link Hover BG</label>
                                    <input type="color" name="styles[link_hover_bg]" value="#6366f1"
                                        class="h-8 w-12 bg-transparent border-0 rounded cursor-pointer p-0">
                                </div>
                            </div>


                        </div>
                    </div>
                </section>

                <!-- Submit Action -->
                <div class="flex justify-end pt-6 border-t border-gray-200">
                    <button type="submit" style="background-color: #5c67f2;"
                        class="group relative inline-flex items-center gap-2 px-8 py-4 text-white rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(92,103,242,0.5)]">
                        <span>Create Section</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                            stroke="currentColor" class="w-5 h-5 transition-transform group-hover:translate-x-1">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Scripting for dynamic behavior & AI -->
    <script>
        const navbarLinks = @json($navbarLinks ?? []);
        let linkCount = 1;
        let socialCount = 1;

        function addLink() {
            const container = document.getElementById('links-container');
            const div = document.createElement('div');
            div.className = 'grid grid-cols-2 gap-3 link-item animate-fade-in-up mt-3';
            div.innerHTML = `
                <div class="space-y-1">
                    <label class="text-xs text-gray-500">Label</label>
                    <input type="text" name="links[${linkCount}][text]" placeholder="e.g Services" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400 transition-all">
                </div>
                <div class="space-y-1">
                    <label class="text-xs text-gray-500">URL</label>
                    <div class="flex gap-2">
                        <input type="text" name="links[${linkCount}][url]" placeholder="#services" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400 transition-all">
                        <button type="button" onclick="this.closest('.link-item').remove()" class="text-red-500 font-bold text-lg px-2 hover:text-red-700 transition-colors">×</button>
                    </div>
                </div>
            `;
            container.appendChild(div);
            linkCount++;
        }

        function addSocial() {
            const container = document.getElementById('socials-container');
            const div = document.createElement('div');
            div.className = 'social-item grid grid-cols-2 gap-3 animate-fade-in-up mt-3';
            div.innerHTML = `
                <div class="space-y-1">
                    <label class="text-xs text-gray-500">Icon</label>
                    <div class="relative">
                        <select name="social_links[${socialCount}][icon]"
                            onchange="const icon = this.parentElement.querySelector('i'); const span = this.parentElement.querySelector('span'); icon.className = (this.value.includes('facebook') ? 'fa-brands fa-facebook-f text-indigo-600' : (this.value.includes('instagram') ? 'fa-brands fa-instagram text-pink-600' : (this.value.includes('linkedin') ? 'fa-brands fa-linkedin-in text-blue-600' : (this.value.includes('github') ? 'fa-brands fa-github text-gray-800' : 'fa-brands fa-twitter text-blue-400')))); span.textContent = this.options[this.selectedIndex].text;"
                            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                            <option value="fa-brands fa-instagram">Instagram Icon</option>
                            <option value="fa-brands fa-facebook-f">Facebook Icon</option>
                            <option value="fa-brands fa-twitter">Twitter Icon</option>
                            <option value="fa-brands fa-linkedin-in">LinkedIn Icon</option>
                            <option value="fa-brands fa-github">GitHub Icon</option>
                        </select>
                        <div class="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 gap-2 h-[46px]">
                            <i class="fa-brands fa-instagram text-pink-600"></i>
                            <span class="text-xs font-semibold text-gray-600">Instagram Icon</span>
                        </div>
                    </div>
                </div>
                <div class="space-y-1">
                    <label class="text-xs text-gray-500">URL</label>
                    <div class="flex gap-2">
                        <input type="text" name="social_links[${socialCount}][url]" placeholder="Profile Link" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400 transition-all">
                        <button type="button" onclick="this.closest('.social-item').remove()" class="text-red-500 font-bold text-lg px-2 hover:text-red-700 transition-colors">×</button>
                    </div>
                </div>
            `;
            container.appendChild(div);
            socialCount++;
        }



        async function fillFooterWithAI() {
            // Open the AI Typing Modal immediately in loading state
            AiTypingModal.show("Generating Footer copy...");

            try {
                const result = await safeAiFetch('{{ route("ai.placeholder") }}', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
                    body: JSON.stringify({ section: 'footer', portfolio_type: '{{ session("portfolio_type", "developer") }}' })
                });
                if (result.success && result.data) {
                    const data = result.data;

                    // Build typewriter items for title + slogan
                    const items = [
                        { label: 'Footer Title', text: data.title || 'Brand Name', targetEl: document.getElementById('footer_title') },
                        { label: 'Slogan / Tagline', text: data.slogan || 'Build, Innovate, Transform', targetEl: document.getElementById('footer_slogan') },
                    ];

                    // Rebuild Quick Links in DOM immediately
                    if (navbarLinks && navbarLinks.length > 0) {
                        const linksContainer = document.getElementById('links-container');
                        linksContainer.innerHTML = '';
                        navbarLinks.forEach((navLink, index) => {
                            const isLast = index === navbarLinks.length - 1;
                            const div = document.createElement('div');
                            div.className = 'grid grid-cols-2 gap-3 link-item animate-fade-in-up mt-3';
                            div.innerHTML = `
                                <div class="space-y-1">
                                    <label class="text-xs text-gray-500">Link ${index + 1}</label>
                                    <input type="text" name="links[${index}][text]" value="${navLink.text || navLink.title || ''}" placeholder="e.g. Services" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs text-gray-500">URL</label>
                                    <div class="flex gap-2">
                                        <input type="text" name="links[${index}][url]" value="${navLink.url || ''}" placeholder="e.g. #services" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all">
                                        ${isLast ? `<button type="button" onclick="addLink()" class="text-xs font-semibold text-indigo-500 hover:text-indigo-600 whitespace-nowrap px-2">+ Add</button>` : `<button type="button" onclick="this.closest('.link-item').remove()" class="text-red-500 font-bold text-lg px-2 hover:text-red-700 transition-colors">×</button>`}
                                    </div>
                                </div>
                            `;
                            linksContainer.appendChild(div);
                        });
                        linkCount = navbarLinks.length;
                    } else {
                        const defaultLinks = [
                            { text: data.links && data.links[0] ? data.links[0] : 'About Us', url: '#about' },
                            { text: data.links && data.links[1] ? data.links[1] : 'Services', url: '#services' },
                            { text: data.links && data.links[2] ? data.links[2] : 'Portfolio', url: '#portfolio' },
                            { text: 'Contact', url: '#contact' }
                        ];
                        const linksContainer = document.getElementById('links-container');
                        linksContainer.innerHTML = '';
                        defaultLinks.forEach((navLink, index) => {
                            const isLast = index === defaultLinks.length - 1;
                            const div = document.createElement('div');
                            div.className = 'grid grid-cols-2 gap-3 link-item animate-fade-in-up mt-3';
                            div.innerHTML = `
                                <div class="space-y-1">
                                    <label class="text-xs text-gray-500">Link ${index + 1}</label>
                                    <input type="text" name="links[${index}][text]" value="${navLink.text || ''}" placeholder="e.g. Services" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs text-gray-500">URL</label>
                                    <div class="flex gap-2">
                                        <input type="text" name="links[${index}][url]" value="${navLink.url || ''}" placeholder="e.g. #services" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 transition-all">
                                        ${isLast ? `<button type="button" onclick="addLink()" class="text-xs font-semibold text-indigo-500 hover:text-indigo-600 whitespace-nowrap px-2">+ Add</button>` : `<button type="button" onclick="this.closest('.link-item').remove()" class="text-red-500 font-bold text-lg px-2 hover:text-red-700 transition-colors">×</button>`}
                                    </div>
                                </div>
                            `;
                            linksContainer.appendChild(div);
                        });
                        linkCount = defaultLinks.length;
                    }

                    // Stagger-animate link inputs
                    setTimeout(() => {
                        const linkItems = document.getElementById('links-container').querySelectorAll('.link-item');
                        linkItems.forEach((item, i) => {
                            item.style.opacity = '0';
                            item.style.transform = 'translateY(10px)';
                            item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                            setTimeout(() => { item.style.opacity = '1'; item.style.transform = 'translateY(0)'; }, i * 80);
                        });
                    }, 50);

                    // Trigger typewriter modal for title + slogan
                    await AiTypingModal.typeItems(items, () => {
                        const shuffleBtn = document.getElementById('ai-shuffle-btn');
                        if (shuffleBtn) shuffleBtn.classList.remove('hidden');
                    });
                } else {
                    throw new Error(result.message || 'Generation failed');
                }
            } catch (e) {
                console.error('Footer AI error:', e);
                AiTypingModal.showError(e.message);
            }
        }
    </script>
</x-app-layout>