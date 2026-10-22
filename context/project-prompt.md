# Master Prompt for Coding Agent: Digital Products Store

Copy the entire prompt block below and pass it to your Coding Agent (Cursor, Claude Code, Antigravity, GitHub Copilot Workspace, etc.) to execute the project end-to-end.

***

```markdown
# MISSION: Autonomous Full-Stack Development of a Secure Digital Products Store

You are an expert Principal Full-Stack Engineer and Security Specialist. Your task is to implement a production-ready, highly secure e-commerce web application for selling and securely delivering digital products (e.g., software, ebooks, digital templates).

---

## 1. TECH STACK SPECIFICATIONS (STRICT CONSTRAINTS)

### Backend
- **Language**: PHP 8.5 (STRICT: Do NOT use Laravel, Symfony full framework, or code generators).
- **Core Features of PHP 8.5 to utilize**:
  - `declare(strict_types=1);` at the top of EVERY PHP file.
  - **Asymmetric Visibility** (`public private(set)`) for all DTOs and entity properties.
  - **Property Hooks** (`get` / `set`) for sanitization, validation, and calculated properties.
  - New array utilities (`array_all`, `array_any`, `array_find`) for validation pipelines.
- **Database**: MySQL 8.0+ interacted with EXCLUSIVELY via **PDO**.
  - `PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION`
  - `PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC`
  - `PDO::ATTR_EMULATE_PREPARES => false` (CRITICAL for SQL Injection prevention).
- **Composer Dependencies**:
  - Router: `bramus/router` (`^1.6`)
  - Environment: `vlucas/phpdotenv` (`^5.6`)
  - Logging: `monolog/monolog` (`^3.7`)

### Frontend
- **Framework**: React 19.3 (Vite).
- **Styling**: TailwindCSS v4 via `@tailwindcss/vite` (using `@import "tailwindcss";` in CSS).
- **State Management & Data Fetching**:
  - `@tanstack/react-query` for server state caching.
  - `zustand` for lightweight client state (auth & cart).
- **Routing & Icons**: `react-router-dom` v6/v7, `lucide-react`.
- **Language/Direction**: RTL support (Arabic UI strings, English code/comments).

---

## 2. DIRECTORY STRUCTURE

You must create and organize the repository according to the following layout:

```text
digital-store/
├── backend/
│   ├── composer.json
│   ├── .env.example
│   ├── .env
│   ├── storage/
│   │   ├── digital_assets/         # Secure digital files (NOT accessible via web)
│   │   │   └── sample_product.zip  # Create a sample mock asset
│   │   └── logs/                   # Monolog files
│   ├── public/                     # Web root
│   │   ├── index.php               # Single entry point
│   │   └── .htaccess               # Apache/Nginx URL rewrite
│   └── src/
│       ├── Config/
│       │   ├── Database.php        # Strict PDO connection singleton
│       │   └── Cors.php            # CORS & Security headers
│       ├── Middleware/
│       │   ├── AuthMiddleware.php  # Verifies session / token
│       │   └── RateLimiter.php     # Rate limiting against brute force
│       ├── DTOs/
│       │   ├── UserRegisterDTO.php # PHP 8.5 hooks & asymmetric visibility
│       │   └── OrderCreateDTO.php
│       ├── Controllers/
│       │   ├── AuthController.php
│       │   ├── ProductController.php
│       │   ├── OrderController.php
│       │   └── DownloadController.php
│       └── Utils/
│           └── Response.php        # JSON standard response helper
│
└── frontend/
    ├── package.json
    ├── vite.config.js              # Configured with @tailwindcss/vite
    ├── index.html
    └── src/
        ├── app.css                 # @import "tailwindcss";
        ├── main.jsx
        ├── App.jsx
        ├── api/
        │   └── client.js           # Fetch/Axios instance with credentials: 'include'
        ├── context/
        │   └── AuthContext.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ProductCard.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Home.jsx
            ├── Login.jsx
            ├── Register.jsx
            ├── ProductDetails.jsx
            ├── Checkout.jsx
            └── MyDownloads.jsx
```

---

## 3. DATABASE SCHEMA & MIGRATIONS

Create an initialization SQL script at `backend/database/schema.sql`:

```sql
CREATE DATABASE IF NOT EXISTS `digital_store` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `digital_store`;

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(191) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('customer', 'admin') DEFAULT 'customer',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `thumbnail_url` VARCHAR(500) NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_size` BIGINT UNSIGNED NOT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_slug` (`slug`),
    INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_number` VARCHAR(64) NOT NULL UNIQUE,
    `user_id` INT UNSIGNED NOT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_orders` (`user_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT UNSIGNED NOT NULL,
    `product_id` INT UNSIGNED NOT NULL,
    `price_at_purchase` DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `download_tokens` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `token` VARCHAR(64) NOT NULL UNIQUE,
    `user_id` INT UNSIGNED NOT NULL,
    `product_id` INT UNSIGNED NOT NULL,
    `order_id` INT UNSIGNED NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `downloads_remaining` INT UNSIGNED DEFAULT 5,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
    INDEX `idx_token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Seed Product
INSERT INTO `products` (`title`, `slug`, `description`, `price`, `thumbnail_url`, `file_path`, `file_size`, `is_active`) 
VALUES (
    'دليل إتقان البرمجة بـ PHP 8.5',
    'php-85-mastery-guide',
    'كتاب إلكتروني شامل لتعلم أحدث ميزات PHP 8.5 وهندسة البرمجيات الآمنة.',
    29.99,
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
    'digital_assets/sample_product.zip',
    1048576,
    1
) ON DUPLICATE KEY UPDATE `id`=`id`;
```

---

## 4. SECURITY REQUIREMENTS (OWASP TOP 10 MITIGATION)

1. **SQL Injection (A03)**:
   - ZERO string concatenation in SQL queries. Always use PDO parameter binding (`:param` or `?`).
   - `PDO::ATTR_EMULATE_PREPARES = false`.
2. **Password Security & Cryptography (A02)**:
   - Always hash passwords with `password_hash($password, PASSWORD_ARGON2ID)`.
   - Never return `password_hash` in any API response.
3. **Session & Cookie Security (A07)**:
   - Start sessions with secure flags:
     ```php
     session_set_cookie_params([
         'lifetime' => 86400,
         'path' => '/',
         'domain' => $_ENV['COOKIE_DOMAIN'] ?? '',
         'secure' => isset($_SERVER['HTTPS']),
         'httponly' => true,
         'samesite' => 'Strict'
     ]);
     ```
   - On successful login, always run `session_regenerate_id(true)`.
4. **Broken Access Control & Path Traversal (A01)**:
   - Digital files must NEVER be inside `public/`.
   - In `DownloadController.php`, verify that the file's resolved path (`realpath()`) strictly starts with `storage/digital_assets/`:
     ```php
     $fullPath = realpath($baseStorage . '/' . $product['file_path']);
     if (!$fullPath || !str_starts_with($fullPath, realpath($baseStorage . '/digital_assets'))) {
         Response::json(['error' => 'Access Denied / Invalid File'], 403);
         return;
     }
     ```
   - Stream the file directly using `header()` and `readfile()`.
5. **Cross-Site Scripting (XSS) (A03)**:
   - Sanitize all string inputs using `htmlspecialchars($str, ENT_QUOTES, 'UTF-8')`.
   - Emit security headers on every response:
     ```php
     header("X-Content-Type-Options: nosniff");
     header("X-Frame-Options: DENY");
     header("X-XSS-Protection: 1; mode=block");
     header("Referrer-Policy: strict-origin-when-cross-origin");
     ```
6. **Rate Limiting (A04)**:
   - Implement `RateLimiter.php` for `/api/auth/login` and `/api/auth/register` (e.g., maximum 5 failed attempts per IP per 10 minutes).

---

## 5. API ENDPOINTS SPECIFICATION

All responses must return JSON in format:
`{"success": true, "data": ...}` or `{"success": false, "error": "message"}`.

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | No | Body: `username`, `email`, `password`. |
| `POST` | `/api/auth/login` | No | Body: `email`, `password`. Sets HttpOnly session. |
| `POST` | `/api/auth/logout` | Yes | Destroys session. |
| `GET` | `/api/auth/me` | Yes | Returns current logged-in user profile. |
| `GET` | `/api/products` | No | List of active digital products. |
| `GET` | `/api/products/{slug}` | No | Single product details. |
| `POST` | `/api/orders/checkout` | Yes | Simulates payment, creates completed order, and generates `download_tokens`. |
| `GET` | `/api/orders/my-downloads` | Yes | List of user's purchased products with active download tokens. |
| `GET` | `/api/download/{token}` | No | Validates token, decreases remaining count, and streams the binary file. |

---

## 6. FRONTEND IMPLEMENTATION REQUIREMENTS

1. **Vite + TailwindCSS v4 Setup**:
   - `vite.config.js` must import and register `@tailwindcss/vite`.
   - `src/app.css` must contain:
     ```css
     @import "tailwindcss";

     @layer base {
       body {
         @apply bg-slate-950 text-slate-100 min-h-screen font-sans;
         direction: rtl;
       }
     }
     ```
2. **Key Pages**:
   - **Store Catalog (`Home.jsx`)**: Responsive grid of digital products with badges, prices, and "Add to Cart / Buy Now" buttons.
   - **Auth Forms (`Login.jsx`, `Register.jsx`)**: Clean, accessible forms with inline validation, error alerts, and loading spinners.
   - **Checkout (`Checkout.jsx`)**: Summary of item and simulated 1-click checkout button.
   - **My Downloads (`MyDownloads.jsx`)**: Displays purchased digital products, expiration date, remaining download counts, and a direct download trigger button.
3. **API Client (`src/api/client.js`)**:
   - Base URL configured to `/api` with `credentials: 'include'` so HttpOnly cookies are automatically sent.

---

## 7. EXECUTION PHASES FOR THE AGENT

Please complete the implementation in the following sequential order:

1. **Phase 1: Environment & Backend Foundation**
   - Initialize `backend/composer.json` and install required dependencies.
   - Setup `backend/.env.example` and `backend/.env`.
   - Create `backend/src/Config/Database.php` and `backend/database/schema.sql`.
   - Create dummy file at `backend/storage/digital_assets/sample_product.zip`.

2. **Phase 2: Core Routing & Auth Controller**
   - Build `backend/public/index.php` with `Bramus\Router\Router`.
   - Implement `UserRegisterDTO.php` using PHP 8.5 Property Hooks and Asymmetric Visibility.
   - Implement `AuthController.php` (register, login, me, logout) with `password_hash(..., PASSWORD_ARGON2ID)`.
   - Implement `AuthMiddleware.php`.

3. **Phase 3: Products, Orders, and Secure File Streaming**
   - Implement `ProductController.php` (list, get).
   - Implement `OrderController.php` (checkout simulation, token generation).
   - Implement `DownloadController.php` with binary streaming and path traversal validation.

4. **Phase 4: Frontend Development (React 19 + Tailwind v4)**
   - Initialize Vite React app in `frontend/`.
   - Install TailwindCSS v4 (`@tailwindcss/vite`), `lucide-react`, `zustand`, `@tanstack/react-query`, `react-router-dom`.
   - Implement `AuthContext.jsx`, `client.js`, and pages (`Home`, `Login`, `Register`, `MyDownloads`, `Checkout`).

5. **Phase 5: Verification & Testing**
   - Verify that PHP syntax passes linting: `php -l`.
   - Verify that all endpoints respond as expected.
   - Test that downloading the sample digital asset works and decrements `downloads_remaining`.
   - Verify frontend builds cleanly: `npm run build`.

NOW PROCEED WITH THE IMPLEMENTATION STEP BY STEP.
```
