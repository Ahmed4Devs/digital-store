<?php
declare(strict_types=1);

namespace App\Utils;

use App\Middleware\RequestIdMiddleware;
use App\Middleware\SecurityHeadersMiddleware;

class Response {
    public static function json(mixed $data, int $statusCode = 200, array $headers = []): void {
        http_response_code($statusCode);

        // Apply modern security headers
        SecurityHeadersMiddleware::apply();
        header('Content-Type: application/json; charset=UTF-8');

        $requestId = RequestIdMiddleware::getRequestId();

        foreach ($headers as $key => $value) {
            header("$key: $value");
        }

        // Standardize API response wrapper if not already formatted
        if (is_array($data)) {
            if (isset($data['error'])) {
                echo json_encode([
                    'success'    => false,
                    'error'      => $data['error'],
                    'code'       => $data['code'] ?? 'ERROR',
                    'request_id' => $requestId,
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                exit;
            }

            if (!isset($data['success'])) {
                echo json_encode([
                    'success'    => true,
                    'request_id' => $requestId,
                    'data'       => $data
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                exit;
            }
        }

        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $message, int $statusCode = 400, string $code = 'BAD_REQUEST'): void {
        self::json(['error' => $message, 'code' => $code], $statusCode);
    }

    public static function success(mixed $data, int $statusCode = 200): void {
        self::json(['success' => true, 'data' => $data], $statusCode);
    }
}
