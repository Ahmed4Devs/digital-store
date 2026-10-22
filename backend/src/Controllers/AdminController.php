<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Services\AuditLogger;
use App\Utils\Response;
use PDO;

class AdminController {
    public function stats(): void {
        $admin = AuthMiddleware::requireAdmin();
        $pdo = Database::getConnection();

        $totalProducts = (int)$pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
        $publishedProducts = (int)$pdo->query("SELECT COUNT(*) FROM products WHERE status = 'published'")->fetchColumn();
        $totalOrders = (int)$pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'completed'")->fetchColumn();
        $totalRevenueCents = (int)$pdo->query("SELECT COALESCE(SUM(total_cents), 0) FROM orders WHERE status = 'completed'")->fetchColumn();
        $totalUsers = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role = 'customer'")->fetchColumn();

        Response::json([
            'stats' => [
                'total_products'      => $totalProducts,
                'published_products'  => $publishedProducts,
                'total_orders'        => $totalOrders,
                'total_revenue_cents' => $totalRevenueCents,
                'total_revenue'       => number_format($totalRevenueCents / 100, 2, '.', ''),
                'total_customers'     => $totalUsers,
            ]
        ]);
    }

    public function auditLogs(): void {
        $admin = AuthMiddleware::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->query("
            SELECT al.id, al.action, al.entity_type, al.entity_id, al.result, al.request_id, 
                   al.redacted_details, al.created_at,
                   u.username AS actor_username, u.email AS actor_email
            FROM admin_audit_log al
            JOIN users u ON al.actor_id = u.id
            ORDER BY al.id DESC
            LIMIT 100
        ");
        $logs = $stmt->fetchAll();

        $formatted = array_map(function ($l) {
            $l['details'] = json_decode((string)($l['redacted_details'] ?? '{}'), true);
            unset($l['redacted_details']);
            return $l;
        }, $logs);

        Response::json(['audit_logs' => $formatted]);
    }
}
