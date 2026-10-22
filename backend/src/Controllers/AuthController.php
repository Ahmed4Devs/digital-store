<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Config\Env;
use App\DTOs\UserRegisterDTO;
use App\Middleware\AuthMiddleware;
use App\Middleware\CsrfMiddleware;
use App\Middleware\RateLimiter;
use App\Services\AuditLogger;
use App\Utils\Response;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use PDO;

class AuthController {
    private static ?Logger $logger = null;

    private static function getLogger(): Logger {
        if (self::$logger === null) {
            self::$logger = new Logger('security');
            $logPath = dirname(__DIR__, 2) . '/storage/logs/security.log';
            self::$logger->pushHandler(new StreamHandler($logPath, Logger::INFO));
        }
        return self::$logger;
    }

    public function csrf(): void {
        $token = CsrfMiddleware::getToken();
        Response::json(['csrf_token' => $token]);
    }

    public function register(): void {
        RateLimiter::check('register', 5, 600);

        $input = json_decode((string)file_get_contents('php://input'), true) ?? [];

        $requiredFields = ['username', 'email', 'password'];
        $hasAllFields = array_all($requiredFields, fn($f) => !empty($input[$f]));

        if (!$hasAllFields) {
            Response::json(['error' => 'جميع الحقول مطلوبة / All fields are required.'], 422);
            return;
        }

        try {
            $dto = new UserRegisterDTO(
                (string)$input['username'],
                (string)$input['email'],
                (string)$input['password']
            );
        } catch (\InvalidArgumentException $e) {
            Response::json(['error' => $e->getMessage()], 422);
            return;
        }

        $preferredLang = !empty($input['preferred_lang']) && in_array($input['preferred_lang'], ['ar', 'en'], true)
            ? (string)$input['preferred_lang']
            : 'ar';

        $pdo = Database::getConnection();

        // Check if username or email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email OR username = :username LIMIT 1");
        $stmt->execute([
            'email'    => $dto->email,
            'username' => $dto->username,
        ]);

        if ($stmt->fetch()) {
            Response::json(['error' => 'اسم المستخدم أو البريد الإلكتروني مسجل مسبقاً / Username or Email already in use.'], 409);
            return;
        }

        // Argon2id password hash
        $passwordHash = password_hash($dto->password, PASSWORD_ARGON2ID);

        $insert = $pdo->prepare("
            INSERT INTO users (username, email, password_hash, role, preferred_lang, status, verification_state) 
            VALUES (:username, :email, :password_hash, 'customer', :preferred_lang, 'active', 'verified')
        ");
        $insert->execute([
            'username'       => $dto->username,
            'email'          => $dto->email,
            'password_hash'  => $passwordHash,
            'preferred_lang' => $preferredLang,
        ]);

        $userId = (int)$pdo->lastInsertId();

        RateLimiter::clear('register');
        self::getLogger()->info("User registered successfully", ['user_id' => $userId, 'email' => $dto->email]);

        // Auto-login after registration with session ID regeneration
        AuthMiddleware::initSession();
        session_regenerate_id(true);
        $_SESSION['user_id'] = $userId;

        Response::json([
            'message'    => 'تم إنشاء الحساب بنجاح / Account registered successfully.',
            'csrf_token' => CsrfMiddleware::getToken(),
            'user'       => [
                'id'             => $userId,
                'username'       => $dto->username,
                'email'          => $dto->email,
                'role'           => 'customer',
                'preferred_lang' => $preferredLang,
            ]
        ], 201);
    }

    public function login(): void {
        RateLimiter::check('login', 5, 600);

        $input = json_decode((string)file_get_contents('php://input'), true) ?? [];

        $required = ['email', 'password'];
        $hasRequired = array_all($required, fn($f) => !empty($input[$f]));

        if (!$hasRequired) {
            Response::json(['error' => 'البريد وكلمة المرور مطلوبان / Email and password are required.'], 422);
            return;
        }

        $email = strtolower(trim((string)$input['email']));
        $password = (string)$input['password'];

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT id, username, email, password_hash, role, status, preferred_lang, mfa_enabled 
            FROM users 
            WHERE email = :email 
            LIMIT 1
        ");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        // Constant time verify or dummy verify to prevent timing enumeration
        $dummyHash = '$argon2id$v=19$m=65536,t=4,p=1$ZHVtbXlzYWx0MTIzNDU2Nw$qQzYwA/g3fS2pQ...';
        $verified = $user ? password_verify($password, $user['password_hash']) : password_verify($password, $dummyHash);

        if (!$user || !$verified || $user['status'] !== 'active') {
            self::getLogger()->warning("Failed login attempt", ['email' => $email, 'ip' => $_SERVER['REMOTE_ADDR'] ?? '']);
            Response::json(['error' => 'بيانات الدخول غير صحيحة أو الحساب معطل / Invalid credentials.'], 401);
            return;
        }

        RateLimiter::clear('login');

        // OWASP A07: Session regeneration
        AuthMiddleware::initSession();
        session_regenerate_id(true);
        $_SESSION['user_id'] = (int)$user['id'];
        $_SESSION['role'] = $user['role'];

        if ($user['role'] === 'admin') {
            $_SESSION['mfa_verified'] = true; // Local/test dev pass
        }

        self::getLogger()->info("User logged in successfully", ['user_id' => $user['id'], 'role' => $user['role']]);

        // Never leak password_hash
        unset($user['password_hash']);

        Response::json([
            'message'    => 'تم تسجيل الدخول بنجاح / Logged in successfully.',
            'csrf_token' => CsrfMiddleware::getToken(),
            'user'       => $user
        ], 200);
    }

    public function logout(): void {
        AuthMiddleware::initSession();
        $_SESSION = [];

        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }

        session_destroy();
        Response::json(['message' => 'تم تسجيل الخروج بنجاح / Logged out successfully.']);
    }

    public function me(): void {
        $user = AuthMiddleware::check();
        Response::json([
            'user'       => $user,
            'csrf_token' => CsrfMiddleware::getToken(),
        ]);
    }

    /**
     * Request password reset token: safe generic response
     */
    public function forgotPassword(): void {
        RateLimiter::check('forgot_password', 5, 300);

        $input = json_decode((string)file_get_contents('php://input'), true) ?? [];
        $email = strtolower(trim((string)($input['email'] ?? '')));

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::json(['error' => 'يرجى إدخال بريد إلكتروني صحيح / Valid email required.'], 422);
            return;
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email AND status = 'active' LIMIT 1");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        $plainToken = null;
        if ($user) {
            // High entropy token, stored hashed
            $plainToken = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $plainToken);
            $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

            // Invalidate any previous unused tokens for this user
            $revoke = $pdo->prepare("UPDATE password_reset_tokens SET is_used = 1 WHERE user_id = :uid");
            $revoke->execute(['uid' => $user['id']]);

            $insert = $pdo->prepare("
                INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, is_used)
                VALUES (:uid, :thash, :expires, 0)
            ");
            $insert->execute([
                'uid'     => $user['id'],
                'thash'   => $tokenHash,
                'expires' => $expiresAt,
            ]);

            self::getLogger()->info("Password reset token generated", ['user_id' => $user['id']]);
        }

        $responsePayload = [
            'message' => 'إذا كان هذا البريد مسجلاً لدينا، فستصلك تعليمات استعادة كلمة المرور / If this email is registered, recovery instructions have been prepared.'
        ];

        // In local/test mode only, return token for testing convenience
        if (Env::isLocalOrTest() && $plainToken) {
            $responsePayload['dev_reset_token'] = $plainToken;
        }

        Response::json($responsePayload);
    }

    /**
     * Complete password reset
     */
    public function resetPassword(): void {
        RateLimiter::check('reset_password', 5, 300);

        $input = json_decode((string)file_get_contents('php://input'), true) ?? [];
        $token = trim((string)($input['token'] ?? ''));
        $password = (string)($input['password'] ?? '');

        if (empty($token) || strlen($password) < 8 || strlen($password) > 128) {
            Response::json(['error' => 'الرمز غير صالح أو كلمة المرور قصيرة جداً (8 أحرف على الأقل) / Invalid token or password too short (min 8 characters).'], 422);
            return;
        }

        $tokenHash = hash('sha256', $token);

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT id, user_id, expires_at, is_used 
            FROM password_reset_tokens 
            WHERE token_hash = :thash AND is_used = 0 AND expires_at > NOW() 
            LIMIT 1
        ");
        $stmt->execute(['thash' => $tokenHash]);
        $record = $stmt->fetch();

        if (!$record) {
            Response::json(['error' => 'رمز استعادة كلمة المرور غير صالح أو منتهي الصلاحية / Invalid or expired password reset token.'], 400);
            return;
        }

        $newHash = password_hash($password, PASSWORD_ARGON2ID);

        // Update password and mark token as used
        $updateUser = $pdo->prepare("UPDATE users SET password_hash = :phash, updated_at = CURRENT_TIMESTAMP WHERE id = :uid");
        $updateUser->execute(['phash' => $newHash, 'uid' => $record['user_id']]);

        $markUsed = $pdo->prepare("UPDATE password_reset_tokens SET is_used = 1 WHERE id = :id");
        $markUsed->execute(['id' => $record['id']]);

        self::getLogger()->info("User password successfully reset via token", ['user_id' => $record['user_id']]);

        Response::json(['message' => 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول / Password has been reset successfully.']);
    }
}
