<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Config\Env;
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();

Env::validate();

echo "==========================================================" . PHP_EOL;
echo "  Digital Products Store - Bootstrap Administrator Tool   " . PHP_EOL;
echo "==========================================================" . PHP_EOL;

$username = $argv[1] ?? null;
$email    = $argv[2] ?? null;
$password = $argv[3] ?? null;

if (!$username) {
    echo "Enter Administrator Username [default: admin]: ";
    $handle = fopen("php://stdin", "r");
    $line = trim((string)fgets($handle));
    $username = !empty($line) ? $line : "admin";
}

if (!$email) {
    echo "Enter Administrator Email [default: admin@store.local]: ";
    $handle = fopen("php://stdin", "r");
    $line = trim((string)fgets($handle));
    $email = !empty($line) ? $line : "admin@store.local";
}

$generatedPassword = false;
if (!$password) {
    // Generate secure 16-character alphanumeric password if not provided
    $password = bin2hex(random_bytes(8)) . '!A1';
    $generatedPassword = true;
}

$pdo = Database::getConnection();

// Check if user exists
$stmt = $pdo->prepare("SELECT id, username, email, role FROM users WHERE email = :email OR username = :username LIMIT 1");
$stmt->execute(['email' => $email, 'username' => $username]);
$existing = $stmt->fetch();

if ($existing) {
    echo "User exists. Promoting user [ID: {$existing['id']}, Email: {$existing['email']}] to 'admin' role..." . PHP_EOL;
    $update = $pdo->prepare("
        UPDATE users 
        SET role = 'admin', status = 'active', verification_state = 'verified', updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
    ");
    $update->execute(['id' => $existing['id']]);

    if (!$generatedPassword) {
        $hash = password_hash($password, PASSWORD_ARGON2ID);
        $pwdStmt = $pdo->prepare("UPDATE users SET password_hash = :phash WHERE id = :id");
        $pwdStmt->execute(['phash' => $hash, 'id' => $existing['id']]);
        echo "Password updated successfully." . PHP_EOL;
    }
    echo "Administrator privileges granted successfully!" . PHP_EOL;
} else {
    $hash = password_hash($password, PASSWORD_ARGON2ID);
    $insert = $pdo->prepare("
        INSERT INTO users (username, email, password_hash, role, status, verification_state, preferred_lang)
        VALUES (:username, :email, :phash, 'admin', 'active', 'verified', 'ar')
    ");
    $insert->execute([
        'username' => $username,
        'email'    => $email,
        'phash'    => $hash,
    ]);
    $newId = (int)$pdo->lastInsertId();
    echo "New Administrator created with ID: {$newId}" . PHP_EOL;
}

echo PHP_EOL . "================ Credentials ================" . PHP_EOL;
echo "Username: " . $username . PHP_EOL;
echo "Email:    " . $email . PHP_EOL;
if ($generatedPassword) {
    echo "Temporary Password: " . $password . PHP_EOL;
    echo "IMPORTANT: Save this password or change it immediately upon login." . PHP_EOL;
} else {
    echo "Password: [Custom password configured]" . PHP_EOL;
}
echo "=============================================" . PHP_EOL;
