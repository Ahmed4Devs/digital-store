<?php
declare(strict_types=1);

namespace App\Middleware;

class SecurityHeadersMiddleware {
    public static function apply(): void {
        header("X-Content-Type-Options: nosniff");
        header("X-Frame-Options: DENY");
        header("Referrer-Policy: strict-origin-when-cross-origin");
        header("Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()");

        // Tested Content-Security-Policy compatible with React SPA
        $csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' http://localhost:* http://127.0.0.1:*; frame-ancestors 'none'; object-src 'none'; base-uri 'self';";
        header("Content-Security-Policy: " . $csp);

        // Strict-Transport-Security if served over HTTPS
        $isHttps = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443);
        if ($isHttps) {
            header("Strict-Transport-Security: max-age=31536000; includeSubDomains; preload");
        }
    }
}
