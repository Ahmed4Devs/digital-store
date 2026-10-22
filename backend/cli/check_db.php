<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Config\Database;

$dotenv = Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();

$db = Database::getConnection();

$stmt = $db->query("SELECT id, slug, title_ar, title_en, price_cents, status FROM products");
$products = $stmt->fetchAll();

echo "Total products: " . count($products) . PHP_EOL;
foreach ($products as $p) {
    echo "ID: {$p['id']} | Slug: {$p['slug']} | PriceCents: {$p['price_cents']} | Status: {$p['status']} | Title_AR: {$p['title_ar']}" . PHP_EOL;
}

$stmt2 = $db->query("SELECT id, product_id, storage_key, original_filename, file_size FROM product_assets");
$assets = $stmt2->fetchAll();
echo "Total assets: " . count($assets) . PHP_EOL;
foreach ($assets as $a) {
    echo "Asset ID: {$a['id']} | Product ID: {$a['product_id']} | Key: {$a['storage_key']} | File: {$a['original_filename']}" . PHP_EOL;
}

