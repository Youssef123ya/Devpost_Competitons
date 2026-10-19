<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setup & Export Your Laravel Project</title>
    <script src="/js/tailwind.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: radial-gradient(circle at 50% 50%, #f8fafc 0%, #e2e8f0 100%); }
        @keyframes pulse-slow { 0%,100%{opacity:.4;} 50%{opacity:.7;} }
        .pulse-bg { animation: pulse-slow 8s infinite ease-in-out; }
        .progress-shine {
            background: linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.6) 50%,rgba(255,255,255,0) 100%);
            animation: shine 1.5s infinite linear;
        }
        @keyframes shine { 0%{transform:translateX(-100%);} 100%{transform:translateX(100%);} }
        .step { transition: all 0.4s ease; }
        .step.hidden { opacity: 0; pointer-events: none; position: absolute; top: 0; left: 0; right: 0; }
        .step.visible { opacity: 1; position: relative; }
        .input-field {
            width: 100%;
            padding: 12px 16px;
            background: #f8fafc;
            border: 1.5px solid #e2e8f0;
            border-radius: 12px;
            font-size: 14px;
            color: #1e293b;
            outline: none;
            transition: border-color 0.2s;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .input-field:focus { border-color: #6366f1; background: #fff; }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center overflow-hidden text-slate-800 relative p-6">

    <!-- Decorative Blobs -->
    <div class="absolute w-[500px] h-[500px] rounded-full bg-indigo-200/50 blur-[120px] -top-40 -left-40 pulse-bg"></div>
    <div class="absolute w-[500px] h-[500px] rounded-full bg-violet-200/50 blur-[120px] -bottom-40 -right-40 pulse-bg" style="animation-delay: 4s;"></div>

    <div class="z-10 w-full max-w-lg relative">

        <!-- ═══ STEP 1: Admin Setup Form ═══ -->
        <div id="step-setup" class="step visible">
            <!-- Brand Icon -->
            <div class="text-center mb-8">
                <div class="mb-4 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white border border-slate-100 shadow-xl relative">
                    <div class="absolute inset-0 rounded-3xl bg-gradient-to-tr from-indigo-500 to-violet-500 opacity-10 blur-sm"></div>
                    <i class="fa-solid fa-user-shield text-3xl text-indigo-600"></i>
                </div>
                <h1 class="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                    Create Admin Account
                </h1>
                <p class="text-slate-500 text-sm mt-2">Set up your admin credentials to manage the website after download.</p>
            </div>

            <div class="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-2xl">
                <form id="setup-form" class="space-y-5">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                        <input type="text" id="admin_name" required class="input-field" placeholder="e.g. Ahmed Momen">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                        <input type="email" id="admin_email" required class="input-field" placeholder="admin@yourdomain.com">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                        <input type="password" id="admin_password" required minlength="8" class="input-field" placeholder="Min. 8 characters">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                        <input type="password" id="admin_password_confirm" required class="input-field" placeholder="Re-enter password">
                    </div>
                    <div id="form-error" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3"></div>
                    <button type="submit"
                        class="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2">
                        <i class="fa-solid fa-download"></i>
                        Setup & Download Project
                    </button>
                </form>
            </div>
        </div>

        <!-- ═══ STEP 2: Progress Bar ═══ -->
        <div id="step-loading" class="step hidden">
            <div class="text-center mb-8">
                <div class="mb-4 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white border border-slate-100 shadow-xl relative">
                    <div class="absolute inset-0 rounded-3xl bg-gradient-to-tr from-indigo-500 to-violet-500 opacity-10 blur-sm"></div>
                    <i class="fa-brands fa-laravel text-4xl text-indigo-600 animate-bounce" style="animation-duration:2s;"></i>
                </div>
                <h1 class="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                    Assembling Project
                </h1>
                <p class="text-slate-500 text-sm mt-2">Please keep this window open while we build your project.</p>
            </div>

            <div class="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div class="h-12 flex items-center justify-center mb-6">
                    <div id="loading-msg" class="text-indigo-600 font-bold tracking-wide text-base transition-all duration-500 ease-in-out">
                        Initializing project structure...
                    </div>
                </div>
                <div class="w-full bg-slate-100/80 rounded-full h-3.5 p-0.5 border border-slate-200/50 shadow-inner mb-4 relative overflow-hidden">
                    <div id="progress-bar" class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full w-0 transition-all duration-300 ease-out relative overflow-hidden" style="width:0%">
                        <div class="absolute inset-0 progress-shine"></div>
                    </div>
                </div>
                <div class="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span id="percentage-label">Progress: 0%</span>
                    <span id="speed-label">Estimated: 8s remaining</span>
                </div>
            </div>

            <p class="mt-8 text-slate-400 text-xs font-semibold text-center">
                Powered by AI Website Builder &copy; {{ date('Y') }}
            </p>
        </div>

    </div>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script>
        const downloadUrl = "{{ route('website.download', $hero->id) }}";
        const downloadFileBaseUrl = "{{ url('/download-project') }}";

        document.getElementById('setup-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const name     = document.getElementById('admin_name').value.trim();
            const email    = document.getElementById('admin_email').value.trim();
            const pass     = document.getElementById('admin_password').value;
            const confirm  = document.getElementById('admin_password_confirm').value;
            const errEl    = document.getElementById('form-error');

            if (pass !== confirm) {
                errEl.textContent = 'Passwords do not match.';
                errEl.classList.remove('hidden');
                return;
            }
            if (pass.length < 8) {
                errEl.textContent = 'Password must be at least 8 characters.';
                errEl.classList.remove('hidden');
                return;
            }
            errEl.classList.add('hidden');

            // Store admin data in sessionStorage to pass to download
            sessionStorage.setItem('admin_name', name);
            sessionStorage.setItem('admin_email', email);
            sessionStorage.setItem('admin_password', pass);

            // Transition to loading step
            document.getElementById('step-setup').classList.remove('visible');
            document.getElementById('step-setup').classList.add('hidden');
            document.getElementById('step-loading').classList.remove('hidden');
            document.getElementById('step-loading').classList.add('visible');

            startProgress();
        });

        function startProgress() {
            const messages = [
                "Initializing Laravel backend environment...",
                "Injecting your website sections into the database...",
                "Creating admin account & seeders...",
                "Generating Admin Dashboard views...",
                "Configuring authentication system...",
                "Packaging vendor dependencies...",
                "Finalizing ZIP archive...",
                "Your project is ready to download! 🎉"
            ];

            const msgEl  = document.getElementById('loading-msg');
            const bar    = document.getElementById('progress-bar');
            const pctEl  = document.getElementById('percentage-label');
            const spdEl  = document.getElementById('speed-label');

            let msgIdx = 0, step = 0, progress = 0;
            const totalDuration = 15000, stepTime = 100, totalSteps = totalDuration / stepTime;

            const msgInterval = setInterval(() => {
                if (msgIdx < messages.length - 1) {
                    msgIdx++;
                    msgEl.style.opacity = '0';
                    setTimeout(() => { msgEl.textContent = messages[msgIdx]; msgEl.style.opacity = '1'; }, 300);
                }
            }, 1800);

            const progInterval = setInterval(() => {
                step++;
                progress = Math.min(99, Math.round(100 * (1 - Math.exp(-4 * (step / totalSteps)))));
                bar.style.width = progress + '%';
                pctEl.textContent = `Progress: ${progress}%`;
                const rem = Math.max(1, Math.round((totalDuration - step * stepTime) / 1000));
                spdEl.textContent = `Estimated: ${rem}s remaining`;

                if (step >= totalSteps) {
                    clearInterval(progInterval);
                    clearInterval(msgInterval);
                    bar.style.width = '100%';
                    pctEl.textContent = 'Progress: 100%';
                    spdEl.textContent = 'Preparing download...';
                    msgEl.textContent = 'Your project is ready to download! 🎉';

                    setTimeout(() => {
                        // Build POST form to trigger download with admin credentials
                        const form = document.createElement('form');
                        form.method = 'POST';
                        form.action = downloadUrl;
                        form.style.display = 'none';

                        const addField = (n, v) => {
                            const i = document.createElement('input');
                            i.type = 'hidden'; i.name = n; i.value = v;
                            form.appendChild(i);
                        };
                        addField('_token', '{{ csrf_token() }}');
                        addField('admin_name',     sessionStorage.getItem('admin_name') || '');
                        addField('admin_email',    sessionStorage.getItem('admin_email') || '');
                        addField('admin_password', sessionStorage.getItem('admin_password') || '');

                        document.body.appendChild(form);
                        
                        // Submit form as AJAX to get download URL
                        fetch(downloadUrl, {
                            method: 'POST',
                            body: new FormData(form),
                            headers: {
                                'X-Requested-With': 'XMLHttpRequest',
                            }
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Server error: ' + response.status);
                            }
                            return response.json();
                        })
                        .then(data => {
                            if (data.success && data.filename) {
                                // Build download URL using the base URL
                                const downloadRoute = downloadFileBaseUrl + '/' + encodeURIComponent(data.filename);
                                
                                // Trigger the actual file download
                                const link = document.createElement('a');
                                link.href = downloadRoute;
                                link.download = data.filename;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                
                                // Success message
                                msgEl.textContent = '✓ Download started! Redirecting to preview...';
                                
                                // Redirect after 2 seconds
                                setTimeout(() => {
                                    window.location.href = "{{ route('website.preview', $hero->id) }}";
                                }, 2000);
                            } else {
                                throw new Error(data.message || 'Unknown error');
                            }
                        })
                        .catch(error => {
                            console.error('Download error:', error);
                            msgEl.textContent = '❌ Error: ' + error.message;
                            bar.style.width = '0%';
                            pctEl.textContent = 'Error occurred during download';
                            spdEl.textContent = 'Please try again';
                            
                            setTimeout(() => {
                                window.location.href = "{{ route('website.preview', $hero->id) }}";
                            }, 4000);
                        })
                        .finally(() => {
                            if (form.parentNode) {
                                document.body.removeChild(form);
                            }
                        });
                    }, 500);
                }
            }, stepTime);
        }
    </script>
</body>
</html>
