# Secure Digital Products Store

An e-commerce web application for selling and securely delivering digital products (e-books, templates, developer kits, software). Built as a secure modular monolith with native PHP on the backend and React on the frontend, hardened according to the official **OWASP Top 10:2025** standards.

---

## 1. Prerequisites

- **PHP 8.5+** (ZTS or NTS) with extensions: `pdo_mysql`, `openssl`, `fileinfo`, `mbstring`, `json`, `session`.
- **Composer 2.x**.
- **Node.js 20+ LTS** & **npm 10+**.
- **MySQL 8.4 LTS** (or 8.0+) with InnoDB and `utf8mb4` support.

---

## 2. Quick Local Setup

### 2.1 Clone Repository & Install Dependencies

```bash
# Install backend Composer dependencies
cd backend
composer install

# Install frontend npm dependencies
cd ../frontend
npm install
```

### 2.2 Configure Environment

Copy the example environment template:
```bash
cp backend/.env.example backend/.env
```
Ensure database connection credentials match your local MySQL server.

### 2.3 Run Database Migrations

Run versioned migrations to build the relational schema:
```bash
php backend/cli/migrate.php
```

Seed initial sample product assets (for local development testing):
```bash
php backend/cli/seed_all_assets.php
```

### 2.4 Bootstrap Initial Administrator

Create or promote your administrator user safely without committing passwords:
```bash
php backend/cli/bootstrap_admin.php admin admin@store.local AdminSecretPass123!
```

---

## 3. Running Locally

### 3.1 Start PHP Backend Server
From the repository root:
```bash
php -S 127.0.0.1:8000 -t backend/public
```

### 3.2 Start Frontend Dev Server
In a separate terminal:
```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 3000
```
Open your browser at **http://127.0.0.1:3000** (or http://127.0.0.1:3001 if port 3000 is occupied).

---

## 4. Running Tests & Quality Gates

Run the automated security and quality test suite covering the **OWASP Top 10:2025** controls, integer currency math, IDOR protections, and production safety gates:
```bash
php backend/tests/run_tests.php
```

To compile the frontend production bundle:
```bash
cd frontend && npm run build
```

---

## 5. Security & Architectural Features

- **Strict Server-Side Pricing**: Prices and order totals are computed from `products.price_cents` (integer minor units). Client price manipulation is rejected.
- **Production Payment Safety Gate**: Simulation payments are confined strictly to `local` and `test` environments. Application startup fails if `PAYMENT_MODE=mock` in production.
- **CSRF Synchronizer Token**: Session-bound CSRF token required on all state-mutating requests (`X-CSRF-Token`).
- **Cryptographic Protections**: Passwords hashed with `Argon2id`. Download tokens and reset tokens stored exclusively as SHA-256 hashes.
- **Protected Downloads**: Assets stored outside the public web root (`backend/storage/digital_assets/`). Authenticated ownership checks, atomic download count decrement, and strict path boundary inspection.
- **Audit Logging**: Sensitive actions logged to `admin_audit_log` with automatic redaction of credentials and tokens.
- **Bilingual Interface**: Arabic (RTL) & English (LTR) with instant toggle and Dark/Light theme switching.

---

## 6. Project Documentation

Detailed architecture and operational guides are provided in the `docs/` folder:
- [Architecture Documentation](docs/architecture.md)
- [Security Matrix (OWASP Top 10:2025)](docs/security.md)
- [Test Plan & Verification Results](docs/test-plan.md)
- [Deployment Guide](docs/deployment.md)
- [Operations & Incident Response](docs/operations.md)

---

## 7. Notice Regarding Real Payments

> **IMPORTANT**: The payment flow in this codebase is a **development and testing simulation only**. Real monetary transactions and live payment gateway processing are deliberately disabled until a licensed payment provider is selected and integrated.
