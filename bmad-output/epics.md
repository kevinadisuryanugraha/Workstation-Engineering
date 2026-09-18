# Epics Map — WORKSTATION MVP

> The epic MAP. An index of shippable slices derived from `prd.md` and `architecture.md`.
> Story detail lives in individual `bmad-output/stories/{epic}.{story}.{slug}.story.md` files.
>
> Track: BMad Method  
> Sources: `bmad-output/prd.md`, `bmad-output/architecture.md`, `bmad-output/project-context.md`

---

## Epic 1: Core Platform Foundation, Security & Database

**Goal:** Membangun fondasi sistem yang aman, persisten di PostgreSQL 16 via Drizzle ORM, dan berada di bawah kendali versi Git, serta menutup 100% kerentanan kritis Deep Scan (DS-01 s.d. DS-07).

**In scope (cited):**
- FR-001 — Otentikasi Pengguna & Manajemen Sesi Aman [Source: prd.md#FR-001]
- FR-002 — Kontrol Akses Berbasis Peran (RBAC) pada Server [Source: prd.md#FR-002]
- FR-003 — Model Entitas Organisasi & Project [Source: prd.md#FR-003]
- FR-015 — Basis Data Relasional Permanen sebagai Single Source of Truth [Source: prd.md#FR-015]
- NFR-002 — Keamanan Akses & Perlindungan Kredensial [Source: prd.md#NFR-002]
- NFR-003 — Ketahanan & Persistensi Data [Source: prd.md#NFR-003]
- NFR-005 — Kualitas & Keterpeliharaan Kode [Source: prd.md#NFR-005]

**Architecture touchpoints:**
- Modular Layered Monolith [Source: architecture.md#ADR-001]
- PostgreSQL 16 & Drizzle ORM [Source: architecture.md#ADR-002]
- Server-Authoritative RBAC & Stateless JWT [Source: architecture.md#ADR-003]
- Naming & Structure Standards [Source: architecture.md#ADR-008]

**Out of scope:**
- Single Sign-On (SSO / SAML) ditunda ke Enterprise phase.
- Fitur AI scan & translate ditunda ke V2.

**Stories (ordered):**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 1.1 | git-init-and-toolchain | Inisialisasi git, strict tsconfig, dan testing toolchain (DS-07, DS-11) | done |
| 1.2 | postgres-drizzle-setup | Konfigurasi Drizzle ORM, skema inti (users, orgs, projects), dan migrasi SQL (DS-09) | done |
| 1.3 | secure-auth-engine | Rombak auth: bcrypt hashing, stateless JWT HMAC, fail-fast env secret (DS-01, DS-04, DS-06) | done |
| 1.4 | server-rbac-middleware | Penegakan RBAC server-side, hapus auto-admin klien & password hints (DS-02, DS-03, DS-05) | done |
| 1.5 | org-and-project-api | CRUD Organization & Project API ber-RBAC dengan key generation unik | done |

**Cross-epic dependencies:**
- Blocked by: None (Fondasi sistem)
- Blocks: Epic 2, Epic 3, Epic 4, Epic 5, Epic 6, Epic 7

---

## Epic 2: Work Items & Task Management

**Goal:** Menyediakan siklus hidup pengelolaan item pekerjaan rekayasa (Epic, Feature, Task, Bug, Tech Debt) dengan checklist kriteria penerimaan nyata (*Definition of Done*) dan penautan dependensi.

**In scope (cited):**
- FR-004 — Work Item Lifecycle & Manajemen Tugas [Source: prd.md#FR-004]
- FR-006 — Dependency Tracking Antar Work Item [Source: prd.md#FR-006]
- NFR-001 — Kecepatan Respons API (p95 < 150ms) [Source: prd.md#NFR-001]

**Architecture touchpoints:**
- Work Management Component [Source: architecture.md#4.2]
- Schema `work_items` & `acceptance_criteria` [Source: architecture.md#5.2]
- REST Envelope [Source: architecture.md#ADR-004]

**Out of scope:**
- Estimasi berbasis story points/velocity (dilarang oleh filosofi produk — count-based delivery).

**Stories (ordered):**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 2.1 | work-items-crud-api | Skema Drizzle, endpoint CRUD work items, dan filter query terindeks | done |
| 2.2 | acceptance-criteria-engine | Checklist kriteria penerimaan & validasi pemblokiran transisi status DONE | done |
| 2.3 | task-dependency-tracking | Penautan dependensi 'Blocked By' / 'Blocks' dan pencegahan circular loop | done |

**Cross-epic dependencies:**
- Blocked by: Epic 1 (Butuh users, projects, dan auth)
- Blocks: Epic 3, Epic 4, Epic 5

---

## Epic 3: Developer Experience & "My Work" Workspace

**Goal:** Membangun ruang kerja harian developer yang terpadu (*My Work*) dengan pembaruan status 1-klik dan indikator progres berbasis bukti yang dapat di-drill down.

**In scope (cited):**
- FR-005 — Developer "My Work" Workspace [Source: prd.md#FR-005]
- FR-016 — Dashboard Ringkasan Progres & Health Berbasis Evidence [Source: prd.md#FR-016]
- NFR-004 — Efisiensi & Kerapihan Sisi Klien (PWA & navigasi instan) [Source: prd.md#NFR-004]

**Architecture touchpoints:**
- Client State with Zustand & React Query [Source: architecture.md#ADR-006]
- Dekomposisi 13 state `App.tsx` ke custom hooks [Source: architecture.md#ADR-006]
- Retro Desktop Shell integration [Source: architecture.md#ADR-008]

**Out of scope:**
- Dual-language translation engine ditunda ke V1.

**Stories (ordered):**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 3.1 | my-work-aggregation-api | Endpoint agregasi tugas, tiket, dan PR aktif khusus pengguna login | done |
| 3.2 | client-store-decomposition | Dekomposisi 13 state di `src/App.tsx` ke Zustand store & React Query hooks | done |
| 3.3 | quick-status-and-evidence-ui | Aksi status 1-klik dan komponen kartu progres yang bisa di-drill down | done |

**Cross-epic dependencies:**
- Blocked by: Epic 1, Epic 2, Epic 4
- Blocks: None (Lapisan presentasi akhir)

---

## Epic 4: Ticketing & ITSM Issue Resolution

**Goal:** Menyediakan sistem tiket internal untuk mencatat dan menyelesaikan isu, bug, dan insiden teknis dengan pemisahan Severity vs Priority dan penautan dua arah ke work item.

**In scope (cited):**
- FR-007 — Tiket Masuk, Workflow, dan Triage [Source: prd.md#FR-007]
- FR-008 — Tautan Dua Arah Tiket ↔ Work Item ↔ Bukti [Source: prd.md#FR-008]
- FR-009 — Komentar, Lampiran, dan Timeline Tiket [Source: prd.md#FR-009]

**Architecture touchpoints:**
- Ticketing & ITSM Component [Source: architecture.md#4.3]
- Schema `tickets` & `ticket_comments` [Source: architecture.md#5.1]

**Out of scope:**
- Konversi otomatis tiket ke artikel basis pengetahuan (KB) ditunda ke V1.

**Stories (ordered):**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 4.1 | ticket-lifecycle-api | Skema Drizzle tickets, endpoint CRUD, workflow status, dan triase | done |
| 4.2 | ticket-work-item-linking | Mekanisme penautan dua arah Tiket ↔ Work Item dan validasi resolusi | done |
| 4.3 | ticket-comments-timeline | Komentar tiket berbasis markdown dan timeline perubahan status | done |

**Cross-epic dependencies:**
- Blocked by: Epic 1, Epic 2
- Blocks: Epic 3, Epic 5

---

## Epic 5: Git Intelligence & Webhook Engine

**Goal:** Menghubungkan aktivitas kode di GitHub secara otomatis ke tiket dan tugas via webhook receiver resmi (`X-Hub-Signature-256`) dengan deduplikasi idempoten.

**In scope (cited):**
- FR-010 — Registrasi Repository & Webhook Receiver GitHub [Source: prd.md#FR-010]
- FR-011 — Pelacakan Commit, PR, dan Auto-Link ke Work Item / Tiket [Source: prd.md#FR-011]
- NFR-001 — Kecepatan respons webhook < 100ms [Source: prd.md#NFR-001]

**Architecture touchpoints:**
- Asynchronous Idempotent Webhook Engine [Source: architecture.md#ADR-005]
- Schema `repositories`, `commits`, `pull_requests`, `webhook_deliveries` [Source: architecture.md#5.1]

**Out of scope:**
- Multi-provider Git selain GitHub (GitLab/Bitbucket) ditunda ke V2.

**Stories (ordered):**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 5.1 | github-webhook-receiver | Endpoint receiver webhook dengan verifikasi signature HMAC-SHA256 & idempotensi | done |
| 5.2 | git-entity-auto-linker | Parser regex kunci entitas (`WRK-101`) & penautan commit/PR ke evidence_links | done |

**Cross-epic dependencies:**
- Blocked by: Epic 1, Epic 2, Epic 4
- Blocks: Epic 3, Epic 6

---

## Epic 6: Release & Deployment Operations

**Goal:** Mencatat riwayat rilis dan deployment per server/environment secara terverifikasi, serta menyediakan otorisasi rollback darurat dengan audit trail kriptografis.

**In scope (cited):**
- FR-012 — Pencatatan Release & Deployment Manual/Webhook [Source: prd.md#FR-012]
- FR-013 — Riwayat Rollback & Tombol Otorisasi Rollback [Source: prd.md#FR-013]

**Architecture touchpoints:**
- Release & Deployment Component [Source: architecture.md#4.5]
- Schema `deployments` & `deployment_logs` [Source: architecture.md#5.1]
- Rollback signature generation [Source: architecture.md#ADR-007]

**Out of scope:**
- Deployment gate otomatis berbasis tes CI/CD ditunda ke V2.

**Stories (ordered):**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 6.1 | deployment-recording-api | Skema deployments, endpoint pencatatan manual & runner API | done |
| 6.2 | rollback-authorization-ops | Endpoint otorisasi rollback ber-RBAC dengan tanda tangan audit kriptografis | done |

**Cross-epic dependencies:**
- Blocked by: Epic 1, Epic 5
- Blocks: Epic 7

---

## Epic 7: Audit Trail & System Governance

**Goal:** Menjamin kepatuhan, transparansi, dan akuntabilitas sistem dengan mencatat seluruh transaksi mutasi ke dalam tabel audit *append-only* dengan correlation IDs.

**In scope (cited):**
- FR-014 — Audit Trail Append-Only [Source: prd.md#FR-014]
- NFR-002 — Integritas Forensik & Keamanan Sistem [Source: prd.md#NFR-002]

**Architecture touchpoints:**
- Immutable Append-Only Audit Logging with Correlation IDs [Source: architecture.md#ADR-007]
- Schema `audit_logs` [Source: architecture.md#5.2]

**Out of scope:**
- Ekspor laporan audit ke SIEM eksternal ditunda ke Enterprise phase.

**Stories (ordered):**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 7.1 | append-only-audit-middleware | Middleware correlation ID UUIDv7 & service pencatatan event append-only | done |
| 7.2 | audit-log-viewer-api | Endpoint pembacaan audit log dengan filter aktor, rentang tanggal, dan pagination | done |

**Cross-epic dependencies:**
- Blocked by: Epic 1
- Blocks: None (Governance layer melingkupi seluruh aksi sistem)

---

## Delivery Tracking (Count-Based)

Tidak ada story points, velocity, maupun burndown chart. Pelacakan murni berbasis HITUNGAN CERITA:

- **Total Stories:** 20
- **Done:** 12
- **Remaining:** 8
- **Completion Rate:** 60% (12 / 20)

## Sequencing & Wave Plan

```
Wave 1 (Foundation):
  ├── Story 1.1 (Git & Toolchain)
  └── Story 1.2 (Postgres & Drizzle Setup)

Wave 2 (Security & Core Schema):
  ├── Story 1.3 (Secure Auth Engine)
  ├── Story 1.4 (Server RBAC Enforcement)
  └── Story 7.1 (Audit Logging Middleware)

Wave 3 (Domain Entities):
  ├── Story 1.5 (Org & Project API)
  ├── Story 2.1 (Work Items CRUD)
  └── Story 4.1 (Tickets Lifecycle API)

Wave 4 (Logic & Linkages):
  ├── Story 2.2 (Acceptance Criteria Engine)
  ├── Story 2.3 (Dependency Tracking)
  ├── Story 4.2 (Ticket-Work Item Linker)
  └── Story 5.1 (GitHub Webhook Receiver)

Wave 5 (Operations & UI Integration):
  ├── Story 4.3 (Ticket Comments Timeline)
  ├── Story 5.2 (Git Entity Auto-Linker)
  ├── Story 6.1 (Deployment Recording)
  ├── Story 6.2 (Rollback Ops)
  ├── Story 7.2 (Audit Viewer API)
  ├── Story 3.1 (My Work Aggregation API)
  ├── Story 3.2 (Client Store Decomposition)
  └── Story 3.3 (Quick Status & Evidence UI)
```

---

_BMAD Planning & Orchestrator · Epics Map · Tracks `bmad-epics-and-stories`_
