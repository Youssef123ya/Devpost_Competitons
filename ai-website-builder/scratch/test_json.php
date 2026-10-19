<?php
use Illuminate\Support\Facades\Http;

$apiKey = config('services.openrouter.key');
$model = config('services.openrouter.model');

echo "Sending request using model: $model\n";

$response = Http::withHeaders([
    'Authorization' => 'Bearer ' . $apiKey,
    'HTTP-Referer' => 'http://localhost:8000',
    'X-Title' => 'Laravel AI Builder',
    'Content-Type' => 'application/json',
])->timeout(60)->post('https://openrouter.ai/api/v1/chat/completions', [
    'model' => $model,
    'messages' => [
        ['role' => 'system', 'content' => 'You are a professional website copywriter. You must output ONLY valid JSON. No explanations, no markdown blocks.'],
        ['role' => 'user', 'content' => 'Generate HERO section content for developer. Structure: { "title": "Headline", "subtitle": "Subtitle", "description": "Description", "cta_text": "CTA", "cta_2_text": "CTA 2", "image": "url" }'],
    ],
    'response_format' => ['type' => 'json_object']
]);

if ($response->failed()) {
    echo "FAILED: " . $response->body() . "\n";
} else {
    echo "SUCCESS: " . $response->body() . "\n";
}
