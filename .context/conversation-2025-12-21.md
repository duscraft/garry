# Garry Development Session - December 21, 2025

## Project Overview

**Garry** is a warranty/receipt management app (French market) built as a monorepo with 4 apps:
- `apps/api/` - Rust/Axum API (port 8080)
- `apps/auth/` - Go/Chi auth service (port 8081)
- `apps/web/` - React/Vite/Tailwind frontend (port 3000)
- `apps/mobile/` - Kotlin Multiplatform (iOS/Android)

**Repository:** https://github.com/duscraft/garry

---

## Session Summary

### Starting State
- 9 commits on main (last: `dede892` - tests and CI)
- Complete monorepo with all 4 apps implemented
- Unit tests and integration tests for all apps
- GitHub Actions CI workflows with path-based triggers

### What We Did This Session

#### 1. Production Hardening (Commit: `21e3254`)

**Rust API (`apps/api/`):**
- Added `Environment` enum (Development/Production)
- Production mode requires `JWT_SECRET` and `DATABASE_URL` env vars
- Added `cors_origins` from `CORS_ORIGINS` env var
- Added structured JSON logging with tracing
- Added request ID tracking via `TraceLayer`
- Added DB health check in `/health` endpoint
- Added input validation functions for warranties

**Go Auth (`apps/auth/`):**
- Added Redis token store (`internal/redis/store.go`) for:
  - Refresh tokens
  - Password reset tokens
  - Email verification tokens
  - Session management
- Added configurable bcrypt cost (default 12)
- Added rate limiting with `httprate`
- Added structured JSON logging with `slog`
- Added input validation (email, password strength)
- Health check verifies both DB and Redis

**Infrastructure:**
- Updated `docker-compose.yml` with Redis service
- Added new env vars: `ENVIRONMENT`, `REDIS_URL`, `CORS_ORIGINS`, `BCRYPT_COST`, `RATE_LIMIT_RPS`, `RATE_LIMIT_BURST`

#### 2. iOS App Structure (Commit: `848b0c8`)

- Created `apps/mobile/iosApp/` Xcode project wrapper
- Added gradle wrapper scripts (`gradlew`, `gradlew.bat`)
- Updated `mobile.yml` CI to build full iOS app on `macos-14` runner
- iOS builds for simulator without code signing
- Uploads `.app` artifact

#### 3. TODO.md Roadmap (Commit: `3962172`)

Created comprehensive `TODO.md` with:
- 🔴 Critical (blocking production)
- 🟡 Important (should have) per app
- 🟢 Nice to have (future features)
- ✅ Completed work
- 📝 Production env vars reference

#### 4. Feature PRs (4 branches created)

Delegated to specialized sub-agents:

**`feat/api-improvements`** (general agent):
- Rate limiting with `tower-governor` (10 req/s, burst 50)
- OpenAPI/Swagger docs with `utoipa` at `/swagger-ui`
- Pagination for warranties list
- Cleaned up unused imports

**`feat/auth-improvements`** (general agent):
- Email verification flow (Redis-backed)
- Password reset flow (endpoints + Redis)
- Account deletion endpoint (GDPR)
- Session management (list, revoke)
- Unit tests for all new handlers

**`feat/web-improvements`** (frontend-ui-ux-engineer):
- PWA support (service worker, manifest)
- Dark mode toggle with persistence
- i18n (French default, English) with `react-i18next`
- Dashboard charts with `Recharts`

**`feat/mobile-improvements`** (frontend-ui-ux-engineer):
- Biometric auth (Android + iOS)
- Dark mode with Material3
- Pull-to-refresh
- UI polish (animations, colors)

---

## Current State

### Branches

| Branch | Status | PR Link |
|--------|--------|---------|
| `main` | Up to date | - |
| `feat/api-improvements` | Pushed, needs PR | https://github.com/duscraft/garry/pull/new/feat/api-improvements |
| `feat/auth-improvements` | Pushed, needs PR | https://github.com/duscraft/garry/pull/new/feat/auth-improvements |
| `feat/web-improvements` | Pushed, needs PR | https://github.com/duscraft/garry/pull/new/feat/web-improvements |
| `feat/mobile-improvements` | Pushed, needs PR | https://github.com/duscraft/garry/pull/new/feat/mobile-improvements |

### Commits on Main

```
3962172 docs: add comprehensive TODO.md with roadmap per app
848b0c8 feat(mobile): add iOS app structure and CI build
21e3254 feat: production hardening - env vars, validation, redis, logging, rate limiting
dede892 test: add unit tests and CI workflows for all apps
4681c97 docs: update README with architecture and setup instructions
0ab9bbb feat: add docker-compose for local development
89ddaa6 feat(mobile): add complete Kotlin Multiplatform app
0541838 feat(web): add complete React application
3eb5009 feat(auth): add PostgreSQL persistence
860dd05 feat(api): add PostgreSQL database layer
49383a8 feat: scaffold monorepo with 4 apps
053510a :sparkles: init project with README
```

---

## Next Steps

### Immediate (Create PRs)
1. Click each PR link above to create the 4 PRs
2. Review and merge them

### Before Production
See `TODO.md` for full list. Key items:
- [ ] Create Kubernetes manifests (in separate infra repo)
- [ ] Set up secrets management
- [ ] Configure TLS/Ingress
- [ ] Push container images to registry
- [ ] Set up production PostgreSQL and Redis

### Future Features
- File upload for receipts (S3)
- OAuth providers (Google, Apple)
- Push notifications
- OCR for receipt scanning
- 2FA

---

## Environment Variables Reference

### API (Rust) - Production
```bash
ENVIRONMENT=production
DATABASE_URL=postgres://...
JWT_SECRET=<strong-secret>
CORS_ORIGINS=https://garry.app
PORT=8080
```

### Auth (Go) - Production
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

---

## Commands to Continue

### Resume development
```bash
cd /home/alaborderie/repositories/duscraft/garry
git status
git branch -a
```

### Check pending PRs
```bash
# After creating PRs, check their status
gh pr list
```

### Run tests
```bash
# API
cd apps/api && cargo test

# Auth
cd apps/auth && go test ./...

# Web
cd apps/web && npm test

# Mobile (requires Android SDK)
cd apps/mobile && ./gradlew :composeApp:testDebugUnitTest
```

### Start local development
```bash
docker compose up -d
```

---

## Notes

- `gh` CLI was not available, PRs need to be created manually via browser
- iOS builds require macOS (CI uses `macos-14` runner)
- Local gradle build for mobile failed due to missing Android SDK (works on CI)
- Go LSP errors in editor are due to missing `go mod download` (tests pass)
