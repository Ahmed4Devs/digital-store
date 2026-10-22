# Operations, Maintenance & Incident Response

## 1. Routine Operational Procedures

### 1.1 Safe Database Migrations
Migrations are managed strictly through versioned SQL scripts in `backend/database/migrations/`:
- Always verify a fresh database backup before running migrations in production.
- Execute migrations using the CLI tool:
  ```bash
  php backend/cli/migrate.php
  ```
- Check migration execution status:
  ```bash
  php backend/cli/migrate.php status
  ```
- Migrations are non-destructive and tracked in the `migrations` table. In production, never mutate schema ad-hoc.

### 1.2 Database Backup & Disaster Recovery
- **Backup Command**:
  ```bash
  mysqldump --single-transaction --quick --lock-tables=false \
    -u root -p digital_store > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- **Restore Command**:
  ```bash
  mysql -u root -p digital_store < backup_file.sql
  ```
- **Digital Assets Backup**:
  - The `backend/storage/digital_assets/` directory must be backed up along with the database dump to ensure historical product files match records in `product_assets`.

### 1.3 Dependency Audits & Updates
- **Composer dependencies**:
  ```bash
  cd backend && composer audit
  cd backend && composer update --dry-run
  ```
- **npm dependencies**:
  ```bash
  cd frontend && npm audit
  ```
- Always test any dependency upgrade in a staged environment before updating committed lockfiles (`composer.lock`, `package-lock.json`).

### 1.4 Secret Rotation
- **APP_SECRET**: Rotate by updating `.env` or the server environment variable. Note: rotating `APP_SECRET` will invalidate existing user sessions, requiring re-login.
- **Database Password**: Update MySQL user password, then immediately update `DB_PASSWORD` in `.env`.
- **Admin Password**: Use `php backend/cli/bootstrap_admin.php` or the user profile change password flow.

### 1.5 Log Retention & Monitoring
Logs are stored in `backend/storage/logs/`:
- `security.log`: Authentication attempts, failures, and brute force warnings.
- `downloads.log`: Download requests, IDOR detections, and path boundary alerts.
- `audit.log`: Administrative CRUD actions and asset uploads.
- **Retention Policy**: Rotate logs daily and compress after 30 days. Truncate or archive logs older than 90 days.
- **Privacy Notice**: Log files contain zero raw passwords, bearer tokens, or credit card details (redacted automatically by `AuditLogger`).

---

## 2. Unresolved Launch Decisions

The following architectural and business decisions remain deliberately open and must be determined before launching real commercial operations:

1. **Production Hosting Provider**:
   - Status: Open. (Current codebase is neutral to cloud provider, bare metal, or container platform).
2. **Live Payment Gateway Provider**:
   - Status: Open. (Mock simulation is local/test only; production checkout is currently disabled). Requires provider selection (e.g., Stripe, Tap, HyperPay, Moyasar).
3. **Jurisdiction, Currency & Tax Rules**:
   - Status: Open. (Currency defaults to USD minor units; regional VAT/sales tax rules must be defined upon business entity registration).
4. **Transactional Mail Provider**:
   - Status: Open. (Password reset links currently display dev tokens in local/test; requires SMTP or provider API such as Postmark/SendGrid/SES).
5. **Cloud Object Storage Adapter**:
   - Status: Open. (Assets currently store in secure local disk directory `storage/digital_assets/`; can be linked to private S3/GCS bucket with presigned delivery).
6. **Data Retention & Privacy Policy**:
   - Status: Open. (GDPR/local data residency compliance policy to be formalized).
