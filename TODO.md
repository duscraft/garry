# Garry - TODO

> Tracking remaining work before production release

## 🔴 Critical (Blocking Production)

### Infrastructure
- [ ] Create Kubernetes manifests (Deployments, Services, Ingress, ConfigMaps, Secrets)
- [ ] Set up secrets management (External Secrets, Sealed Secrets, or Vault)
- [ ] Configure TLS/Ingress with cert-manager
- [ ] Push container images to registry (GHCR, ECR, etc.)
- [ ] Set up database migrations strategy (init container or job)

### All Apps
- [ ] Configure production environment variables
- [ ] Set up production PostgreSQL (managed service recommended)
- [ ] Set up production Redis (managed service recommended)

---

## 🟡 Important (Should Have)

### API (Rust/Axum)
- [ ] Add request rate limiting
- [ ] Add file upload for receipts/invoices (S3 or compatible)
- [ ] Add image optimization/compression
- [ ] Add OpenAPI/Swagger documentation
- [ ] Add pagination for warranties list
- [ ] Clean up unused imports (cargo fix warnings)

### Auth (Go/Chi)
- [ ] Add email verification flow
- [ ] Add password reset flow (Redis tokens implemented, need email sending)
- [ ] Add OAuth providers (Google, Apple Sign-In)
- [ ] Add account deletion endpoint (GDPR)
- [ ] Add session management (list active sessions, revoke)

### Web (React/Vite)
- [ ] Add PWA support (service worker, manifest)
- [ ] Add offline mode with local storage sync
- [ ] Add image upload UI for receipts
- [ ] Add warranty export (PDF)
- [ ] Add dark mode toggle
- [ ] Add i18n (currently French only)
- [ ] Add E2E tests (Playwright or Cypress)

### Mobile (Kotlin Multiplatform)
- [ ] Add push notifications (FCM for Android, APNs for iOS)
- [ ] Add camera integration for receipt scanning
- [ ] Add OCR for automatic data extraction
- [ ] Add biometric authentication (fingerprint, Face ID)
- [ ] Add widget for expiring warranties
- [ ] Set up App Store signing and deployment
- [ ] Set up Play Store signing and deployment

---

## 🟢 Nice to Have

### Infrastructure
- [ ] Add Helm chart for templated deployments
- [ ] Set up GitOps (ArgoCD or Flux)
- [ ] Add Prometheus metrics endpoints
- [ ] Set up Grafana dashboards
- [ ] Add log aggregation (Loki or ELK)
- [ ] Set up error tracking (Sentry)
- [ ] Add HPA (Horizontal Pod Autoscaler)
- [ ] Add PodDisruptionBudget
- [ ] Add Network Policies

### API (Rust/Axum)
- [ ] Add warranty categories management (custom categories)
- [ ] Add warranty sharing (family mode)
- [ ] Add warranty templates
- [ ] Add bulk import from CSV/JSON
- [ ] Add search with filters (full-text search)

### Auth (Go/Chi)
- [ ] Add 2FA (TOTP)
- [ ] Add login history/audit log
- [ ] Add suspicious activity detection

### Web (React/Vite)
- [ ] Add warranty calendar view
- [ ] Add dashboard charts (Chart.js or Recharts)
- [ ] Add drag-and-drop for receipt upload
- [ ] Add keyboard shortcuts
- [ ] Add Lighthouse CI for performance tracking

### Mobile (Kotlin Multiplatform)
- [ ] Add warranty reminders with custom intervals
- [ ] Add document scanner with edge detection
- [ ] Add share warranty to contacts
- [ ] Add Siri/Google Assistant shortcuts
- [ ] Add Apple Watch / Wear OS companion app

---

## ✅ Completed

### Infrastructure
- [x] Docker Compose for local development
- [x] GitHub Actions CI for all apps
- [x] Production hardening (env vars, validation, logging)
- [x] Redis integration for token storage
- [x] Health check endpoints with DB/Redis verification
- [x] Rate limiting in auth service
- [x] CORS configuration from env vars
- [x] Structured JSON logging

### API (Rust/Axum)
- [x] CRUD for warranties
- [x] JWT authentication middleware
- [x] Warranty statistics endpoint
- [x] Expiring warranties endpoint
- [x] Categories with French names
- [x] Input validation and sanitization
- [x] Unit and integration tests

### Auth (Go/Chi)
- [x] User registration with password hashing
- [x] Login with JWT generation
- [x] Refresh token rotation
- [x] Logout (token invalidation)
- [x] Configurable bcrypt cost
- [x] Input validation (email, password strength)
- [x] Unit tests

### Web (React/Vite)
- [x] Login/Register pages
- [x] Dashboard with stats
- [x] Warranty CRUD UI
- [x] Status badges (valid, expiring, expired)
- [x] Responsive design (Tailwind)
- [x] Protected routes
- [x] Unit tests

### Mobile (Kotlin Multiplatform)
- [x] Shared UI with Compose Multiplatform
- [x] Login/Register screens
- [x] Dashboard with stats
- [x] Warranty CRUD screens
- [x] iOS app structure and CI build
- [x] Android APK build
- [x] Token storage (DataStore)
- [x] Unit tests

---

## 📝 Notes

### Environment Variables (Production)

**API (Rust)**:
```bash
ENVIRONMENT=production
DATABASE_URL=postgres://...
JWT_SECRET=<strong-secret>
CORS_ORIGINS=https://garry.app
PORT=8080
```

**Auth (Go)**:
```bash
ENVIRONMENT=production
DATABASE_URL=postgres://...
REDIS_URL=redis://...
JWT_SECRET=<strong-secret>
CORS_ORIGINS=https://garry.app
BCRYPT_COST=12
RATE_LIMIT_RPS=10
RATE_LIMIT_BURST=20
PORT=8081
```

### Mobile Deployment Requirements

**iOS (App Store)**:
- Apple Developer account ($99/year)
- App Store Connect setup
- Signing certificates and provisioning profiles
- Fastlane Match or manual signing in CI

**Android (Play Store)**:
- Google Play Developer account ($25 one-time)
- Release signing keystore
- Play Console setup
