CREATE DATABASE IF NOT EXISTS `digital_store` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `digital_store`;

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(191) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('customer', 'admin') DEFAULT 'customer',
    `preferred_lang` VARCHAR(10) DEFAULT 'ar',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `title_ar` VARCHAR(255) NULL,
    `title_en` VARCHAR(255) NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `description_ar` TEXT NULL,
    `description_en` TEXT NULL,
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

CREATE TABLE IF NOT EXISTS `rate_limits` (
    `key_id` VARCHAR(128) PRIMARY KEY,
    `hits` INT UNSIGNED NOT NULL DEFAULT 1,
    `reset_time` INT UNSIGNED NOT NULL,
    INDEX `idx_reset_time` (`reset_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Seed Products with both Arabic & English
INSERT INTO `products` (`id`, `title`, `title_ar`, `title_en`, `slug`, `description`, `description_ar`, `description_en`, `price`, `thumbnail_url`, `file_path`, `file_size`, `is_active`) 
VALUES 
(
    1,
    'دليل إتقان البرمجة بـ PHP 8.5',
    'دليل إتقان البرمجة بـ PHP 8.5',
    'PHP 8.5 Architecture & Mastery Guide',
    'php-85-mastery-guide',
    'كتاب إلكتروني تفصيلي وعملي يشرح Property Hooks، Asymmetric Visibility، وأقوى المعايير الهندسية والأمنية لحماية تطبيقات الويب.',
    'كتاب إلكتروني تفصيلي وعملي يشرح Property Hooks، Asymmetric Visibility، وأقوى المعايير الهندسية والأمنية لحماية تطبيقات الويب.',
    'Comprehensive and practical ebook covering Property Hooks, Asymmetric Visibility, and cutting-edge OWASP security standards for web applications.',
    29.99,
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    'digital_assets/sample_product.zip',
    1048576,
    1
),
(
    2,
    'قالب لوحة تحكم React 19 الفائق (SaaS UI Kit)',
    'قالب لوحة تحكم React 19 الفائق (SaaS UI Kit)',
    'Ultimate React 19 SaaS Dashboard UI Kit',
    'react-19-saas-ui-kit',
    'حزمة مكونات جاهزة وعالية الأداء مبنية بـ React 19 و TailwindCSS v4 تدعم الوضع الليلي واللغة العربية بالكامل.',
    'حزمة مكونات جاهزة وعالية الأداء مبنية بـ React 19 و TailwindCSS v4 تدعم الوضع الليلي واللغة العربية والإنجليزية بالكامل.',
    'High-performance production-ready component library built with React 19 & TailwindCSS v4, with full Dark Mode and bilingual RTL/LTR support.',
    49.00,
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
    'digital_assets/sample_product.zip',
    2097152,
    1
),
(
    3,
    'حزمة الأمان السيبراني وتدقيق OWASP Top 10',
    'حزمة الأمان السيبراني وتدقيق OWASP Top 10',
    'OWASP Top 10 Cybersecurity & Audit Toolkit',
    'owasp-security-audit-toolkit',
    'مجموعة أدوات ونماذج تدقيق وفحص أمني متقدمة لمنع ثغرات الحقن، تسريب الجلسات، واختراق الصلاحيات.',
    'مجموعة أدوات ونماذج تدقيق وفحص أمني متقدمة لمنع ثغرات الحقن، تسريب الجلسات، واختراق الصلاحيات.',
    'Advanced auditing scripts, security checklists, and hardened patterns to prevent SQL injection, broken access control, and session leaks.',
    39.50,
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
    'digital_assets/sample_product.zip',
    1572864,
    1
),
(
    4,
    'أيقونات ومكتبة الرسوم التفاعلية الاحترافية',
    'أيقونات ومكتبة الرسوم التفاعلية الاحترافية',
    'Modern Interactive Vector Icons Bundle',
    'modern-interactive-icons-bundle',
    'أكثر من 2000 أيقونة متجهية SVG متحركة ومتوافقة مع الويب وتطبيقات الجوال بستايل عصري وجذاب.',
    'أكثر من 2000 أيقونة متجهية SVG متحركة ومتوافقة مع الويب وتطبيقات الجوال بستايل عصري وجذاب.',
    'Over 2,000 animated and static SVG vector icons designed for high-conversion web & mobile applications with a sleek modern aesthetic.',
    19.00,
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    'digital_assets/sample_product.zip',
    5242880,
    1
)
ON DUPLICATE KEY UPDATE 
    `title_ar` = VALUES(`title_ar`),
    `title_en` = VALUES(`title_en`),
    `description_ar` = VALUES(`description_ar`),
    `description_en` = VALUES(`description_en`);
