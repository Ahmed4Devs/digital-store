<?php
declare(strict_types=1);

namespace App\Middleware;

use App\Utils\Response;

class CsrfMiddleware {
    public static function getToken(): string {
        AuthMiddleware::initSession();

        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32)); // 64 hex characters
        }

        return (string)$_SESSION['csrf_token'];
    }

    public static function verify(): void {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

        // Safe methods do not mutate state
        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }

        AuthMiddleware::initSession();

        $sessionToken = $_SESSION['csrf_token'] ?? null;
        $requestToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;

        // If JSON body supplied a _csrf_token fallback
        if (!$requestToken) {
            $input = json_decode((string)file_get_contents('php://input'), true);
            if (is_array($input) && !empty($input['_csrf_token'])) {
                $requestToken = (string)$input['_csrf_token'];
            }
        }

        if (!$sessionToken || !$requestToken || !hash_equals((string)$sessionToken, (string)$requestToken)) {
            Response::json([
                'error' => 'رمز التحقق ضد التزوير (CSRF Token) غير صالح أو مفقود / Invalid or missing CSRF token.',
                'code'  => 'CSRF_VALIDATION_FAILED'
            ], 403);
            exit;
        }
    }
}
