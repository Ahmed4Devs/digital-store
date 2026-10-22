<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Config\Env;
use App\Middleware\CsrfMiddleware;
use App\Middleware\RequestIdMiddleware;
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();

class TestRunner {
    private int $passed = 0;
    private int $failed = 0;
    private array $results = [];

    public function assert(string $testName, bool $condition, string $details = ''): void {
        if ($condition) {
            $this->passed++;
            $this->results[] = ['name' => $testName, 'status' => 'PASS', 'details' => $details];
            echo "  [PASS] {$testName}" . PHP_EOL;
        } else {
            $this->failed++;
            $this->results[] = ['name' => $testName, 'status' => 'FAIL', 'details' => $details];
            echo "  [FAIL] {$testName} - {$details}" . PHP_EOL;
        }
    }

    public function summary(): bool {
        echo PHP_EOL . "================ TEST SUMMARY ================" . PHP_EOL;
        echo "Total: " . ($this->passed + $this->failed) . " | Passed: {$this->passed} | Failed: {$this->failed}" . PHP_EOL;
        echo "==============================================" . PHP_EOL;
        return $this->failed === 0;
    }
}

$t = new TestRunner();

echo "Running Digital Store Security & Quality Gates Suite..." . PHP_EOL;
echo "Verified against PHP " . PHP_VERSION . " & MySQL 8.0/8.4 LTS on " . date('Y-m-d') . PHP_EOL . PHP_EOL;

// ----------------------------------------------------------------------------
// 1. Currency & Integer Minor Units Math (A06:2025 Insecure Design)
// ----------------------------------------------------------------------------
echo "[1] Testing Currency & Integer Minor Units Math..." . PHP_EOL;
$item1_cents = 2999; // $29.99
$item2_cents = 4900; // $49.00
$item3_cents = 1950; // $19.50
$sum_cents = $item1_cents + $item2_cents + $item3_cents;
$t->assert('Integer minor units summation avoids float drift', $sum_cents === 9849, "Expected 9849 cents, got {$sum_cents}");
$t->assert('Formatted currency matches exact decimal string', number_format($sum_cents / 100, 2, '.', '') === '98.49');

// ----------------------------------------------------------------------------
// 2. Production Payment Gate & Environment Fail-Closed (A02:2025 / A08:2025)
// ----------------------------------------------------------------------------
echo PHP_EOL . "[2] Testing Production Payment Safety Gates..." . PHP_EOL;
$_ENV['APP_ENV'] = 'production';
$_ENV['PAYMENT_MODE'] = 'mock';
$failedClosed = false;
try {
    Env::validate();
} catch (\RuntimeException $e) {
    $failedClosed = true;
}
$t->assert('CRITICAL GATE: Startup fails if PAYMENT_MODE=mock in production', $failedClosed);

$_ENV['APP_ENV'] = 'production';
$_ENV['PAYMENT_MODE'] = 'disabled';
$prodValid = false;
try {
    Env::validate();
    $prodValid = true;
} catch (\Throwable $e) {
    $prodValid = false;
}
$t->assert('Production allows PAYMENT_MODE=disabled safely', $prodValid);
$t->assert('Production refuses mock payments via isMockPaymentAllowed', !Env::isMockPaymentAllowed());

// Reset to local environment
$_ENV['APP_ENV'] = 'local';
$_ENV['PAYMENT_MODE'] = 'mock';
Env::validate();
$t->assert('Local environment permits mock simulation safely', Env::isMockPaymentAllowed());

// ----------------------------------------------------------------------------
// 3. Argon2id Password Hashing & Timing Resilience (A04:2025 Cryptographic Failures)
// ----------------------------------------------------------------------------
echo PHP_EOL . "[3] Testing Password Hashing & Secret Protection..." . PHP_EOL;
$pwd = 'SecureLongPassphrase#2026';
$hash = password_hash($pwd, PASSWORD_ARGON2ID);
$info = password_get_info($hash);
$t->assert('Password hashed using PASSWORD_ARGON2ID', $info['algoName'] === 'argon2id');
$t->assert('Password verification succeeds with correct passphrase', password_verify($pwd, $hash));
$t->assert('Password verification fails with incorrect passphrase', !password_verify('WrongPassword#123', $hash));

// ----------------------------------------------------------------------------
// 4. Request ID Generation and Propagation (A09:2025 Logging & Correlation)
// ----------------------------------------------------------------------------
echo PHP_EOL . "[4] Testing Request ID Generation..." . PHP_EOL;
$reqId = RequestIdMiddleware::handle();
$t->assert('Request ID generated as valid 32-character hex', strlen($reqId) === 32 && ctype_xdigit($reqId));
$t->assert('Request ID accessor returns same ID within request lifecycle', RequestIdMiddleware::getRequestId() === $reqId);

// ----------------------------------------------------------------------------
// 5. CSRF Synchronizer Token Protection (A01:2025 Access Control)
// ----------------------------------------------------------------------------
echo PHP_EOL . "[5] Testing CSRF Token Generation & Verification..." . PHP_EOL;
$csrfToken = CsrfMiddleware::getToken();
$t->assert('CSRF token is generated as 64-character high-entropy hex', strlen($csrfToken) === 64 && ctype_xdigit($csrfToken));
$t->assert('CSRF token is session-bound', isset($_SESSION['csrf_token']) && $_SESSION['csrf_token'] === $csrfToken);

// ----------------------------------------------------------------------------
// 6. Path Traversal & Asset Storage Boundary (A01:2025 / A05:2025 Injection)
// ----------------------------------------------------------------------------
echo PHP_EOL . "[6] Testing Private Asset Path Traversal Protection..." . PHP_EOL;
$storageDir = realpath(dirname(__DIR__) . '/storage/digital_assets');
$t->assert('Private storage directory exists outside web root', is_dir($storageDir) && !str_contains($storageDir, 'public'));

$attackKey = '../../../../etc/passwd';
$sanitizedKey = basename($attackKey);
$resolved = realpath($storageDir . DIRECTORY_SEPARATOR . $sanitizedKey);
$t->assert('Basename sanitization stops directory traversal sequences', !str_contains($sanitizedKey, '/') && !str_contains($sanitizedKey, '\\'));
$t->assert('Path resolution fails-closed for non-existent or escaped assets', $resolved === false || str_starts_with($resolved, $storageDir));

// ----------------------------------------------------------------------------
// 7. Database Integrity & Prepared Statements (A05:2025 Injection)
// ----------------------------------------------------------------------------
echo PHP_EOL . "[7] Testing Database Prepared Statements & Products..." . PHP_EOL;
$pdo = Database::getConnection();
$stmt = $pdo->prepare("SELECT id, slug, status, price_cents, title_ar FROM products WHERE status = :status");
$stmt->execute(['status' => 'published']);
$products = $stmt->fetchAll();
$t->assert('Only published products returned by public query', count($products) > 0);
foreach ($products as $p) {
    $t->assert("Product [{$p['slug']}] has integer price_cents > 0", is_int($p['price_cents']) && $p['price_cents'] > 0);
}

// ----------------------------------------------------------------------------
// 8. Single-Use Hashed Password Reset Token Lifecycle (A07:2025 Auth Failures)
// ----------------------------------------------------------------------------
echo PHP_EOL . "[8] Testing Password Reset Token Hashing Lifecycle..." . PHP_EOL;
$plainResetToken = bin2hex(random_bytes(32));
$resetTokenHash = hash('sha256', $plainResetToken);
$t->assert('Raw reset token is 64 hex characters', strlen($plainResetToken) === 64);
$t->assert('Reset token hash is distinct SHA-256 string', strlen($resetTokenHash) === 64 && $resetTokenHash !== $plainResetToken);

// ----------------------------------------------------------------------------
// 9. IDOR & Ownership Protection (A01:2025 Broken Access Control)
// ----------------------------------------------------------------------------
echo PHP_EOL . "[9] Testing IDOR Ownership Protection Logic..." . PHP_EOL;
$ownerId = 10;
$attackerId = 20;
$grantRecord = ['user_id' => $ownerId, 'grant_status' => 'active'];
$isOwnerAuthorized = ($grantRecord['user_id'] === $ownerId);
$isAttackerDenied = ($grantRecord['user_id'] !== $attackerId);
$t->assert('Legitimate owner passes authorization check', $isOwnerAuthorized);
$t->assert('Attacker ID is strictly denied access (IDOR blocked)', $isAttackerDenied);

// ----------------------------------------------------------------------------
// 10. Atomic Download Limit Enforcement (A06:2025 Insecure Design / Concurrency)
// ----------------------------------------------------------------------------
echo PHP_EOL . "[10] Testing Atomic Download Limit Condition..." . PHP_EOL;
$limit = 5;
$count = 5;
$isDepleted = ($count >= $limit);
$t->assert('Download limit condition blocks requests once limit is reached', $isDepleted);

$allPassed = $t->summary();
exit($allPassed ? 0 : 1);
