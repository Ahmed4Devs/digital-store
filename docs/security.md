# Security Architecture & OWASP Top 10:2025 Verification Matrix

## 1. Threat Model & Security Controls

The application is hardened against web application vulnerabilities in compliance with modern OWASP standards:

### 1.1 Authentication & Session Management
- **Passwords**: Hashed with `PASSWORD_ARGON2ID` using memory, time, and parallelism parameters. Never stored or logged in plaintext.
- **Session Security**: Server-side PHP sessions configured with `session.use_strict_mode = 1`, `session.use_only_cookies = 1`, `HttpOnly = true`, `SameSite = Lax`, and `Secure = true` (in production).
- **Session Rotation**: Session ID regenerated on login, privilege alteration, and credential update (`session_regenerate_id(true)`).
- **Timeouts**: 2-hour idle timeout and 24-hour absolute session expiration.
- **Password Reset**: Generates 256-bit entropy random tokens; stores only SHA-256 hashes in `password_reset_tokens`; single-use and valid for 1 hour. Generic responses prevent account enumeration.

### 1.2 Cross-Site Request Forgery (CSRF)
- Synchronizer token bound to server-side session (`$_SESSION['csrf_token']`).
- Required on all mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) via the `X-CSRF-Token` request header.
- Validated via constant-time string comparison (`hash_equals`).

### 1.3 Access Control & Insecure Direct Object References (IDOR)
- Server-side authorization check executes on every request; never trusts client state or sequential IDs.
- Order details and digital download delivery explicitly verify that `order.user_id === session.user_id`.
- Administrative endpoints mandate `role === 'admin'` and MFA state.

### 1.4 Digital Asset Storage & Delivery
- Uploaded files are stored **outside the public web document root** (`backend/storage/digital_assets/`).
- Filenames from users are discarded; files are assigned random opaque internal keys (`storage_key`).
- MIME types inspected via PHP `finfo` (Fileinfo) and SHA-256 digests computed at upload.
- Strict path traversal prevention: Storage key is sanitized with `basename()` and validated against canonical root directory via `str_starts_with(realpath(...), $storageDir)`.
- Streaming headers enforce `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`, and sanitized `Content-Disposition`.

### 1.5 Mock Payment Production Safety Gate
- Enumerated environments: `local`, `test`, `production`.
- In production, `PAYMENT_MODE=mock` **fails application startup** immediately.
- Production requires `PAYMENT_MODE=disabled`. Checkout returns `403 CHECKOUT_DISABLED` and cannot fulfill orders.
- Client requests cannot declare payments successful.

---

## 2. Official OWASP Top 10:2025 Verification Matrix

| OWASP Top 10:2025 Category | Threat & Application Context | Required Control | Verification Method & Actual Result | Status |
|---|---|---|---|---|
| **A01:2025 Broken Access Control** | IDOR on orders, download links, and admin actions. Horizontal privilege escalation between customers. | Server-side ownership validation (`order.user_id == current_user.id`). Deny-by-default on all admin routes. | Verified in `backend/tests/run_tests.php` (Test 9) with mismatched owner ID and attacker ID; access strictly denied (403). | **VERIFIED (PASS)** |
| **A02:2025 Security Misconfiguration** | Exposed `.env`, stack traces in API responses, permissive CORS wildcard, mock active in production. | Clean error wrappers (no SQL/path leakage); exact CORS allowlist; startup check aborts if mock active in prod. | Verified in `backend/tests/run_tests.php` (Test 2); startup exception thrown when `PAYMENT_MODE=mock` in production. | **VERIFIED (PASS)** |
| **A03:2025 Software Supply Chain Failures** | Compromised, vulnerable, or unpinned dependencies in Composer or npm. | Locked versions committed in `composer.lock` and `package-lock.json`. Minimal maintained dependencies. | Zero unreviewed packages; locked dependencies built cleanly via `npm run build` and Composer. | **VERIFIED (PASS)** |
| **A04:2025 Cryptographic Failures** | Plaintext passwords, weak tokens, sensitive secrets exposed in database or logs. | Argon2id password hashing; SHA-256 hashed download and reset tokens; sensitive data redaction in `AuditLogger`. | Verified in `backend/tests/run_tests.php` (Test 3 & 8); Argon2id verified, reset token hash checked at rest. | **VERIFIED (PASS)** |
| **A05:2025 Injection** | SQL injection, XSS, header injection, path traversal. | PDO prepared statements with `PDO::ATTR_EMULATE_PREPARES => false`; React text auto-escaping; `basename()` path boundary checks. | Verified in `backend/tests/run_tests.php` (Test 6 & 7); parameterized queries verified, path escape blocked. | **VERIFIED (PASS)** |
| **A06:2025 Insecure Design** | Client price manipulation, float rounding drift, unlimited downloads, concurrent race conditions. | Server recalculates totals from `products.price_cents` (minor units); atomic SQL decrement for download limits. | Verified in `backend/tests/run_tests.php` (Test 1 & 10); integer math tested, download limit enforced. | **VERIFIED (PASS)** |
| **A07:2025 Authentication Failures** | Brute force, session fixation, account enumeration. | Session ID regeneration on login; Argon2id; rate limiter (`RateLimiter`); generic login/reset messages. | Verified in `backend/tests/run_tests.php` (Test 3 & 5); session rotation and constant-time checks verified. | **VERIFIED (PASS)** |
| **A08:2025 Software & Data Integrity Failures** | Client-asserted payment success, unauthorized state transitions. | State machine enforces `pending` -> `completed` transition via server adapter only; client status claims rejected. | Verified in `backend/src/Controllers/OrderController.php`; order state machine strictly controlled on server. | **VERIFIED (PASS)** |
| **A09:2025 Security Logging & Alerting Failures** | Uncorrelated errors, actions invisible, credentials logged. | `X-Request-Id` attached to every request; audit logging with automatic redaction of passwords and tokens. | Verified in `backend/tests/run_tests.php` (Test 4); 32-char hex request IDs generated and propagated. | **VERIFIED (PASS)** |
| **A10:2025 Mishandling of Exceptional Conditions** | Fail-open transactions, partial order fulfillment on failure. | PDO transactions (`beginTransaction`, `commit`, `rollBack`); fail-closed exception handling. | Verified in `backend/src/Controllers/OrderController.php`; rollback executed on any failure, zero partial state. | **VERIFIED (PASS)** |

---

## 3. Security Headers Profile

Every response emitted by `backend/public/index.php` contains:

```http
Content-Type: application/json; charset=UTF-8
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' http://localhost:* http://127.0.0.1:*; frame-ancestors 'none'; object-src 'none'; base-uri 'self';
X-Request-Id: <32-hex-characters>
```
