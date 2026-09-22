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

## Epic 14: Sprints & Milestones (Penuntasan V1)

> # COURSE-CORRECTION-3 (2026-09-18, via bmad-prd UPDATE — FR-017)
> Sisa scope V1 dari Master PRD §5 & §30.

**Goal:** Work item terkelompokkan dalam sprint/milestone dengan progres yang dapat dijelaskan (planned/completed/carry-over).

**In scope (cited):** FR-017 [Source: prd.md#FR-017], Master PRD §5 [Source: docs/WORKSTATION_Super_Duper_PRD.pdf#5]
**Out of scope:** kapasitas tim & velocity points (count-based saja).

**Stories:**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 14.1 | sprint-milestone-management | Skema sprints/milestones + assignment ke work item + CRUD API | done |
| 14.2 | sprint-board-progress | Sprint board (planned/completed/carry-over) + panel UI Project 360 | done |

**Dependencies:** Blocked by Epic 2 · Blocks: Epic 17 (analytics, V2.1)

---

## Epic 15: Knowledge Base & Global Search (Penuntasan V1)

> # COURSE-CORRECTION-3 (2026-09-18) — Master PRD §19.

**Goal:** Artikel KB dengan versioning (termasuk draft dari tiket resolved) dan pencarian global lintas entitas.

**In scope (cited):** FR-018 [Source: prd.md#FR-018], Master PRD §19
**Out of scope:** full-text search engine eksternal (pg_trgm ILIKE cukup).

**Stories:**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 15.1 | kb-articles-versioning | Skema kb_articles + versions, CRUD, draft dari tiket resolved | done |
| 15.2 | global-search | Endpoint pencarian lintas tiket/work item/KB/insiden + panel hasil | done |

**Dependencies:** Blocked by Epic 4 · Blocks: None

---

## Epic 16: AI Codebase Intelligence Real (Gemini)

> # COURSE-CORRECTION-3 (2026-09-18) — Inti Fase V2, Master PRD §11 & §30. Keputusan AI DISETUJUI.

**Goal:** Scan AI berbasis Gemini dengan snapshot persisten, finding lifecycle tervalidasi manusia, konversi recommendation→work item, dan terjemahan laporan dwibahasa.

**In scope (cited):** FR-019..FR-021, NFR-006 [Source: prd.md], Master PRD §11
**Out of scope:** full repository indexer; AI menulis langsung ke code/status bisnis (dilarang prinsip).

**Stories:**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 16.1 | ai-scan-snapshots | Snapshot scan persisten (live & demo) + riwayat | done |
| 16.2 | finding-lifecycle | Finding individual + state machine + audit | done |
| 16.3 | recommendation-to-work-item | Konversi rekomendasi → work item (approval manusia, idempoten) | done |
| 16.4 | ai-report-translate | Terjemahan EN↔ID arsip laporan via Gemini (503 bersih tanpa key) | done |

**Dependencies:** Blocked by Epic 7 (audit), Epic 2 (work items) · Blocks: V2.1 analytics

---

## Epic 17: UI Clarity & Role-Based Navigation

> # COURSE-CORRECTION-4 (2026-09-19) — Umpan balik owner: UI terasa padat & membingungkan. Diagnosis: over-EXPOSURE (15 menu rata tanpa filter role + data demo), bukan over-engineering backend. Lihat decision-log 2026-09-19.

**Goal:** Menurunkan beban kognitif via *progressive disclosure* — menu difilter per permission (memakai `PERM_*`/`SERVER_ROLE_PERMISSIONS` eksisting), dikelompokkan 3 seksi, data demo keluar dari jalur default, dan Blueprint keluar dari permukaan produk.

**In scope:** IA navigasi (Sidebar/App), gating mock data, higienitas konten.
**Out of scope:** penghapusan fitur backend, perubahan RBAC server, fitur baru, redesign visual.

**Stories:**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 17.1 | role-based-grouped-navigation | Registry navigasi + filter permission + 3 grup (Kerjaanku/Operations/Governance) | done |
| 17.2 | demo-data-exit-strategy | mockData digating (VITE_DEMO_MODE); default data API nyata | done |
| 17.3 | blueprint-surface-removal | Blueprint keluar dari nav/view; konten diarsipkan ke docs/ + disclaimer | done |

**Dependencies:** 17.1 → 17.2 → 17.3 (sequential; shared scope `App.tsx`/`Sidebar.tsx`) · Blocks: perencanaan UX V1

---

## Epic 18: Client API Wiring — Honest Data Everywhere

> # COURSE-CORRECTION-5 (2026-09-19) — Lanjutan langsung CC-4. Temuan Dev Agent Record 17.2 (BLOK 12.6 Deep Scan Report): 6 domain punya data/API nyata tetapi UI belum terhubung — di boot real tampil kosong + honest notice, mock hanya di mode demo. Epic ini menutup celah wiring tersebut agar seluruh layar menampilkan data nyata.

**Goal:** Seluruh view menampilkan data nyata dari API — menghilangkan 6 honest-empty notice dengan menghubungkan UI ke endpoint yang ada (dan menambah read endpoint kecil untuk Git entities yang datanya sudah terkumpul via webhook).

**In scope:** hook React Query baru (src/hooks/api/*), mapping DTO→UI di blok sumber data App.tsx, read endpoint Git entities (server/modules/git), wiring GlobalSearchModal ke /api/v1/search.
**Out of scope:** persistensi mutasi lokal ke API (create/update work item, ticket, incident, rollback — CC berikutnya), pengayaan field proyek (owner/techLead/currentSprint/latestRelease), perubahan skema DB, fitur baru.

**Stories:**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 18.1 | git-entities-wiring | GET /api/v1/git/commits & /pull-requests (server) + hook client + hydration | done |
| 18.2 | deployments-wiring | Hook useDeployments + hydration view Deployments | done |
| 18.3 | kb-wiring | Hook useKbArticles + hydration view Knowledge Base | done |
| 18.4 | audit-ledger-wiring | Hook useAuditLogs + adapter DTO→event feed view Audit | done |
| 18.5 | ai-intelligence-wiring | Hook findings/recommendations + hydration view AI | done |
| 18.6 | global-search-wiring | GlobalSearchModal query debounced ke /api/v1/search | done |

**Dependencies:** semua depend on 17.2 (infra gating, done) · 18.1 → 18.2 → 18.3 → 18.4 → 18.5 → 18.6 (sequential; shared scope blok sumber data `App.tsx`) · 18.6 tidak menyentuh App.tsx data-block (modal self-fetch)

---

## Epic 19: Report Export — PDF & Excel

> # COURSE-CORRECTION-6 (2026-09-19) — Keputusan owner: 3 fitur yang sebelumnya eksplisit *out of scope* (Epic 10/12) kini masuk backlog. Item 1 dari 3: export laporan.

**Goal:** Laporan manajemen (arsip DAILY/WEEKLY/MONTHLY + ringkasan periode) dapat diekspor ke PDF dan Excel untuk didistribusikan di luar sistem.

**In scope:** endpoint export server-side (PDF via `pdfkit`, Excel via `exceljs`) dari arsip laporan tersimpan, tombol export di UI laporan (unduh blob).
**Out of scope:** editor template ekspor; chart/gambar di dalam PDF (teks & tabel terformat cukup); export massal multi-arsip (zip).

**Stories:**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 19.1 | report-export-api | Endpoint `GET /api/v1/reports/history/:id/export.pdf` & `.xlsx` (stream file + audit) | done |
| 19.2 | export-ui | Tombol Export PDF/Excel di panel laporan + unduh blob + state jujur | done |

**Dependencies:** 19.2 depends on 19.1 · 19.1 depends on 12.1 (done) — sequential wave (shared `ReportView`/`App.tsx`)

---

## Epic 20: Scheduled Delivery — Cron, Email & WhatsApp

> # COURSE-CORRECTION-6 (2026-09-19) — Item 2 dari 3: pengiriman laporan berkala otomatis.

**Goal:** Laporan DAILY/WEEKLY/MONTHLY dibuat otomatis oleh scheduler produksi dan terkirim ke email (SMTP) dan WhatsApp (gateway HTTP) — dengan log delivery append-only dan graceful skip saat provider tidak dikonfigurasi.

**In scope:** scheduler cron in-process (`node-cron`, jadwal via env, idempoten per tipe), delivery service email (nodemailer) + WhatsApp (provider gateway generik kompatibel Fonnte/Wablas), tabel `report_deliveries` (append-only log status kirim).
**Out of scope:** UI admin penyuntingan penerima (penerima via env `REPORT_DELIVERY_EMAILS` / `REPORT_DELIVERY_WA_NUMBERS`); retry bertingkat; lampiran PDF di WA (kirim ringkasan teks + tautan).

**Stories:**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 20.1 | report-scheduler-cron | Cron scheduler produksi (generate otomatis, idempoten, audit, env-gated) | done |
| 20.2 | email-delivery | SMTP delivery + tabel report_deliveries + graceful skip | done |
| 20.3 | whatsapp-delivery | WhatsApp gateway delivery (HTTP provider generik) + graceful skip | done |

**Dependencies:** 20.2 & 20.3 depend on 20.1 · 20.1 depends on 12.1/12.2 (done) — sequential wave (shared scheduler module + `server.ts`)

---

## Epic 21: Gemini Real AI Scan — Aktivasi Fase V2

> # COURSE-CORRECTION-6 (2026-09-19) — Item 3 dari 3: keputusan PENDING (A-01, 2026-09-18) mengenai fitur AI real kini diputuskan AKTIF dengan kunci Gemini produksi.

**Goal:** AI scan menganalisis kode nyata via Gemini API (`@google/genai`) saat kunci tersedia — hasil tersimpan dengan mode `REAL_GEMINI` yang jujur; tanpa kunci/gagal → fallback `STATIC_DEMO_PREVIEW` eksisting tetap berjalan dengan label integritas yang tidak ambigu.

**In scope:** real scan path di `ai.service.ts` (prompt terstruktur → findings/rekomendasi JSON tervalidasi), mode `REAL_GEMINI` di enum, badge mode di UI scan + riwayat, dokumentasi env.
**Out of scope:** perubahan finding lifecycle (16.2 tetap berlaku — AI tidak pernah menutup tiket); scan otomatis terjadwal; multi-model.

**Stories:**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 21.1 | gemini-real-scan | Real scan path via Gemini + persist mode REAL_GEMINI + fallback aman | done |
| 21.2 | ai-real-ui | Badge mode REAL/DEMO di hasil & riwayat scan + filter + docs env | done |

**Dependencies:** 21.2 depends on 21.1 · 21.1 depends on 16.1 (done) — sequential wave (shared `ai.service.ts` + `App.tsx`)

---

## Epic 22: Technical Debt Registry (DEF-006)

> # COURSE-CORRECTION-7 (2026-09-21) — Sisa Fase V2: DEF-006 (Master PRD §11.4) — satu-satunya item Fase V2 yang disetujui namun belum tereksekusi (terverifikasi tidak pernah dibahas di decision-log/epics/PRD).

**Goal:** Debt item terlacak sistematis sesuai Master PRD §11.4 — setiap debt memiliki **origin, evidence, impact, effort, owner, target milestone, status, dan aging** — melalui endpoint registry terpusat dan tab "Technical Debt" di AI Intelligence View yang kini menampilkan data nyata (sebelumnya selalu kosong di boot real, komentar 18.5).

**In scope:** kolom terstruktur `debt_origin`/`debt_impact`/`debt_source_ref` pada work_items (migration 0016), endpoint registry `GET /api/v1/work-items/debts` (aging terkomputasi + agregat + filter), pengayaan konversi rekomendasi AI (16.3) agar mengisi field terstruktur, hidupkan tab techdebt AIIntelligenceView dengan data nyata.
**Out of scope:** nav baru (menjaga kemenangan CC-4 — debt tetap di dalam view AI sesuai struktur Master PRD §11); perubahan finding lifecycle (16.2); pembuatan debt otomatis oleh AI tanpa approval manusia (prinsip §11.4: *"AI tidak boleh menciptakan debt sebagai fakta tanpa evidence"*).

**Stories:**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 22.1 | debt-registry-api | Skema + API registry (origin/impact/evidence/aging) + pengayaan konversi AI | done |
| 22.2 | debt-registry-ui | Hidupkan tab Technical Debt AIIntelligenceView dengan data registry nyata | done |

**Dependencies:** 22.2 depends on 22.1 · 22.1 depends on 2.1, 16.3 (done) — sequential wave (shared `work-items` module + `App.tsx` + `AIIntelligenceView`)

---

## Epic 23: Multi-Provider Git — GitLab & Bitbucket

> # COURSE-CORRECTION-8 (2026-09-22) — Sisa Fase V2: "multi-provider Git" (Master PRD §30) — item V2 yang sejak Epic-5 ditunda eksplisit ("Multi-provider Git selain GitHub ditunda ke V2") dan belum pernah dibuka di decision-log. Owner memilih opsi ini dari 4 kandidat sisa Fase V2 pada 2026-09-22.

**Goal:** Evidence commit/MR/PR dari GitLab dan Bitbucket mengalir ke WORKSTATION dengan pipeline yang sama kuatnya dengan GitHub — webhook terverifikasi kriptografis per provider, payload dinormalisasi ke satu model kanonik, evidence links tetap ditegakkan regex kode item, dan registrasi repo multi-provider bisa dilakukan dari UI tanpa akses DB.

**In scope:** kolom `provider` pada `repositories` & `webhook_deliveries` (migration 0017), Repository Registry API (register/list, RBAC-gated, idempoten), webhook adapter GitLab (token timing-safe) & Bitbucket (HMAC-SHA256) dengan normalisasi payload kanonik, pemrosesan commits/MR-PR + evidence links dari model kanonik, read API menyertakan `provider`, UI badge provider + form registrasi repo.
**Out of scope:** adapter CI/CD eksternal dan advanced deployment gates (sisa Fase V2 lainnya — kandidat CC berikutnya); mengubah perilaku webhook GitHub eksisting (ADR-005 regression wajib hijau); menambah nav baru (menjaga kemenangan CC-4 — semua di panel Git eksisting); mengubah regex kode item; SSO/SCIM (Enterprise Phase).

**Stories:**

| ID | Slug | Intent | Status |
|----|------|--------|--------|
| 23.1 | multi-provider-schema-registry | Migration 0017 (kolom provider) + Repository Registry API idempoten | done |
| 23.2 | webhook-provider-adapters | Route & verifikasi GitLab/Bitbucket + normalisasi payload kanonik | done |
| 23.3 | git-linker-canonical-processing | Pemrosesan commits/MR-PR + evidence links dari model kanonik | done |
| 23.4 | provider-ui-wiring | Badge provider, form registrasi repo, hydration panel Git | done |

**Dependencies:** 23.2 → 23.1 · 23.3 → 23.2 · 23.4 → 23.1, 23.3 — sequential waves 28–31 (shared `git` module, `webhook.service.ts`, `App.tsx`)

---

## Delivery Tracking (Count-Based)

Tidak ada story points, velocity, maupun burndown chart. Pelacakan murni berbasis HITUNGAN CERITA:

- **Total Stories:** 65 (61 laporan sebelumnya + 4 Epic 23 CC-8)
- **Done:** 65 (Epic 23 tuntas 4/4 di hari yang sama, 2026-09-22)
- **Remaining:** 0
- **Completion Rate:** 100% (65 / 65) — Sisa Fase V2 \"multi-provider Git\" (Master PRD §30) tuntas penuh (433/433 test)
- **Koreksi 2026-09-19 (CC-4):** angka lama (33/35, remaining 13.2–13.3) tidak mencerminkan penyelesaian Waves 12–14; factual: 43/43 done sebelum Epic 17.
- **Koreksi 2026-09-19 (CC-5):** Epic 17 tuntas 3/3 (46/46 done, 100%) sebelum Epic 18 dibuka; Epic 18 tuntas 6/6 di hari yang sama.

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

Wave 12 (Sprints & Milestones) [COURSE-CORRECTION-3 — Fase V2]:
  ├── Story 14.1 (Sprint & Milestone Management)
  └── Story 14.2 (Sprint Board & Progress)

Wave 13 (Knowledge Base & Search) [COURSE-CORRECTION-3]:
  ├── Story 15.1 (KB Articles & Versioning)
  └── Story 15.2 (Global Search)

Wave 14 (AI Intelligence Real) [COURSE-CORRECTION-3]:
  ├── Story 16.1 (AI Scan Snapshots)
  ├── Story 16.2 (Finding Lifecycle)
  ├── Story 16.3 (Recommendation → Work Item)
  └── Story 16.4 (AI Report Translate)

Wave 19 (Report Export API) [COURSE-CORRECTION-6]:
  └── Story 19.1 (Report Export API — PDF & Excel)

Wave 20 (Export UI) [COURSE-CORRECTION-6]:
  └── Story 19.2 (Export Buttons UI)

Wave 21 (Scheduler Cron) [COURSE-CORRECTION-6]:
  └── Story 20.1 (Report Scheduler Cron)

Wave 22 (Email Delivery) [COURSE-CORRECTION-6]:
  └── Story 20.2 (SMTP Email Delivery)

Wave 23 (WhatsApp Delivery) [COURSE-CORRECTION-6]:
  └── Story 20.3 (WhatsApp Gateway Delivery)

Wave 24 (Gemini Real Scan) [COURSE-CORRECTION-6]:
  └── Story 21.1 (Gemini Real Scan Path)

Wave 25 (AI Real UI) [COURSE-CORRECTION-6]:
  └── Story 21.2 (AI Mode Badge & Filter UI)

Wave 26 (Debt Registry API) [COURSE-CORRECTION-7]:
  └── Story 22.1 (Debt Registry Schema & API)

Wave 27 (Debt Registry UI) [COURSE-CORRECTION-7]:
  └── Story 22.2 (Debt Registry Tab — Real Data)

Wave 28 (Provider Schema & Registry) [COURSE-CORRECTION-8]:
  └── Story 23.1 (Multi-Provider Schema & Registry API)

Wave 29 (Webhook Adapters) [COURSE-CORRECTION-8]:
  └── Story 23.2 (GitLab & Bitbucket Verification + Normalization)

Wave 30 (Canonical Processing) [COURSE-CORRECTION-8]:
  └── Story 23.3 (Commits/MR-PR + Evidence Links dari Model Kanonik)

Wave 31 (Provider UI) [COURSE-CORRECTION-8]:
  └── Story 23.4 (Badge Provider + Registry Form + Hydration)
```

---

_BMAD Planning & Orchestrator · Epics Map · Tracks `bmad-epics-and-stories`_
