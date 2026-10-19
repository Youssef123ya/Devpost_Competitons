<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\HeroController;
use App\Http\Controllers\PromptController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Fix for Windows php artisan serve: serve storage files directly via PHP
// This bypasses the Junction symlink 403 issue
Route::get('/storage/{path}', function (string $path) {
    $fullPath = storage_path('app/public/' . $path);
    if (!file_exists($fullPath)) {
        abort(404);
    }
    $mimeType = mime_content_type($fullPath) ?: 'application/octet-stream';
    return response()->file($fullPath, ['Content-Type' => $mimeType]);
})->where('path', '.*');

Route::get('/website-type', function () {
    return view('website-type');
})->name('website.type');

// Create with Prompt (testing - free mock AI)
use App\Http\Controllers\AiImageController;
Route::post('/api/generate-image', [AiImageController::class, 'generate'])->name('ai.generate-image');

Route::get('/create-with-prompt', [PromptController::class, 'showForm'])->name('prompt.create');
Route::post('/create-with-prompt', [PromptController::class, 'submit'])->name('prompt.submit');

Route::get('/website-setup', function (\Illuminate\Http\Request $request) {
    if ($request->has('portfolio_type')) {
        session(['portfolio_type' => $request->portfolio_type]);
    }
    return view('website-setup');
})->name('website.setup');

Route::get('/portfolio-type', function () {
    return view('portfolio-type');
})->name('portfolio.type');

Route::get('/dashboard', function () {
    $heroes = \App\Models\Hero::where('user_id', auth()->id())->latest()->get();
    return view('dashboard', compact('heroes'));
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';

// Hero Routes
Route::middleware('auth')->prefix('hero')->name('hero.')->group(function () {
    // Create and Store
    Route::get('/', [HeroController::class, 'index'])->name('create');
    Route::get('/create', [HeroController::class, 'index'])->name('create.alias');
    Route::post('/', [HeroController::class, 'store'])->name('store');

    // Preview and Update
    Route::get('{id}/generate', [HeroController::class, 'generate'])->name('generate');
    Route::get('{id}/generate-code', [HeroController::class, 'generateCode'])->name('generateCode')->middleware('credits');
    Route::get('{id}/preview-full', [HeroController::class, 'fullPreview'])->name('preview-full');
    Route::post('{id}/update-design', [HeroController::class, 'updateDesign'])->name('updateDesign');
    Route::post('{id}/update-background-image', [HeroController::class, 'updateBackgroundImage'])->name('updateBackgroundImage');
    Route::post('{id}/regenerate', [HeroController::class, 'regenerate'])->name('regenerate')->middleware('credits');

    // API
    Route::get('{id}/api', [HeroController::class, 'api'])->name('api');

    // Delete All
    Route::delete('delete-all', [HeroController::class, 'destroyAll'])->name('destroyAll');

    // Delete
    Route::delete('{id}', [HeroController::class, 'destroy'])->name('destroy');
});
// Navbar Routes
use App\Http\Controllers\NavbarController;
use App\Http\Controllers\AboutSectionController;

Route::middleware('auth')->prefix('about')->name('about.')->group(function () {
    Route::get('/create/{heroId}', [AboutSectionController::class, 'create'])->name('create');
    Route::post('/store/{heroId}', [AboutSectionController::class, 'store'])->name('store');
    Route::get('/{id}/generate', [AboutSectionController::class, 'generate'])->name('generate');
    Route::get('/{id}/generate-code', [AboutSectionController::class, 'generateCode'])->name('generateCode')->middleware('credits');
    Route::post('/{id}/regenerate', [AboutSectionController::class, 'regenerate'])->name('regenerate')->middleware('credits');
    Route::post('/{id}/update-design', [AboutSectionController::class, 'updateDesign'])->name('updateDesign');
    Route::post('/{id}/upload-image', [AboutSectionController::class, 'uploadImage'])->name('uploadImage');
});

Route::middleware('auth')->prefix('navbar')->name('navbar.')->group(function () {
    Route::get('/create/{heroId}', [NavbarController::class, 'create'])->name('create');
    Route::post('/store/{heroId}', [NavbarController::class, 'store'])->name('store');
    Route::get('/{id}/generate', [NavbarController::class, 'generate'])->name('generate');
    Route::get('/{id}/generate-code', [NavbarController::class, 'generateCode'])->name('generateCode')->middleware('credits');
    Route::post('/{id}/regenerate', [NavbarController::class, 'regenerate'])->name('regenerate')->middleware('credits');
    Route::post('/{id}/update-design', [NavbarController::class, 'updateDesign'])->name('updateDesign');
    Route::post('/{id}/update-logo', [NavbarController::class, 'updateLogo'])->name('updateLogo');
});

// Services Routes
use App\Http\Controllers\ServiceSectionController;
use App\Http\Controllers\WhyChooseUsController;

Route::middleware('auth')->prefix('services')->name('services.')->group(function () {
    Route::get('/create/{heroId}', [ServiceSectionController::class, 'create'])->name('create');
    Route::post('/store/{heroId}', [ServiceSectionController::class, 'store'])->name('store');
    Route::get('/{id}/generate', [ServiceSectionController::class, 'generate'])->name('generate');
    Route::get('/{id}/generate-code', [ServiceSectionController::class, 'generateCode'])->name('generateCode')->middleware('credits');
    Route::post('/{id}/regenerate', [ServiceSectionController::class, 'regenerate'])->name('regenerate')->middleware('credits');
    Route::post('/{id}/update-design', [ServiceSectionController::class, 'updateDesign'])->name('updateDesign');
});

// Skills Routes
use App\Http\Controllers\SkillSectionController;

Route::middleware('auth')->prefix('skills')->name('skills.')->group(function () {
    Route::get('/create/{heroId}', [SkillSectionController::class, 'create'])->name('create');
    Route::post('/store/{heroId}', [SkillSectionController::class, 'store'])->name('store');
    Route::get('/{id}/generate', [SkillSectionController::class, 'generate'])->name('generate');
    Route::get('/{id}/generate-code', [SkillSectionController::class, 'generateCode'])->name('generateCode')->middleware('credits');
    Route::post('/{id}/regenerate', [SkillSectionController::class, 'regenerate'])->name('regenerate')->middleware('credits');
    Route::post('/{id}/update-design', [SkillSectionController::class, 'updateDesign'])->name('updateDesign');
});

// Why Choose Us Routes
Route::middleware('auth')->prefix('why-choose-us')->name('why-choose-us.')->group(function () {
    Route::get('/create/{heroId}', [WhyChooseUsController::class, 'create'])->name('create');
    Route::post('/store/{heroId}', [WhyChooseUsController::class, 'store'])->name('store');
    Route::get('/{id}/generate', [WhyChooseUsController::class, 'generate'])->name('generate');
    Route::get('/{id}/generate-code', [WhyChooseUsController::class, 'generateCode'])->name('generateCode')->middleware('credits');
    Route::post('/{id}/regenerate', [WhyChooseUsController::class, 'regenerate'])->name('regenerate')->middleware('credits');
    Route::post('/{id}/update-design', [WhyChooseUsController::class, 'updateDesign'])->name('updateDesign');
});

// Work Routes
use App\Http\Controllers\WorkController;

Route::middleware('auth')->prefix('work')->name('work.')->group(function () {
    Route::get('/create/{heroId}', [WorkController::class, 'create'])->name('create');
    Route::post('/store/{heroId}', [WorkController::class, 'store'])->name('store');
    Route::get('/{id}/generate', [WorkController::class, 'generate'])->name('generate');
    Route::get('/{id}/generate-code', [WorkController::class, 'generateCode'])->name('generateCode')->middleware('credits');
    Route::post('/{id}/regenerate', [WorkController::class, 'regenerate'])->name('regenerate')->middleware('credits');
    Route::post('/{id}/update-design', [WorkController::class, 'updateDesign'])->name('updateDesign');
    Route::post('/upload-image', [WorkController::class, 'uploadImage'])->name('uploadImage');
    Route::post('/upload-video', [WorkController::class, 'uploadVideo'])->name('uploadVideo');
    Route::get('/{id}/all-projects', [WorkController::class, 'allProjects'])->name('all-projects');
});

// Full Website Generation Routes
use App\Http\Controllers\FullWebsiteController;

Route::middleware('auth')->group(function () {
    // Full website creation
    Route::get('/full-website/create', [FullWebsiteController::class, 'create'])->name('full-website.create');
    Route::post('/full-website/store', [FullWebsiteController::class, 'store'])->name('full-website.store');
    Route::get('/full-website/{id}/generate', [FullWebsiteController::class, 'generate'])->name('full-website.generate')->middleware('credits');
    Route::get('/full-website/{id}/preview', [FullWebsiteController::class, 'preview'])->name('full-website.preview');
    Route::post('/full-website/{id}/regenerate', [FullWebsiteController::class, 'regenerate'])->name('full-website.regenerate')->middleware('credits');
});

Route::middleware('auth')->get('/website/{heroId}/preview', [HeroController::class, 'fullPreview'])->name('website.preview');
Route::middleware('auth')->get('/website/{heroId}/export-loading', [HeroController::class, 'exportLoading'])->name('website.export-loading');
Route::middleware('auth')->post('/website/{heroId}/download', [HeroController::class, 'downloadProject'])->name('website.download');
Route::middleware('auth')->get('/download-project/{filename}', [HeroController::class, 'downloadFile'])->name('download-project');

// Standalone Contact Page
Route::get('/website/{heroId}/contact', [HeroController::class, 'contactPage'])->name('website.contact');

// Contact Section Routes
use App\Http\Controllers\ContactSectionController;

Route::middleware('auth')->prefix('contact')->name('contact.')->group(function () {
    Route::get('/create/{heroId}', [ContactSectionController::class, 'create'])->name('create');
    Route::post('/store/{heroId}', [ContactSectionController::class, 'store'])->name('store');
    Route::get('/{id}/generate', [ContactSectionController::class, 'generate'])->name('generate');
    Route::get('/{id}/generate-code', [ContactSectionController::class, 'generateCode'])->name('generateCode')->middleware('credits');
    Route::post('/{id}/regenerate', [ContactSectionController::class, 'regenerate'])->name('regenerate')->middleware('credits');
    Route::post('/{id}/update-design', [ContactSectionController::class, 'updateDesign'])->name('updateDesign');
});

// Footer Section Routes
use App\Http\Controllers\FooterSectionController;

Route::middleware('auth')->prefix('footer')->name('footer.')->group(function () {
    Route::get('/create/{heroId}', [FooterSectionController::class, 'create'])->name('create');
    Route::post('/store/{heroId}', [FooterSectionController::class, 'store'])->name('store');
    Route::get('/{id}/generate', [FooterSectionController::class, 'generate'])->name('generate');
    Route::get('/{id}/generate-code', [FooterSectionController::class, 'generateCode'])->name('generateCode')->middleware('credits');
    Route::post('/{id}/regenerate', [FooterSectionController::class, 'regenerate'])->name('regenerate')->middleware('credits');
    Route::post('/{id}/save-changes', [FooterSectionController::class, 'saveChanges'])->name('saveChanges');
});

// Plans and Payment flow
Route::middleware('auth')->group(function () {
    Route::get('/plans', [App\Http\Controllers\PlanController::class, 'index'])->name('plans.index');
    Route::get('/plans/{plan:slug}/pay', [App\Http\Controllers\PlanController::class, 'pay'])->name('plans.pay');
    Route::post('/plans/{plan:slug}/pay', [App\Http\Controllers\PlanController::class, 'storePayment'])->name('plans.store-payment');
    Route::get('/orders', [App\Http\Controllers\PlanController::class, 'orders'])->name('plans.orders');
});

// Admin management
use App\Http\Controllers\AdminOrderController;
Route::middleware('auth')->prefix('admin')->name('admin.')->group(function () {
    Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');
    Route::post('/orders/{order}/approve', [AdminOrderController::class, 'approve'])->name('orders.approve');
    Route::post('/orders/{order}/reject', [AdminOrderController::class, 'reject'])->name('orders.reject');
});

// API endpoint for limitless placeholder generation
Route::post('/api/generate-placeholder', [\App\Http\Controllers\AiContentController::class, 'generatePlaceholder'])->name('ai.placeholder')->middleware('auth');
Route::post('/api/suggest-design', [\App\Http\Controllers\HeroController::class, 'suggestDesign'])->name('ai.suggest-design')->middleware('auth');
Route::post('/api/creative-design', [\App\Http\Controllers\AiContentController::class, 'generateCreativeDesign'])->name('ai.creative-design')->middleware('auth');
Route::post('/api/modify-code', [\App\Http\Controllers\AiContentController::class, 'modifyCode'])->name('ai.modify-code')->middleware('auth');


