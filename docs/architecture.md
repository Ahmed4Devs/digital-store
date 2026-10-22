# Architecture Documentation

## 1. System Overview

The **Digital Products Store** is engineered as a secure modular monolith designed for selling and delivering digital assets (e-books, software bundles, design kits). It couples a decoupled, accessible **React 19.3** single-page application with a high-performance **native PHP 8.5** versioned REST API (`/api/v1`) and a **MySQL 8.4 LTS / 8.0+ InnoDB** relational database.

```
+-------------------------------------------------------------+
|                      React 19.3 SPA                         |
|   (Bilingual Arabic/English RTL/LTR, Tailwind CSS 4.x)      |
+------------------------------+------------------------------+
                               | HTTPS / Same-Origin Cookies
                               | X-CSRF-Token / X-Request-Id
+------------------------------v------------------------------+
|                   PHP 8.5 Front Controller                  |
|                 (backend/public/index.php)                  |
+------------------------------+------------------------------+
                               |
       +-----------------------+-----------------------+
       |                       |                       |
+------v--------+      +-------v-------+       +-------v------+
| Auth & CSRF   |      | Catalog &     |       | Orders &     |
| Sessions,     |      | Versioned     |       | Mock Payment |
| Argon2id, MFA |      | Assets        |       | Adapter      |
+---------------+      +-------+-------+       +-------+------+
                               |                       |
                       +-------v-------+       +-------v------+
                       | Delivery &    |       | Audit Logger |
                       | Downloads     |       | & Monolog    |
                       +-------+-------+       +-------+------+
                               |                       |
+------------------------------v-----------------------v------+
|              MySQL 8.4 LTS InnoDB (utf8mb4)                 |
| (users, products, product_assets, orders, download_grants)  |
+-------------------------------------------------------------+
                               |
+------------------------------v------------------------------+
|         Local Private Storage (outside Web Root)            |
|              (backend/storage/digital_assets/)              |
+-------------------------------------------------------------+
```

## 2. Module Boundaries

The backend organizes domain concerns into explicit modules without framework lock-in:

1. **Identity & Session Management (`App\Controllers\AuthController`, `App\Middleware\AuthMiddleware`, `App\Middleware\CsrfMiddleware`)**:
   - Manages secure PHP sessions with `HttpOnly`, `SameSite=Lax`, and `Secure` cookie flags.
   - Session ID regeneration upon login, privilege elevation, and account changes.
   - Synchronizer CSRF tokens bound to server-side sessions (`X-CSRF-Token`).
   - Password hashing via Argon2id. Single-use hashed password reset tokens.

2. **Product Catalog & Digital Assets (`App\Controllers\ProductController`)**:
   - Exposes public catalog containing strictly published products (`status = 'published'`).
   - Protected admin product management (CRUD, status transition: `draft`, `published`, `archived`).
   - Secure asset versioning: MIME inspection with PHP Fileinfo, SHA-256 calculation, and private storage keys.

3. **Orders & Test Payment Simulation (`App\Controllers\OrderController`)**:
   - Server-side price calculation using integer minor units (`price_cents`).
   - Idempotency key protection preventing duplicate orders under network retries.
   - Order state machine (`pending` -> `completed` / `cancelled`).
   - **Production Safety Gate**: Mock payments are strictly confined to `local` and `test` environments. Application startup fails if `PAYMENT_MODE=mock` in production.

4. **Digital Delivery & Grant Verification (`App\Controllers\DownloadController`)**:
   - Double-check authorization on every stream request: validates session, user ownership, order completion, grant active status, expiration date, and atomic download limits.
   - Emits privacy-conscious audit records to `download_events`.
   - Streaming binary delivery with path traversal prevention and cache control.

5. **Operational Audit Logging (`App\Services\AuditLogger`)**:
   - Records administrative mutations into `admin_audit_log` with actor ID, action, entity, result, and correlated `request_id`.
   - Automatically redacts sensitive fields (passwords, tokens, credentials).

## 3. Database Schema & Relationships

All tables utilize MySQL InnoDB with foreign keys and strict mode:

- `users` (id, username, email, password_hash, role, status, verification_state, preferred_lang, mfa_enabled, created_at)
- `password_reset_tokens` (id, user_id, token_hash, expires_at, is_used)
- `products` (id, slug, title, title_ar, title_en, description, description_ar, description_en, status, price_cents, currency, thumbnail_url)
- `product_assets` (id, product_id, version, storage_key, original_filename, mime_type, file_size, sha256_checksum, upload_state, uploader_id)
- `orders` (id, order_number, user_id, status, total_cents, currency, idempotency_key, created_at)
- `order_items` (id, order_id, product_id, asset_id, title_snapshot, price_cents, currency, quantity, line_total_cents)
- `payment_attempts` (id, order_id, provider, mode, status, reference_id, amount_cents, currency, metadata_json)
- `download_grants` (id, order_id, order_item_id, user_id, product_id, asset_id, token_hash, download_limit, download_count, expires_at, status)
- `download_events` (id, grant_id, user_id, outcome, reason, request_id, ip_address, created_at)
- `admin_audit_log` (id, actor_id, action, entity_type, entity_id, result, request_id, redacted_details, created_at)

## 4. Order & Delivery State Machine

```
[Customer adds items to cart]
           │
           ▼
[POST /api/v1/orders/checkout]
           │
           ├─► Server recalculates total_cents from products.price_cents
           ├─► Verifies all products status = 'published'
           ├─► Evaluates Production Safety Gate:
           │     If APP_ENV == 'production': returns 403 (CHECKOUT_DISABLED)
           │
           ▼ (Database Transaction)
     INSERT INTO orders (status = 'pending')
     INSERT INTO order_items (immutable title & price snapshots)
     INSERT INTO payment_attempts (provider = 'mock', status = 'successful')
     UPDATE orders SET status = 'completed'
     INSERT INTO download_grants (token_hash = sha256(token), downloads = 5, expires = +7 days)
     COMMIT
           │
           ▼
[Returns plain token / grant reference to authenticated customer]
           │
           ▼
[GET /api/v1/download/{token} or /download/grant/{id}]
           │
           ├─► Authenticate session
           ├─► Verify grant belongs to current user
           ├─► Verify order status == 'completed'
           ├─► Verify grant.status == 'active' AND expires_at > NOW()
           ├─► Atomically update: download_count = download_count + 1 WHERE download_count < limit
           ├─► Resolve storage_key in private directory outside web root
           ├─► Log to download_events (allowed, request_id)
           └─► Stream binary with Content-Disposition attachment & no-store cache
```
