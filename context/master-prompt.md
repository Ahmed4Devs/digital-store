# MASTER PROMPT: Build a Secure Digital Products Store

## Mission

You are an autonomous senior full-stack engineer and application security specialist. Build a maintainable web application for selling and securely delivering digital products such as e-books, software, and templates.

Implement the application in the current repository. Do not stop at a plan or a partial scaffold. Inspect the repository first, preserve existing user work, then implement, document, and verify the application in small reviewable phases.

If a separate MASTER_SPEC.md accompanies this prompt, read it and use it as supporting context. This prompt is self-contained and is authoritative wherever it conflicts with the source architecture plan or any example code in that plan.

## 1. Product decisions and non-negotiable constraints

- Backend: native PHP, Composer, and PDO. Do not use Laravel, Symfony Full-Stack, or a code generator. Small, maintained libraries are allowed when they solve a specific need.
- Database: MySQL with InnoDB. Prefer the current supported LTS release, using MySQL 8.4 LTS as the compatibility baseline unless the repository already has a justified, supported LTS target.
- Frontend: React 19.3 with a matching React DOM version, Vite, and Tailwind CSS 4.x.
- Architecture: secure modular monolith. Keep one deployable application with clear internal modules and boundaries. Do not create microservices.
- Product: public catalog, customer accounts, administrator product management, orders, a development/test-only mock payment flow, and protected digital downloads.
- Payment: simulation for development and testing only. No real payment provider, card handling, live webhook, or real payment claim is part of this task.
- Hosting: not selected. Keep deployment requirements neutral to web server, operating system, container platform, and hosting provider. Do not make Apache, Nginx, IIS, Docker, or a cloud provider mandatory.
- No jurisdiction, currency, tax rules, mail provider, domain, or production storage provider has been selected. Do not invent one. Record these as open decisions.
- Initial user interface: Arabic strings and RTL support, while keeping layout direction configurable and code identifiers/comments in English. Do not hardcode RTL assumptions into every component.
- Do not publish, deploy, connect to external payment systems, send real email, or run migrations against a production database.

## 2. Correct the source material; do not copy its unsafe examples

The provided architecture plan and earlier coding prompt are inputs for review, not code to copy literally. In particular:

1. Use the official OWASP Top 10:2025 category names and mappings in this prompt. The source files use outdated or mismatched mappings. For example, SQL injection and XSS belong under Injection, rate limiting is not Cryptographic Failures, SSRF is not A10:2025, and A03:2025 is Software Supply Chain Failures.
2. Do not store a raw download token in MySQL or treat a public bearer URL as the only authorization check. Authenticate the account and verify order ownership and an active download grant on every download request. Store only hashes for any opaque token that is genuinely needed.
3. Do not accept client-supplied prices, totals, order status, or payment success. Calculate prices on the server from current database records and use an explicit order/payment state machine.
4. Do not use floating-point or ambiguous DECIMAL arithmetic for money. Store integer minor units and a currency code; make the currency exponent explicit.
5. Do not delete customers, orders, or purchased assets through cascading deletion. Preserve business records and purchased-file version references; archive products instead of deleting records referenced by orders.
6. Do not escape all input with htmlspecialchars before saving it. Validate and normalize input at the boundary, preserve legitimate data, and encode output for its actual context. React already escapes text by default; rich HTML requires a reviewed allowlist sanitizer.
7. Do not create or commit a real .env file, production secret, default password, or root database credential. Provide only a safe .env.example. Preserve any existing ignored .env file without reading its secret values or overwriting it.
8. Do not put a mandatory .htaccess, Nginx configuration, or other server-specific rewrite file in the only supported deployment path. The public document root and PHP front-controller behavior must be expressible through deployment-neutral requirements; optional examples may be added for multiple environments.
9. Do not include a fake sample product file in production data or download it from an unreviewed external URL. Any sample asset must be a harmless local test fixture outside the public web root.
10. Do not emit obsolete X-XSS-Protection as a primary defense. Use context-aware output encoding, a tested Content Security Policy, and suitable modern security headers.

## 3. Version policy

Verify versions against official sources at the beginning of implementation and record the verification date in the documentation. The following versions were verified for this task on 22 October 2026:

- PHP 8.5 is the stable supported branch to target. Use the latest stable 8.5.x patch available when implementation begins. Do not use PHP 8.6 release candidates or development builds in production.
- React 19.3.0 was released on 9 September 2026. Keep react and react-dom compatible and pin resolved versions in the frontend lockfile.
- Tailwind CSS 4.x is required; 4.3 was announced in May 2026. Use the official Tailwind Vite integration where compatible. Verify the Tailwind 4 browser floor: Chrome 111+, Safari 16.4+, and Firefox 128+; document this user-facing compatibility requirement.
- MySQL 8.4 LTS is the default database compatibility baseline. Use the latest available stable patch in the selected LTS line.
- Use a supported Node.js LTS release for frontend build tooling and a supported Composer 2 release. Node.js need not be a production runtime dependency unless a chosen deployment explicitly requires it.
- Pin dependencies through composer.lock and exactly one frontend lockfile. Avoid claiming “latest” without a verification date and official source.

If these facts change before implementation, recheck them rather than blindly preserving this dated note.

## 4. Initial repository inspection and working rules

Before editing:

1. Read repository instructions such as AGENTS.md and existing README files.
2. Inspect the repository layout, existing code, current Git branch, and working-tree changes.
3. Identify existing functionality and preserve it unless a change is necessary for this task.
4. Never overwrite or remove user changes, secrets, local databases, or unrelated files.
5. Report a concise implementation plan and any actual blocking conflict, then continue with independent work.
6. Do not use destructive Git operations, force-push, or amend existing commits.
7. Keep code simple, explicit, typed, and testable. Use strict PHP typing and consistent formatting. Use PHP 8.5 features such as property hooks or asymmetric visibility only when they improve a specific domain model; do not force them into every DTO or entity and never treat them as a substitute for validation or authorization.
8. Do not over-install dependencies. Before adding one, verify that it is maintained, compatible, licensed appropriately, and justified. A small maintained router, dotenv loader, and structured logger may be used; do not assume the package names or versions in the source plan are still suitable.
9. Do not claim that checks passed unless you ran them. Record actual commands, outcomes, and remaining failures.
10. Implement and test the application; this prompt asks you to run the relevant project checks. Keep test databases isolated from development and production data.

## 5. Architecture

Build a same-origin React SPA and versioned JSON API where practical. A same-origin default simplifies cookie sessions and CSRF controls. If a separate frontend origin is necessary, document it and use an exact allowlist; never enable wildcard CORS with credentials.

Use a modular-monolith structure with clear modules such as:

- Identity and session management
- Authorization and administrator functions
- Product catalog and product assets
- Orders and order items
- Mock payment adapter
- Digital delivery and download grants
- Audit logging and operational configuration

Keep the flow understandable:

HTTP routing and middleware → application use cases → domain rules and policies → PDO repositories and infrastructure adapters.

Controllers must not contain all business logic. Domain rules should not depend on HTTP globals, SQL details, or React state. Keep database and storage adapters behind small interfaces where this improves testability.

Use a single PHP public entry point and expose only built frontend assets and explicitly public endpoints. Keep source code, environment files, database scripts, logs, sessions, temporary uploads, and digital product files outside the public web root.

A lightweight maintained router is allowed. Do not build a complex custom router. Do not require a particular server rewrite syntax. Document the equivalent hosting capabilities: configurable public document root, PHP 8.5 runtime, URL forwarding to the front controller, HTTPS, private storage, environment secrets, CLI execution, and MySQL connectivity.

Suggested repository organization, adaptable to an existing project:

- public/ for the PHP entry point and built public assets only
- src/Modules/ for identity, catalog, admin, orders, payment, and delivery
- src/Shared/ for small cross-module contracts and error handling
- config/ for validated configuration loading, without secrets
- database/migrations/ and local/test-only seeders
- frontend/ for React/Vite/Tailwind source
- storage/private/ for local private digital assets, outside the web root and ignored by Git
- tests/ for unit, integration, API, and end-to-end checks
- docs/ for architecture, security, setup, tests, deployment, and operations

Do not reorganize a working repository merely to match this example.

## 6. Database design and migrations

Use MySQL InnoDB, utf8mb4, UTC timestamps, foreign keys, explicit indexes, uniqueness constraints, and strict SQL mode. Use PDO consistently. Configure exceptions and associative fetches. Disable emulated prepares where the MySQL driver supports it.

Bind all values with prepared statements. Placeholders do not safely parameterize table names, column names, or sort direction; use explicit allowlists for those identifiers. Do not concatenate untrusted input into SQL.

Implement versioned, reviewed migrations. Do not create or mutate schema on ordinary web requests. Provide a CLI migration command with validated environment configuration and clear failures. Production migrations must be a deliberate operator action after a verified backup; use corrective migrations instead of destructive rollback where data may be lost.

Design at least the following tables, with useful indexes and constraints:

- users: normalized unique email, username if the product needs it, password hash, account status, verification state, and timestamps.
- roles and user_roles, or an equally explicit server-side role model for customer and admin. Do not allow self-promotion.
- password_reset_tokens: store only a token hash, expiry, use/revocation state, and user reference.
- sessions if using a database-backed PHP session handler; otherwise document the supported server-side session store.
- products: unique slug, title, description, status (draft/published/archived), price in integer minor units, currency code, and timestamps.
- product_assets: private storage key, version, verified MIME type, byte size, SHA-256 digest, upload state, uploader, and timestamps. Never expose an internal filesystem path.
- orders: non-sequential public reference, owning user, state, currency, integer totals, idempotency key where appropriate, and timestamps.
- order_items: order reference, product reference, immutable title/price/currency snapshot, purchased asset version reference, quantity, and line total.
- payment_attempts: provider/mode, state, unique idempotency/reference values, order reference, safe result metadata, and timestamps. Mock attempts may exist only in isolated local/test databases.
- download_grants: order-item and user linkage, purchased asset version, active/revoked state, optional expiry and download limits/count. No raw bearer token.
- download_events: allowed/denied outcome, grant/order reference, timestamp, and request ID with privacy-conscious metadata.
- admin_audit_log: actor, action, entity reference, timestamp, result, request ID, and carefully redacted metadata.
- migrations metadata maintained by the selected migration tool.

Use database constraints to prevent duplicate email, slug, idempotency keys, and invalid relationships. Treat pre-checks as user experience only; database uniqueness is required to close races. Do not cascade-delete orders, audit records, users with purchases, or files needed by historical order items. Archive products and deactivate accounts where appropriate.

For money, store integer minor units and ISO currency code. Implement currency exponent rules explicitly; do not assume every currency has two fractional digits. Never use float arithmetic. The tax, fee, and jurisdiction rules remain unspecified; do not invent them.

## 7. Authentication, sessions, CSRF, and authorization

### Passwords and account flows

- Implement registration, login, logout, current-user profile, and secure password reset. Add email verification if the product flow requires it, behind a mailer interface.
- Use PHP password_hash, password_verify, and password_needs_rehash. Prefer Argon2id when supported and suitably configured; use PASSWORD_DEFAULT as a safe compatibility fallback. Fail clearly if production configuration cannot satisfy the selected password-hashing policy. Never write a custom password hash or salt scheme.
- Accept long passphrases, define a reasonable minimum and a maximum compatible with the selected algorithm, and reject overlong input rather than silently truncating it. Do not force arbitrary character-class rules or periodic resets without a security event.
- Use generic login and reset responses that do not reveal whether an account exists. Apply rate limits using account/email and request-source signals, not IP alone. Trust forwarded IP headers only from explicitly configured proxies.
- Reset tokens must be high entropy, short-lived, single-use, hashed at rest, and never written to logs or exposed in application errors.
- Enforce database uniqueness and handle duplicate registration races safely without leaking unnecessary account details.
- Require MFA for administrator accounts before enabling the admin area in production. Use a maintained TOTP or WebAuthn implementation; store MFA secrets encrypted with a key outside the database and recovery codes as hashes. Any local/test bypass must be explicit, isolated, and impossible in production.
- Do not seed default production users or passwords. Provide a protected CLI process to bootstrap the first administrator; do not put passwords on shell command lines or in committed seed data.

### Sessions

- Use server-side sessions and secure cookies for the same-origin browser application. Do not store session IDs, JWTs, refresh tokens, or credentials in localStorage or sessionStorage.
- Configure session cookies before starting the session. In production require HTTPS and Secure, HttpOnly, SameSite=Lax or Strict as appropriate, Path=/, and no Domain attribute unless explicitly required. Prefer the __Host- prefix where compatible.
- Enable PHP strict session mode. Regenerate the session ID after login, reauthentication, password change, or privilege change; invalidate the old ID.
- Enforce server-side idle and absolute expiration, logout invalidation, and session revocation after account disablement or credential reset.
- Never decide access based only on client-side state, IP address, User-Agent, or a React protected route.

### CSRF and authorization

- Use a synchronizer CSRF token bound to the server-side session for every state-changing request. Send it in a custom request header; never put it in the URL or logs.
- State changes must use POST, PUT, PATCH, or DELETE. GET and HEAD must not mutate data. SameSite cookies and exact Origin/Referer checking are defense in depth, not a replacement for the CSRF token.
- Protect login and other pre-authentication state changes against CSRF where applicable.
- Keep the API same-origin by default. Reject unexpected simple content types for JSON mutations. Do not enable broad CORS.
- Apply authorization on the server for every protected request and every resource. Use deny-by-default. Customers may only read their own orders and download grants. Admin endpoints require admin authorization and MFA state.
- Prevent IDOR by checking ownership in the same service/query that loads the requested order, asset, or grant. Never rely on an unguessable sequential ID as authorization.

## 8. Products, administration, orders, and digital assets

### Product catalog and admin

- Public APIs expose only published products. Draft and archived products remain private.
- Admin create/edit/publish/archive operations require server-side authorization, MFA, CSRF, input validation, and audit logging.
- Preserve products and asset versions referenced by orders. Do not silently replace a purchased version when an administrator uploads a newer file.
- Avoid rendering raw HTML descriptions. React text rendering should remain escaped. If rich text is necessary, define an allowlist sanitizer and test it.
- Restrict search, sort, filters, pagination, and upload sizes on the server.

### Uploads

- Accept uploads only from authorized administrators and only through a CSRF-protected endpoint.
- Enforce an explicit extension/type allowlist appropriate to product formats, inspect content with Fileinfo, enforce size limits, and reject upload errors. Do not trust the browser's Content-Type or original filename.
- Generate a random internal storage key. Store files outside the public web root or in a private storage adapter. Set non-executable permissions and never derive a filesystem path from user input.
- Record size, verified MIME type, asset version, and SHA-256 digest. A quarantine or malware scanning adapter may be used where available; do not send private user files to a public scanning service without a documented privacy decision.
- Do not automatically execute or extract uploaded archives.

### Orders

- Accept product identifiers and quantities from the client, then reload product status and prices from MySQL and calculate totals server-side.
- Create orders and immutable order item snapshots in a transaction. Use integer money values.
- Implement explicit state transitions and reject illegal transitions, duplicate completion, or fulfillment before an allowed payment result.
- Use idempotency keys, unique constraints, row locks or equivalent transaction controls where needed to prevent duplicate orders/payment attempts/download grants under retries and concurrent requests.
- Do not trust client-supplied order totals, currency, payment result, order status, product file path, or grant state.
- Do not apply tax or fees until policy and jurisdiction are selected. Record this as an open launch decision.

## 9. Development/test-only mock payment: production safety gate

Implement a PaymentProvider interface and a MockPaymentProvider only. Apply every safeguard below:

1. Accept only explicitly enumerated environment values such as local, test, and production. Unknown values fail closed.
2. Register mock routes and load the mock adapter only when APP_ENV is exactly local or test.
3. In production, PAYMENT_MODE=mock must fail application startup. Add a second guard inside the payment service so no route or configuration mistake can mark an order successful.
4. Production must use PAYMENT_MODE=disabled. Hide checkout actions and return a clear feature-disabled response if a payment endpoint is called.
5. A browser request, query parameter, form field, or React state must never be able to declare a payment successful. Mock outcomes are controlled by a local/test server-side test harness only.
6. Mark the UI and test data explicitly as simulated. Do not claim that money was charged.
7. Mock payments may create a paid-like test state and a download grant only in isolated local/test databases. Never let a mock result fulfill a production order or release a production asset.
8. The test harness must refuse to run against a production database. Validate environment and database name/configuration; never run seeders or tests against production.
9. Test success, decline, cancellation, replay, duplicate request, concurrent attempt, transaction rollback, and the production configuration guard.
10. Do not add card fields, payment credentials, live webhooks, external payment HTTP calls, or real payment-provider code. A future provider requires a separate reviewed specification and implementation.

Until a real provider is separately approved and integrated, production checkout remains disabled. The project must not be described as ready to collect real payments.

## 10. Secure digital downloads

Prefer an authenticated, ownership-checked download endpoint such as a route using the order and item/grant reference. For every request:

- Confirm the current server-side session and account status.
- Confirm the order belongs to the current user.
- Confirm the order is in the permitted payment state for this environment.
- Confirm the active grant is linked to that order item and the exact purchased asset version.
- Enforce expiry, revocation, and download-count policy atomically; prevent concurrent requests from bypassing limits.
- Resolve the stored internal key through the private storage adapter. Do not accept a path or filename from the client and do not expose a public storage URL.
- Protect against path traversal and symlink escapes using canonical trusted storage roots and path-boundary checks. Prefer opaque storage keys that cannot contain path separators.
- Stream the file through PHP or use a documented, host-supported internal delivery mechanism only after authorization. The default must work without a particular web server.
- Set a verified Content-Type, a sanitized Content-Disposition attachment filename, Content-Length when reliable, Cache-Control: private/no-store, and X-Content-Type-Options: nosniff.
- Do not log the file contents, raw tokens, session IDs, or full private filesystem paths.
- Test unauthorized users, other users' grant IDs, expired/revoked grants, path traversal, symlink escape, missing/corrupt assets, invalid MIME, concurrent count decrement, and oversized uploads.
- A bearer capability link is not the default. If a future guest-download requirement makes one necessary, use a high-entropy opaque token, store only its hash, bind it to one order item, enforce short expiry/use limits/revocation, and never log it.

If a future feature causes the server to fetch user-supplied URLs, treat it as an SSRF risk: avoid arbitrary outbound fetches or enforce a strict destination allowlist, block private/link-local/metadata addresses, and revalidate redirects and resolved IPs.

## 11. API and frontend requirements

Use a consistent versioned API, preferably under /api/v1, with safe JSON responses, validation errors, appropriate HTTP status codes, and a request ID. Never expose SQL errors, stack traces, filesystem paths, secrets, or internal exception details to clients.

Core routes should cover:

- Registration, login, logout, current user, password reset, and CSRF token handling.
- Public published product listing and product details.
- Admin product CRUD, publishing/archiving, asset upload, and order view.
- Authenticated user's order history and download list.
- Order creation and mock payment routes that exist only in local/test.

Implement the exact route shape to fit the selected router, and document it. Every route must have an authorization and CSRF decision recorded in the route/middleware design. Do not place sensitive tokens in URLs.

Frontend requirements:

- Use React 19.3, matching React DOM, Vite, and Tailwind CSS 4.x. Configure Tailwind using its supported v4 integration and syntax; do not copy v3 configuration blindly.
- Build catalog, product detail, registration, login, checkout/test simulation, order history/downloads, and admin pages.
- Provide loading, empty, validation, error, success, and disabled-production-checkout states.
- Use an API client with credentials included for same-origin cookies and CSRF header handling. Do not store credentials or auth tokens in browser storage.
- Client route guards are UX only; the backend remains authoritative.
- Make Arabic/RTL layouts responsive with accessible labels, keyboard navigation, visible focus, meaningful headings, and clear errors.
- Use server-state caching only where needed. Add React Query, Zustand, icon packages, or routing packages only if justified; do not install every package listed in the source prompt automatically.
- Do not hotlink fake production images. Use local placeholders or explicitly licensed assets.
- Document supported browser versions implied by Tailwind CSS 4.

## 12. OWASP Top 10:2025 threat and test matrix

Use the official 2025 categories. The Top 10 is an awareness/risk taxonomy, not a complete verification checklist. Use OWASP ASVS 5.0.0 as a more detailed security verification reference; target applicable Level 1 requirements and document exceptions.

| Category | Store threat and required control | Verification |
|---|---|---|
| A01:2025 Broken Access Control | IDOR on orders, downloads, files, and admin actions; default-deny and server-side ownership checks. If remote fetching is ever added, SSRF belongs in this access-control threat review. | Use two customers and an admin. Swap IDs and call endpoints directly; no cross-account data or unauthorized action is allowed. |
| A02:2025 Security Misconfiguration | Debug output, exposed private files or environment files, weak cookies, open CORS, permissive proxy trust, or mock enabled in production. | Production config fails closed, hides errors/secrets, serves only public root, sets required cookies/headers, rejects untrusted origins, and refuses mock payment. |
| A03:2025 Software Supply Chain Failures | Compromised, unmaintained, vulnerable, or unpinned Composer/npm dependency or build artifact. | Lockfiles are committed; dependency audits and license checks run; no unresolved critical/high advisory remains without a documented release-blocking exception. |
| A04:2025 Cryptographic Failures | Plaintext passwords/reset tokens, weak secrets, sensitive data in logs, or missing transport protection. | Inspect DB and logs for raw secrets; verify password hash/rehash, single-use hashed reset tokens, production HTTPS, and secret-free repository history for new files. |
| A05:2025 Injection | SQL injection, reflected/stored XSS, header/filename injection, or unsafe dynamic identifiers. | SQL payloads cannot alter queries; XSS strings render as text; allowlists reject dynamic SQL identifiers; filenames and headers are safely encoded. |
| A06:2025 Insecure Design | Client price tampering, invalid order/payment transitions, duplicate fulfillment, unbounded uploads or abuse. | Alter submitted prices/statuses; retry and race requests; invalid transitions fail; totals remain server-computed; limits and abuse controls work. |
| A07:2025 Authentication Failures | Credential stuffing, account enumeration, session fixation, weak reset, or unprotected administrator access. | Verify generic auth responses, rate limits, session rotation/revocation/timeouts, reset token lifecycle, and required admin MFA. |
| A08:2025 Software or Data Integrity Failures | Client-asserted payment success, unreviewed seed/migration/build changes, or cross-environment data contamination. | Client cannot mark payment paid; production cannot run mock/seed/test; migrations and build lockfiles are reviewed; test DB isolation guard blocks production. |
| A09:2025 Security Logging & Alerting Failures | Sensitive actions are invisible, uncorrelated, or logs leak credentials. | Auth/admin/CSRF/download/error events have request IDs and redaction; verify a test alert integration event without exposing secret values. |
| A10:2025 Mishandling of Exceptional Conditions | Fail-open authorization, partial transactions, information leakage, double processing after retries, or broken storage/database failure handling. | Inject failures during order, payment simulation, grant creation, and streaming. Rollbacks work, no unauthorized grant is created, retry is idempotent, and clients see safe errors. |

Maintain a test-plan entry for every row with test name, command or procedure, expected outcome, actual result, and any release blocker.

## 13. Testing and quality gates

Implement and run tests appropriate to the repository:

- PHP syntax/lint and static analysis where configured.
- Unit tests for money/currency arithmetic, validation, authorization policies, order transitions, idempotency, and download grant rules.
- Integration tests against MySQL for migrations, uniqueness, transactions, prepared queries, and session behavior.
- API tests for auth, CSRF, role/ownership enforcement, validation, rate limits, safe errors, and payment mode guards.
- Frontend tests for loading/error/form states, accessible interaction, API client behavior, and Arabic/RTL behavior.
- End-to-end tests for registration/login, catalog, test order, mock success/decline, order history, allowed download, denied cross-account download, admin product management, and production checkout disabled.
- Security checks based on the OWASP matrix, dependency lockfiles, file upload/download boundaries, headers, and configuration.
- A test database must be separate from development and production. Refuse destructive setup if the environment/database does not exactly identify itself as a local/test database.
- Do not use SQLite to claim MySQL/PDO integration coverage.
- Run frontend lint/type-check/build scripts if present. Do not silently skip failing checks; fix them or report why they cannot run.
- Avoid tests that call live payment services, send real emails, upload private assets to public services, or mutate external production systems.

## 14. Phased execution and Git commits

### Phase 0 — Inspect and plan
Read repository instructions, versions, Git status, and existing functionality. Record a short plan and preserve user changes.

### Phase 1 — Foundation
Set up or adapt the PHP entry point, routing, configuration validation, Composer dependencies, React/Vite/Tailwind, error handling, request IDs, logging interface, and CI. Add only a safe .env.example and ensure real .env/storage/logs are ignored.

### Phase 2 — Database
Implement the MySQL schema, migrations, constraints, indexes, environment-safe CLI commands, and isolated test database setup. Verify a clean migration and safe rerun behavior.

### Phase 3 — Identity and authorization
Implement registration/login/logout/reset, server-side session lifecycle, CSRF middleware, roles/policies, rate limits, and admin MFA. Test positive and negative authorization cases.

### Phase 4 — Catalog and admin assets
Implement public catalog, protected admin CRUD, product lifecycle, upload validation, private storage, asset versioning, and audit records. Test that public users cannot read assets directly.

### Phase 5 — Orders and mock payment
Implement server-priced orders, immutable item snapshots, transaction/state machine/idempotency, mock-only local/test routes, production guards, and isolated download grants. Test tampering, replay, concurrency, rollback, and production mode.

### Phase 6 — Frontend
Build accessible Arabic/RTL catalog, authentication, checkout/test simulation, order/download views, and admin pages. Confirm production shows checkout as disabled.

### Phase 7 — Hardening and verification
Complete the OWASP matrix, integration/E2E suite, dependency review, security headers, error/log review, and deploy-neutral configuration checks.

### Phase 8 — Documentation and handoff
Complete the required docs, record actual test outcomes and limitations, verify no production mock path exists, and provide the final report.

After each completed phase, create one focused Git commit using Conventional Commits, for example:

- feat(auth): add secure session and csrf flow
- feat(catalog): add private versioned product assets
- feat(orders): add development-only payment simulation
- test(security): cover download authorization and production guards
- docs: document deployment-neutral setup

Do not amend old commits, force-push, or combine unrelated phases. Do not commit secrets, generated private files, local databases, logs, or real customer data.

## 15. Required documentation and acceptance criteria

Required documentation:

- README.md: prerequisites, setup, local run, frontend build, migration, test commands, first-admin bootstrap, and troubleshooting.
- .env.example: variable names and harmless placeholders only, with descriptions for local/test/production.
- docs/architecture.md: module boundaries, request flow, database relationships, order state machine, and download flow.
- docs/security.md: threat model, password/session/CSRF/RBAC/MFA controls, upload/download controls, payment production gate, secret handling, and logging.
- docs/test-plan.md: MySQL test setup, commands actually run, OWASP matrix, actual results, failures, and blockers.
- docs/deployment.md: provider-neutral PHP/MySQL/HTTPS/public-root/private-storage/CLI/secrets/logging/proxy/backup/restore requirements. Server-specific examples must be optional.
- docs/operations.md: safe migrations, backup/restore, dependency updates, log retention, secret rotation, and incident-relevant events.
- List unresolved decisions: host, payment provider, jurisdiction/currency/tax, mail provider, storage provider, retention, and data residency.

The implementation is complete only when all applicable items pass:

1. The application runs locally from documented instructions, without Laravel or committed secrets.
2. React 19.3 and Tailwind CSS 4.x build successfully with pinned dependency lockfiles.
3. A clean MySQL database initializes through versioned migrations; test setup cannot target production.
4. Registration, login, logout, and password reset work without plaintext credentials or account enumeration.
5. Session ID rotation, revocation, secure production cookie flags, server-side expiry, and CSRF protections work.
6. Admin MFA and server-side roles protect every admin route; customers cannot view another customer's order or download.
7. Only published products are public; product and file updates preserve historical order snapshots.
8. Uploaded digital files cannot be accessed through a public URL and cannot escape private storage through traversal or symlinks.
9. The server computes order prices and currency; tampering, invalid state changes, replay, and duplicate concurrent fulfillment are rejected.
10. Mock payment works only in isolated local/test environments. Production rejects mock configuration at startup and in the payment service; production checkout is disabled.
11. Download grants are created only after an allowed test payment result, tied to the exact order item and asset version, and checked on every request.
12. API errors, logs, and audit events are useful and correlated but do not disclose secrets, stack traces, private paths, or payment claims.
13. Every applicable OWASP Top 10:2025 row has a recorded verification result; no critical/high finding remains unresolved without an explicit release-blocking exception.
14. The interface supports Arabic and RTL, keyboard use, clear form labels, focus states, and safe loading/error/empty states.
15. Setup, testing, deployment, operations, and unresolved hosting/payment decisions are documented.
16. Git history contains focused phase commits and no secrets, private assets, or local databases.

## 16. Final report

At the end, provide:

- A concise summary of modules and user flows implemented.
- The important architecture and security decisions.
- The exact tool versions verified, with verification date.
- The tests and security checks actually run, plus their real outcomes.
- The Git commits created.
- Any remaining failures, exceptions, or launch blockers.
- A clear statement that mock payment is for development/testing only and that real payment collection is not implemented.
- The deployment capabilities still requiring confirmation after hosting is selected.

Never call the application production-ready for real commerce merely because local tests pass.

## Official references

- OWASP Top 10:2025: https://top10.owasp.org/2025/0x00_2025-Introduction/
- OWASP Application Security Verification Standard 5.0.0: https://asvs.owasp.org/
- PHP supported versions: https://www.php.net/supported-versions.php
- PHP PDO prepared statements: https://www.php.net/manual/en/pdo.prepare.php
- React versions: https://react.dev/versions
- React 19.3 release: https://react.dev/blog/2026/09/09/react-19-3
- Tailwind CSS releases: https://tailwindcss.com/blog
- Tailwind CSS compatibility: https://tailwindcss.com/docs/compatibility
- MySQL release model: https://dev.mysql.com/doc/refman/8.4/en/mysql-releases.html
- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP CSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
