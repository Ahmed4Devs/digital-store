<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/vendor/autoload.php';

use App\Config\Database;
use Dotenv\Dotenv;

$baseDir = dirname(__DIR__);
if (file_exists($baseDir . '/.env')) {
    $dotenv = Dotenv::createImmutable($baseDir);
    $dotenv->safeLoad();
}

$env = $_ENV['APP_ENV'] ?? 'local';
echo "Running migrations in environment: [{$env}]\n";

try {
    $pdo = Database::getConnection();
    $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");

    // Ensure migrations tracking table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `migrations` (
            `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            `migration` VARCHAR(191) NOT NULL UNIQUE,
            `executed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $stmt = $pdo->query("SELECT migration FROM migrations");
    $applied = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $migrationDir = __DIR__ . '/../database/migrations';
    $files = glob($migrationDir . '/*.sql');
    sort($files);

    $ranCount = 0;
    foreach ($files as $file) {
        $name = basename($file);
        if (in_array($name, $applied, true)) {
            continue;
        }

        echo "Applying: {$name}... ";
        $sql = file_get_contents($file);
        if ($sql === false) {
            throw new RuntimeException("Could not read migration file: {$name}");
        }

        // Execute migration statements
        $pdo->exec($sql);

        // Record execution
        $ins = $pdo->prepare("INSERT INTO migrations (migration) VALUES (:name)");
        $ins->execute(['name' => $name]);

        echo "DONE\n";
        $ranCount++;
    }

    if ($ranCount === 0) {
        echo "Database is already up to date. No new migrations.\n";
    } else {
        echo "Successfully applied {$ranCount} migration(s).\n";
    }

} catch (Throwable $e) {
    echo "\n[ERROR] Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
