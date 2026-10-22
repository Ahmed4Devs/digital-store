<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Services\AuditLogger;
use App\Utils\Response;
use finfo;
use PDO;

class ProductController {
    /**
     * Public catalog listing: returns only PUBLISHED products
     */
    public function index(): void {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT p.id, p.slug, p.title, p.title_ar, p.title_en, 
                   p.description, p.description_ar, p.description_en,
                   p.price_cents, p.currency, p.thumbnail_url, p.created_at,
                   COALESCE(pa.file_size, 0) AS file_size,
                   COALESCE(pa.mime_type, 'application/zip') AS mime_type
            FROM products p
            LEFT JOIN product_assets pa ON pa.product_id = p.id AND pa.upload_state = 'active'
            WHERE p.status = 'published'
            ORDER BY p.id ASC
        ");
        $stmt->execute();
        $products = $stmt->fetchAll();

        // Format helper fields for compatibility
        $formatted = array_map(function ($p) {
            $p['price'] = number_format($p['price_cents'] / 100, 2, '.', '');
            return $p;
        }, $products);

        Response::json(['products' => $formatted]);
    }

    /**
     * Public single product details: only if PUBLISHED
     */
    public function show(string $slug): void {
        $cleanSlug = trim($slug);

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT p.id, p.slug, p.title, p.title_ar, p.title_en, 
                   p.description, p.description_ar, p.description_en,
                   p.price_cents, p.currency, p.thumbnail_url, p.created_at,
                   COALESCE(pa.file_size, 0) AS file_size,
                   COALESCE(pa.mime_type, 'application/zip') AS mime_type
            FROM products p
            LEFT JOIN product_assets pa ON pa.product_id = p.id AND pa.upload_state = 'active'
            WHERE p.slug = :slug AND p.status = 'published'
            LIMIT 1
        ");
        $stmt->execute(['slug' => $cleanSlug]);
        $product = $stmt->fetch();

        if (!$product) {
            Response::json(['error' => 'المنتج غير موجود أو غير منشور / Product not found or not published.'], 404);
            return;
        }

        $product['price'] = number_format($product['price_cents'] / 100, 2, '.', '');

        Response::json(['product' => $product]);
    }

    /**
     * Admin: List all products (draft, published, archived)
     */
    public function adminIndex(): void {
        $admin = AuthMiddleware::requireAdmin();

        $pdo = Database::getConnection();
        $stmt = $pdo->query("
            SELECT p.id, p.slug, p.title, p.title_ar, p.title_en,
                   p.description, p.description_ar, p.description_en,
                   p.status, p.price_cents, p.currency, p.thumbnail_url, p.created_at, p.updated_at,
                   COUNT(pa.id) AS asset_count
            FROM products p
            LEFT JOIN product_assets pa ON pa.product_id = p.id
            GROUP BY p.id
            ORDER BY p.id DESC
        ");
        $products = $stmt->fetchAll();

        $formatted = array_map(function ($p) {
            $p['price'] = number_format($p['price_cents'] / 100, 2, '.', '');
            return $p;
        }, $products);

        Response::json(['products' => $formatted]);
    }

    /**
     * Admin: Create product
     */
    public function adminStore(): void {
        $admin = AuthMiddleware::requireAdmin();

        $input = json_decode((string)file_get_contents('php://input'), true) ?? [];

        $titleAr = trim((string)($input['title_ar'] ?? ''));
        $titleEn = trim((string)($input['title_en'] ?? ''));
        $priceCents = (int)($input['price_cents'] ?? 0);
        $status = in_array($input['status'] ?? '', ['draft', 'published', 'archived'], true) ? $input['status'] : 'draft';
        $descAr = trim((string)($input['description_ar'] ?? ''));
        $descEn = trim((string)($input['description_en'] ?? ''));
        $thumb = trim((string)($input['thumbnail_url'] ?? ''));

        if (empty($titleAr) || empty($titleEn) || $priceCents <= 0) {
            Response::json(['error' => 'العنوان باللغتين والسعر بوحدات السنت مطلوبة / Arabic and English titles and valid price_cents are required.'], 422);
            return;
        }

        // Generate unique slug
        $baseSlug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $titleEn));
        $baseSlug = trim($baseSlug, '-');
        if (empty($baseSlug)) {
            $baseSlug = 'product-' . bin2hex(random_bytes(4));
        }

        $pdo = Database::getConnection();
        $slug = $baseSlug;
        $counter = 1;
        while (true) {
            $check = $pdo->prepare("SELECT id FROM products WHERE slug = :slug LIMIT 1");
            $check->execute(['slug' => $slug]);
            if (!$check->fetch()) {
                break;
            }
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $stmt = $pdo->prepare("
            INSERT INTO products (slug, title, title_ar, title_en, description, description_ar, description_en, status, price_cents, currency, thumbnail_url)
            VALUES (:slug, :title, :title_ar, :title_en, :desc, :desc_ar, :desc_en, :status, :price_cents, 'USD', :thumb)
        ");
        $stmt->execute([
            'slug'        => $slug,
            'title'       => $titleAr,
            'title_ar'    => $titleAr,
            'title_en'    => $titleEn,
            'desc'        => $descAr,
            'desc_ar'     => $descAr,
            'desc_en'     => $descEn,
            'status'      => $status,
            'price_cents' => $priceCents,
            'thumb'       => !empty($thumb) ? $thumb : null,
        ]);

        $productId = (int)$pdo->lastInsertId();

        AuditLogger::log((int)$admin['id'], 'create_product', 'product', $productId, 'success', [
            'slug'        => $slug,
            'price_cents' => $priceCents,
            'status'      => $status
        ]);

        Response::json([
            'message'    => 'تم إنشاء المنتج بنجاح / Product created successfully.',
            'product_id' => $productId,
            'slug'       => $slug,
        ], 201);
    }

    /**
     * Admin: Update product details and publication status
     */
    public function adminUpdate(string $id): void {
        $admin = AuthMiddleware::requireAdmin();
        $productId = (int)$id;

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT id, slug, status FROM products WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $productId]);
        $existing = $stmt->fetch();

        if (!$existing) {
            Response::json(['error' => 'المنتج غير موجود / Product not found.'], 404);
            return;
        }

        $input = json_decode((string)file_get_contents('php://input'), true) ?? [];

        $titleAr = trim((string)($input['title_ar'] ?? ''));
        $titleEn = trim((string)($input['title_en'] ?? ''));
        $priceCents = isset($input['price_cents']) ? (int)$input['price_cents'] : null;
        $status = in_array($input['status'] ?? '', ['draft', 'published', 'archived'], true) ? $input['status'] : null;
        $descAr = trim((string)($input['description_ar'] ?? ''));
        $descEn = trim((string)($input['description_en'] ?? ''));
        $thumb = trim((string)($input['thumbnail_url'] ?? ''));

        $updateSql = "UPDATE products SET updated_at = CURRENT_TIMESTAMP";
        $params = ['id' => $productId];

        if (!empty($titleAr)) {
            $updateSql .= ", title = :title, title_ar = :title_ar";
            $params['title'] = $titleAr;
            $params['title_ar'] = $titleAr;
        }
        if (!empty($titleEn)) {
            $updateSql .= ", title_en = :title_en";
            $params['title_en'] = $titleEn;
        }
        if ($priceCents !== null && $priceCents > 0) {
            $updateSql .= ", price_cents = :price_cents";
            $params['price_cents'] = $priceCents;
        }
        if ($status !== null) {
            $updateSql .= ", status = :status";
            $params['status'] = $status;
        }
        if (!empty($descAr)) {
            $updateSql .= ", description = :desc, description_ar = :desc_ar";
            $params['desc'] = $descAr;
            $params['desc_ar'] = $descAr;
        }
        if (!empty($descEn)) {
            $updateSql .= ", description_en = :desc_en";
            $params['desc_en'] = $descEn;
        }
        if (!empty($thumb)) {
            $updateSql .= ", thumbnail_url = :thumb";
            $params['thumb'] = $thumb;
        }

        $updateSql .= " WHERE id = :id";
        $updateStmt = $pdo->prepare($updateSql);
        $updateStmt->execute($params);

        AuditLogger::log((int)$admin['id'], 'update_product', 'product', $productId, 'success', [
            'changes' => array_keys($params)
        ]);

        Response::json(['message' => 'تم تحديث بيانات المنتج بنجاح / Product updated successfully.']);
    }

    /**
     * Admin: Upload digital product asset with strict MIME verification and SHA-256
     */
    public function adminUploadAsset(string $id): void {
        $admin = AuthMiddleware::requireAdmin();
        $productId = (int)$id;

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT id, slug FROM products WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $productId]);
        $product = $stmt->fetch();

        if (!$product) {
            Response::json(['error' => 'المنتج غير موجود / Product not found.'], 404);
            return;
        }

        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            Response::json(['error' => 'فشل تحميل الملف أو لم يتم تحديد ملف صالح / Upload failed or invalid file.'], 400);
            return;
        }

        $file = $_FILES['file'];
        $tmpPath = $file['tmp_name'];
        $originalFilename = basename((string)$file['name']);
        $fileSize = (int)$file['size'];

        // Enforce max upload size: 100MB
        if ($fileSize <= 0 || $fileSize > 100 * 1024 * 1024) {
            Response::json(['error' => 'حجم الملف يتجاوز الحد المسموح به (100 ميغابايت) / File size exceeds limit (100MB).'], 422);
            return;
        }

        // Strict Fileinfo inspection (OWASP A04/File Upload)
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo->file($tmpPath);

        $allowedMimes = [
            'application/zip',
            'application/x-zip-compressed',
            'application/pdf',
            'application/epub+zip',
            'application/json',
            'application/octet-stream',
        ];

        if (!in_array($detectedMime, $allowedMimes, true)) {
            Response::json(['error' => "نوع الملف غير مدعوم ({$detectedMime}) / Unsupported file MIME type."], 422);
            return;
        }

        // Compute SHA-256 digest
        $sha256 = hash_file('sha256', $tmpPath);

        // Generate opaque random storage key outside public web root
        $extension = pathinfo($originalFilename, PATHINFO_EXTENSION);
        $cleanExt = !empty($extension) ? strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $extension)) : 'zip';
        $storageKey = bin2hex(random_bytes(20)) . '.' . $cleanExt;

        $targetDir = dirname(__DIR__, 2) . '/storage/digital_assets';
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $targetPath = $targetDir . '/' . $storageKey;
        if (!move_uploaded_file($tmpPath, $targetPath)) {
            Response::json(['error' => 'تعذر حفظ الملف في التخزين الآمن / Failed to store asset securely.'], 500);
            return;
        }

        // Determine next version
        $vStmt = $pdo->prepare("SELECT COALESCE(MAX(version), 0) + 1 AS next_v FROM product_assets WHERE product_id = :pid");
        $vStmt->execute(['pid' => $productId]);
        $version = (int)($vStmt->fetch()['next_v'] ?? 1);

        // Insert product asset record
        $assetStmt = $pdo->prepare("
            INSERT INTO product_assets (product_id, version, storage_key, original_filename, mime_type, file_size, sha256_checksum, upload_state, uploader_id)
            VALUES (:pid, :version, :key, :filename, :mime, :size, :sha256, 'active', :uploader_id)
        ");
        $assetStmt->execute([
            'pid'         => $productId,
            'version'     => $version,
            'key'         => $storageKey,
            'filename'    => $originalFilename,
            'mime'        => $detectedMime,
            'size'        => $fileSize,
            'sha256'      => $sha256,
            'uploader_id' => $admin['id'],
        ]);

        $assetId = (int)$pdo->lastInsertId();

        AuditLogger::log((int)$admin['id'], 'upload_asset', 'product_asset', $assetId, 'success', [
            'product_id' => $productId,
            'version'    => $version,
            'filename'   => $originalFilename,
            'size'       => $fileSize,
            'sha256'     => $sha256,
        ]);

        Response::json([
            'message'    => 'تم رفع وحفظ الأصل الرقمي بنجاح وتحديث الإصدار / Asset uploaded and version incremented successfully.',
            'asset_id'   => $assetId,
            'version'    => $version,
            'file_size'  => $fileSize,
            'sha256'     => $sha256,
        ], 201);
    }
}
