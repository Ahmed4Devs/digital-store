-- Migration 002: Seed Initial Digital Products & Assets

INSERT INTO `products` (`id`, `slug`, `title`, `title_ar`, `title_en`, `description`, `description_ar`, `description_en`, `status`, `price_cents`, `currency`, `thumbnail_url`)
VALUES 
(
    1,
    'php-85-mastery-guide',
    'دليل إتقان البرمجة بـ PHP 8.5',
    'دليل إتقان البرمجة بـ PHP 8.5',
    'PHP 8.5 Architecture & Mastery Guide',
    'كتاب إلكتروني تفصيلي وعملي يشرح Property Hooks، Asymmetric Visibility، وأقوى المعايير الهندسية والأمنية لحماية تطبيقات الويب.',
    'كتاب إلكتروني تفصيلي وعملي يشرح Property Hooks، Asymmetric Visibility، وأقوى المعايير الهندسية والأمنية لحماية تطبيقات الويب.',
    'Comprehensive and practical ebook covering Property Hooks, Asymmetric Visibility, and cutting-edge security standards for web applications.',
    'published',
    2999,
    'USD',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
),
(
    2,
    'react-19-saas-ui-kit',
    'قالب لوحة تحكم React 19 الفائق (SaaS UI Kit)',
    'قالب لوحة تحكم React 19 الفائق (SaaS UI Kit)',
    'Ultimate React 19 SaaS Dashboard UI Kit',
    'حزمة مكونات جاهزة وعالية الأداء مبنية بـ React 19 و TailwindCSS v4 تدعم الوضع الليلي واللغة العربية والإنجليزية بالكامل.',
    'حزمة مكونات جاهزة وعالية الأداء مبنية بـ React 19 و TailwindCSS v4 تدعم الوضع الليلي واللغة العربية والإنجليزية بالكامل.',
    'High-performance production-ready component library built with React 19 & TailwindCSS v4, with full Dark Mode and bilingual RTL/LTR support.',
    'published',
    4900,
    'USD',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80'
),
(
    3,
    'owasp-security-audit-toolkit',
    'حزمة الأمان السيبراني وتدقيق OWASP Top 10',
    'حزمة الأمان السيبراني وتدقيق OWASP Top 10',
    'OWASP Top 10 Cybersecurity & Audit Toolkit',
    'مجموعة أدوات ونماذج تدقيق وفحص أمني متقدمة لمنع ثغرات الحقن، تسريب الجلسات، واختراق الصلاحيات.',
    'مجموعة أدوات ونماذج تدقيق وفحص أمني متقدمة لمنع ثغرات الحقن، تسريب الجلسات، واختراق الصلاحيات.',
    'Advanced auditing scripts, security checklists, and hardened patterns to prevent SQL injection, broken access control, and session leaks.',
    'published',
    3950,
    'USD',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80'
),
(
    4,
    'modern-interactive-icons-bundle',
    'أيقونات ومكتبة الرسوم التفاعلية الاحترافية',
    'أيقونات ومكتبة الرسوم التفاعلية الاحترافية',
    'Modern Interactive Vector Icons Bundle',
    'أكثر من 2000 أيقونة متجهية SVG متحركة ومتوافقة مع الويب وتطبيقات الجوال بستايل عصري وجذاب.',
    'أكثر من 2000 أيقونة متجهية SVG متحركة ومتوافقة مع الويب وتطبيقات الجوال بستايل عصري وجذاب.',
    'Over 2,000 animated and static SVG vector icons designed for high-conversion web & mobile applications with a sleek modern aesthetic.',
    'published',
    1900,
    'USD',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'
)
ON DUPLICATE KEY UPDATE 
    `title_ar` = VALUES(`title_ar`),
    `title_en` = VALUES(`title_en`),
    `description_ar` = VALUES(`description_ar`),
    `description_en` = VALUES(`description_en`),
    `price_cents` = VALUES(`price_cents`),
    `status` = VALUES(`status`);

-- Seed Assets linked to initial products
INSERT INTO `product_assets` (`id`, `product_id`, `version`, `storage_key`, `original_filename`, `mime_type`, `file_size`, `sha256_checksum`, `upload_state`)
VALUES
(1, 1, 1, 'asset_sample_product.zip', 'php-85-mastery-guide.zip', 'application/zip', 1048576, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'active'),
(2, 2, 1, 'asset_sample_product.zip', 'react-19-saas-ui-kit.zip', 'application/zip', 2097152, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'active'),
(3, 3, 1, 'asset_sample_product.zip', 'owasp-security-audit-toolkit.zip', 'application/zip', 1572864, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'active'),
(4, 4, 1, 'asset_sample_product.zip', 'modern-interactive-icons-bundle.zip', 'application/zip', 5242880, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'active')
ON DUPLICATE KEY UPDATE `id` = `id`;
