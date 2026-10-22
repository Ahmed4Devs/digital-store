<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Cors;
use App\Config\Database;
use App\Config\Env;
use App\Controllers\AdminController;
use App\Controllers\AuthController;
use App\Controllers\DownloadController;
use App\Controllers\OrderController;
use App\Controllers\ProductController;
use App\Middleware\CsrfMiddleware;
use App\Middleware\RequestIdMiddleware;
use App\Middleware\SecurityHeadersMiddleware;
use App\Utils\Response;
use Bramus\Router\Router;
use Dotenv\Dotenv;

// Load environment variables
$dotenvPath = dirname(__DIR__);
if (file_exists($dotenvPath . '/.env')) {
    $dotenv = Dotenv::createImmutable($dotenvPath);
    $dotenv->safeLoad();
}

// 1. Validate environment & production safety gates (Section 9)
Env::validate();

// 2. Generate and attach Request ID to response and context (Section 11)
RequestIdMiddleware::handle();

// 3. Apply modern security headers (OWASP Mitigation, Section 2)
SecurityHeadersMiddleware::apply();

// 4. Handle CORS (exact allowlist, credentials supported, no wildcards)
Cors::handle();

// 5. CSRF Synchronizer Token verification for state-mutating requests (Section 7)
// Allow initial pre-flight, safe GET/HEAD, and CSRF token endpoint
$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '';
$isCsrfExempt = in_array($requestUri, [
    '/api/v1/auth/csrf',
    '/api/auth/csrf',
    '/api/v1/auth/login',
    '/api/auth/login',
    '/api/v1/auth/register',
    '/api/auth/register',
    '/api/v1/auth/forgot-password',
    '/api/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/auth/reset-password',
], true);

if (!$isCsrfExempt && strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'OPTIONS') {
    CsrfMiddleware::verify();
}

$router = new Router();

// ============================================================================
// Health Check
// ============================================================================
$healthHandler = function () {
    Response::json([
        'status'       => 'healthy',
        'env'          => Env::getEnv(),
        'payment_mode' => Env::getPaymentMode(),
        'timestamp'    => time(),
    ]);
};
$router->get('/api/v1/health', $healthHandler);
$router->get('/api/health', $healthHandler);

// ============================================================================
// CSRF & Authentication Routes
// ============================================================================
$csrfHandler = function () {
    (new AuthController())->csrf();
};
$router->get('/api/v1/auth/csrf', $csrfHandler);
$router->get('/api/auth/csrf', $csrfHandler);

$registerHandler = function () {
    (new AuthController())->register();
};
$router->post('/api/v1/auth/register', $registerHandler);
$router->post('/api/auth/register', $registerHandler);

$loginHandler = function () {
    (new AuthController())->login();
};
$router->post('/api/v1/auth/login', $loginHandler);
$router->post('/api/auth/login', $loginHandler);

$logoutHandler = function () {
    (new AuthController())->logout();
};
$router->post('/api/v1/auth/logout', $logoutHandler);
$router->post('/api/auth/logout', $logoutHandler);

$meHandler = function () {
    (new AuthController())->me();
};
$router->get('/api/v1/auth/me', $meHandler);
$router->get('/api/auth/me', $meHandler);

$forgotHandler = function () {
    (new AuthController())->forgotPassword();
};
$router->post('/api/v1/auth/forgot-password', $forgotHandler);
$router->post('/api/auth/forgot-password', $forgotHandler);

$resetHandler = function () {
    (new AuthController())->resetPassword();
};
$router->post('/api/v1/auth/reset-password', $resetHandler);
$router->post('/api/auth/reset-password', $resetHandler);

// ============================================================================
// Public Catalog Routes (published products only)
// ============================================================================
$productsIndexHandler = function () {
    (new ProductController())->index();
};
$router->get('/api/v1/products', $productsIndexHandler);
$router->get('/api/products', $productsIndexHandler);

$productsShowHandler = function (string $slug) {
    (new ProductController())->show($slug);
};
$router->get('/api/v1/products/{slug}', $productsShowHandler);
$router->get('/api/products/{slug}', $productsShowHandler);

// ============================================================================
// Orders & Customer Downloads
// ============================================================================
$checkoutHandler = function () {
    (new OrderController())->checkout();
};
$router->post('/api/v1/orders/checkout', $checkoutHandler);
$router->post('/api/orders/checkout', $checkoutHandler);

$myDownloadsHandler = function () {
    (new OrderController())->myDownloads();
};
$router->get('/api/v1/orders/my-downloads', $myDownloadsHandler);
$router->get('/api/orders/my-downloads', $myDownloadsHandler);

// ============================================================================
// Download Delivery (Authenticated & ownership checked)
// ============================================================================
$downloadTokenHandler = function (string $token) {
    (new DownloadController())->downloadByToken($token);
};
$router->get('/api/v1/download/{token}', $downloadTokenHandler);
$router->get('/api/download/{token}', $downloadTokenHandler);

$downloadGrantHandler = function (string $grantId) {
    (new DownloadController())->downloadByGrant($grantId);
};
$router->get('/api/v1/download/grant/{grantId}', $downloadGrantHandler);
$router->get('/api/download/grant/{grantId}', $downloadGrantHandler);

// ============================================================================
// Admin Management Routes
// ============================================================================
$router->get('/api/v1/admin/stats', function () {
    (new AdminController())->stats();
});

$router->get('/api/v1/admin/audit-logs', function () {
    (new AdminController())->auditLogs();
});

$router->get('/api/v1/admin/products', function () {
    (new ProductController())->adminIndex();
});

$router->post('/api/v1/admin/products', function () {
    (new ProductController())->adminStore();
});

$router->put('/api/v1/admin/products/{id}', function (string $id) {
    (new ProductController())->adminUpdate($id);
});

$router->post('/api/v1/admin/products/{id}/assets', function (string $id) {
    (new ProductController())->adminUploadAsset($id);
});

$router->get('/api/v1/admin/orders', function () {
    (new OrderController())->adminOrders();
});

// ============================================================================
// 404 Handler
// ============================================================================
$router->set404(function () {
    Response::json(['error' => 'المسار المطلوب غير موجود / Route not found.', 'code' => 'NOT_FOUND'], 404);
});

$router->run();
