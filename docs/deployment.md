# Deployment Requirements (Provider-Neutral)

This document outlines the neutral infrastructure, server, and runtime prerequisites for deploying the Digital Products Store without binding to any specific vendor, operating system, or cloud provider.

---

## 1. Runtime & Environment Prerequisites

1. **PHP Runtime**:
   - PHP 8.5+ with native `pdo_mysql`, `openssl`, `fileinfo`, `mbstring`, `json`, and `session` extensions.
   - `expose_php = Off` in `php.ini`.
   - `display_errors = Off` in production.
   - Memory limit: 256MB+ recommended for large asset streams.

2. **Database Engine**:
   - MySQL 8.4 LTS (or compatible MySQL 8.0+ / MariaDB 10.11+).
   - Storage Engine: InnoDB.
   - Character Set: `utf8mb4` with `utf8mb4_unicode_ci` collation.
   - Strict SQL mode enabled (`STRICT_TRANS_TABLES`, `NO_ENGINE_SUBSTITUTION`).

3. **Public Document Root Boundary**:
   - The web server must point its public web root strictly to `backend/public/`.
   - All other application directories (`src/`, `config/`, `database/`, `storage/`, `vendor/`) must remain outside and inaccessible from the web.
   - URL rewrite: All incoming requests to non-existent static files must forward to `backend/public/index.php`.

4. **Private Asset Storage**:
   - Private digital assets reside in `backend/storage/digital_assets/`.
   - Must have write permissions for the PHP process user.
   - Must never be exposed via web server direct static file alias.

5. **Secrets & Environment Variables**:
   - Production secrets (`DB_PASSWORD`, `APP_SECRET`) must be provided via server environment variables or a protected, uncommitted `.env` file with `chmod 600`.
   - `APP_ENV` must be set to `production`.
   - `PAYMENT_MODE` must be set to `disabled`.

6. **Transport Security (HTTPS)**:
   - Valid TLS certificate required.
   - All HTTP traffic redirected to HTTPS.
   - `SESSION_SECURE=true` enabled in `.env`.

7. **Frontend Build Delivery**:
   - The React frontend application is compiled via `npm run build` in `frontend/`.
   - The output in `frontend/dist/` can be served directly by the web server or reverse-proxied to the PHP front controller.

---

## 2. Optional Server Configuration Examples

### Nginx (Optional Example)
```nginx
server {
    listen 443 ssl http2;
    server_name store.example.com;

    root /var/www/digital-store/backend/public;
    index index.php;

    ssl_certificate /etc/ssl/certs/store.crt;
    ssl_certificate_key /etc/ssl/private/store.key;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend Single Page App / Static Assets
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM Handler
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php8.5-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_intercept_errors on;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### Apache (Optional Example via VirtualHost)
```apache
<VirtualHost *:443>
    ServerName store.example.com
    DocumentRoot /var/www/digital-store/backend/public

    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/store.crt
    SSLCertificateKeyFile /etc/ssl/private/store.key

    <Directory /var/www/digital-store/backend/public>
        AllowOverride None
        Require all granted
        FallbackResource /index.php
    </Directory>

    <Directory /var/www/digital-store/backend/storage>
        Require all denied
    </Directory>
</VirtualHost>
```

---

## 3. Launch & Deployment Checklist

- [ ] Database migrated via `php backend/cli/migrate.php`
- [ ] Initial administrator bootstrapped via `php backend/cli/bootstrap_admin.php`
- [ ] `APP_ENV=production` set in environment
- [ ] `PAYMENT_MODE=disabled` verified
- [ ] `display_errors = Off` verified
- [ ] Automated security tests passed via `php backend/tests/run_tests.php`
- [ ] HTTPS certificates active and HSTS enabled
- [ ] Nightly database backup scheduled
