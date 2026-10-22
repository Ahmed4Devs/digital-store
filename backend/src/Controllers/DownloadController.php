<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Middleware\RequestIdMiddleware;
use App\Utils\Response;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use PDO;

class DownloadController {
    private static ?Logger $logger = null;

    private static function getLogger(): Logger {
        if (self::$logger === null) {
            self::$logger = new Logger('downloads');
            $logPath = dirname(__DIR__, 2) . '/storage/logs/downloads.log';
            self::$logger->pushHandler(new StreamHandler($logPath, Logger::INFO));
        }
        return self::$logger;
    }

    /**
     * Download via token hash
     */
    public function downloadByToken(string $token): void {
        $cleanToken = trim($token);

        if (empty($cleanToken) || strlen($cleanToken) !== 64 || !ctype_xdigit($cleanToken)) {
            Response::json(['error' => 'رمز التحميل غير صالح / Invalid download token format.'], 400);
            return;
        }

        $tokenHash = hash('sha256', $cleanToken);
        $this->processDownload(['token_hash' => $tokenHash]);
    }

    /**
     * Download via grant ID (authenticated ownership check)
     */
    public function downloadByGrant(string $grantId): void {
        $cleanId = (int)$grantId;
        if ($cleanId <= 0) {
            Response::json(['error' => 'معرف الإذن غير صالح / Invalid grant ID.'], 400);
            return;
        }

        $this->processDownload(['grant_id' => $cleanId]);
    }

    private function processDownload(array $criteria): void {
        $user = AuthMiddleware::check();
        $pdo = Database::getConnection();
        $requestId = RequestIdMiddleware::getRequestId();
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

        // 1. Fetch grant, order ownership, and asset
        $sql = "
            SELECT dg.id AS grant_id, dg.user_id, dg.download_limit, dg.download_count, 
                   dg.expires_at, dg.status AS grant_status,
                   o.id AS order_id, o.status AS order_status,
                   pa.id AS asset_id, pa.storage_key, pa.original_filename, pa.mime_type, pa.file_size, pa.upload_state,
                   p.slug, p.title_ar, p.title_en
            FROM download_grants dg
            JOIN orders o ON dg.order_id = o.id
            JOIN product_assets pa ON dg.asset_id = pa.id
            JOIN products p ON dg.product_id = p.id
            WHERE " . (isset($criteria['token_hash']) ? "dg.token_hash = :token_hash" : "dg.id = :grant_id") . "
            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($criteria);
        $grant = $stmt->fetch();

        if (!$grant) {
            self::getLogger()->warning("Download denied: grant not found", ['criteria' => $criteria, 'user_id' => $user['id']]);
            Response::json(['error' => 'إذن التحميل غير موجود / Download grant not found.'], 404);
            return;
        }

        $grantId = (int)$grant['grant_id'];

        // 2. Ownership verification: current user must own the grant (unless admin)
        if ((int)$grant['user_id'] !== (int)$user['id'] && ($user['role'] ?? '') !== 'admin') {
            $this->logEvent($pdo, $grantId, (int)$user['id'], 'denied', 'unauthorized_ownership', $requestId, $ip);
            self::getLogger()->critical("IDOR attempt detected on download", [
                'grant_id'     => $grantId,
                'target_owner' => $grant['user_id'],
                'caller_id'    => $user['id'],
                'request_id'   => $requestId,
            ]);
            Response::json(['error' => 'غير مصرح لك بتحميل هذا الملف / You do not have permission to download this asset.'], 403);
            return;
        }

        // 3. Verify order payment state
        if ($grant['order_status'] !== 'completed') {
            $this->logEvent($pdo, $grantId, (int)$user['id'], 'denied', 'order_not_completed', $requestId, $ip);
            Response::json(['error' => 'حالة الطلب غير مكتملة / Order payment is not completed.'], 403);
            return;
        }

        // 4. Verify grant status & expiration
        $isExpired = strtotime($grant['expires_at']) <= time();
        if ($grant['grant_status'] !== 'active' || $isExpired) {
            $this->logEvent($pdo, $grantId, (int)$user['id'], 'denied', 'grant_expired_or_revoked', $requestId, $ip);
            Response::json(['error' => 'انتهت صلاحية رابط التحميل أو تم إلغاؤه / Download grant has expired or been revoked.'], 403);
            return;
        }

        // 5. Verify download count and atomically increment
        $updateStmt = $pdo->prepare("
            UPDATE download_grants 
            SET download_count = download_count + 1 
            WHERE id = :id AND download_count < download_limit AND status = 'active'
        ");
        $updateStmt->execute(['id' => $grantId]);

        if ($updateStmt->rowCount() === 0) {
            $this->logEvent($pdo, $grantId, (int)$user['id'], 'denied', 'limit_depleted', $requestId, $ip);
            Response::json(['error' => 'تم استنفاد الحد الأقصى لعدد مرات التحميل / Download limit has been reached.'], 403);
            return;
        }

        // 6. Strict Path Traversal Prevention on Storage Key
        $storageDir = realpath(dirname(__DIR__, 2) . '/storage/digital_assets');
        $storageKey = basename((string)$grant['storage_key']); // Disallow slashes or subpath escapes
        $assetPath = realpath($storageDir . DIRECTORY_SEPARATOR . $storageKey);

        if (!$assetPath || !str_starts_with($assetPath, $storageDir) || !file_exists($assetPath)) {
            $this->logEvent($pdo, $grantId, (int)$user['id'], 'denied', 'asset_file_missing', $requestId, $ip);
            self::getLogger()->critical("Asset file missing or invalid path escape", [
                'grant_id'    => $grantId,
                'storage_key' => $storageKey,
                'request_id'  => $requestId,
            ]);
            Response::json(['error' => 'الملف المطلوب غير موجود في التخزين الآمن / Asset file not found in secure storage.'], 404);
            return;
        }

        // 7. Log successful download event
        $this->logEvent($pdo, $grantId, (int)$user['id'], 'allowed', 'authorized_download', $requestId, $ip);
        self::getLogger()->info("Download authorized and streamed", [
            'grant_id'   => $grantId,
            'user_id'    => $user['id'],
            'request_id' => $requestId,
        ]);

        // 8. Stream file with strict delivery headers
        $cleanFilename = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', (string)($grant['original_filename'] ?? 'digital_asset.zip'));
        $mime = !empty($grant['mime_type']) ? $grant['mime_type'] : 'application/octet-stream';

        header('Content-Description: File Transfer');
        header('Content-Type: ' . $mime);
        header('Content-Disposition: attachment; filename="' . $cleanFilename . '"');
        header('Content-Length: ' . (string)filesize($assetPath));
        header('Cache-Control: private, no-store, no-cache, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
        header('X-Content-Type-Options: nosniff');

        if (ob_get_level()) {
            ob_end_clean();
        }

        readfile($assetPath);
        exit;
    }

    private function logEvent(
        PDO $pdo,
        int $grantId,
        int $userId,
        string $outcome,
        string $reason,
        string $requestId,
        string $ip
    ): void {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO download_events (grant_id, user_id, outcome, reason, request_id, ip_address)
                VALUES (:gid, :uid, :outcome, :reason, :rid, :ip)
            ");
            $stmt->execute([
                'gid'     => $grantId,
                'uid'     => $userId,
                'outcome' => $outcome,
                'reason'  => $reason,
                'rid'     => $requestId,
                'ip'      => substr($ip, 0, 45),
            ]);
        } catch (\Throwable $e) {
            error_log("Failed to insert download_event: " . $e->getMessage());
        }
    }
}
