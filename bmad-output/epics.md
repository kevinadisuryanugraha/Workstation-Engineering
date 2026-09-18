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

## Epic 8: Security Hardening & Token Governance

> # COURSE-CORRECTION (2026-09-18, via bmad-correct-course)
> Epic baru hasil audit keamanan mendalam — Sprint V1.1. [Source: docs/DEEP-SCAN-REPORT-2026-09-18.md §5 & §8]

**Goal:** Menutup 100% temuan audit keamanan lanjutan (SEC-01 s.d. SEC-05) agar sistem memenuhi standar OWASP Top 10:2025 sebelum operasi produksi penuh.

**In scope (cited):**
- SEC-01 — Pembatalan token instan via kolom `token_version` pada tabel users [Source: docs/DEEP-SCAN-REPORT-2026-09-18.md#SEC-01]
- SEC-02 — Rate limiting endpoint login (maks 5 percobaan gagal / 15 menit / IP) [Source: docs/DEEP-SCAN-REPORT-2026-09-18.md#SEC-02]
- SEC-03 — Security headers standar via helmet & sembunyikan `X-Powered-By` [Source: docs/DEEP-SCAN-REPORT-2026-09-18.md#SEC-03]
- SEC-04 — Turunkan batas body parser menjadi `500kb` [Source: docs/DEEP-SCAN-REPORT-2026-09-18.md#SEC-04]
- SEC-05 — Label integritas `STATIC_DEMO_PREVIEW` pada fallback AI scanner [Source: docs/DEEP-SCAN-REPORT-2026-09-18.md#SEC-05]
- NFR-002 — Keamanan Akses & Perlindungan Kredensial [Source: prd.md#NFR-002]

**Architecture touchpoints:**
- Server-Authoritative RBAC & Stateless JWT (diperluas dengan verifikasi `token_version`) [Source: architecture.md#ADR-003]
- Modular Layered Monolith [Source: architecture.md#ADR-001]

**Out of scope:**
- Redis blacklist eksternal (kolom `token_version` di PostgreSQL cukup untuk skala saat ini).
- Endpoint upload lampiran 10 MB khusus (ditunda sampai fitur attachment ada).

**Stories (ordered):**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 8.1 | http-hardening-middleware | SEC-02+SEC-03+SEC-04: rate limit login, helmet headers, body limit 500kb | done |
| 8.2 | token-revocation-token-version | SEC-01: pencabutan token instan via token_version di DB | done |
| 8.3 | ai-scanner-demo-integrity | SEC-05: penandaan mode demo AI scanner + peringatan visual UI | done |

**Cross-epic dependencies:**
- Blocked by: Epic 1 (auth engine & skema users)
- Blocks: None

---

## Epic 9: Workstation Linux Server Agent

> # COURSE-CORRECTION (2026-09-18, via bmad-correct-course)
> Epic baru — Sprint V1.2. [Source: docs/DEEP-SCAN-REPORT-2026-09-18.md §8]

**Goal:** Daemon ringan berbasis Node.js yang memantau kesehatan server (CPU, RAM, Disk) di server kantor & Kontabo VPS, mengirim telemetri berkala ke platform WORKSTATION, dan menampilkannya sebagai dashboard kesehatan server.

**In scope (cited):**
- Sprint V1.2 — Workstation Linux Server Agent (daemon CPU/RAM/Disk) [Source: docs/DEEP-SCAN-REPORT-2026-09-18.md#8]
- FR-015 — Persistensi data telemetri nyata di PostgreSQL [Source: prd.md#FR-015]

**Architecture touchpoints:**
- Modular Layered Monolith — modul `agent` (daemon) & `server-metrics` (ingest API) [Source: architecture.md#ADR-001]
- PostgreSQL 16 & Drizzle ORM [Source: architecture.md#ADR-002]

**Out of scope:**
- Alerting/notifikasi (email/Slack/Telegram) ditunda ke iterasi berikutnya.
- Agen untuk Windows/macOS (target hanya Linux).

**Stories (ordered):**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 9.1 | agent-metrics-daemon | Daemon pengumpul CPU/RAM/Disk dengan polling interval, buffer, dan retry | done |
| 9.2 | agent-ingestion-api | Endpoint ingest telemetri ber-auth token agen + skema `server_metrics` | ready-for-dev |
| 9.3 | server-health-view | Dashboard kesehatan server: kartu status live + riwayat metrik | done |

**Cross-epic dependencies:**
- Blocked by: Epic 1 (auth & DB foundation)
- Blocks: None

---

## Epic 10: Dual-Language Reporting Engine

> # COURSE-CORRECTION (2026-09-18, via bmad-correct-course)
> Epic baru — Sprint V1.3. [Source: docs/DEEP-SCAN-REPORT-2026-09-18.md §8]

**Goal:** Generator ringkasan laporan manajemen otomatis dalam Bahasa Indonesia yang mengagregasi data operasional nyata (tiket, work item, deployment, audit) per periode — menggantikan pelaporan manual.

**In scope (cited):**
- Sprint V1.3 — Dual-Language Reporting Engine (ringkasan Bahasa Indonesia) [Source: docs/DEEP-SCAN-REPORT-2026-09-18.md#8]
- FR-015 — Single source of truth dari data nyata, bukan pelaporan manual [Source: prd.md#FR-015]

**Architecture touchpoints:**
- Modular Layered Monolith — modul `reports` (aggregation + generator) [Source: architecture.md#ADR-001]
- PostgreSQL 16 & Drizzle ORM [Source: architecture.md#ADR-002]

**Out of scope:**
- Terjemahan otomatis EN↔ID berbasis LLM (menunggu keputusan fitur AI yang masih PENDING di decision-log).
- Export PDF/Excel; output Phase ini adalah teks/Markdown terstruktur + tampilan UI.

**Stories (ordered):**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 10.1 | report-aggregation-api | Endpoint agregasi KPI operasional per periode (tiket, work item, deployment, audit) | done |
| 10.2 | id-report-generator | Generator narasi ringkasan manajemen Bahasa Indonesia dari data agregasi | done |

**Cross-epic dependencies:**
- Blocked by: Epic 2, Epic 4, Epic 6, Epic 7 (sumber data agregasi)
- Blocks: None

---

## Epic 11: Server Agent — Service Monitoring (Nginx/MySQL/Redis)

> # COURSE-CORRECTION-2 (2026-09-18, via bmad-correct-course)
> Ekspansi Epic 9 — Master PRD Section 30: pemantauan layanan, bukan hanya hardware.

**Goal:** Agent memeriksa kesehatan layanan kritis (Nginx, MySQL, Redis) di tiap server dan menampilkannya di kartu Infrastructure yang sudah punya panel "Systemd Services Monitored by Agent".

**In scope (cited):**
- Master PRD §30 — Fase V1: Server Agent (CPU, RAM, Disk, Nginx, MySQL, Redis) [Source: docs/WORKSTATION_Super_Duper_PRD.pdf#30]
- FR-015 — persistensi telemetri nyata [Source: prd.md#FR-015]

**Architecture touchpoints:**
- Modular Layered Monolith — modul agent & server-metrics diperluas [Source: architecture.md#ADR-001]

**Out of scope:** query mendalam (slow query log MySQL, hit ratio Redis) — cukup kesehatan koneksi/latensi probe.

**Stories (ordered):**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 11.1 | agent-service-probes | Probe Nginx (HTTP), MySQL & Redis (TCP + handshake) yang dapat dikonfigurasi per server | done |
| 11.2 | service-metrics-persistence | Kolom `services` JSONB, ingest + validasi, API latest menyertakan layanan, kartu UI live | done |

**Cross-epic dependencies:** Blocked by Epic 9 · Blocks: None

---

## Epic 12: Scheduled Reporting Engine (Daily/Weekly/Monthly)

> # COURSE-CORRECTION-2 (2026-09-18, via bmad-correct-course)
> Ekspansi Epic 10 — Master PRD Section 30: laporan berkala otomatis berbahasa manajemen.

**Goal:** Laporan harian/mingguan/bulanan yang dapat dibuat & disimpan sebagai arsip (riwayat immutable), dengan narasi eksekutif Bahasa Indonesia dan perbandingan tren vs periode sebelumnya.

**In scope (cited):**
- Master PRD §30 — Fase V1: laporan harian, mingguan, bulanan otomatis [Source: docs/WORKSTATION_Super_Duper_PRD.pdf#30]

**Architecture touchpoints:**
- Modular Layered Monolith — modul reports diperluas [Source: architecture.md#ADR-001]

**Out of scope:** pengiriman email/WhatsApp otomatis; penyusunan jadwal cron produksi (endpoint pembuatan on-demand + arsip cukup untuk fase ini).

**Stories (ordered):**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 12.1 | generated-reports-storage | Tabel `generated_reports`, POST generate DAILY/WEEKLY/MONTHLY, riwayat & detail arsip | done |
| 12.2 | executive-narrative-trends | Paragraf eksekutif Bahasa manajemen + tren vs periode sebelumnya (delta otomatis) | done |

**Cross-epic dependencies:** Blocked by Epic 10 · Blocks: None

---

## Epic 13: Incident Room & SLA Management

> # COURSE-CORRECTION-2 (2026-09-18, via bmad-correct-course)
> Modul baru — Master PRD Section 30: pengelolaan waktu tanggap insiden & timeline immutable.

**Goal:** Backend insiden sungguhan yang menggantikan data mock Incident Room: deklarasi insiden, mesin status lifecycle, target SLA tanggap/penyelesaian per severity dengan deteksi pelanggaran, dan timeline append-only yang tidak dapat diubah/dihapus.

**In scope (cited):**
- Master PRD §30 — Fase V1: Incident Room & SLA [Source: docs/WORKSTATION_Super_Duper_PRD.pdf#30]
- FR-014 — pola append-only immutable [Source: prd.md#FR-014]
- NFR-002 — integritas forensik [Source: prd.md#NFR-002]

**Architecture touchpoints:**
- Immutable Append-Only Audit (pola yang sama untuk timeline insiden) [Source: architecture.md#ADR-007]
- Server-Authoritative RBAC [Source: architecture.md#ADR-003]

**Out of scope:** notifikasi PagerDuty/Slack; on-call scheduling; post-mortem template generator (postmortem disimpan sebagai event timeline bertipe note).

**Stories (ordered):**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 13.1 | incident-schema-lifecycle | Skema `incidents` + API deklarasi & transisi status tervalidasi mesin status | done |
| 13.2 | incident-sla-engine | Target SLA tanggap/resolve per severity, perhitungan status MET/BREACHED/PENDING | done |
| 13.3 | incident-immutable-timeline-ui | Tabel `incident_events` append-only + wiring IncidentRoomView ke API nyata | done |

**Cross-epic dependencies:** Blocked by Epic 1 (auth/RBAC), Epic 7 (pola audit) · Blocks: None

---

## Delivery Tracking (Count-Based)

Tidak ada story points, velocity, maupun burndown chart. Pelacakan murni berbasis HITUNGAN CERITA:

- **Total Stories:** 35 (20 MVP + 8 Fase V1 gel.1 + 7 Fase V1 gel.2)
- **Done:** 33
- **Remaining:** 2 (13.2, 13.3)
- **Completion Rate:** 94% (33 / 35)

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

Wave 6 (Security Hardening — Sprint V1.1) [COURSE-CORRECTION]:
  ├── Story 8.1 (HTTP Hardening Middleware)
  ├── Story 8.2 (Token Revocation / token_version)
  └── Story 8.3 (AI Scanner Demo Integrity)

Wave 7 (Server Agent — Sprint V1.2) [COURSE-CORRECTION]:
  ├── Story 9.1 (Agent Metrics Daemon)
  ├── Story 9.2 (Agent Ingestion API)
  └── Story 9.3 (Server Health View)

Wave 8 (Reporting — Sprint V1.3) [COURSE-CORRECTION]:
  ├── Story 10.1 (Report Aggregation API)
  └── Story 10.2 (ID Report Generator)

Wave 9 (Service Monitor + Arsip Laporan) [COURSE-CORRECTION-2]:
  ├── Story 11.1 (Agent Service Probes)
  ├── Story 11.2 (Service Metrics Persistence)
  └── Story 12.1 (Generated Reports Storage)

Wave 10 (Narasi Eksekutif + Incident Core) [COURSE-CORRECTION-2]:
  ├── Story 12.2 (Executive Narrative & Trends)
  └── Story 13.1 (Incident Schema & Lifecycle)

Wave 11 (SLA + Timeline Immutable) [COURSE-CORRECTION-2]:
  ├── Story 13.2 (Incident SLA Engine)
  └── Story 13.3 (Immutable Timeline & Incident Room UI)
```

---

_BMAD Planning & Orchestrator · Epics Map · Tracks `bmad-epics-and-stories`_
