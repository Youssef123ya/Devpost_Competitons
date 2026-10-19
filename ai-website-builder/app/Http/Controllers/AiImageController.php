<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class AiImageController extends Controller
{
    public function generate(Request $request)
    {
        $request->validate([
            'prompt' => 'required|string|max:500'
        ]);

        $prompt = $request->input('prompt');

        try {
            // Encode the prompt for the URL
            $encodedPrompt = urlencode($prompt);
            
            // Pollinations.ai API URL (Free, no key required, high quality)
            $url = "https://image.pollinations.ai/prompt/{$encodedPrompt}?width=1200&height=800&nologo=true&enhance=true";

            // Fetch the image from the API
            $response = Http::timeout(60)->get($url);

            if ($response->successful()) {
                $imageContent = $response->body();
                
                // Ensure directory exists
                $dirPath = public_path('images/generated');
                if (!file_exists($dirPath)) {
                    mkdir($dirPath, 0755, true);
                }

                // Generate a unique filename
                $filename = 'ai_img_' . time() . '_' . Str::random(8) . '.jpg';
                $filePath = $dirPath . '/' . $filename;

                // Save the image locally
                file_put_contents($filePath, $imageContent);

                // Return the local URL
                return response()->json([
                    'success' => true,
                    'image_url' => '/images/generated/' . $filename
                ]);
            } else {
                throw new \Exception("Failed to generate image. HTTP Status: " . $response->status());
            }

        } catch (\Exception $e) {
            Log::error('AI Image Generation Failed', [
                'error' => $e->getMessage(),
                'prompt' => $prompt
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate image. Please try again or check your internet connection.'
            ], 500);
        }
    }
}
