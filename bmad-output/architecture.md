# System Architecture: WORKSTATION

**Document Version:** 1.0  
**Date:** 18 September 2026  
**Author:** Winston (BMAD System Architect)  
**Track:** BMad Method  
**Status:** Approved  
**Source PRD:** `bmad-output/prd.md` (MVP v1.0)  
**Companion Documents:** `bmad-output/project-context.md`, `bmad-output/decision-log.md`, `docs/WORKSTATION_Super_Duper_PRD.pdf`

> This is the single source of truth for cross-cutting technical decisions. Every
> story compiled by bmad-scrum-master inherits the LOCKED decisions recorded here.
> Catching alignment at this layer is ~10x cheaper than during implementation.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Pattern](#2-architecture-pattern)
3. [Architecture Decision Records](#3-architecture-decision-records)
4. [Component Design](#4-component-design)
5. [Data Model & Persistence Schema](#5-data-model)
6. [API Specifications](#6-api-specifications)
7. [FR / NFR Coverage Matrix](#7-fr--nfr-coverage-matrix)
8. [Technology Stack](#8-technology-stack)
9. [Trade-off Analysis](#9-trade-off-analysis)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Future Considerations](#11-future-considerations)
12. [Appendix](#12-appendix)

---

## 1. System Overview

### Purpose
WORKSTATION adalah platform operasional internal yang bertindak sebagai *single source of truth* untuk seluruh siklus hidup software engineering. Sistem mengumpulkan, memvalidasi, dan menghubungkan aktivitas teknis (Tiket → Work Items → Commits → Pull Requests → Releases → Deployments → Evidence) ke dalam satu basis data relasional terverifikasi, memungkinkan tim developer bekerja cepat tanpa gesekan dan memberikan visibilitas deliverable berbasis bukti bagi tech lead dan manajemen.

### Scope
**In Scope (MVP Phase):**
- **Security & Identity Foundation:** Otentikasi aman berbasis email/password (bcrypt cost 12), token JWT bervalidasi kriptografis HMAC-SHA256, kontrol akses berbasis peran (RBAC 9 role × 20 permissions) yang divalidasi ketat di sisi server.
- **Relational Persistence:** Migrasi dari array in-memory ke PostgreSQL 16+ dengan skema termigrasi terotomasi via Drizzle ORM.
- **Work Items & Task Management:** Siklus hidup Epic/Feature/Task/Bug dengan checklist kriteria penerimaan nyata (*Definition of Done*).
- **Developer "My Work" Workspace:** Tampilan terpusat beban kerja developer harian, review PR tertunda, dan aksi status 1-klik.
- **Ticketing / ITSM Workflow:** Alur triase isu dengan pemisahan Severity vs Priority dan penautan dua arah ke work items.
- **GitHub Intelligence Webhook Receiver:** Ingestion webhook GitHub resmi (`X-Hub-Signature-256`) dengan deduplikasi idempoten dan penautan otomatis artefak commit/PR berdasarkan parsing pola regex kunci entitas (`WRK-101`).
- **Release & Deployment Operations:** Pencatatan deployment manual/API per environment (Dev, Staging, Production) dan aksi rollback terotorisasi dengan jejak audit.
- **Immutable Audit Trail:** Pencatatan log sistem *append-only* untuk seluruh operasi mutasi data sensitif.

**Out of Scope (Ditunda ke V1/V2):**
- Fitur AI Codebase Scanner dan Dual-Language Translation (ditunda per Keputusan 2026-09-18, tercatat di `addendum.md` A-01).
- Workstation Linux Server Agent daemon untuk Kontabo/lokal (V1 Infrastructure).
- Multi-provider Git selain GitHub (GitLab/Bitbucket) (V2).
- Single Sign-On (SSO / SAML 2.0 / Okta) (Enterprise).

### Architectural Drivers
Batasan NFR utama yang mengendalikan desain arsitektur:
1. **NFR-002 (Zero Security Compromise):** Menutup total seluruh kerentanan Deep Scan (DS-01 bypass tanpa token, DS-02 pemalsuan payload token, DS-03 auto-admin di klien, DS-04 backdoor admin123, DS-05 kredensial plaintext, DS-06 fallback secret hardcoded).
2. **NFR-003 (Reliability & Strong Consistency):** Integritas relasional mutlak: tiket, work item, commit, dan deployment tidak boleh hilang atau mengalami kondisi yatim (*orphaned*) saat restart atau crash proses.
3. **NFR-001 (Performance & Low Latency):** Respons API GET < 150 ms p95 dan respons pemrosesan webhook GitHub < 100 ms untuk mencegah timeout dari sisi pengirim GitHub.
4. **NFR-004 (Frontend Usability & PWA Integrity):** Mempertahankan 100% komponen UI neo-brutalist / retro desktop shell React 19 yang sudah selesai, tanpa regresi tampilan saat menghubungkan ke REST API nyata.
5. **NFR-005 (Maintainability & Zero-Conflict Parallelism):** Pemecahan monolith file `server.ts` (801 baris) menjadi struktur berlapis (*layered architecture*) yang memungkinkan multi-agent BMAD bekerja paralel tanpa konflik merge file.

### Stakeholders & Constraints (from project-context.md)
- **Primary Users:** Developer tim internal (kecepatan respon, alur kerja My Work, auto-linking GitHub).
- **Secondary Users:** Tech Lead / PM (deployment tracking, audit log, persetujuan rollback).
- **Team Size:** 1-5 developer inti.
- **Existing Constraints:** Runtime Node.js 22 LTS, Vite 8, React 19, Tailwind CSS 4, database PostgreSQL/MySQL yang tersedia di server lokal kantor / Kontabo VPS.

---

## 2. Architecture Pattern

**Pattern:** **Modular Layered Monolith**

```
┌──────────────────────────────────────────────────────────────────┐
│             Presentation Tier: React 19 SPA + PWA                │
│    (Zustand Stores / React Query Cache / Retro Desktop Shell)     │
└─────────────────────────────────▲────────────────────────────────┘
                                  │ HTTPS / REST (JSON)
┌─────────────────────────────────▼────────────────────────────────┐
│            Backend Tier: Node.js Express Modular Monolith        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 1. Middleware Layer: Helmet, CORS, RateLimit, Auth, RBAC   │  │
│  └──────────────────────────────┬─────────────────────────────┘  │
│                                 ▼                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 2. Routing & Controller Layer: Schema Validation (Zod)     │  │
│  └──────────────────────────────┬─────────────────────────────┘  │
│                                 ▼                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 3. Domain Service Layer: Business Logic & Workflows        │  │
│  └──────────────────────────────┬─────────────────────────────┘  │
│                                 ▼                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 4. Repository Layer: Drizzle ORM Data Access               │  │
│  └──────────────────────────────┬─────────────────────────────┘  │
└─────────────────────────────────┼────────────────────────────────┘
                                  │ SQL / Connection Pool
┌─────────────────────────────────▼────────────────────────────────┐
│       Persistence Tier: PostgreSQL 16 (Relational DB)            │
│  (Organizations, Users, Projects, WorkItems, Tickets, Git, Audit)│
└──────────────────────────────────────────────────────────────────┘
```

**Justification:**
- **Skala MVP Tim Internal (1-5 Devs):** Microservices akan menghasilkan overhead operasional berlebihan (network latency, distributed transaction, k8s complexity). Modular Monolith memberikan batas domain yang bersih (*clean boundaries*) dalam satu proses yang mudah di-deploy ke server tunggal (Lokal / Kontabo VPS / Docker).
- **Pemisahan Monolith Eksisting:** Mengurai `server.ts` (801 baris) menjadi 4 layer terpisah (Middlewares, Controllers, Services, Repositories) memungkinkan parallel dev agent BMAD mengerjakan story berbeda tanpa saling menabrak baris kode file yang sama.
- **Single Process Efficiency:** Dev mode tetap menggunakan Express yang meng-embed Vite middleware, sehingga DX (*Developer Experience*) lokal tetap instan (`npm run dev`).

**Alternatives Considered:**
- **Microservices Architecture:** Ditolak karena memperkenalkan latency antar jaringan, overhead tracing, dan koordinasi container berlebihan yang melanggar timeline MVP 3-4 sprint.
- **Serverless / Cloud Functions:** Ditolak karena ketergantungan pada deployment lokal kantor / Kontabo VPS mandiri dan kebutuhan websocket/webhook ingestion yang stabil tanpa cold-start.

---

## 3. Architecture Decision Records (ADRs)

| ADR | Title | Status | Drives |
|-----|-------|--------|--------|
| **ADR-001** | Modular Layered Monolith Architecture Structure | Accepted | NFR-005, FR-001..FR-015 |
| **ADR-002** | Relational Persistence with PostgreSQL 16 and Drizzle ORM | Accepted | FR-015, NFR-001, NFR-003 |
| **ADR-003** | Server-Authoritative RBAC & Stateless JWT Authentication | Accepted | FR-001, FR-002, NFR-002 |
| **ADR-004** | RESTful API Style with Standardized JSON Envelope | Accepted | NFR-001, NFR-004, NFR-005 |
| **ADR-005** | Asynchronous Idempotent GitHub Webhook Ingestion Engine | Accepted | FR-010, FR-011, NFR-001 |
| **ADR-006** | Client-Side State Management with Zustand and React Query | Accepted | FR-005, NFR-004, NFR-005 |
| **ADR-007** | Immutable Append-Only Audit Logging with Correlation IDs | Accepted | FR-014, NFR-002 |
| **ADR-008** | Universal Naming Conventions and Code Structure Standards | Accepted | NFR-005 |

---

### ADR-001: Modular Layered Monolith Architecture Structure

**Status:** Accepted  
**Drives:** NFR-005 (Maintainability), FR-001 s.d. FR-015  

**Context:**  
Saat ini backend berada dalam satu berkas tunggal `server.ts` (801 baris) yang mencampurkan otentikasi, routing Express, data mock, koneksi AI, dan server startup. Jika parallel dev agent BMAD bekerja di sprint mendatang, modifikasi bersamaan pada `server.ts` akan menimbulkan konflik merge fatal.

**Decision:**  
Memisahkan backend ke dalam struktur direktori modular berlayer:
```
server/
├── config/             # Environment variables (dotenv + validation)
├── db/                 # Drizzle schema, client, and migrations
├── middlewares/        # authMiddleware, rbacMiddleware, rateLimiter, errorHandler
├── modules/
│   ├── auth/           # routes, controller, service, repository
│   ├── projects/       # routes, controller, service, repository
│   ├── work-items/     # routes, controller, service, repository
│   ├── tickets/        # routes, controller, service, repository
│   ├── git/            # routes, controller, service, webhook handler
│   ├── deployments/    # routes, controller, service, repository
│   └── audit/          # routes, controller, service, repository
├── types/              # Server-side TypeScript interfaces & DTOs
└── app.ts              # Express application assembly
```
File `server.ts` di root direduksi menjadi bootstrap server murni (memuat `app.ts` dan memulai listener port HTTP).

**Consequences — LOCKED for all stories:**
- Setiap story baru yang menambahkan entitas bisnis WAJIB menempatkan kodenya di dalam folder `server/modules/<domain>/` dengan pemisahan Controller, Service, dan Repository.
- Controller HANYA bertugas memvalidasi request (Zod) dan mengembalikan response HTTP. Logika bisnis dilarang berada di Controller (wajib di Service).
- Service dilarang memanggil query SQL mentah; akses data wajib melalui Repository.

**Alternatives:**
- Tetap memelihara `server.ts` tunggal: Ditolak karena collision rate sangat tinggi saat parallel agents bekerja.
- NestJS framework: Ditolak karena memperkenalkan overhead dependency injection dan decorators yang berlebihan untuk skala tim saat ini.

---

### ADR-002: Relational Persistence with PostgreSQL 16 and Drizzle ORM

**Status:** Accepted  
**Drives:** FR-015, NFR-001 (Performance), NFR-003 (Reliability)  

**Context:**  
Saat ini seluruh data aplikasi bersifat in-memory (`mockData.ts` dan array `SERVER_USERS`). Begitu server restart, seluruh tiket, work item, dan deployment hilang. Master PRD mensyaratkan basis data relasional dengan integritas foreign key ketat dan kemampuan transaksi aman.

**Decision:**  
Mengadopsi **PostgreSQL 16** sebagai *system of record* utama dan **Drizzle ORM** (`drizzle-orm` + `pg` + `drizzle-kit`) sebagai lapisan akses data.  
- Drizzle dipilih karena: (1) Zero-cost runtime overhead; (2) Full TypeScript type-safety yang otomatis menghasilkan tipe data TypeScript dari skema SQL; (3) Sistem migrasi SQL mentah yang transparan via `drizzle-kit generate` dan `drizzle-kit migrate`.

**Consequences — LOCKED for all stories:**
- Seluruh tabel didefinisikan dalam berkas TypeScript di `server/db/schema/*.ts`.
- Dilarang keras memodifikasi struktur database secara manual di server (seperti `ALTER TABLE` manual); seluruh perubahan struktur wajib melalui migration files Drizzle yang di-commit ke Git.
- Setiap entitas wajib memiliki kolom audit standar: `id` (UUIDv7 atau prefix string `usr_`, `wrk_`), `created_at` (timestamptz default now), dan `updated_at` (timestamptz).

**Alternatives:**
- Prisma ORM: Ditolak karena binary query engine Rust berat, memory footprint tinggi di VPS kecil (Kontabo), dan performa query cold-start lebih lambat dibanding Drizzle.
- MongoDB / NoSQL: Ditolak karena data WORKSTATION sangat relasional (Ticket ↔ WorkItem ↔ Commit ↔ Deployment ↔ Evidence) yang membutuhkan ACID guarantee dan foreign keys.

---

### ADR-003: Server-Authoritative RBAC & Stateless JWT Authentication

**Status:** Accepted  
**Drives:** FR-001, FR-002, NFR-002 (Security) — Menutup Temuan Deep Scan DS-01 s.d. DS-06  

**Context:**  
Deep Scan 18 Sep 2026 membuktikan 6 celah keamanan fatal:
1. `server.ts` fallback otomatis menganggap request tanpa header token sebagai Super Admin (DS-01).
2. Cabang `verifyJWT` menerima token buatan klien asal berbentuk base64 JSON bertuliskan role (DS-02).
3. Klien otomatis membuat sesi Super Admin di browser tanpa login (DS-03).
4. Master password backdoor `"admin123"` membuka semua akun (DS-04).
5. Daftar 7 akun dan petunjuk password plaintext (`passwordHint`) berada di kode klien (DS-05).
6. `JWT_SECRET` memiliki fallback string hardcoded di kode (DS-06).

**Decision:**  
Merombak total arsitektur autentikasi dan otorisasi:
1. **Password Hashing:** Menggunakan `bcryptjs` dengan *cost factor* 12. Hapus seluruh array `DIRECTORY_USERS` dari kode frontend `src/lib/auth.ts` dan pindahkan sepenuhnya ke tabel `users` PostgreSQL.
2. **Stateless JWT Engine:** Menggunakan library standar teruji (`jsonwebtoken`) dengan algoritma HMAC-SHA256.
3. **Fail-Fast Environment Secret:** Backend wajib membaca `JWT_SECRET` dari environment variable (panjang minimal 32 karakter acak). Jika tidak disetel, aplikasi server wajib *crash on startup* dengan pesan kesalahan eksplisit.
4. **Zero Bypass Token Middleware:** `authenticateToken` wajib menolak setiap request tanpa header `Authorization: Bearer <valid_token>` dengan status HTTP 401 Unauthorized. Tidak ada default user.
5. **Server-Side Authoritative Permissions:** Payload JWT hanya membawa `userId`, `email`, dan `role`. Permission tidak dibaca dari payload token melainkan divalidasi langsung oleh middleware server berdasarkan matriks peran yang tersimpan di backend.
6. **Penghapusan Backdoor:** Menghapus seluruh pengecualian `password === "admin123"` di handler `/api/auth/login` dan menghapus method `switchRole()` klien yang memanggil password palsu.

**Consequences — LOCKED for all stories:**
- Tidak ada data kredensial atau password hash yang boleh berada di file kode sumber (`.ts`, `.tsx`, `.js`).
- Setiap penambahan endpoint API baru WAJIB menyematkan middleware `authenticateToken` dan minimal satu `requirePermission(...)`.

**Alternatives:**
- Session-based cookie auth (Express-session + Redis): Ditolak untuk MVP karena JWT stateless lebih mudah diintegrasikan dengan aplikasi mobile/PWA dan CI/CD pipeline deployment runner.

---

### ADR-004: RESTful API Style with Standardized JSON Envelope

**Status:** Accepted  
**Drives:** NFR-001 (Performance), NFR-004 (Usability), NFR-005 (Maintainability)  

**Context:**  
Tanpa kontrak response terpadu, parallel dev agents akan menciptakan format respons yang saling bertolak belakang (sebagian mengembalikan `{ data: ... }`, sebagian `{ success: true, ... }`, sebagian langsung array), mengakibatkan parser frontend rusak.

**Decision:**  
Seluruh endpoint API REST wajib mengembalikan format JSON seragam (*Uniform Response Envelope*):

**Response Sukses:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  },
  "timestamp": "2026-09-18T10:00:00.000Z"
}
```

**Response Error:**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Work item with ID WRK-102 was not found",
    "details": []
  },
  "timestamp": "2026-09-18T10:00:00.000Z"
}
```

**Standar HTTP Status Codes:**
- `200 OK` — Pembacaan atau pembaruan sukses.
- `201 Created` — Entitas baru berhasil dibuat.
- `400 Bad Request` — Validasi schema input Zod gagal.
- `401 Unauthorized` — Token hilang, tidak valid, atau kadaluwarsa.
- `403 Forbidden` — Peran tidak memiliki permission yang diminta.
- `404 Not Found` — Resource tidak ditemukan di basis data.
- `409 Conflict` — Konflik kunci unik (misal duplikasi project key).
- `500 Internal Server Error` — Kesalahan server yang tidak terduga.

**Consequences — LOCKED for all stories:**
- Frontend helper `authFetch` atau API client wajib mengekstrak field `response.data` secara seragam.
- Error handling di frontend wajib membaca field `response.error.message`.

**Alternatives:**
- GraphQL: Ditolak karena kompleksitas schema caching, N+1 query overhead, dan tidak diperlukan untuk antarmuka MVP yang didominasi tabel data REST.

---

### ADR-005: Asynchronous Idempotent GitHub Webhook Ingestion Engine

**Status:** Accepted  
**Drives:** FR-010, FR-011, NFR-001 (Performance)  

**Context:**  
GitHub Webhook mengirimkan payload event (push, pull_request) yang membutuhkan verifikasi tanda tangan kriptografis dan ekstraksi kode tiket. Jika server melakukan pemrosesan berat secara sinkron sebelum mengembalikan respons, GitHub webhook runner akan mengalami timeout (batas 10 detik). Selain itu, pengiriman ulang (*webhook retry*) oleh GitHub dapat menyebabkan duplikasi data commit/PR jika tidak idempoten.

**Decision:**  
Merancang alur ingestion webhook dua tahap:
1. **Tahap 1 (Sinkron & Verifikasi Cepat, < 50ms):**
   - Menangkap raw request body.
   - Memvalidasi header `X-Hub-Signature-256` menggunakan HMAC-SHA256 dengan secret repositori terdaftar. Jika tidak cocok → tolak HTTP 401.
   - Membaca header `X-GitHub-Delivery` (UUID unik event).
   - Memeriksa tabel `webhook_deliveries`. Jika UUID sudah pernah diproses → segera kembalikan `HTTP 200 OK` (Idempotent bypass).
   - Menyimpan raw payload ke `webhook_deliveries` berstatus `PENDING` dan segera mengembalikan response `HTTP 202 Accepted` ke GitHub.
2. **Tahap 2 (Pemrosesan Event Asinkron):**
   - Service worker/handler memproses event: membedah commit message dan PR title menggunakan regex `\b([A-Z]{2,6}-\d+)\b`.
   - Mengaitkan commit SHA dan PR URL ke work item dan tiket terkait di tabel `evidence_links`.
   - Memperbarui status `webhook_deliveries` menjadi `PROCESSED`.

**Consequences — LOCKED for all stories:**
- Tabel `webhook_deliveries` wajib memiliki constraint UNIQUE pada kolom `delivery_id`.
- Seluruh webhook receiver wajib memverifikasi signature sebelum membaca payload.

**Alternatives:**
- Background Redis Queue (BullMQ): Disimpan sebagai arsitektur masa depan di V1; untuk MVP pemrosesan asinkron in-process (setImmediate / async task) dengan pencatatan status di database PostgreSQL sudah mencukupi target beban tim internal.

---

### ADR-006: Client-Side State Management with Zustand and React Query

**Status:** Accepted  
**Drives:** FR-005, NFR-004 (Usability), NFR-005 (Maintainability)  

**Context:**  
Saat ini `src/App.tsx` memiliki 885 baris kode dengan 13 `useState` raksasa yang menampung data mock statis (`projects`, `workItems`, `tickets`, `deployments`, dsb.). Saat beralih ke REST API nyata, state lokal ini akan menimbulkan re-render masif, *prop-drilling* ke belasan komponen anak, dan kegagalan cache.

**Decision:**  
Memperkenalkan arsitektur state klien modern:
1. **Server-Cache State:** Menggunakan `@tanstack/react-query` untuk fetching, caching, dan invalidation data server (Work Items, Tickets, Deployments). Menyediakan fitur *optimistic update* dan *background refetch*.
2. **Client-Session State:** Menggunakan `zustand` untuk state global aplikasi murni (Sesi login pengguna, Tab aktif, Pengaturan proyek aktif, Modal navigasi terbuka).
3. **Dekomposisi `src/App.tsx`:** Mengurangi ukuran `App.tsx` dari 885 baris menjadi < 150 baris dengan mendelegasikan state ke custom hooks (`useWorkItems()`, `useTickets()`, `useAuth()`).

**Consequences — LOCKED for all stories:**
- Dilarang menambahkan state data bisnis server baru ke dalam `useState` lokal di `App.tsx`.
- Komponen tampilan (`*View.tsx`) wajib membaca data dari hook React Query terkait.

**Alternatives:**
- Redux Toolkit: Ditolak karena boilerplate file terlalu banyak (actions, reducers, selectors) untuk kebutuhan MVP.
- Prop Drilling Context API murni: Ditolak karena context rentan trigger re-render seluruh sub-tree komponen saat state berubah.

---

### ADR-007: Immutable Append-Only Audit Logging with Correlation IDs

**Status:** Accepted  
**Drives:** FR-014, NFR-002 (Security & Governance)  

**Context:**  
Master PRD Section 25 mensyaratkan audit log yang *append-only*, mencatat aktor, aksi, sebelum/sesudah perubahan, dan IP pengakses. Data audit tidak boleh dapat diubah (*tamper-proof*) oleh siapa pun termasuk admin melalui antarmuka reguler.

**Decision:**  
1. Membuat tabel `audit_logs` di PostgreSQL dengan hak akses dibatasi: backend service hanya memiliki permission `INSERT` dan `SELECT` pada tabel ini (tanpa grant `UPDATE` maupun `DELETE`).
2. Setiap request masuk diberikan `correlation_id` unik (UUIDv7) melalui middleware `requestCorrelationId` yang disematkan pada response header `X-Correlation-Id` dan dicatat ke log.
3. Event mutasi kritis (Login, Failed Login, Permission Change, Rollback, WorkItem Delete, Incident Declare) wajib memanggil `auditService.logEvent(...)` dalam satu blok transaksi basis data yang sama.

**Consequences — LOCKED for all stories:**
- Aksi penghapusan data bisnis (soft delete) wajib menyertakan alasan (*reason*) yang dicatat ke audit log.

**Alternatives:**
- Logging ke file teks flat: Ditolak karena sulit di-query, di-filter, dan ditampilkan ke antarmuka `AuditLogView.tsx` secara cepat.

---

### ADR-008: Universal Naming Conventions and Code Structure Standards

**Status:** Accepted  
**Drives:** NFR-005 (Maintainability & Zero-Conflict Parallelism)  

**Context:**  
Ketika beberapa subagent BMAD mengimplementasikan cerita secara paralel, perbedaan gaya penamaan (misal: camelCase vs snake_case pada kolom database, format file PascalCase vs kebab-case) akan menimbulkan inkonsistensi sintaksis dan bug runtime saat komponen dihubungkan.

**Decision:**  
Seluruh tim dan subagent pengembang wajib mematuhi aturan standar penamaan (*naming conventions*) dan casing berikut:
1. **Database Tables & Columns (SQL):** Wajib menggunakan `snake_case` (contoh: `work_items`, `created_at`, `assignee_id`).
2. **TypeScript Files & Modules:**
   - Komponen React UI: `PascalCase.tsx` (contoh: `WorkItemsView.tsx`, `Badge.tsx`).
   - Hooks: `camelCase.ts` dengan awalan `use` (contoh: `useWorkItems.ts`).
   - Services, Repositories, Controllers, Middlewares: `camelCase.ts` atau `domain.role.ts` (contoh: `workItems.service.ts`, `auth.middleware.ts`).
3. **Variables & Functions:** Wajib `camelCase` (contoh: `fetchWorkItems()`, `currentSession`).
4. **Classes, Types, & Interfaces:** Wajib `PascalCase` (contoh: `WorkItem`, `AuthResponse`, `UserRole`).
5. **Constants & Enum Values:** Wajib `SCREAMING_SNAKE_CASE` (contoh: `PERM_VIEW_DASHBOARD`, `JWT_SECRET`).
6. **API Routes & URL Paths:** Wajib `kebab-case` jamak (contoh: `/api/v1/work-items`, `/api/v1/audit-logs`).

**Consequences — LOCKED for all stories:**
- Linter dan code reviewer otomatis menolak pull request atau kode yang tidak mematuhi matriks casing ini.
- Drizzle schema wajib mendefinisikan nama kolom SQL dalam snake_case dan properti TypeScript dalam camelCase.

**Alternatives:**
- Membiarkan gaya bebas per modul: Ditolak karena merusak keterbacaan kode secara keseluruhan.

---

## 4. Component Design

### Component Topology

```
                  ┌─────────────────────────────────────┐
                  │          API Gateway Layer          │
                  │ (Helmet, CORS, RateLimit, Authn,    │
                  │  CorrelationId, RequestLogger)      │
                  └──────────────────┬──────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   Auth Module    │       │ Work Management  │       │ Ticketing Module │
│ (Login, Sesi,    │       │ (Projects,       │       │ (Tickets, SLA,   │
│  RBAC Policies,  │       │  Work Items,     │       │  Triage, History,│
│  User Directory) │       │  Checklist AC)   │       │  Comments)       │
└────────┬─────────┘       └────────┬─────────┘       └────────┬─────────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │
         ┌──────────────────────────┼───────────────────────────┐
         ▼                          ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ Git Intelligence │       │ Release & Deploy │       │  Audit Logging   │
│ (GitHub Webhook, │       │ (Environments,   │       │ (Append-only     │
│  Commit/PR Sync, │       │  Deploy Records, │       │  Forensic Store, │
│  Entity Linker)  │       │  Rollback Auth)  │       │  Filter Engine)  │
└────────┬─────────┘       └────────┬─────────┘       └────────┬─────────┘
         │                          │                          │
         └──────────────────────────▼──────────────────────────┘
                         PostgreSQL 16 Storage
```

### 4.1 Auth & Identity Component
- **Responsibility:** Menangani registrasi, login kredensial, verifikasi password bcrypt, pembuatan token JWT, dan pemaksaan kebijakan RBAC di tingkat endpoint.
- **Interfaces Provided:**
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
  - `GET /api/v1/auth/users`
  - Middleware: `authenticateToken`, `requirePermission(perm)`, `requireRole(role)`
- **Data Owned:** Tabel `users`, `roles`, `permissions`, `role_permissions`, `sessions`.
- **ADRs that constrain it:** ADR-003, ADR-004.
- **NFRs Addressed:** NFR-002 (Security), NFR-001 (Latency < 100ms).

### 4.2 Work Management Component
- **Responsibility:** Mengelola siklus hidup proyek, modul, dan work item rekayasa (Epic s.d. Bug) beserta kriteria penerimaan nyata (*Definition of Done*).
- **Interfaces Provided:**
  - `GET /api/v1/projects` & `POST /api/v1/projects`
  - `GET /api/v1/work-items` (dengan filter status, assignee, project)
  - `POST /api/v1/work-items` & `PUT /api/v1/work-items/:id`
  - `PUT /api/v1/work-items/:id/status` (transisi status + cek AC)
  - `POST /api/v1/work-items/:id/acceptance-criteria`
- **Data Owned:** Tabel `projects`, `project_members`, `work_items`, `acceptance_criteria`, `work_item_dependencies`.
- **ADRs that constrain it:** ADR-001, ADR-002, ADR-004.
- **NFRs Addressed:** NFR-001 (p95 query < 150ms dengan index `project_id` & `status`).

### 4.3 Ticketing & ITSM Component
- **Responsibility:** Mencatat isu, bug, dan permintaan teknis, memisahkan severity vs priority, serta menghubungkan tiket ke work item atau evidence commit.
- **Interfaces Provided:**
  - `GET /api/v1/tickets` & `POST /api/v1/tickets`
  - `GET /api/v1/tickets/:id`
  - `PATCH /api/v1/tickets/:id/triage` (assignee, priority, work-item link)
  - `POST /api/v1/tickets/:id/comments`
- **Data Owned:** Tabel `tickets`, `ticket_comments`, `ticket_history`.
- **ADRs that constrain it:** ADR-002, ADR-004.
- **NFRs Addressed:** NFR-003 (Reliability).

### 4.4 Git Intelligence & Webhook Receiver Component
- **Responsibility:** Menerima webhook GitHub resmi, memvalidasi signature HMAC-SHA256, mengekstrak entitas kode (misal `WRK-101`), dan menautkan commit/PR sebagai bukti penyelesaian.
- **Interfaces Provided:**
  - `POST /api/v1/webhooks/github` (Inbound webhook receiver)
  - `GET /api/v1/git/repositories`
  - `GET /api/v1/git/commits` (dengan filter work-item/ticket ID)
- **Data Owned:** Tabel `repositories`, `commits`, `pull_requests`, `evidence_links`, `webhook_deliveries`.
- **ADRs that constrain it:** ADR-005, ADR-002.
- **NFRs Addressed:** NFR-001 (respons ingestion webhook < 100ms).

### 4.5 Release & Deployment Component
- **Responsibility:** Mencatat riwayat deployment ke environment target dan mengelola otorisasi aksi rollback darurat.
- **Interfaces Provided:**
  - `GET /api/v1/deployments`
  - `POST /api/v1/deployments` (pencatatan deployment baru)
  - `POST /api/v1/deployments/rollback` (aksi rollback terotorisasi)
- **Data Owned:** Tabel `environments`, `deployments`, `deployment_logs`.
- **ADRs that constrain it:** ADR-003, ADR-007.
- **NFRs Addressed:** NFR-002 (Otorisasi ketat Tech Lead).

### 4.6 Audit & Governance Component
- **Responsibility:** Mencatat seluruh transaksi sensitif ke dalam penyimpanan append-only dan menyediakan antarmuka pencarian audit.
- **Interfaces Provided:**
  - `GET /api/v1/audit-logs` (Filter by actor, action, date range)
  - Internal Service: `auditService.log(entry)`
- **Data Owned:** Tabel `audit_logs`.
- **ADRs that constrain it:** ADR-007, ADR-002.
- **NFRs Addressed:** NFR-002 (Keamanan & Forensik).

---

## 5. Data Model & Persistence Schema

### 5.1 Entity Relationship Model (PostgreSQL 16)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  organizations  │1     *│      users      │*     *│      roles      │
├─────────────────┤◄──────├─────────────────┤◄──────├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ name            │       │ email (UNIQUE)  │       │ name (UNIQUE)   │
│ slug            │       │ password_hash   │       │ description     │
└────────┬────────┘       │ role_id (FK)    │       └─────────────────┘
         │1               └────────┬────────┘
         │                         │1
         │*                        │*
┌────────▼────────┐       ┌────────▼────────┐       ┌─────────────────┐
│    projects     │1     *│   work_items    │1     *│   acceptance_   │
├─────────────────┤◄──────├─────────────────┤◄──────│    criteria     │
│ id (PK)         │       │ id (PK)         │       ├─────────────────┤
│ key (UNIQUE)    │       │ project_id (FK) │       │ id (PK)         │
│ name            │       │ key (e.g.WRK-1) │       │ work_item_id(FK)│
│ status          │       │ title           │       │ text            │
└────────┬────────┘       │ status          │       │ is_completed    │
         │1               │ assignee_id(FK) │       └─────────────────┘
         │                └────────▲────────┘
         │                         │1
         │*                        │* (via evidence_links)
┌────────▼────────┐       ┌────────┴────────┐       ┌─────────────────┐
│     tickets     │       │ evidence_links  │       │  repositories   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ key (e.g.TCK-1) │       │ work_item_id(FK)│       │ project_id (FK) │
│ project_id (FK) │       │ ticket_id (FK)  │       │ full_name       │
│ severity        │       │ commit_id (FK)  │       │ webhook_secret  │
│ priority        │       │ pr_id (FK)      │       └────────┬────────┘
│ status          │       │ deployment_id   │                │1
└─────────────────┘       └─────────────────┘                │*
                                                    ┌────────▼────────┐
┌─────────────────┐       ┌─────────────────┐       │     commits     │
│   deployments   │       │   audit_logs    │       ├─────────────────┤
├─────────────────┤       ├─────────────────┤       │ id (PK)         │
│ id (PK)         │       │ id (PK)         │       │ repo_id (FK)    │
│ project_id (FK) │       │ actor_id (FK)   │       │ sha (UNIQUE)    │
│ environment     │       │ action          │       │ message         │
│ commit_sha      │       │ target_entity   │       │ author_name     │
│ status          │       │ payload_diff    │       │ committed_at    │
└─────────────────┘       │ created_at      │       └─────────────────┘
                          └─────────────────┘
```

### 5.2 Skema DDL Inti (Drizzle TypeScript Representation)

```typescript
// server/db/schema/users.ts
export const users = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('Developer'),
  avatar: varchar('avatar', { length: 10 }).notNull().default('U'),
  team: varchar('team', { length: 100 }).notNull().default('Engineering'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_role_idx').on(table.role)
]);

// server/db/schema/work_items.ts
export const workItems = pgTable('work_items', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: varchar('key', { length: 20 }).notNull().unique(), // e.g. WRK-101
  projectId: varchar('project_id', { length: 36 }).notNull().references(() => projects.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // EPIC, FEATURE, TASK, BUG, TECH_DEBT
  priority: varchar('priority', { length: 10 }).notNull().default('P2'), // P0, P1, P2, P3
  status: varchar('status', { length: 30 }).notNull().default('BACKLOG'),
  assigneeId: varchar('assignee_id', { length: 36 }).references(() => users.id),
  estimateHours: integer('estimate_hours'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  index('work_items_project_id_idx').on(table.projectId),
  index('work_items_assignee_id_idx').on(table.assigneeId),
  index('work_items_status_idx').on(table.status),
  index('work_items_key_idx').on(table.key)
]);

// server/db/schema/audit_logs.ts (Append-Only)
export const auditLogs = pgTable('audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  actorId: varchar('actor_id', { length: 36 }).notNull(),
  actorName: varchar('actor_name', { length: 150 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  targetEntity: varchar('target_entity', { length: 50 }).notNull(),
  targetId: varchar('target_id', { length: 100 }).notNull(),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  correlationId: varchar('correlation_id', { length: 36 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  index('audit_logs_actor_idx').on(table.actorId),
  index('audit_logs_action_idx').on(table.action),
  index('audit_logs_created_at_idx').on(table.createdAt)
]);
```

### Storage Strategy
- **Primary Store:** PostgreSQL 16 dengan connection pool (PGPool max 20 connections).
- **Indexing Strategy:** B-Tree index pada kolom pencarian utama (`email`, `project_id`, `assignee_id`, `status`, `key`, `sha`).
- **Backup Policy (NFR-003):** Backup harian via `pg_dump` otomatis setiap pukul 02:00 WIB ke direktori terisolasi dengan retensi 14 hari.

---

## 6. API Specifications

> Seluruh endpoint mengikuti kontrak envelope pada ADR-004 dan otentikasi Bearer JWT pada ADR-003.

### 6.1 Authentication Endpoints
- **`POST /api/v1/auth/login`**
  - **Auth:** None (Public)
  - **Request Body:** `{ "email": "dev@workstation.io", "password": "secure_password" }`
  - **Response 200:** `{ "success": true, "data": { "token": "jwt...", "user": { "id", "email", "name", "role" }, "permissions": [...] } }`
  - **Error 401:** Kredensial tidak cocok.
- **`GET /api/v1/auth/me`**
  - **Auth:** Required (Bearer Token)
  - **Response 200:** Data user sesi aktif beserta daftar permission server-side.

### 6.2 Work Items Endpoints
- **`GET /api/v1/work-items`**
  - **Auth:** Required (`PERM_VIEW_ENGINEERING`)
  - **Query Params:** `?projectId=...&assigneeId=...&status=...&page=1&limit=20`
  - **Response 200:** Array of work items + metadata pagination.
- **`POST /api/v1/work-items`**
  - **Auth:** Required (`PERM_WORK_ITEM_CREATE`)
  - **Request Body:** `{ "projectId": "...", "title": "...", "type": "TASK", "priority": "P1" }`
  - **Response 201:** Entitas work item yang baru dibuat.
- **`PATCH /api/v1/work-items/:id/status`**
  - **Auth:** Required (`PERM_WORK_ITEM_UPDATE`)
  - **Request Body:** `{ "status": "DONE", "overrideReason": "..." }`
  - **Response 200:** Status berhasil diperbarui.
  - **Error 400:** Transisi ke `DONE` ditolak jika kriteria penerimaan belum 100% terpenuhi.

### 6.3 Ticketing Endpoints
- **`GET /api/v1/tickets`**
  - **Auth:** Required (`PERM_VIEW_DASHBOARD`)
  - **Response 200:** Daftar tiket dengan status, severity, dan assignee.
- **`PATCH /api/v1/tickets/:id/triage`**
  - **Auth:** Required (`PERM_TICKET_UPDATE`)
  - **Request Body:** `{ "assigneeId": "...", "priority": "P0", "linkedWorkItemId": "..." }`
  - **Response 200:** Tiket berhasil ditriase.

### 6.4 GitHub Webhook Endpoint
- **`POST /api/v1/webhooks/github`**
  - **Auth:** Header `X-Hub-Signature-256` HMAC validation.
  - **Headers Wajib:** `X-GitHub-Event`, `X-GitHub-Delivery`.
  - **Response 202:** `{ "success": true, "message": "Webhook queued for processing" }`
  - **Response 200:** `{ "success": true, "message": "Duplicate delivery ignored" }`

### 6.5 Deployments & Rollback Endpoints
- **`POST /api/v1/deployments`**
  - **Auth:** Required (`PERM_DEPLOYMENT_EXECUTE`)
  - **Request Body:** `{ "projectId": "...", "environment": "PRODUCTION", "commitSha": "...", "version": "v1.0.0" }`
- **`POST /api/v1/deployments/rollback`**
  - **Auth:** Required (`PERM_DEPLOYMENT_ROLLBACK`) — Hanya Tech Lead & Admin.
  - **Request Body:** `{ "deploymentId": "...", "targetVersion": "v0.9.8", "reason": "Memory leak detected on orders worker" }`
  - **Response 200:** Rollback berhasil diotorisasi dan dicatat ke audit log.

---

## 7. FR / NFR Coverage Matrix

| ID | Type | Requirement Summary | Component(s) | ADR(s) | Status |
|----|------|---------------------|--------------|--------|--------|
| **FR-001** | FR | Otentikasi Pengguna & Sesi Aman | Auth & Identity | ADR-003 | Addressed |
| **FR-002** | FR | Kontrol Akses Server-Side (RBAC) | Auth & Identity | ADR-003 | Addressed |
| **FR-003** | FR | Model Entitas Organisasi & Project | Work Management | ADR-001, ADR-002 | Addressed |
| **FR-004** | FR | Work Item Lifecycle & Acceptance Criteria | Work Management | ADR-001, ADR-002 | Addressed |
| **FR-005** | FR | Developer "My Work" Workspace | Presentation Tier | ADR-006, ADR-004 | Addressed |
| **FR-006** | FR | Dependency Tracking Antar Tugas | Work Management | ADR-002 | Addressed |
| **FR-007** | FR | Tiket Masuk, Workflow, dan Triage | Ticketing / ITSM | ADR-001, ADR-002 | Addressed |
| **FR-008** | FR | Tautan Dua Arah Tiket ↔ Work Item | Ticketing, Git | ADR-002, ADR-005 | Addressed |
| **FR-009** | FR | Komentar & Timeline Tiket | Ticketing / ITSM | ADR-002 | Addressed |
| **FR-010** | FR | Registrasi Repo & Webhook Receiver | Git Intelligence | ADR-005 | Addressed |
| **FR-011** | FR | Auto-Link Commit/PR ke Tiket | Git Intelligence | ADR-005 | Addressed |
| **FR-012** | FR | Pencatatan Release & Deployment | Release & Deploy | ADR-001, ADR-002 | Addressed |
| **FR-013** | FR | Otorisasi & Riwayat Rollback | Release & Deploy | ADR-003, ADR-007 | Addressed |
| **FR-014** | FR | Audit Trail Append-Only | Audit & Governance | ADR-007 | Addressed |
| **FR-015** | FR | Basis Data Relasional Permanen | Persistence Tier | ADR-002 | Addressed |
| **FR-016** | FR | Dashboard Progress Berbasis Evidence | Presentation Tier | ADR-006, ADR-004 | Addressed |
| **NFR-001** | NFR | Kecepatan Respons API (p95 < 150ms) | Architecture, DB | ADR-001, ADR-002, ADR-004 | Addressed |
| **NFR-002** | NFR | Keamanan Akses & Perlindungan Secret | Auth, Gateway | ADR-003, ADR-007 | Addressed |
| **NFR-003** | NFR | Ketahanan, Ketersediaan & Persistensi Data (RPO < 1h, Uptime Target 99.5%) | Persistence Tier, Monitoring | ADR-002 | Addressed |
| **NFR-004** | NFR | Efisiensi & Kerapihan Sisi Klien | Presentation Tier | ADR-006 | Addressed |
| **NFR-005** | NFR | Kualitas Kode & Kendali Versi Git | Repo, CI, Modules | ADR-001, ADR-002, ADR-008 | Addressed |

### Detailed NFR Notes (Architectural Drivers & Availability)
- **High Availability & Uptime Target:** Sistem ditargetkan memiliki ketersediaan minimum 99.5% uptime pada jam kerja operasional (08:00 - 20:00 WIB), dengan health check monitoring via `/api/health` yang dipantau oleh PM2/Docker restart policy.
- **Monitoring & Observability:** Endpoint `/api/health` mengecek status konektivitas pool PostgreSQL dan memori Node.js; log error dicatat dengan correlation ID untuk mempercepat investigasi insiden downtime.

---

## 8. Technology Stack

| Layer | Choice | Version | Rationale (→ Driver) | ADR |
|-------|--------|---------|----------------------|-----|
| **Frontend Framework** | React | ^19.0.1 | Mempertahankan komponen UI retro 90s yang sudah matang di `src/` (NFR-004) | — |
| **Frontend Bundler** | Vite | ^8.3.0 | Hot-Module-Replacement instan dan build optimized | — |
| **Frontend Styling** | Tailwind CSS | ^4.3.3 | Utilitas styling neo-brutalist dengan performa compile cepat | — |
| **Frontend State** | Zustand + React Query | ^5.x | Pengganti 13 `useState` raksasa `App.tsx`, caching server responsif | ADR-006 |
| **Backend Runtime** | Node.js (TypeScript) | LTS 22.x | Single language runtime (TS) full-stack, kecepatan eksekusi tinggi | ADR-001 |
| **Backend Framework** | Express | ^4.21.2 | Minimalist, fleksibel, mudah di-layer dan di-test | ADR-001 |
| **Database** | PostgreSQL | 16.x | ACID compliance mutlak, performa query JSONB audit log tinggi | ADR-002 |
| **ORM / Data Layer** | Drizzle ORM | ^0.38.x | Zero runtime overhead, end-to-end type safety, migrasi transparan | ADR-002 |
| **Security Utilities** | bcryptjs + jsonwebtoken | Latest | Standar enkripsi kata sandi dan stateless authentication teruji | ADR-003 |
| **Validation Library** | Zod | ^3.24.x | Validasi schema request runtime yang sinkron dengan TypeScript | ADR-004 |
| **Version Control** | Git | 2.4x | Fondasi kendali versi wajib (menutup temuan DS-07) | NFR-005 |

---

## 9. Trade-off Analysis

### Trade-off 1: Drizzle ORM vs Prisma ORM
- **Decision:** Memilih Drizzle ORM (ADR-002).
- **Options:** Prisma (DX mudah, schema declarative, tapi binary Rust berat) vs Drizzle (TypeScript murni, zero-overhead, query SQL transparan).
- **Rationale:** Server deployment menggunakan VPS lokal / Kontabo dengan alokasi memori terbatas. Drizzle tidak memakan memori tambahan untuk binary engine dan menghasilkan query SQL tercepat untuk memenuhi target p95 < 150 ms (NFR-001).
- **Accepted Cost:** Sedikit lebih banyak kode boilerplate pada join query relasional kompleks.

### Trade-off 2: Modular Monolith vs Microservices
- **Decision:** Memilih Modular Monolith (ADR-001).
- **Options:** Microservices (independen tapi kompleks) vs Modular Monolith (satu runtime terbagi domain).
- **Rationale:** Tim berukuran 1-5 developer. Microservices akan menyerap 60% waktu tim untuk infrastruktur (service discovery, k8s, tracing) daripada menyelesaikan fitur inti.
- **Accepted Cost:** Skalabilitas komputasi terikat dalam satu proses aplikasi. Mitigasi: Node.js clustering atau PM2 jika beban meningkat.

### Trade-off 3: Asynchronous In-Process Webhook vs Distributed Queue (Redis/Kafka)
- **Decision:** In-Process Idempotent Asynchronous Webhook (ADR-005).
- **Options:** Redis BullMQ vs In-Process DB-backed asynchronous processing.
- **Rationale:** Menghindari penambahan dependensi server Redis eksternal pada fase MVP. Menyimpan event di tabel `webhook_deliveries` PostgreSQL sudah cukup menjamin idempotensi dan durabilitas.
- **Accepted Cost:** Jika server crash di tengah pemrosesan event asinkron, status tetap `PENDING` dan membutuhkan reconciler sederhana saat server restart.

---

## 10. Deployment Architecture

### Environments
1. **Local Development:** `npm run dev` menjalankan Express + Vite middleware dalam satu terminal, terhubung ke PostgreSQL lokal (`localhost:5432/workstation_dev`).
2. **Staging / Office Server:** Container Docker atau proses PM2 di server lokal kantor/Kontabo, terhubung ke PostgreSQL staging.
3. **Production:** Node.js process (`dist/server.cjs`) melayani static client bundle dan REST API, terhubung ke PostgreSQL production dengan connection pooling dan SSL aktif.

### Deployment Topology
```
[Internet / GitHub Webhook]
          │
          ▼ (HTTPS Port 443)
┌───────────────────────────────────────────────┐
│ Nginx Reverse Proxy / Cloudflare Tunnel       │
│ - SSL Termination                             │
│ - Rate Limiting (Burst 50 req/s)              │
│ - Static Assets Caching                       │
└───────────────────────┬───────────────────────┘
                        │ HTTP Port 3000
┌───────────────────────▼───────────────────────┐
│ WORKSTATION Application Process (Node.js/PM2)  │
│ - Express REST API Modular Monolith           │
│ - Built-in Security Middlewares               │
└───────────────────────┬───────────────────────┘
                        │ Port 5432
┌───────────────────────▼───────────────────────┐
│ PostgreSQL 16 Database Server                 │
│ - Tables, Indexes, Constraints                │
│ - Daily Automated Dump Backup                 │
└───────────────────────────────────────────────┘
```

---

## 11. Future Considerations

- **Fase V1 (Operations Expansion):** Penambahan daemon Workstation Linux Agent via gRPC/WebSocket aman untuk telemetry server Kontabo, serta pengaktifan generator laporan berkala dual-language.
- **Fase V2 (AI Codebase Intelligence):** Re-integrasi Gemini AI untuk pemindaian repository berbasis diff Git PR, dengan sandboxing isolasi proses dan verifikasi kuota token perusahaan.
- **Revisit Triggers (Kapan Arsitektur Ini Harus Ditinjau Ulang):**
  1. Beban concurrent active user melampaui 500 pengguna aktif bersamaan.
  2. Volume webhook GitHub harian melampaui 50.000 event/hari (saat itu wajib beralih ke Redis BullMQ / Kafka).
  3. Kebutuhan multi-region atau enterprise SSO (SAML/SCIM).

---

## 12. Appendix

### Glossary
- **Drizzle ORM:** TypeScript ORM modern dengan pendekatan SQL-first dan zero runtime overhead.
- **UUIDv7:** Format UUID berbasis waktu yang menjamin keterurutan data (*time-sortable*) saat dijadikan Primary Key pada indeks B-Tree database.
- **Idempotency:** Kemampuan suatu operasi dipanggil berulang kali dengan payload yang sama tanpa menghasilkan efek samping ganda.

### References
- PRD: `bmad-output/prd.md`
- Decision Log: `bmad-output/decision-log.md`
- Deep Scan Report: `docs/DEEP-SCAN-REPORT-2026-09-18.md`
- Master PRD: `docs/WORKSTATION_Super_Duper_PRD.pdf`

---

**END OF ARCHITECTURE DOCUMENT** — Approved by Winston (BMAD System Architect).
