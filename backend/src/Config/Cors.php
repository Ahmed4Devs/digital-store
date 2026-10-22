<?php
declare(strict_types=1);

namespace App\Config;

class Cors {
    public static function handle(): void {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowedOriginsEnv = $_ENV['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:3000,http://127.0.0.1:3000';
        $allowedOrigins = array_map('trim', explode(',', $allowedOriginsEnv));

        if ($origin && in_array($origin, $allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: {$origin}");
            header("Access-Control-Allow-Credentials: true");
        } elseif (empty($origin)) {
            // Non-browser or direct requests
            header("Access-Control-Allow-Origin: *");
        }

        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept");
        header("Access-Control-Max-Age: 86400");

        // Global security headers
        header("X-Content-Type-Options: nosniff");
        header("X-Frame-Options: DENY");
        header("X-XSS-Protection: 1; mode=block");
        header("Referrer-Policy: strict-origin-when-cross-origin");

        // Preflight OPTIONS handling
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
