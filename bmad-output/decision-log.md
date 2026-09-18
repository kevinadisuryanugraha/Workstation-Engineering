# Decision Log — WORKSTATION (Engineering Intelligence & Operations)

Log keputusan append-only. Skill BMAD berikutnya (architecture, stories, sprint)
membaca log ini agar keputusan tetap konsisten. Entri terbaru di atas.

---

### 2026-09-18 — KEPUTUSAN: Fitur AI DISETUJUI untuk Fase V2 (menghapus status PENDING)
- **Decision:** Keputusan posisi fitur AI (yang sebelumnya PENDING) resmi: **DISETUJUI** — AI masuk scope Fase V2 sesuai Master PRD §11 & §30: AI code scan nyata (Gemini), finding lifecycle dengan validasi manusia, recommendation→work item, dan terjemahan laporan.
- **Rationale:** Prinsip Master PRD "AI as analyst, not authority" terpenuhi: AI menghasilkan temuan/rekomendasi, manusia memvalidasi (state machine finding + approval konversi). Tanpa GEMINI_API_KEY sistem tetap berfungsi (STATIC_DEMO_PREVIEW, SEC-05) dan biaya nol. Kunci dapat ditempelkan ke `.env` kapan pun tanpa perubahan kode.
- **Impact:** prd.md (+FR-017..FR-021, NFR-006); epics.md (+Epic 14/15/16); sprint-status (+10 story); item COULD yang ditunda ke V2.1: multi-provider Git (GitLab/Bitbucket), CI/CD adapters, advanced deployment gates, advanced analytics, tech-debt register penuh (lihat addendum).
- **In-progress stories affected:** none.
- **Made by:** bmad-prd (John the PM)
- **Supersedes:** entri "Posisi fitur AI ditunda keputusannya [PENDING]"

### 2026-09-18 — Fase V1 Gelombang 2 Tuntas: Epic 11/12/13 selesai dieksekusi (Wave 9-11)
- **Decision:** Seluruh 7 story gelombang kedua dieksekusi & diuji: **Wave 9** (11.1 service probes Nginx/MySQL/Redis, 11.2 persistensi services + panel live, 12.1 arsip laporan DAILY/WEEKLY/MONTHLY), **Wave 10** (12.2 narasi eksekutif + tren antar periode, 13.1 skema insiden + mesin status lifecycle), **Wave 11** (13.2 SLA engine PENDING/MET/BREACHED + overdue, 13.3 timeline append-only + wiring Incident Room live).
- **Rationale:** Eksekusi penuh Master PRD §30 gelombang 2; Incident Room kini berjalan di atas PostgreSQL nyata (bukan mock).
- **Impact:** Total 35/35 story done (100%); test suite 98 → 144; migrasi 0007 (services), 0008 (generated_reports), 0009 (incidents), 0010 (incident_events); field opsional `sla` pada tipe Incident UI (deviasi minor terdokumentasi).
- **In-progress stories affected:** none.
- **Made by:** bmad-correct-course → bmad-epics-and-stories → dev execution loop
- **Supersedes:** none

### 2026-09-18 — Course Correction #2: Epic 11/12/13 (Fase V1 gelombang 2 — Master PRD §30)
- **Decision:** Menambah 3 epic (7 story) sesuai peta jalan Master PRD Section 30: **Epic 11** Agent Service Monitoring (Nginx/MySQL/Redis), **Epic 12** Scheduled Reporting (daily/weekly/monthly + arsip + narasi eksekutif + tren), **Epic 13** Incident Room & SLA (lifecycle + SLA engine + timeline immutable + wiring UI).
- **Rationale:** MVP dan Fase V1 gelombang 1 (Epic 8/9/10) tuntas 28/28; Master PRD §30 menetapkan ekspansi berikutnya. Koneksi layanan & insiden/SLA belum ada sama sekali di backend — perlu perencanaan terstruktur sebelum eksekusi.
- **Impact:** epics.md (+3 epic, 35 story total, wave plan +9/10/11); stories/ (+7 file); sprint-status.yaml (parallel_set 9/10/11).
- **In-progress stories affected:** none.
- **Made by:** bmad-correct-course
- **Supersedes:** none (additive)

### 2026-09-18 — Fase V1 Tuntas: Epic 8/9/10 selesai dieksekusi (Wave 6-8)
- **Decision:** Seluruh 8 story Fase V1 hasil course-correction dieksekusi, diuji, dan dikomit: **Wave 6** (Epic 8 — SEC-01 s.d. SEC-05: rate limit, helmet, body limit 500kb, token_version revocation, AI demo integrity flag), **Wave 7** (Epic 9 — agent daemon + ingest API server_metrics + server health cards), **Wave 8** (Epic 10 — aggregation API + generator laporan Bahasa Indonesia + ReportView).
- **Rationale:** Eksekusi penuh roadmap Fase V1 sesuai Deep Scan Report §8; seluruh temuan audit kini tuntas (23/23).
- **Impact:** Total story 28/28 done (100%); test suite 49 → 98 test; migrasi DB 0005 (token_version) & 0006 (server_metrics); dependencies baru: helmet, express-rate-limit.
- **In-progress stories affected:** none.
- **Made by:** bmad-correct-course → bmad-epics-and-stories → dev execution loop
- **Supersedes:** none

### 2026-09-18 — Course Correction: Tambah Epic 8, 9, 10 (Fase V1) dari Deep Scan Report
- **Decision:** Menambahkan 3 epic baru (8 story) hasil audit keamanan mendalam & roadmap Fase V1: **Epic 8** Security Hardening & Token Governance (SEC-01 s.d. SEC-05, Sprint V1.1), **Epic 9** Workstation Linux Server Agent (Sprint V1.2), **Epic 10** Dual-Language Reporting Engine (Sprint V1.3).
- **Rationale:** MVP 20/20 story selesai 100% dan semua temuan kritis DS-01..DS-07 tertutup. Deep Scan Report §8 menetapkan Roadmap Fase V1 sebagai lanjutan resmi; scope harus masuk planning agar penambahan terlacak, dependency jelas, dan siap dieksekusi dev.
- **Impact:** epics.md (+3 epic, delivery tracking 20/28 = 71%, wave plan +Wave 6/7/8); stories/ (+8 story files ready-for-dev); sprint-status.yaml (re-sequence: parallel_set 6, 7, 8).
- **In-progress stories affected:** none (semua 20 story MVP berstatus done).
- **Made by:** bmad-correct-course
- **Supersedes:** none (additive)

### 2026-09-18 — Solutioning ADRs (ADR-001 s.d. ADR-008) disetujui
- **Decision:** Mengunci 8 keputusan arsitektur sistem (ADR) untuk seluruh story dev:
  1. **ADR-001:** Modular Layered Monolith (pemisahan `server.ts` ke Routes, Controllers, Services, Repositories).
  2. **ADR-002:** PostgreSQL 16 + Drizzle ORM sebagai relational persistence & migration engine (menggantikan mock data).
  3. **ADR-003:** Server-Authoritative RBAC + stateless JWT (bcrypt 12, fail-fast env secret, menutup DS-01..DS-06).
  4. **ADR-004:** RESTful API style dengan Standardized JSON Envelope (`{ success, data, error, meta }`).
  5. **ADR-005:** Asynchronous Idempotent GitHub Webhook Receiver (`X-Hub-Signature-256`, delivery ID deduplication).
  6. **ADR-006:** Client-Side State Management via Zustand & React Query (dekomposisi 13 state di `App.tsx`).
  7. **ADR-007:** Immutable Append-Only Audit Trail dengan UUIDv7 Correlation IDs.
  8. **ADR-008:** Standar universal penamaan (snake_case DB, PascalCase UI, camelCase logic, kebab-case API).
- **Rationale:** Memaksa keselarasan teknis sebelum dev parallel agents dijalankan, mencegah konflik merge dan arsitektur divergen.
- **Made by:** bmad-architecture (Winston, the Architect)
- **Supersedes:** none

---

### 2026-09-18 — Posisi fitur AI ditunda keputusannya [PENDING]
- **Decision:** Fitur AI (scan, findings, translation, technical debt) ditetapkan **Won't (MVP)** sambil menunggu keputusan pemilik produk. Tersimpan sebagai A-01 di `addendum.md` dengan opsi + rekomendasi.
- **Rationale:** Jawaban user "belum tahu". Menunda lebih aman daripada memaksakan; MVP tetap valid tanpa AI sesuai phasing Master PRD (AI = V2).
- **Made by:** bmad-prd (diskusi dengan owner)
- **Supersedes:** none

### 2026-09-18 — User pertama: Developer
- **Decision:** User segmen pertama yang dilayani MVP adalah **Developer** — "My Work" dan ticket workspace keyboard-friendly menjadi epic prioritas; Management View/dual-language ditunda ke V1.
- **Rationale:** Jawaban eksplisit owner. Developer adalah pengguna harian yang menghasilkan data; tanpa mereka tidak ada evidence untuk dilihat manager.
- **Made by:** bmad-prd (diskusi dengan owner)
- **Supersedes:** none

### 2026-09-18 — Master PRD PDF = North Star; working PRD = shard fase MVP; track BMad Method
- **Decision:** `docs/WORKSTATION_Super_Duper_PRD.pdf` (v1.0, 17 Sep 2026) tetap menjadi Master PRD / North Star. PRD kerja (`bmad-output/prd.md`) hanya mem-shard **fase MVP** (section 30): Auth/RBAC, organization/project, work items, tickets, GitHub sync, basic releases/deployments, dashboard, audit log. Track: **BMad Method**.
- **Rationale:** Jawaban owner "A". Master PRD sudah berdisiplin (prinsip, non-goals, phasing) — sayang dibuang; scope 50+ stories cocok untuk BMad Method, bukan Quick Flow.
- **Made by:** bmad-prd (diskusi dengan owner)
- **Supersedes:** none

### 2026-09-18 — Target produk: internal produksi (bukan demo saja) → Foundation-first wajib
- **Decision:** Aplikasi diperlakukan sebagai **produk internal yang benar-benar dipakai tim**, bukan sekadar demo. Konsekuensi: build order mengikuti Master PRD section 31 — Foundation (identity, RBAC, audit, core database) dikerjakan lebih dulu; seluruh temuan kritis Deep Scan (DS-01 s.d. DS-07) menjadi input wajib epic pertama.
- **Rationale:** Jawaban owner "B". Deep Scan 18 Sep 2026 menemukan auth bypass, kredensial plaintext, tanpa DB, tanpa version control — tidak dapat diterima untuk penggunaan nyata. PRD Master sendiri melarang secret plaintext (Non-Goals) dan mensyaratkan "security built-in, not bolted-on".
- **Made by:** bmad-prd (diskusi dengan owner), berbasis `docs/DEEP-SCAN-REPORT-2026-09-18.md`
- **Supersedes:** none
