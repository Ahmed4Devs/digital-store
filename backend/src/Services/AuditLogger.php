<?php
declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use App\Middleware\RequestIdMiddleware;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use PDO;

class AuditLogger {
    private static ?Logger $logger = null;

    private static function getMonolog(): Logger {
        if (self::$logger === null) {
            self::$logger = new Logger('audit');
            $logPath = dirname(__DIR__, 2) . '/storage/logs/audit.log';
            self::$logger->pushHandler(new StreamHandler($logPath, Logger::INFO));
        }
        return self::$logger;
    }

    public static function log(
        int $actorId,
        string $action,
        string $entityType,
        int $entityId,
        string $result,
        array $details = []
    ): void {
        $requestId = RequestIdMiddleware::getRequestId();

        // Redact any sensitive keys
        $redacted = self::redactSensitiveData($details);
        $jsonDetails = json_encode($redacted, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("
                INSERT INTO admin_audit_log (actor_id, action, entity_type, entity_id, result, request_id, redacted_details)
                VALUES (:actor_id, :action, :entity_type, :entity_id, :result, :request_id, :details)
            ");
            $stmt->execute([
                'actor_id'    => $actorId,
                'action'      => $action,
                'entity_type' => $entityType,
                'entity_id'   => $entityId,
                'result'      => $result,
                'request_id'  => $requestId,
                'details'     => $jsonDetails,
            ]);
        } catch (\Throwable $e) {
            error_log("Failed to insert audit log into database: " . $e->getMessage());
        }

        self::getMonolog()->info("Admin action logged", [
            'actor_id'    => $actorId,
            'action'      => $action,
            'entity_type' => $entityType,
            'entity_id'   => $entityId,
            'result'      => $result,
            'request_id'  => $requestId,
            'details'     => $redacted,
        ]);
    }

    private static function redactSensitiveData(array $data): array {
        $sensitiveKeys = ['password', 'password_hash', 'token', 'token_hash', 'secret', 'mfa_secret', 'card', 'cvv'];
        $clean = [];

        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $clean[$key] = self::redactSensitiveData($value);
            } elseif (in_array(strtolower((string)$key), $sensitiveKeys, true)) {
                $clean[$key] = '[REDACTED]';
            } else {
                $clean[$key] = $value;
            }
        }

        return $clean;
    }
}
