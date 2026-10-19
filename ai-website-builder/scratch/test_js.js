
            // ── Portfolio AI Content Data ────────────────────────────────
            let portfolioType = '""';
            if (!portfolioType) {
                portfolioType = 'developer';
            }

            let currentVariantIndexes = {};
            let pastSuggestions = [];

            async function fillWithAI(shuffle = false) {
                const btn = document.getElementById('ai-fill-btn');
                const shuffleBtn = document.getElementById('ai-shuffle-btn');
                const loadingIcon = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = `${loadingIcon} Generating...`;
                }

                try {
                    const response = await fetch('""', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': '""'
                        },
                        body: JSON.stringify({
                            section: 'hero',
                            portfolio_type: portfolioType,
                            past_suggestions: pastSuggestions
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Server error');
                    }

                    const result = await response.json();

                    if (result.success) {
                        const data = result.data;

                        if (data.title && !pastSuggestions.includes(data.title)) {
                            pastSuggestions.push(data.title);
                        }

                        // Fill text fields
                        const titleEl = document.getElementById('title');
                        const subtitleEl = document.getElementById('subtitle');
                        const descEl = document.getElementById('description');
                        const ctaTextEl = document.getElementById('cta_text');

                        const fields = [
                            [titleEl, data.title],
                            [subtitleEl, data.subtitle],
                            [descEl, data.description],
                            [ctaTextEl, data.cta_text],
                        ];

                        // Animate each field fill
                        fields.forEach(([el, val], i) => {
                            if (!el || !val) return;
                            setTimeout(() => {
                                el.style.transition = 'background 0.3s, border-color 0.3s';
                                el.style.background = '#f0fdf4';
                                el.style.borderColor = '#86efac';
                                el.value = val;
                                setTimeout(() => {
                                    el.style.background = '';
                                    el.style.borderColor = '';
                                }, 1000);
                            }, i * 150);
                        });

                        // Show CTA2 and fill it
                        const cta2Container = document.getElementById('cta-2-container');
                        const cta2TextEl = document.getElementById('cta_2_text');
                        if (cta2Container && cta2Container.classList.contains('hidden') && data.cta_2_text) {
                            cta2Container.classList.remove('hidden');
                        }
                        if (cta2TextEl && data.cta_2_text) {
                            setTimeout(() => {
                                cta2TextEl.style.transition = 'background 0.3s, border-color 0.3s';
                                cta2TextEl.style.background = '#f0fdf4';
                                cta2TextEl.style.borderColor = '#86efac';
                                cta2TextEl.value = data.cta_2_text;
                                setTimeout(() => {
                                    cta2TextEl.style.background = '';
                                    cta2TextEl.style.borderColor = '';
                                }, 1000);
                            }, fields.length * 150);
                        }

                        // Handle AI Image
                        if (data.image) {
                            const aiImgInput = document.getElementById('background_image_url');
                            const aiPreview = document.getElementById('ai-image-preview');
                            const aiSrc = document.getElementById('ai-img-src');

                            if (aiImgInput && aiPreview && aiSrc) {
                                let cleanUrl = data.image.split(' ')[0].trim();
                                aiImgInput.value = cleanUrl;
                                aiSrc.src = cleanUrl;
                                aiPreview.classList.remove('hidden');
                                document.getElementById('file_input').value = '';
                            }
                        }

                        if (btn) {
                            btn.innerHTML = `<i class="fa-solid fa-check mr-2"></i> Filled!`;
                            btn.classList.add('scale-105', 'shadow-emerald-100', 'bg-emerald-600', 'border-emerald-500');
                            btn.classList.remove('bg-slate-900', 'border-slate-700/70', 'hover:bg-slate-700');

                            setTimeout(() => {
                                btn.disabled = false;
                                btn.innerHTML = `<svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" /></svg> AI Fill <span class="text-[10px] text-slate-400">(${portfolioType ? '(' + portfolioType.charAt(0).toUpperCase() + portfolioType.slice(1) + ')' : ''})</span>`;
                                btn.classList.remove('bg-emerald-600', 'border-emerald-500', 'scale-105', 'shadow-emerald-100');
                                btn.classList.add('bg-slate-900', 'border-slate-700/70', 'hover:bg-slate-700');
                                if (shuffleBtn) shuffleBtn.classList.remove('hidden');
                            }, 1000);
                        }
                    } else {
                        throw new Error(result.message || 'Generation failed');
                    }
                } catch (error) {
                    console.error('AI Error:', error);
                    alert('AI Generation Error: ' + error.message);
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = `<i class="fa-solid fa-magic mr-1.5"></i> AI Fill`;
                    }
                }
            }

            document.addEventListener('DOMContentLoaded', function () {
                const layoutInputs = document.querySelectorAll('input[name="layout_style"]');
                const bgImageLabel = document.querySelector('label[for="background_image"]');

                function updateImageLabel(layout) {
                    if (layout === 'split') {
                        bgImageLabel.textContent = 'Right Column Image';
                    } else {
                        bgImageLabel.textContent = 'Background Image';
                    }
                }

                const checkedInput = document.querySelector('input[name="layout_style"]:checked');
                if (checkedInput) {
                    updateImageLabel(checkedInput.value);
                }

                layoutInputs.forEach(input => {
                    input.addEventListener('change', (e) => {
                        updateImageLabel(e.target.value);
                    });
                });

                // Initialize visible states for Add buttons
                updateCtaAddButtons();

                document.getElementById('add-cta-master-btn').addEventListener('click', () => {
                    const cta2 = document.getElementById('cta-2-container');
                    const cta3 = document.getElementById('cta-3-container');
                    if (cta2.classList.contains('hidden')) {
                        showCta(2);
                    } else if (cta3.classList.contains('hidden')) {
                        showCta(3);
                    }
                });
            });

            function updateCtaAddButtons() {
                const cta2Vis = !document.getElementById('cta-2-container').classList.contains('hidden');
                const cta3Vis = !document.getElementById('cta-3-container').classList.contains('hidden');

                // Hide if max CTAs (3) are visible
                document.getElementById('add-btn-container-1').style.display = (cta2Vis && cta3Vis) ? 'none' : 'block';
            }

            function showCta(id) {
                document.getElementById('cta-' + id + '-container').classList.remove('hidden');
                updateCtaAddButtons();
            }

            function removeCta(id) {
                document.getElementById('cta_' + id + '_text').value = '';
                document.getElementById('cta_' + id + '_url').value = '';
                document.getElementById('cta-' + id + '-container').classList.add('hidden');

                // Shift data up if removing CTA 2 and CTA 3 is active
                if (id === 2 && !document.getElementById('cta-3-container').classList.contains('hidden')) {
                    document.getElementById('cta_2_text').value = document.getElementById('cta_3_text').value;
                    document.getElementById('cta_2_url').value = document.getElementById('cta_3_url').value;

                    document.getElementById('cta_3_text').value = '';
                    document.getElementById('cta_3_url').value = '';
                    document.getElementById('cta-3-container').classList.add('hidden');
                }

                updateCtaAddButtons();
            }

            function clearAiImage() {
                document.getElementById('background_image_url').value = '';
                document.getElementById('ai-image-preview').classList.add('hidden');
            }

            function randomizeLayout() {
                const layouts = ['centered', 'left-aligned', 'split'];
                const randomLayout = layouts[Math.floor(Math.random() * layouts.length)];

                // 1. Select Radio
                const radio = document.querySelector(`input[name="layout_style"][value="${randomLayout}"]`);
                if (radio) {
                    radio.checked = true;
                    // Trigger visual change if needed (usually handled by peer-checked CSS)
                }

                // 2. Randomize Colors
                const colorPalettes = [
                    { bg: '#ffffff', title: '#000000', sub: '#374151', btn: '#3B82F6' },
                    { bg: '#0f172a', title: '#f8fafc', sub: '#94a3b8', btn: '#6366f1' },
                    { bg: '#fdf2f8', title: '#831843', sub: '#be185d', btn: '#db2777' },
                    { bg: '#f0fdf4', title: '#14532d', sub: '#15803d', btn: '#16a34a' },
                    { bg: '#fffbeb', title: '#78350f', sub: '#92400e', btn: '#d97706' }
                ];
                const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

                document.querySelector('input[name="bg_color"]').value = palette.bg;
                document.querySelector('input[name="title_color"]').value = palette.title;
                document.querySelector('input[name="subtitle_color"]').value = palette.sub;
                document.querySelector('input[name="button_bg_color"]').value = palette.btn;

                // 3. UI Feedback
                const btn = document.getElementById('ai-layout-btn');
                const originalHtml = btn.innerHTML;
                btn.innerHTML = `<i class="fa-solid fa-check"></i> Applied!`;
                btn.classList.replace('bg-slate-900', 'bg-emerald-600');

                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                    btn.classList.replace('bg-emerald-600', 'bg-slate-900');
                }, 2000);
                async function triggerMasterAI() {
                    const btn = document.getElementById('ai-layout-btn');
                    const originalHtml = btn.innerHTML;

                    // Show loading state
                    btn.disabled = true;
                    btn.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin"></i> Designing Section...`;

                    try {
                        // Gather form data
                        const formData = {
                            title: document.getElementById('title').value,
                            subtitle: document.getElementById('subtitle').value,
                            description: document.getElementById('description').value,
                            cta_text: document.getElementById('cta_text').value,
                        };
                        const colors = {
                            bg_color: document.querySelector('input[name="bg_color"]').value,
                            title_color: document.querySelector('input[name="title_color"]').value,
                            subtitle_color: document.querySelector('input[name="subtitle_color"]').value,
                            button_bg_color: document.querySelector('input[name="button_bg_color"]').value,
                        };

                        const response = await fetch('""', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': '""'
                            },
                            body: JSON.stringify({
                                section: 'hero',
                                data: formData,
                                colors: colors
                            })
                        });

                        const result = await response.json();
                        if (result.success && result.layouts && result.layouts.length > 0) {
                            showCreativePreview(result.layouts);
                        } else {
                            throw new Error(result.message || 'No layouts returned');
                        }
                    } catch (error) {
                        console.error('Creative Design Error:', error);
                        alert('Failed to generate creative designs. Please try again.');
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = originalHtml;
                    }
                }

                let currentLayoutIndex = 0;
                let generatedLayouts = [];

                function showCreativePreview(layouts) {
                    generatedLayouts = layouts;
                    currentLayoutIndex = 0;
                    
                    let modal = document.getElementById('creative-modal');
                    if (!modal) {
                        const modalHtml = `
                    <div id="creative-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-opacity hidden">
                        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden relative">
                            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                                <div>
                                    <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <i class="fa-solid fa-wand-magic-sparkles text-indigo-500"></i>
                                        Choose Your Magic AI Design
                                    </h3>
                                    <p class="text-xs text-slate-500">We generated 3 unique styles. Pick your favorite!</p>
                                </div>
                                <div class="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                                    <button onclick="prevLayout()" class="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors">
                                        <i class="fa-solid fa-chevron-left"></i>
                                    </button>
                                    <span id="layout-indicator" class="text-sm font-bold text-indigo-600 min-w-[3rem] text-center">1 / 3</span>
                                    <button onclick="nextLayout()" class="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors">
                                        <i class="fa-solid fa-chevron-right"></i>
                                    </button>
                                </div>
                                <button onclick="closeCreativeModal()" class="text-slate-400 hover:text-slate-600 transition-colors ml-4">
                                    <i class="fa-solid fa-xmark text-xl"></i>
                                </button>
                            </div>
                            <div class="flex-1 overflow-auto bg-slate-100 p-8" id="creative-preview-body"></div>
                            <div class="px-6 py-4 border-t border-gray-100 bg-slate-50 flex items-center justify-between">
                                <button onclick="closeCreativeModal(); triggerMasterAI();" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800">
                                    <i class="fa-solid fa-rotate-right mr-1"></i> Regenerate Options
                                </button>
                                <button onclick="submitAsCustom()" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2">
                                    <i class="fa-solid fa-check"></i> Apply This Design
                                </button>
                            </div>
                        </div>
                    </div>`;
                        document.body.insertAdjacentHTML('beforeend', modalHtml);
                        modal = document.getElementById('creative-modal');
                    }

                    renderCurrentLayout();
                    modal.classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
                }

                function renderCurrentLayout() {
                    if(generatedLayouts.length > 0) {
                        document.getElementById('creative-preview-body').innerHTML = generatedLayouts[currentLayoutIndex];
                        document.getElementById('layout-indicator').innerText = (currentLayoutIndex + 1) + ' / ' + generatedLayouts.length;
                    }
                }

                function nextLayout() {
                    if(currentLayoutIndex < generatedLayouts.length - 1) {
                        currentLayoutIndex++;
                        renderCurrentLayout();
                    }
                }

                function prevLayout() {
                    if(currentLayoutIndex > 0) {
                        currentLayoutIndex--;
                        renderCurrentLayout();
                    }
                }

                function closeCreativeModal() {
                    const modal = document.getElementById('creative-modal');
                    if (modal) modal.classList.add('hidden');
                    document.body.style.overflow = 'auto';
                }

                function submitAsCustom() {
                    let aiRadio = document.querySelector('input[name="layout_style"][value="ai_custom"]');
                    if (!aiRadio) {
                        aiRadio = document.createElement('input');
                        aiRadio.type = 'radio';
                        aiRadio.name = 'layout_style';
                        aiRadio.value = 'ai_custom';
                        aiRadio.className = 'sr-only';
                        document.querySelector('form').appendChild(aiRadio);
                    }
                    aiRadio.checked = true;

                    const previewBody = document.getElementById('creative-preview-body');
                    if (previewBody && previewBody.innerHTML.trim() !== '') {
                        let codeInput = document.querySelector('input[name="generated_code"]');
                        if (!codeInput) {
                            codeInput = document.createElement('input');
                            codeInput.type = 'hidden';
                            codeInput.name = 'generated_code';
                            document.querySelector('form').appendChild(codeInput);
                        }
                        codeInput.value = previewBody.innerHTML;
                    }
                    document.querySelector('form').submit();
                }
        
