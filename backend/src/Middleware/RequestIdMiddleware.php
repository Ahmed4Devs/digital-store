<?php
declare(strict_types=1);

namespace App\Middleware;

class RequestIdMiddleware {
    private static ?string $requestId = null;

    public static function handle(): string {
        if (self::$requestId === null) {
            $incoming = $_SERVER['HTTP_X_REQUEST_ID'] ?? null;
            if ($incoming && preg_match('/^[a-zA-Z0-9\-_]{8,64}$/', (string)$incoming)) {
                self::$requestId = (string)$incoming;
            } else {
                self::$requestId = bin2hex(random_bytes(16)); // 32 hex chars
            }

            if (!headers_sent()) {
                header("X-Request-Id: " . self::$requestId);
            }
        }

        return self::$requestId;
    }

    public static function getRequestId(): string {
        return self::$requestId ?? self::handle();
    }
}
