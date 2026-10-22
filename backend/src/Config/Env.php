<?php
declare(strict_types=1);

namespace App\Config;

use RuntimeException;

class Env {
    private const ALLOWED_ENVS = ['local', 'test', 'production'];

    public static function validate(): void {
        $appEnv = $_ENV['APP_ENV'] ?? 'local';

        if (!in_array($appEnv, self::ALLOWED_ENVS, true)) {
            throw new RuntimeException("Invalid APP_ENV configuration: '{$appEnv}'. Allowed values are: " . implode(', ', self::ALLOWED_ENVS));
        }

        $paymentMode = $_ENV['PAYMENT_MODE'] ?? 'disabled';

        // Master Prompt Section 9 Requirement 3:
        // In production, PAYMENT_MODE=mock must fail application startup.
        if ($appEnv === 'production' && $paymentMode === 'mock') {
            throw new RuntimeException("CRITICAL PRODUCTION SAFETY GATE: Mock payment mode is strictly prohibited in production environments. PAYMENT_MODE must be 'disabled'. Application startup aborted.");
        }
    }

    public static function getEnv(): string {
        return $_ENV['APP_ENV'] ?? 'local';
    }

    public static function isProduction(): bool {
        return self::getEnv() === 'production';
    }

    public static function isLocalOrTest(): bool {
        return in_array(self::getEnv(), ['local', 'test'], true);
    }

    public static function getPaymentMode(): string {
        return $_ENV['PAYMENT_MODE'] ?? 'disabled';
    }

    public static function isMockPaymentAllowed(): bool {
        return self::isLocalOrTest() && self::getPaymentMode() === 'mock';
    }
}
