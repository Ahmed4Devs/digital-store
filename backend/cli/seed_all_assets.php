<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();

$db = Database::getConnection();
$sampleSource = dirname(__DIR__) . '/storage/digital_assets/asset_sample_product.zip';

$products = [
    2 => 'react-19-saas-ui-kit.zip',
    3 => 'owasp-security-audit-toolkit.zip',
    4 => 'modern-interactive-icons-bundle.zip',
];

foreach ($products as $pid => $fn) {
    $targetPath = dirname(__DIR__) . '/storage/digital_assets/' . $fn;
    if (!file_exists($targetPath) && file_exists($sampleSource)) {
        copy($sampleSource, $targetPath);
    }

    $sha = file_exists($targetPath) ? hash_file('sha256', $targetPath) : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    $size = file_exists($targetPath) ? filesize($targetPath) : 1024;

    $check = $db->prepare('SELECT id FROM product_assets WHERE product_id = ?');
    $check->execute([$pid]);
    if (!$check->fetch()) {
        $in = $db->prepare('
            INSERT INTO product_assets (product_id, version, storage_key, original_filename, mime_type, file_size, sha256_checksum, upload_state) 
            VALUES (?, 1, ?, ?, ?, ?, ?, "active")
        ');
        $in->execute([$pid, $fn, $fn, 'application/zip', $size, $sha]);
        echo "Created asset record for product ID: {$pid}" . PHP_EOL;
    }
}

echo "All product assets seeded successfully." . PHP_EOL;
