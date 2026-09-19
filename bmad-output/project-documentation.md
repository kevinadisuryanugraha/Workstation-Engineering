# Project Documentation — WORKSTATION (Engineering Intelligence & Operations)

> **BROWNFIELD ground truth.** Dihasilkan oleh skill BMAD `bmad-document-project` melalui
> scan codebase READ-ONLY (6 pass: skeleton, stack, entry points, modul, konvensi, integrasi).
> Dokumen ini menjadi input bagi skill BMAD lanjutan (PRD, architecture, tech-spec,
> project-context) agar mulai dari kondisi nyata. Jangan edit manual tanpa catatan;
> jalankan scan Update agar tetap akurat.

- **Tanggal scan:** 19 September 2026 (full re-scan; menggantikan scan 18 Sep 2026)
- **Root codebase:** `/home/smod-dev/Documents/kevin-work/workstation-engineering-intelligence-&-operations`
- **BMAD track:** BMad Method — `bmad-output/` berisi prd.md, architecture.md, epics.md,
  stories/, sprint-status.yaml, decision-log.md, handoff-manifest.json
- **Konteks:** Awalnya applet Google AI Studio; kini aplikasi full-stack mandiri
  (React SPA + Express API + PostgreSQL + agent daemon) yang ter-deploy di VPS produksi
- **Skala:** ± 24.266 baris TS/TSX/CSS (src 12.386 · server 7.593 · agent 453 · tests +
  scripts) · 51 commit di git (`b432d23`, 19 Sep 2026) · 37 file test · CI GitHub Actions

---

## 1. Repository Structure

### Layout

```
.
├── server.ts                    # Bootstrap Express (438 brs): middleware chain + mount 19 router + SPA serve
├── vite.config.ts               # Vite 8 (rolldown) + React + Tailwind 4 + PWA (manifest + workbox)
├── drizzle.config.ts            # Drizzle Kit (migrasi PostgreSQL)
├── tsconfig.json                # ES2022, strict: TRUE, alias @/*, allowImportingTsExtensions
├── package.json                 # name "workstation-engineering-intelligence", type: module (ESM)
├── bun.lock + package-lock.json # DUA lockfile: bun (CI) & npm (deploy VPS)
├── metadata.json                # Sisa metadata applet AI Studio (server-side Gemini)
├── .env.example                 # DATABASE_URL, JWT_SECRET, RATE_LIMIT_*, AGENT_* (Epic 9 & 11)
├── .github/workflows/ci.yml     # CI: bun install → tsc strict → vitest (push main + PR)
├── agent/                       # Daemon telemetri Linux (453 brs): index, config, collectors, transport
├── server/                      # Backend modular (7.593 brs) — lihat §4
│   ├── config/                  # auth.ts (JWT secret), security.ts (helmet options)
│   ├── constants/               # permissions.ts: 9 UserRole, Permission PERM_*, SERVER_ROLE_PERMISSIONS
│   ├── db/                      # client.ts (pool pg), migrate.ts, seed*.ts, 15 migrasi SQL, schema/ (26 file)
│   ├── middlewares/             # agentAuth, authenticate (JWT), correlationId, rateLimit, rbac, safeAsync
│   └── modules/                 # 16 domain: ai, audit, auth, deployments, git, incidents, kb,
│                                #   my-work, projects, reports, search, server-metrics, sprints,
│                                #   tickets, users, work-items
├── src/                         # Frontend SPA (12.386 brs)
│   ├── main.tsx                 # Bootstrap React 19 (StrictMode)
│   ├── App.tsx                  # Orchestrator view + routing tab (1.059 brs)
│   ├── components/              # 23 komponen: 15 view fitur + modal + layout (Sidebar, Header, MobileBottomBar)
│   ├── hooks/api/               # 7 hook TanStack Query (useTickets, useIncidents, useSprints, ...)
│   ├── hooks/                   # useOnlineStatus, usePWAInstall
│   ├── stores/                  # appStore.ts, authStore.ts (Zustand)
│   ├── lib/                     # apiClient.ts (envelope ADR-004), auth.ts, rbac.ts, utils.ts
│   ├── types.ts                 # Domain model terpusat
│   ├── mockData.ts              # Data demo mode DEMO (masih di-import App.tsx, label SEC-05)
│   ├── blueprintData.ts         # ⚠ Teks blueprint target lama (Laravel+PG) — TIDAK sesuai implementasi
│   └── index.css                # Tailwind 4 + design system retro/neo-brutalist (+ .md-view)
├── tests/                       # 37 file test vitest (unit, service, RBAC, e2e workflow, agent, webhook)
├── deploy/                      # workstation.service, workstation-agent.service (systemd), README deploy VPS
├── docs/                        # AKUN-PRODUKSI-RAHASIA.md ⚠, UI-AUDIT-2026-09-18.md, DEEP-SCAN-REPORT, PRD PDF
├── scripts/generate-pwa-icons.js
└── bmad-output/                 # Workspace BMAD (artikel planning)
```

_Depth-3; node_modules, .git, dist, dev-dist, .pi, .agents dikecualikan._

### Monorepo / Workspace Signals

Tidak ada — single app (SPA + API dalam satu repo, di-deploy sebagai satu unit systemd
`workstation` + satu unit terpisah `workstation-agent`).

### Documentation Roots

- `README.md` (root)
- `docs/` — UI audit, deep-scan report, kredensial produksi (⚠ lihat Planning Notes), PRD PDF
- `deploy/README.md` — panduan deploy VPS Kontabo (Node 22, PostgreSQL 16, systemd, nginx)
- `bmad-output/` — prd.md, architecture.md (dengan ADR), epics.md, stories/, decision-log.md

---

## 2. Stack and Toolchain

### Primary Language(s) and Runtime

| Language | Version | Evidence File |
|----------|---------|---------------|
| TypeScript | ^7.0.2 (devDep), target ES2022, `strict: true` | package.json, tsconfig.json |
| Node.js | 22+ (produksi VPS: v24.20.0) | deploy/README.md, verifikasi VPS 19 Sep |
| SQL | PostgreSQL 16 (15 migrasi drizzle) | server/db/migrations/ |

### Framework(s)

| Framework | Version | Role |
|-----------|---------|------|
| React | 19.0.1 | SPA frontend |
| Vite (rolldown) | 8.3.0 | Bundler + dev server middleware di server.ts |
| Express | 4.21.2 | REST API `/api/v1/*` |
| Drizzle ORM | 0.45.2 | ORM + migrasi PostgreSQL |
| Tailwind CSS | 4.3.3 | Styling (via @tailwindcss/vite) |

### Key Dependencies

**Runtime:**
- `@google/genai` 2.4.0 — Gemini AI (AI Intelligence view; fallback demo preview SEC-05)
- `@tanstack/react-query` ^5.103.1 — data fetching frontend (7 hook di src/hooks/api)
- `zustand` ^5.0.15 — state global (appStore, authStore)
- `zod` ^4.6.5 — validasi input (project.schema.ts, ticket.schema.ts, work-item.schema.ts)
- `jsonwebtoken` 9 + `bcryptjs` 3 — autentikasi JWT + hash password
- `helmet` 8.3 + `express-rate-limit` 8.7 — hardening HTTP (SEC-03) + rate limit login (SEC-02)
- `pg` 8.23 — driver PostgreSQL (pool max 20)
- `react-markdown` 10 + `remark-gfm` 4 — render markdown laporan (fix audit H-1)
- `recharts` 3, `motion` 12, `animejs` 4, `lucide-react` — visualisasi, animasi, ikon
- `vite-plugin-pwa` 1.3 — PWA (manifest, workbox precache 17 entri)

**Build / Dev toolchain:**
- Package manager: **bun** (bun.lock — dipakai CI) + **npm** (package-lock.json — dipakai deploy VPS; perlu `--legacy-peer-deps` karena konflik peer vite 8 ↔ esbuild 0.25)
- `tsx` 4.21 — runtime TS untuk dev (`npm run dev`) & migrasi/seed
- `esbuild` 0.25 — bundle server.ts → dist/server.cjs (CJS, packages external)
- `drizzle-kit` 0.31 — generate & migrasi skema
- `playwright-core` 1.63 — dipakai audit UI runtime (dev-only)
- `vitest` 5 — test runner

### Test Framework(s)

- **Vitest 5** — 37 file test di `tests/*.test.ts`: auth, rbac, token-revocation,
  http-hardening, webhook, db, work-items, tickets (+comments/linking), incidents
  (+lifecycle/sla/timeline), sprints, kb-articles, projects, deployments, reports
  (+generator), generated-reports, ai-mode/translate/snapshots, agent-daemon/ingestion/
  service-probes, git-linker, finding-lifecycle, recommendation-conversion,
  executive-narrative, acceptance-criteria, dependencies, sanity, server-health,
  workflow-e2e. **Dicatat saja, tidak dieksekusi saat scan.**

### Container / Infrastructure

- Tanpa Dockerfile untuk app; PostgreSQL 16 berjalan sebagai container di VPS (`workstation-db`, port 127.0.0.1:5433)
- Deploy: VPS Kontabo Ubuntu 24.04, systemd (`workstation.service` API+SPA di port 3020, `workstation-agent.service` daemon), nginx reverse proxy + SSL → https://workstation.zamzami.or.id
- CI: GitHub Actions `ci.yml` — bun install frozen → `tsc --noEmit` (strict) → `vitest run` (push main + PR). **Tidak ada auto-deploy** (deploy manual: git pull → npm install → build → restart systemd)

---

## 3. Entry Points and Key Flows

### Application Bootstrap

| Entry File | Role |
|------------|------|
| `server.ts` | Bootstrap Express: helmet → cors → json(500kb) → correlationId → rate limit login → mount 19 router `/api/v1/*` → SPA fallback → `app.listen(PORT 0.0.0.0)` (default 3000; VPS 3020) |
| `src/main.tsx` | Bootstrap React 19 (StrictMode) → App.tsx |
| `agent/index.ts` | Daemon telemetri (Epic 9/Story 9.1): sampling CPU/RAM/disk + probe layanan (http/tcp) tiap AGENT_INTERVAL_SECONDS, kirim ke `/api/v1/agent` dengan buffer retry, graceful shutdown SIGTERM/SIGINT |
| `server/db/migrate.ts` | Runner migrasi drizzle (`npm run db:migrate`) |

### Primary Routing Layer

- **Backend:** Express Router per domain di `server/modules/<domain>/<domain>.routes.ts`,
  di-mount di server.ts dengan pola `/api/v1/<domain>`. Group: auth, projects,
  work-items, tickets, webhooks (git), deployments, audit-logs, my-work, users,
  agent (token khusus), server-metrics, reports, incidents, sprints, milestones,
  kb, search, ai. Ada alias legacy `/api/auth/login` + `/api/v1/auth/login`.
- **Frontend:** SPA tanpa react-router — view switching via state tab di App.tsx
  (Overview, Project360, Work Items, Ticketing, Incident Room, Sprint, Git Intelligence,
  Deployments, Infrastructure, Security, Audit Log, Knowledge Base, Reports, Report,
  AI Intelligence, Blueprint) + GlobalSearchModal + MobileBottomBar.

### Authentication / Middleware Chain

`helmet(buildHelmetOptions)` → `cors()` → `express.json({limit:"500kb"})` →
`requestCorrelationId` → [`loginRateLimiter` di /auth/login] →
[`authenticateToken` (JWT Bearer) di route terproteksi] →
[`requirePermission`/`requireRole` (RBAC 9 role × PERM_*)] → handler.
Khusus `/api/v1/agent`: `agentAuth` (shared token AGENT_INGEST_TOKEN, bukan JWT — Story 9.2).
Webhook git: verifikasi HMAC `GITHUB_WEBHOOK_SECRET` (webhook.crypto.ts).
Revokasi token via `users.token_version` (kolom DB, ada test token-revocation).

### Background Workers / Queues

- Tidak ada message queue eksternal.
- `agent/` = poller terpisah (setInterval-style setTimeout loop), bukan antrian.
- `incident.events.ts` + SLA timer di modul incidents (in-process).

---

## 4. Module and Domain Structure

### Layer Breakdown

| Layer / Module | Path(s) | Inferred Responsibility |
|---------------|---------|------------------------|
| Bootstrap API | `server.ts` | Wiring middleware + router + serving SPA build |
| Domain modules | `server/modules/{auth,projects,work-items,tickets,deployments,audit,my-work,users,server-metrics,reports,sprints,kb,search,incidents,git,ai}` | Pola konsisten: `<x>.routes.ts` → `<x>.controller.ts` → `<x>.service.ts` (+ `<x>.repository.ts`, `<x>.schema.ts` zod) |
| Persistence | `server/db/` | client pool pg + drizzle, 26 tabel schema, 15 migrasi, seed |
| Cross-cutting | `server/middlewares/`, `server/config/`, `server/constants/` | JWT, RBAC, rate limit, correlation id, safeAsync, helmet, permissions |
| Telemetry agent | `agent/` | Daemon ringan di server termonitor → ingestion API |
| SPA views | `src/components/*View.tsx` (15) | Satu view per fitur, data via hooks/api (react-query) |
| SPA shared | `src/lib/`, `src/stores/`, `src/hooks/` | apiClient envelope, auth manager, rbac mirror, zustand |
| Demo/legacy data | `src/mockData.ts`, `src/blueprintData.ts` | Mode demo berlabel SEC-05; blueprint teks lama (tidak akurat vs implementasi) |

### Cross-Cutting Utilities

- `server/middlewares/safeAsync.ts` — wrapper async route: error DB → HTTP 503 `DATABASE_UNAVAILABLE` (degraded-mode contract, kode PG ECONNREFUSED/28P01/42P01/…)
- `server/modules/ai/ai.fallback.ts` — preview demo statis berlabel jujur ketika Gemini gagal/tanpa key (SEC-05, Story 8.3)
- `server/modules/git/entity-parser.ts` + `git-linker.service.ts` — link commit/PR → work item/ticket
- `src/lib/apiClient.ts` — ApiError + JSON Envelope ADR-004 (`{data}` / `{error:{code,message,details}}`)
- `server/constants/permissions.ts` — matriks 9 role (Super Admin … Viewer) × permission `PERM_*`; dimirror di `src/lib/rbac.ts`

### Notable Domain Concepts (from naming)

Organisasi → Proyek → Work Items (+ dependencies, acceptance criteria) · Sprints &
Milestones · Tickets (komentar, riwayat, evidence links) · Incidents (events, SLA) ·
Git Intelligence (repositories, commits, pull requests, webhook deliveries) ·
Deployments · Server Metrics (layanan termonitor) · AI Intelligence (scans,
recommendations, generated reports, translate) · Knowledge Base · Audit Logs ·
RBAC + Users (token_version).

---

## 5. Conventions and Patterns

### Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Files | kebab-case + suffix peran | `audit-log.service.ts`, `work-item.routes.ts`, `useWorkItems.ts` |
| Komponen React | PascalCase + suffix View/Modal/Panel | `IncidentRoomView.tsx`, `RBACDenialModal.tsx` |
| Functions/vars | camelCase | `buildStaticDemoPreview`, `agentIngestRouter` |
| Types/constants | UPPER_SNAKE untuk enum-like | `PERM_VIEW_DASHBOARD`, `AGENT_INGEST_TOKEN`, `SERVER_ROLE_PERMISSIONS` |

### Module Resolution

ESM (`"type": "module"`) dengan **ekstensi .ts eksplisit** pada import server
(`allowImportingTsExtensions`); frontend memakai bundler resolution + alias `@/*`;
tidak ada barrel export dominan (schema/index.ts satu-satunya barrel).

### Concurrency Model

async/await di seluruh backend; pool koneksi pg (max 20); setTimeout loop pada agent;
tidak ada worker thread / antrian eksternal.

### Error Handling Style

- HTTP: `safeAsync()` → 503 DATABASE_UNAVAILABLE untuk kegagalan DB; envelope error ADR-004
- Frontend: `ApiError` class (code, status, details) dilempar apiClient
- Proses: pool `on('error')` di-log tanpa crash; agent buffer + retry dengan console.warn

### Logging Approach

`console.log/warn/error` dengan prefix tag (`[agent]`, `[AI Scan]`, `[DB Pool Error]`) +
correlation id per request. Tidak ada library logging terstruktur (winston/pino tidak dipakai).

### Configuration and Secrets

- dotenv `.env` (lihat `.env.example`): DATABASE_URL, JWT_SECRET (min 32 char),
  RATE_LIMIT_*, GEMINI_API_KEY, AGENT_INGEST_TOKEN, AGENT_* (daemon & probes Epic 11)
- Produksi: `.env` di `/opt/workstation`, password DB di `/opt/workstation/.dbpass-workstation` (chmod 600)
- ⚠ `docs/AKUN-PRODUKSI-RAHASIA.md` berisi kredensial nyata di dalam repo

### Test File Location Convention

Terpusat di `tests/*.test.ts` (bukan colocated), dijalankan vitest; CI mengeksekusi
dengan env dummy JWT_SECRET/AGENT_INGEST_TOKEN.

---

## 6. Integration Points

### External HTTP APIs

| Service / Domain | Direction | Notes |
|-----------------|-----------|-------|
| Google Gemini (`@google/genai`) | outbound | AI Intelligence: scan/translate/narrative; fallback demo berlabel bila gagal (SEC-05) |
| GitHub (webhook) | inbound | `POST /api/v1/webhooks` — HMAC `GITHUB_WEBHOOK_SECRET`, feeding Git Intelligence |
| Google Fonts | outbound (CDN) | fonts.googleapis.com / fonts.gstatic.com (runtime caching workbox) |
| Agent → WORKSTATION API | internal | `POST /api/v1/agent` token shared; probes http/tcp ke layanan lokal server termonitor |

### Database(s)

| Database | Type | ORM / Driver | Connection Pattern |
|----------|------|-------------|--------------------|
| PostgreSQL 16 | Relational | drizzle-orm 0.45 + pg 8 (node-postgres) | Pool max 20, idle 30s; dev `localhost:5432/workstation_dev`, prod container `workstation-db` di 127.0.0.1:5433; 15 migrasi drizzle-kit |

### Message Queues / Event Buses

None detected. (Buffer retry in-process pada agent transport.)

### Object / File Storage

None detected.

### Third-Party Services

| Service | Category | SDK / Client |
|---------|---------|-------------|
| Google Gemini | AI/LLM | @google/genai 2.4.0 |
| GitHub | Source control webhooks | HTTP + crypto HMAC |
| Kontabo VPS + aaPanel | Hosting | systemd ×2, nginx, SSL (manual deploy) |
| PWA (self-hosted) | Client distribution | vite-plugin-pwa + workbox |

---

## 7. Planning Notes

_Catatan scan yang relevan untuk planning — BUKAN task implementasi._

1. **Dua lockfile berisiko drift** — `bun.lock` (CI) vs `package-lock.json` (deploy VPS).
   npm install di VPS butuh `--legacy-peer-deps` (konflik peer vite 8 ↔ esbuild 0.25).
   Perlu keputusan: satukan toolchain (ADR kandidat).
2. **`docs/AKUN-PRODUKSI-RAHASIA.md` berisi kredensial produksi nyata** (password VPS lama
   masih tercatat meski tidak valid lagi, kredensial lain valid) — ter-commit ke git.
   Rotasi + pindahkan ke secrets manager, lalu purge dari riwayat bila perlu.
3. **`src/blueprintData.ts` menonaktifkan akurat** — mendeskripsikan arsitektur target
   Laravel+PG yang TIDAK sesuai implementasi (Express+PG). Rapikan agar tidak menyesatkan
   viewer/auditor.
4. **`mockData.ts` masih di-import App.tsx** — co-existence mode demo vs data live belum
   punya strategi deprecation terdokumentasi.
5. **Tidak ada auto-deploy** — CI hanya type-check + test; deploy manual di VPS sudah
   terbukti (19 Sep) tapi bergantung disiplin manual. Deployment workflow kandidat ADR.
6. **TypeScript ^7.0.2** — versi mayor baru; pastikan disengaja (bukan typo), karena
   devDep lain masih di generasi sebelumnya.
7. **Logging console saja** — tanpa struktur/level/ship; kandidat perbaikan observability
   bersama correlation id yang sudah ada.
8. **Deploy terverifikasi 19 Sep 2026**: VPS sudah di `b432d23`, build baru
   (`index-oP9CXHfP.js`) live dan memuat marker fix UI audit (H-1 md-view, H-2
   prefers-reduced-motion).

---

## 8. Open Questions

1. Apakah dual lockfile (bun untuk CI, npm untuk VPS) disengaja permanen, atau akan
   distandarkan ke satu package manager?
2. Kapan dan bagaimana mode demo (`mockData.ts`) dicalkan — tetap fitur (demo landing)
   atau dihapus setelah data live paripurna?
3. Apakah blueprint Laravel (blueprintData.ts) masih relevan sebagai arah evolusi,
   atau sudah resmi ditinggalkan demi Express+Drizzle saat ini?
4. Strategi rotasi kredensial & pengelolaan secrets: apakah mau pindah ke systemd
   credentials / secrets manager, dan kapan file akun di `docs/` dibersihkan?
5. Apakah perlu pipeline deploy otomatis (GitHub Actions → VPS) seiring bertambahnya
   frekuensi rilis?

---

## 9. Document History

| Date | Author | Change |
|------|--------|--------|
| 18 Sep 2026 | BMAD bmad-document-project | Scan awal (pra-git, era AI Studio applet) |
| 19 Sep 2026 | BMAD bmad-document-project | Full re-scan: git+CI+37 test, server modular 16 domain, drizzle 15 migrasi, agent Epic 9/11, deploy VPS produksi, fix UI audit ter-deploy |

---

_BMAD Planning & Orchestrator · Document Project · tracks `bmad-document-project` from the BMAD Method by the BMAD Code Organization (https://github.com/bmad-code-org/BMAD-METHOD)_
