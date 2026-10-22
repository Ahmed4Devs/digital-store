<?php
declare(strict_types=1);

namespace App\Middleware;

use App\Config\Database;
use App\Utils\Response;
use PDO;

class RateLimiter {
    /**
     * Check if client IP exceeded allowed attempts
     *
     * @param string $action Action key (e.g., 'login', 'register')
     * @param int $maxAttempts Maximum allowed hits
     * @param int $decaySeconds Window duration in seconds (e.g., 600 for 10 minutes)
     */
    public static function check(string $action, int $maxAttempts = 5, int $decaySeconds = 600): void {
        $ip = self::getClientIp();
        $key = "rl:{$action}:{$ip}";
        $now = time();

        $pdo = Database::getConnection();

        // Clean expired rate limit records periodically
        $pdo->prepare("DELETE FROM rate_limits WHERE reset_time < :now")
            ->execute(['now' => $now]);

        // Fetch current limit record
        $stmt = $pdo->prepare("SELECT hits, reset_time FROM rate_limits WHERE key_id = :key LIMIT 1");
        $stmt->execute(['key' => $key]);
        $record = $stmt->fetch();

        if ($record) {
            if ($record['hits'] >= $maxAttempts) {
                $retryAfter = max(1, $record['reset_time'] - $now);
                header("Retry-After: {$retryAfter}");
                Response::json([
                    'error' => "تم تجاوز الحد المسموح من المحاولات. يرجى المحاولة بعد {$retryAfter} ثانية."
                ], 429);
                exit;
            }

            // Increment hit count
            $update = $pdo->prepare("UPDATE rate_limits SET hits = hits + 1 WHERE key_id = :key");
            $update->execute(['key' => $key]);
        } else {
            // First hit in this window
            $insert = $pdo->prepare("INSERT INTO rate_limits (key_id, hits, reset_time) VALUES (:key, 1, :reset_time)");
            $insert->execute([
                'key' => $key,
                'reset_time' => $now + $decaySeconds
            ]);
        }
    }

    /**
     * Clear rate limit on successful authentication
     */
    public static function clear(string $action): void {
        $ip = self::getClientIp();
        $key = "rl:{$action}:{$ip}";
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("DELETE FROM rate_limits WHERE key_id = :key");
        $stmt->execute(['key' => $key]);
    }

    private static function getClientIp(): string {
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            return $_SERVER['HTTP_CF_CONNECTING_IP'];
        }
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($ips[0]);
        }
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }
}
