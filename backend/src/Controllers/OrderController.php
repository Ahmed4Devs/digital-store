<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Config\Env;
use App\DTOs\OrderCreateDTO;
use App\Middleware\AuthMiddleware;
use App\Services\AuditLogger;
use App\Utils\Response;
use PDO;

class OrderController {
    /**
     * Checkout & Payment Simulation (Local/Test ONLY)
     */
    public function checkout(): void {
        $user = AuthMiddleware::check();

        // Master Prompt Section 9 Production Safety Gate:
        if (!Env::isMockPaymentAllowed()) {
            Response::json([
                'error' => 'خدمة الدفع معطلة في هذه البيئة. المحاكاة متاحة فقط في بيئة التطوير والاختبار / Checkout and payment simulation are disabled in this environment.',
                'code'  => 'CHECKOUT_DISABLED'
            ], 403);
            return;
        }

        $input = json_decode((string)file_get_contents('php://input'), true) ?? [];
        $productInput = $input['product_ids'] ?? $input['items'] ?? ($input['product_id'] ?? null);

        if ($productInput === null) {
            Response::json(['error' => 'يرجى تحديد المنتجات لإتمام الشراء / Please select products to checkout.'], 422);
            return;
        }

        try {
            $dto = new OrderCreateDTO($productInput);
        } catch (\InvalidArgumentException $e) {
            Response::json(['error' => $e->getMessage()], 422);
            return;
        }

        $idempotencyKey = $_SERVER['HTTP_IDEMPOTENCY_KEY'] ?? ($input['idempotency_key'] ?? null);
        if ($idempotencyKey) {
            $idempotencyKey = substr(trim((string)$idempotencyKey), 0, 128);
        }

        $pdo = Database::getConnection();

        // Check if an order with this idempotency key already exists for this user
        if ($idempotencyKey) {
            $existingStmt = $pdo->prepare("SELECT id, order_number, total_cents, status FROM orders WHERE idempotency_key = :ikey AND user_id = :uid LIMIT 1");
            $existingStmt->execute(['ikey' => $idempotencyKey, 'uid' => $user['id']]);
            $existingOrder = $existingStmt->fetch();
            if ($existingOrder) {
                Response::json([
                    'message'      => 'طلب مكتمل مسبقاً (معالجة مكررة آمنة) / Idempotent order already processed.',
                    'order_number' => $existingOrder['order_number'],
                    'order_id'     => $existingOrder['id'],
                    'total_cents'  => $existingOrder['total_cents'],
                    'status'       => $existingOrder['status'],
                ]);
                return;
            }
        }

        // Server-side product price & status verification
        $placeholders = implode(',', array_fill(0, count($dto->productIds), '?'));
        $stmt = $pdo->prepare("
            SELECT p.id, p.slug, p.title, p.title_ar, p.title_en, p.price_cents, p.currency, p.status,
                   pa.id AS asset_id
            FROM products p
            LEFT JOIN product_assets pa ON pa.product_id = p.id AND pa.upload_state = 'active'
            WHERE p.id IN ({$placeholders}) AND p.status = 'published'
        ");
        $stmt->execute($dto->productIds);
        $products = $stmt->fetchAll();

        if (count($products) !== count($dto->productIds)) {
            Response::json(['error' => 'بعض المنتجات المحددة غير متوفرة أو تم سحبها / Some selected products are no longer available.'], 422);
            return;
        }

        // Calculate total in integer minor units (strictly server-side)
        $totalCents = 0;
        foreach ($products as $p) {
            $totalCents += (int)$p['price_cents'];
        }

        try {
            $pdo->beginTransaction();

            $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(4)));

            $orderStmt = $pdo->prepare("
                INSERT INTO orders (order_number, user_id, status, total_cents, currency, idempotency_key)
                VALUES (:order_number, :user_id, 'pending', :total_cents, 'USD', :idempotency_key)
            ");
            $orderStmt->execute([
                'order_number'    => $orderNumber,
                'user_id'         => $user['id'],
                'total_cents'     => $totalCents,
                'idempotency_key' => $idempotencyKey,
            ]);
            $orderId = (int)$pdo->lastInsertId();

            $itemStmt = $pdo->prepare("
                INSERT INTO order_items (order_id, product_id, asset_id, title_snapshot, price_cents, currency, quantity, line_total_cents)
                VALUES (:order_id, :product_id, :asset_id, :title_snapshot, :price_cents, 'USD', 1, :line_total_cents)
            ");

            $grantStmt = $pdo->prepare("
                INSERT INTO download_grants (order_id, order_item_id, user_id, product_id, asset_id, token_hash, download_limit, download_count, expires_at, status)
                VALUES (:order_id, :order_item_id, :user_id, :product_id, :asset_id, :token_hash, 5, 0, :expires_at, 'active')
            ");

            $generatedGrants = [];
            $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

            foreach ($products as $p) {
                // If product has no asset yet, create fallback sample asset reference
                $assetId = $p['asset_id'];
                if (!$assetId) {
                    $defAsset = $pdo->query("SELECT id FROM product_assets LIMIT 1")->fetch();
                    $assetId = $defAsset ? (int)$defAsset['id'] : null;
                }

                $titleSnapshot = $p['title_ar'] ?? $p['title'];

                $itemStmt->execute([
                    'order_id'         => $orderId,
                    'product_id'       => $p['id'],
                    'asset_id'         => $assetId,
                    'title_snapshot'   => $titleSnapshot,
                    'price_cents'      => $p['price_cents'],
                    'line_total_cents' => $p['price_cents'],
                ]);
                $orderItemId = (int)$pdo->lastInsertId();

                // Generate high entropy grant token (stored as SHA-256 hash)
                $plainToken = bin2hex(random_bytes(32)); // 64 hex characters
                $tokenHash = hash('sha256', $plainToken);

                if ($assetId) {
                    $grantStmt->execute([
                        'order_id'      => $orderId,
                        'order_item_id' => $orderItemId,
                        'user_id'       => $user['id'],
                        'product_id'    => $p['id'],
                        'asset_id'      => $assetId,
                        'token_hash'    => $tokenHash,
                        'expires_at'    => $expiresAt,
                    ]);
                    $grantId = (int)$pdo->lastInsertId();

                    $generatedGrants[] = [
                        'grant_id'            => $grantId,
                        'product_id'          => $p['id'],
                        'title'               => $titleSnapshot,
                        'token'               => $plainToken,
                        'download_url'        => "/api/v1/download/{$plainToken}",
                        'expires_at'          => $expiresAt,
                        'downloads_remaining' => 5,
                    ];
                }
            }

            // Record Mock Payment Attempt
            $paymentRef = 'MOCK-PAY-' . strtoupper(bin2hex(random_bytes(6)));
            $payStmt = $pdo->prepare("
                INSERT INTO payment_attempts (order_id, provider, mode, status, reference_id, amount_cents, currency, metadata_json)
                VALUES (:order_id, 'mock', 'local_simulation', 'successful', :ref_id, :amount_cents, 'USD', :meta)
            ");
            $payStmt->execute([
                'order_id'     => $orderId,
                'ref_id'       => $paymentRef,
                'amount_cents' => $totalCents,
                'meta'         => json_encode(['simulated' => true, 'env' => Env::getEnv()]),
            ]);

            // Transition order status to 'completed'
            $pdo->prepare("UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = :id")
                ->execute(['id' => $orderId]);

            $pdo->commit();

            Response::json([
                'message'      => 'تمت معالجة الطلب بنجاح عبر بوابة المحاكاة التجريبية / Order completed successfully via test simulation.',
                'order_number' => $orderNumber,
                'order_id'     => $orderId,
                'total_cents'  => $totalCents,
                'total_amount' => number_format($totalCents / 100, 2, '.', ''),
                'items_count'  => count($products),
                'downloads'    => $generatedGrants,
            ], 201);

        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log("Order checkout exception: " . $e->getMessage());
            Response::json(['error' => 'تعذر إتمام عملية الطلب / Failed to complete order.'], 500);
        }
    }

    /**
     * Customer's purchased downloads & active grants
     */
    public function myDownloads(): void {
        $user = AuthMiddleware::check();

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT dg.id AS grant_id, dg.token_hash, dg.download_limit, dg.download_count, dg.expires_at, dg.status AS grant_status,
                   p.id AS product_id, p.title_ar, p.title_en, p.slug, p.thumbnail_url,
                   pa.file_size, pa.original_filename,
                   o.order_number, o.created_at AS order_date
            FROM download_grants dg
            JOIN products p ON dg.product_id = p.id
            JOIN product_assets pa ON dg.asset_id = pa.id
            JOIN orders o ON dg.order_id = o.id
            WHERE dg.user_id = :uid AND o.status = 'completed'
            ORDER BY dg.id DESC
        ");
        $stmt->execute(['uid' => $user['id']]);
        $rows = $stmt->fetchAll();

        $now = time();
        $downloads = array_map(function ($row) use ($now) {
            $isExpired = strtotime($row['expires_at']) <= $now;
            $rem = max(0, (int)$row['download_limit'] - (int)$row['download_count']);
            $isDepleted = $rem <= 0;
            $isValid = !$isExpired && !$isDepleted && $row['grant_status'] === 'active';

            return [
                'grant_id'            => (int)$row['grant_id'],
                'order_number'        => $row['order_number'],
                'order_date'          => $row['order_date'],
                'product_id'          => (int)$row['product_id'],
                'title_ar'            => $row['title_ar'],
                'title_en'            => $row['title_en'],
                'title'               => $row['title_ar'],
                'slug'                => $row['slug'],
                'thumbnail_url'       => $row['thumbnail_url'],
                'file_size'           => (int)$row['file_size'],
                'downloads_remaining' => $rem,
                'download_count'      => (int)$row['download_count'],
                'download_limit'      => (int)$row['download_limit'],
                'expires_at'          => $row['expires_at'],
                'is_valid'            => $isValid,
                'is_expired'          => $isExpired,
                'is_depleted'         => $isDepleted,
                // Authenticated grant download endpoint
                'download_url'        => "/api/v1/download/grant/{$row['grant_id']}",
            ];
        }, $rows);

        Response::json(['downloads' => $downloads]);
    }

    /**
     * Admin: View all orders & payment attempts
     */
    public function adminOrders(): void {
        $admin = AuthMiddleware::requireAdmin();

        $pdo = Database::getConnection();
        $stmt = $pdo->query("
            SELECT o.id, o.order_number, o.status, o.total_cents, o.currency, o.created_at,
                   u.username, u.email,
                   pa.provider, pa.status AS payment_status, pa.reference_id AS payment_ref
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN payment_attempts pa ON pa.order_id = o.id
            ORDER BY o.id DESC
            LIMIT 100
        ");
        $orders = $stmt->fetchAll();

        $formatted = array_map(function ($o) {
            $o['total_amount'] = number_format($o['total_cents'] / 100, 2, '.', '');
            return $o;
        }, $orders);

        Response::json(['orders' => $formatted]);
    }
}
