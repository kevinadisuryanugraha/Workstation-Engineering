# Project Documentation — WORKSTATION (Engineering Intelligence & Operations)

> **BROWNFIELD ground truth.** Dihasilkan oleh skill BMAD `bmad-document-project` melalui
> scan codebase READ-ONLY. Dokumen ini menjadi input bagi skill BMAD lanjutan (PRD,
> architecture, tech-spec, project-context) agar mulai dari kondisi nyata. Jangan edit
> manual tanpa catatan; jalankan scan Update agar tetap akurat.

- **Tanggal scan:** 18 September 2026
- **Root codebase:** `/home/smod-dev/Documents/kevin-work/workstation-engineering-intelligence-&-operations`
- **BMAD track:** belum diinisialisasi (`bmad-output/` baru dibuat oleh scan ini)
- **Konteks:** Applet Google AI Studio (metadata.json) — prototipe full-stack dengan klaim produk "platform engineering intelligence"
- **Skala:** ± 12.324 baris TS/TSX/JS/CSS · ± 40 file sumber · 0 pengujian otomatis · tidak berada di bawah version control

---

## 1. Repository Structure

### Layout

```
.
├── index.html                  # SPA shell + meta PWA + Google Fonts
├── server.ts                   # Backend Express + Vite middleware + auth + AI (801 baris, SATU file)
├── vite.config.ts              # Vite 8 + React + Tailwind 4 + PWA (manifest + workbox)
├── tsconfig.json               # ES2022, noEmit, alias @/* — TANPA "strict"
├── package.json                # name "react-example" (boilerplate AI Studio)
├── bun.lock                    # package manager: bun (lockfile)
├── metadata.json               # applet AI Studio: server-side Gemini capability
├── .env.example                # GEMINI_API_KEY, APP_URL (placeholder)
├── scripts/
│   └── generate-pwa-icons.js   # generator ikon PWA
├── public/                     # ikon PWA 192/512/maskable, favicon, icon.svg
├── src/
│   ├── main.tsx                # bootstrap React (StrictMode)
│   ├── App.tsx                 # god component 885 baris — routing tab + 13 state slices
│   ├── types.ts                # domain model terpusat (376 baris): 9 role, 20 permission
│   ├── mockData.ts             # seluruh data demo (763 baris) — satu-satunya sumber data
│   ├── blueprintData.ts        # blueprint teks arsitektur target Laravel+PG (661 baris, tidak sesuai implementasi)
│   ├── index.css               # Tailwind 4 + design system retro/neo-brutalist
│   ├── components/             # 16 view fitur + 2 modal/layout
│   │   ├── ui/                 # 10 komponen UI reusable (RetroDesktopShell, RetroDialogs, dst.)
│   │   └── ...views
│   ├── hooks/                  # useOnlineStatus, usePWAInstall
│   └── lib/                    # auth.ts (AuthManager + DIRECTORY_USERS), rbac.ts, utils.ts
├── TEMPLATE-DEEP-SCAN-REPORT.md# template laporan manajer (Bahasa Indonesia)
└── WORKSTATION_Super_Duper_PRD.pdf  # PRD sumber (PDF, 673 KB)
```

_Depth-3 snapshot; node_modules, dist, cache dikecualikan._

### Monorepo / Workspace Signals

Tidak terdeteksi. Single app (client + server dalam satu root), tanpa `packages/`/`apps/`.

### Documentation Roots

- `README.md` — boilerplate default AI Studio (belum disesuaikan)
- `TEMPLATE-DEEP-SCAN-REPORT.md` — template laporan pemeriksaan untuk manajemen
- `WORKSTATION_Super_Duper_PRD.pdf` — PRD produk sumber
- `src/blueprintData.ts` — dokumentasi arsitektur tertanam sebagai data UI (informatif)

---

## 2. Stack and Toolchain

### Primary Language(s) and Runtime

| Language | Version | Evidence File |
|----------|---------|---------------|
| TypeScript | ^7.0.2 (devDep) | package.json, tsconfig.json |
| Node.js (server) | ES2022 target, ESM | server.ts, tsconfig.json |

### Framework(s)

| Framework | Version | Role |
|-----------|---------|------|
| React | ^19.0.1 | SPA UI (16 view fitur) |
| Express | ^4.21.2 | API server + static host (server.ts) |
| Vite | ^8.3.0 | Bundler + dev server (middleware mode di server.ts) |
| Tailwind CSS | ^4.3.3 | Styling (via @tailwindcss/vite) |
| vite-plugin-pwa | ^1.3.0 | PWA: manifest, workbox precache + runtime caching |

### Key Dependencies

**Runtime:**
- `@google/genai` ^2.4.0 — SDK Gemini AI (server-side, dipakai server.ts saja)
- `motion` ^12.23.24 — animasi (import "motion/react")
- `animejs` ^4.5.0 — animasi (duplikasi fungsi dengan motion — catatan planning)
- `recharts` ^3.10.1 — chart (OverviewView, ReportsView, dsb.)
- `lucide-react` ^0.546.0 — ikon
- `clsx` + `tailwind-merge` — class utilities (src/lib/utils.ts)
- `dotenv` ^17.2.3 — env loading (server)

**Build / Dev toolchain:**
- Package manager: **bun** (bun.lock); skrip npm-compatible
- `tsx` — menjalankan server.ts saat dev (`npm run dev` = `tsx server.ts`)
- `esbuild` — bundle server ke `dist/server.cjs` (format cjs, packages=external)
- TypeScript: `npm run lint` = `tsc --noEmit` (TIDAK ada ESLint/Prettier config)
- Tidak ada Dockerfile / docker-compose / IaC / CI-CD (.github tidak ada)

### Test Framework(s)

**Tidak terdeteksi.** Tidak ada test framework, tidak ada file `*.test.*` / `*.spec.*`.

### Container / Infrastructure

Tidak terdeteksi. Model deploy: Google AI Studio applet → Cloud Run (injeksi `GEMINI_API_KEY` & `APP_URL` saat runtime, lihat .env.example & metadata.json). Tidak ada CI/CD pipeline.

---

## 3. Entry Points and Key Flows

### Application Bootstrap

| Entry File | Role |
|------------|------|
| `server.ts` | Bootstrap Express (port 3000, 0.0.0.0); dev = Vite middleware, prod = static `dist/` |
| `src/main.tsx` | Mount React app ke #root (StrictMode) |
| `src/App.tsx` | Komposisi seluruh UI: tab navigation, session RBAC, 13 state slices data mock |

### Primary Routing Layer

- **Backend:** Express flat routes — `/api/auth/*` (login, me, logout, users, verify-action), `/api/actions/*` (rollback, declare-incident), `/api/ai/*` (scan, translate), `/api/health`. Tidak ada router terpisah.
- **Frontend:** SPA tab-state (`ActiveTab` di Sidebar) — bukan URL router. 16 tampilan: Overview, Project360, WorkItems, Ticketing, IncidentRoom, GitIntelligence, Deployments, Infrastructure, AIIntelligence, Reports, Blueprint, KnowledgeBase, AuditLog, Security + GlobalSearchModal & RetroDesktopShell.

### Authentication / Middleware Chain

`express.json({limit:"10mb"})` → (route) `authenticateToken` → `requirePermission(...)` / `requireRole(...)` → handler. Implementasi JWT manual (HMAC-SHA256 via node:crypto), tanpa library auth. **Tiga celah fatal terdeteksi — lihat §7 Planning Notes.**

### Background Workers / Queues

None detected. (Kafka/Redis/queue hanya disebut di data mock & blueprint.)

---

## 4. Module and Domain Structure

### Layer Breakdown

| Layer / Module | Path(s) | Inferred Responsibility |
|---------------|---------|------------------------|
| Server/API | `server.ts` | Monolith: auth engine, RBAC matrix, user directory, 9 endpoint API, AI client, Vite/static hosting |
| Views (fitur) | `src/components/*View.tsx` | 16 layar domain: overview, work items, ticketing, incident, git, deployment, infra, AI, report, blueprint, KB, audit, security |
| UI primitives | `src/components/ui/` | Design system retro: shell, dialogs, card, badge, sparkline, toast, counter, PWA button |
| State/session | `src/lib/auth.ts` | AuthManager singleton: sesi localStorage, login/offline-fallback, authFetch |
| RBAC klien | `src/lib/rbac.ts` | Duplikat matriks permission per role (sisi klien) |
| Domain model | `src/types.ts` | User, Project, WorkItem, Ticket, Incident, Deployment, AIFinding, ServerTelemetry, dsb. |
| Data demo | `src/mockData.ts`, `src/blueprintData.ts` | Seluruh konten aplikasi (tidak ada backend data nyata) |
| Hooks | `src/hooks/` | PWA install, online status |

### Cross-Cutting Utilities

- `src/lib/utils.ts` — helper class names (cn)
- `authFetch()` (lib/auth.ts) — wrapper fetch + Bearer token
- `crypto` (node) di server.ts — hashing, HMAC, timing-safe compare

### Notable Domain Concepts (from naming)

Project, WorkItem, Evidence, Ticket, Incident (commander/severity), Deployment (rollback), ServerTelemetry, AIFinding/Recommendation, TechnicalDebt, Commit/PR, EngineeringEvent, KnowledgeArticle, AuditLog, RBAC (9 role × 20 permission). PRD PDF menegaskan konsep "engineering activity → measurable, traceable, evidence-backed progress" + "dual-language (teknis ↔ manajemen)".

---

## 5. Conventions and Patterns

### Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Files (komponen) | PascalCase | `IncidentRoomView.tsx`, `RetroDesktopShell.tsx` |
| Files (lib/hooks) | camelCase | `auth.ts`, `usePWAInstall.ts` |
| Classes / Types | PascalCase interface/type union | `AuthSession`, `UserRole`, `Permission` |
| Functions | camelCase | `authenticateToken`, `hashPassword` |
| Constants | SCREAMING_SNAKE | `PERM_VIEW_DASHBOARD`, `SERVER_ROLE_PERMISSIONS` |
| CSS | custom utility classes | `.bg-retro-grid`, `.retro-shadow-sm` |

### Module Resolution

ESM (`"type":"module"`), relative imports di src, alias `@/*` → root (terdaftar tapi jarang dipakai — import relatif dominan).

### Concurrency Model

async/await + Promise (Express handler async untuk endpoint AI; fetch di klien). Tidak ada worker/queue.

### Error Handling Style

try/catch per-endpoint → `res.status(500).json({error})`; klien: try/catch + `console.warn/error` + fallback perilaku (offline). Tanpa error middleware terpusat, tanpa error boundary React terdeteksi di App.tsx (perlu konfirmasi saat planning).

### Logging Approach

`console.log/warn/error` saja. Tidak ada logging library, tidak ada structured logging, tidak ada request logging.

### Configuration and Secrets

`dotenv` + `process.env` (server): `JWT_SECRET` (punya **fallback hardcoded**), `GEMINI_API_KEY`, `NODE_ENV`, `PORT` (hardcoded 3000, tidak dari env). Klien: localStorage (`workstation_auth_session_v1`). `.gitignore` benar (exclude `.env*` kecuali `.env.example`).

### Test File Location Convention

Tidak ada. (Rekomendasi planning: tentukan framework + lokasi sebelum epic pengembangan.)

---

## 6. Integration Points

### External HTTP APIs

| Service / Domain | Direction | Notes |
|-----------------|-----------|-------|
| Google Gemini API (`@google/genai`) | outbound | Model `"gemini-3.8-flash"` — nama model perlu divalidasi terhadap API berjalan; dipakai untuk scan & translate; JSON response mode |
| Google Fonts (fonts.googleapis.com, fonts.gstatic.com) | outbound (browser) | Plus Jakarta Sans + JetBrains Mono; CacheFirst via workbox |
| Internal `/api/*` | inbound | Dikonsumsi `authFetch` klien: auth login/logout, actions, AI |

### Database(s)

**Tidak ada.** Seluruh state server in-memory (`SERVER_USERS` array); seluruh data aplikasi klien dari `mockData.ts`. Tidak ada ORM/driver/connection. (MySQL/PostgreSQL/Redis hanya disebut di konten mock & blueprint.)

### Message Queues / Event Buses

None detected. (Hanya narasi mock: "Kafka/Redis event bus" di blueprintData.)

### Object / File Storage

None detected.

### Third-Party Services

| Service | Category | SDK / Client |
|---------|---------|-------------|
| Google Gemini | AI/LLM | @google/genai (server-side) |
| Google AI Studio / Cloud Run | Hosting/deploy | metadata.json + env injeksi |

---

## 7. Planning Notes

Temuan scan yang relevan untuk planning (bukan tugas implementasi). **Urutan = tingkat kekritisan.**

1. **🔴 Auth bypass di server:** `authenticateToken` (server.ts) memberi identitas **Super Admin default** untuk request TANPA token. RBAC server efektif tidak melindungi apa pun.
2. **🔴 Token forgeable:** `verifyJWT` menerima token buatan klien (payload base64 JSON apa pun yang punya field `role`) dan "memperbaiki" permissions dari role tersebut → privilege escalation total.
3. **🔴 Sesi Super Admin otomatis di klien:** `AuthManager.restoreSession()` mem-bootstrap sesi Super Admin jika belum ada; fallback offline login menerima email mana pun **tanpa password**.
4. **🔴 Master-password backdoor:** pengecekan login server lolos jika `password === "admin123"` untuk akun mana pun; `switchRole()` klien mengirim `"admin123"` hardcoded.
5. **🔴 Kredensial plaintext di source:** 7 akun + password hash lemah + **petunjuk sandi plaintext** (`passwordHint`) di `src/lib/auth.ts` — ikut ter-bundle ke browser publik.
6. **🔴 JWT_SECRET fallback hardcoded** `"workstation-enterprise-rbac-secure-salt-2026"`.
7. **🔴 Tidak ada version control:** tidak ada `.git` — risiko kehilangan kerja, tanpa audit trail, tanpa rollback.
8. **🟠 Password hashing SHA-256 tanpa salt** — gunakan bcrypt/argon2 saat auth nyata dibangun.
9. **🟠 Tanpa persistence:** restart server = hilang; produk mengklaim "evidence-backed" tapi tidak ada DB. Kebutuhan DB (pilihan SQL/vektor/file) = keputusan arsitektur pertama.
10. **🟠 AI fallback mengembalikan data palsu:** tanpa `GEMINI_API_KEY`, `/api/ai/scan` mengembalikan temuan keamanan hardcoded seolah hasil scan nyata — berbahaya untuk alat yang diklaim "evidence-backed". Nama model `"gemini-3.8-flash"` perlu diverifikasi.
11. **🟠 Zero test, zero CI, zero linter** (lint = tsc --noEmit; tsconfig tanpa `"strict"`).
12. **🟠 Server hardening minim:** tanpa helmet/security headers, tanpa rate limit, body 10 MB, PORT hardcoded, bind 0.0.0.0.
13. **🟡 Matriks RBAC terduplikasi 3×** (server.ts, lib/rbac.ts, types.ts) — sudah ada indikasi drift antara server & klien (Org Admin: `PERM_INCIDENT_RESOLVE`).
14. **🟡 App.tsx 885 baris (god component)**, 13 useState — pertimbangkan store (zustand/context split) saat refactor.
15. **🟡 `blueprintData.ts` mendeskripsikan arsitektur target Laravel+PostgreSQL+Kafka** yang tidak cocok dengan implementasi aktual (React/TS/Express) — risiko salah komunikasi ke stakeholder; perlu ADR penyelarasan.
16. **🟢 Tidak ada XSS surface** (tidak ada dangerouslySetInnerHTML/eval); React default escaping utuh.

---

## 8. Open Questions

1. Apakah target deploy tetap Google AI Studio/Cloud Run applet, atau server mandiri? (menentukan kebutuhan DB, secret manager, domain).
2. Apakah login/ RBAC harus nyata di produksi (user management, hash bcrypt, sesi server), atau ini memang demo data-mock? (menentukan scope epic keamanan).
3. Model Gemini mana yang berlaku untuk akun ini (`gemini-3.8-flash` perlu diverifikasi) dan bagaimana provisioning `GEMINI_API_KEY` untuk lingkungan non-AI-Studio?
4. Apakah PRD PDF (`WORKSTATION_Super_Duper_PRD.pdf`) masih menjadi sumber requirement aktif untuk PRD BMAD berikutnya?
5. Data: berapa banyak yang harus persisten (work items, tiket, incident, audit) vs tetap agregasi/live-feed?

---

## 9. Document History

| Date | Author | Change |
|------|--------|--------|
| 18 September 2026 | BMAD bmad-document-project (pi agent) | Initial scan — 6 pass, READ-ONLY |

---

_BMAD Planning & Orchestrator · Document Project · Mengimplementasikan spirit `bmad-document-project` dari BMAD Method by the BMAD Code Organization (https://github.com/bmad-code-org/BMAD-METHOD)_
