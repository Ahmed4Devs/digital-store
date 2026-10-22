<?php
declare(strict_types=1);

namespace App\Middleware;

use App\Config\Database;
use App\Config\Env;
use App\Utils\Response;
use PDO;

class AuthMiddleware {
    private static ?array $currentUser = null;

    public static function initSession(): void {
        if (session_status() === PHP_SESSION_NONE) {
            $isSecure = Env::isProduction() || (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
            $cookieDomain = $_ENV['COOKIE_DOMAIN'] ?? '';

            if (!headers_sent()) {
                ini_set('session.use_strict_mode', '1');
                ini_set('session.use_only_cookies', '1');

                session_set_cookie_params([
                    'lifetime' => (int)($_ENV['SESSION_LIFETIME'] ?? 86400),
                    'path'     => '/',
                    'domain'   => !empty($cookieDomain) ? $cookieDomain : '',
                    'secure'   => $isSecure,
                    'httponly' => true,
                    'samesite' => 'Lax',
                ]);

                session_start();
            } else if (session_status() === PHP_SESSION_NONE) {
                @session_start();
            }

            // Session idle timeout: 2 hours
            $now = time();
            if (isset($_SESSION['last_activity']) && ($now - $_SESSION['last_activity']) > 7200) {
                $_SESSION = [];
                session_destroy();
                session_start();
            }
            $_SESSION['last_activity'] = $now;
        }
    }

    public static function check(): array {
        self::initSession();

        $userId = $_SESSION['user_id'] ?? null;

        if (!$userId) {
            Response::json(['error' => 'يرجى تسجيل الدخول أولاً / Please log in to continue.'], 401);
            exit;
        }

        if (self::$currentUser !== null && (int)self::$currentUser['id'] === (int)$userId) {
            return self::$currentUser;
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT id, username, email, role, status, verification_state, preferred_lang, mfa_enabled, created_at 
            FROM users 
            WHERE id = :id 
            LIMIT 1
        ");
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch();

        if (!$user || $user['status'] !== 'active') {
            $_SESSION = [];
            session_destroy();
            Response::json(['error' => 'حساب المستخدم غير موجود أو معطل / User account is disabled or not found.'], 401);
            exit;
        }

        self::$currentUser = $user;
        return $user;
    }

    public static function requireAdmin(): array {
        $user = self::check();

        if (($user['role'] ?? '') !== 'admin') {
            Response::json(['error' => 'غير مصرح بالوصول: يتطلب صلاحيات المدير / Access denied: Administrator privileges required.'], 403);
            exit;
        }

        // Production MFA Enforcement (Section 7: Require MFA for admin in production)
        if (Env::isProduction()) {
            if (empty($user['mfa_enabled']) || empty($_SESSION['mfa_verified'])) {
                Response::json(['error' => 'يتطلب التحقق بخطوتين (MFA) قبل متابعة العمليات / Multi-Factor Authentication required.'], 403);
                exit;
            }
        }

        return $user;
    }

    public static function getCurrentUser(): ?array {
        if (self::$currentUser !== null) {
            return self::$currentUser;
        }

        self::initSession();
        $userId = $_SESSION['user_id'] ?? null;
        if (!$userId) {
            return null;
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT id, username, email, role, status, verification_state, preferred_lang, mfa_enabled, created_at 
            FROM users 
            WHERE id = :id AND status = 'active'
            LIMIT 1
        ");
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch();

        if ($user) {
            self::$currentUser = $user;
        }
        return self::$currentUser;
    }
}
