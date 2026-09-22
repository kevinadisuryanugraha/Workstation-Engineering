# Decision Log — WORKSTATION (Engineering Intelligence & Operations)

Log keputusan append-only. Skill BMAD berikutnya (architecture, stories, sprint)
membaca log ini agar keputusan tetap konsisten. Entri terbaru di atas.

---

### 2026-09-22 — Deploy Produksi: Epic 22 (CC-7) Live di https://workstation.zamzami.or.id
- **Decision:** Rilis produksi VPS Kontabo dari `4674394` (era CC-6/WA-1) → `cb58ec5` (Epic 22 tuntas): `git fetch + reset --hard origin/main`, build ulang (bundle baru `index-DBPG5UCi.js`, backup `dist.bak-cc7-*`), migrasi DB `0016_add_debt_fields.sql` ter-apply (kolom `debt_origin`/`debt_impact`/`debt_source_ref` terverifikasi di container `workstation-db`), `systemctl restart workstation`.
- **Verification (semua hijau):** (1) service `workstation` active — RBAC ACTIVE + Report Scheduler ACTIVE (DAILY/WEEKLY/MONTHLY); (2) `/api/health` lokal & publik OK (`rbacSecurity: ENFORCED_HMAC_SHA256`, `hasGeminiKey: true`); (3) endpoint baru `GET /api/v1/work-items/debts` publik → 401 tanpa token (auth-gated benar); (4) end-to-end dengan token Super Admin → 200 + data nyata (legacy TECH_DEBT items tampil dengan aging terkomputasi — WRK-105 aging 3 hari → FRESH, math floor benar; item pra-22.1 jujur `debtOrigin: null`).
- **Catatan operasional:** WORKSTATION berjalan di port **3020** (bukan 3000 — port itu aplikasi aaPanel lain); `npm install` di VPS mengalami ERESOLVE (tanpa dampak — Epic 22 tidak menambah dependency, node_modules eksisting lengkap).
- **Impact:** produksi kini setara `main` — Fase V2 (DEF-005 AI + DEF-006 Debt Registry) hidup di produksi; tidak ada perubahan kode pasca-verify.
- **In-progress stories affected:** none.
- **Made by:** deploy loop (owner menyetujui “lanjutkan” pasca-konfirmasi commit)
- **Supersedes:** none (deploy pertama pasca-CC-7)

---

### 2026-09-21 — Epic 22 (CC-7) Tuntas: DEF-006 Debt Registry selesai — Fase V2 tuntas penuh
- **Decision:** Seluruh 2 story Epic 22 dieksekusi, diuji, dan di-merge ke `main` via worktree loop: **22.1** Debt Registry API (migration `0016_add_debt_fields.sql`: `debt_origin`/`debt_impact`/`debt_source_ref`; endpoint `GET /api/v1/work-items/debts` dengan aging server-side + bucket FRESH/AGING/STALE/CRITICAL + agregat + filter; konversi rekomendasi AI kini mengisi field terstruktur dengan `debtSourceRef="scan/rec"` wajib — prinsip §11.4 "AI tidak boleh menciptakan debt tanpa evidence" ditegakkan; mapper DTO jujur) dan **22.2** tab Technical Debt di AI Intelligence View kini hidup dengan data nyata (strip agregat + filter status/origin/impact + pencarian + honest loading/error/empty; mode demo tetap mock legacy).
- **Rationale:** Menutup DEF-006 — satu-satunya item Fase V2 yang tersisa; debt kini memiliki origin, evidence, impact, effort, owner, target milestone, status, dan aging persis Master PRD §11.4. Nav TIDAK bertambah (kemenangan CC-4 dijaga — debt memang bagian §11 AI Intelligence).
- **Impact:** total 61 story (22 epic) semua DONE — 100%; test suite 331 → 371 (+40); migrasi DB 0016; owner/target milestone/effort memakai kolom work_items eksisting (assigneeId/milestoneId/estimateHours) tanpa duplikasi.
- **In-progress stories affected:** none.
- **Made by:** bmad-epic-pipeline-worktree (dev loop) → review → gate → finalize
- **Supersedes:** none (penutup CC-7)

---

### 2026-09-21 — Course Correction 7: Tambah Epic 22 — Technical Debt Registry (DEF-006)
- **Decision:** Owner memilih Opsi A — mengeksekusi sisa Fase V2 yang disetujui: **DEF-006 Technical Debt Registry** (Master PRD §11.4), satu-satunya item V2 yang belum tereksekusi (terverifikasi tidak pernah dibahas di decision-log/epics/PRD). **Epic 22** (2 story): **22.1** Debt Registry API — kolom terstruktur `debt_origin`/`debt_impact`/`debt_source_ref` pada work_items (migration 0016), endpoint `GET /api/v1/work-items/debts` (aging terkomputasi server + bucket FRESH/AGING/STALE/CRITICAL + agregat + filter), pengayaan konversi rekomendasi AI (16.3) agar mengisi field terstruktur; **22.2** hidupkan tab "Technical Debt" AIIntelligenceView dengan data nyata (tab eksisting yang selalu kosong di boot real — komentar 18.5), hook `useDebtRegistry`, hydration via mapper kontrak.
- **Rationale:** Master PRD §11.4 mensyaratkan debt item memiliki origin, evidence, impact, effort, owner, target milestone, status, dan aging — saat ini semua hanya teks bebas di deskripsi; prinsip *"AI tidak boleh menciptakan debt sebagai fakta tanpa evidence"* ditegakkan via `debt_source_ref` wajib pada konversi human-approved. UI ditempatkan di tab AI eksisting (struktur Master PRD §11) — nav TIDAK bertambah, menjaga kemenangan CC-4. Alternatif yang ditolak: nav/view terpisah (menambah kepadatan yang sudah diperbaiki CC-4), tabel debt terpisah (duplikatif — owner/milestone/effort sudah ada di work_items).
- **Impact:** epics.md (+Epic 22, total 61 story: done 59, remaining 2, 97%); stories/ (+2 file ready-for-dev); sprint-status.yaml (+epic-22 in-progress, parallel_set 26–27 sequential — shared `work-items` module, `App.tsx`, `AIIntelligenceView`); project-context.md (catatan CC-7).
- **In-progress stories affected:** none (59 story lama tetap done).
- **Made by:** bmad-correct-course → bmad-epics-and-stories → bmad-sprint-planning
- **Supersedes:** none (additive — melengkapi eksekusi Fase V2 yang dibuka keputusan 2026-09-18)

---

### 2026-09-19 — Course Correction 6: Ekspansi Distribusi Laporan & AI Real (Epic 19-21)
- **Decision:** Owner menyetujui 3 fitur yang sebelumnya eksplisit *out of scope* untuk masuk backlog: **(1) Epic 19** Report Export PDF & Excel (endpoint server `pdfkit`/`exceljs` + tombol UI), **(2) Epic 20** Scheduled Delivery — cron produksi idempoten (`node-cron`, default OFF via env), pengiriman email SMTP (`nodemailer`) & WhatsApp gateway HTTP generik dengan tabel append-only `report_deliveries`, **(3) Epic 21** Aktivasi Gemini Real AI Scan — path analisis kode nyata via `@google/genai` dengan mode `REAL_GEMINI` + fallback demo statis yang tetap terlabel jujur. Total **7 story baru** (19.1, 19.2, 20.1, 20.2, 20.3, 21.1, 21.2), waves 19-25 sequential (shared `server.ts`/`App.tsx`).
- **Rationale:** Laporan terarsip (Epic 12) belum menjangkau distribusi di luar aplikasi; generate masih manual; keputusan PENDING (A-01, 2026-09-18) mengenai AI real kini diputuskan AKTIF dengan kunci Gemini. Prinsip tetap: AI adalah analis bukan otoritas (lifecycle findings 16.2 tidak berubah).
- **Impact:** epics.md (+3 epic, total 59 story); stories/ (+7 file ready-for-dev); sprint-status.yaml (epic 19-21 in-progress, parallel_set 19-25); project-context.md (catatan CC-6); deps baru: pdfkit, exceljs, node-cron, nodemailer.
- **In-progress stories affected:** none (seluruh 52 story lama tetap done).
- **Made by:** bmad-correct-course → bmad-epics-and-stories → bmad-sprint-planning
- **Supersedes:** menutup keputusan PENDING A-01 (2026-09-18) untuk aspek AI scan real

---

### 2026-09-19 — HOTFIX Produksi #2–#4: Stale SW, CSP Fonts, Empty-Selection Guards, No-Cache
- **Decision:** Rangkaian tiga hotfix lanjutan pasca-deploy Epic 17/18 atas laporan user: **#2** service worker workbox mem-precache bundle lama → `skipWaiting`+`clientsClaim` eksplisit; **#3** CSP `connect-src` memblokir fetch font oleh SW → domain fonts diizinkan + runtimeCaching fonts dihapus dari SW (font dimuat langsung halaman); **#4** crash `reading 'author'` di KnowledgeBaseView — `useState(articles[0])` menghasilkan undefined saat boot real → guard render + fallback jujur (pola sama dicegah di InfrastructureView), plus `Cache-Control: no-cache` untuk `/sw.js` & `index.html`.
- **Rationale:** Kontrak deploy WORKSTATION baru: (1) setiap array yang mungkin kosong TIDAK boleh jadi initial state yang di-dereference tanpa guard; (2) `sw.js`+`index.html` wajib no-cache; (3) SW tidak meng-intercept resource lintas-origin yang dibatasi CSP-nya sendiri.
- **Impact:** security.ts, vite.config.ts, server.ts, KnowledgeBaseView, InfrastructureView; test 234/234 hijau; produksi di `0f3ca99`, bundle `index-wHXVDmt1.js` terverifikasi memuat semua guard.
- **In-progress stories affected:** none.
- **Made by:** bmad-epic-pipeline-worktree (hotfix loop ×3)
- **Supersedes:** none (lanjutan HOTFIX Produksi #1 DTO contract mappers)

---

### 2026-09-19 — HOTFIX Produksi: DTO→UI Contract Mappers + Gate Permission Hook
- **Decision:** Hotfix pasca-deploy Blok 14 atas laporan user: (1) crash `TypeError: reading 'name'` di WorkItemsView — API work-items/tickets mengirim baris DB mentah, mapper kontrak UI terlewat; (2) 403 berulang `audit-logs` — hook 18.4 menembak tanpa cek permission. Perbaikan: `src/lib/contractMappers.ts` (mapWorkItemDto/mapTicketDto dengan placeholder jujur), gate `PERM_AUDIT_LOGS_VIEW` & `PERM_AI_SCAN_TRIGGER` pada hook terkait, 10 test baru (234/234 hijau), redeploy & verifikasi publik.
- **Rationale:** Tiping TypeScript tidak menjamin bentuk runtime — setiap hydrasi API wajib lewat mapper eksplisit; endpoint ber-permission tidak boleh di-fetch untuk role tanpa permission.
- **Impact:** +1 modul mapper; App.tsx (hydration + gating); test 224→234; deploy ulang produksi di `504c4e3` (bundle `index-HblDWw4b.js`).
- **In-progress stories affected:** none.
- **Made by:** bmad-epic-pipeline-worktree (hotfix loop)
- **Supersedes:** none (perbaikan atas efek samping CC-5)

---

### 2026-09-19 — Epic 18 (CC-5) Tuntas: Client API Wiring 6/6 selesai
- **Decision:** Seluruh 6 story Epic 18 dieksekusi, diuji, dan di-merge ke `main` via worktree loop: **18.1** Git entities (endpoint read baru `GET /api/v1/git/commits` & `/pull-requests` — additive, ingest webhook utuh + hydration client), **18.2** Deployments, **18.3** KB, **18.4** Audit ledger (adapter DTO→event feed + tipe `SYSTEM_AUDIT`), **18.5** AI findings/recommendations, **18.6** Global Search modal (debounced, jalur real/demo ganda).
- **Rationale:** Menuntaskan CC-5 — seluruh view kini menampilkan data nyata di boot produksi; honest-empty notice hilang otomatis saat data mengalir; mock hanya hidup di mode demo (VITE_DEMO_MODE).
- **Impact:** +5 hook client (useGitEntities, useDeployments, useKbArticles, useAuditLogs, useAiIntel) + useGlobalSearch; +1 endpoint server (git entities read, 2 route); test suite 44→45 file, 195→224 test hijau; badge statis palsu "4 Commits" dihapus; tracker 52/52 story done (18/18 epic).
- **In-progress stories affected:** none.
- **Made by:** bmad-epic-pipeline-worktree (dev loop) → review → gate → finalize
- **Supersedes:** none

---

### 2026-09-19 — Course Correction 5: Tambah Epic 18 — Client API Wiring (Honest Data Everywhere)
- **Decision:** Menambahkan Epic 18 (6 story, wave 18) hasil temuan Dev Agent Record 17.2 / BLOK 12.6 Deep Scan Report: 6 domain punya data/API nyata tapi UI belum terhubung — **18.1** Git entities (perlu read endpoint server kecil: GET /api/v1/git/commits & /pull-requests; data sudah terkumpul via webhook 5.x), **18.2** Deployments, **18.3** KB, **18.4** Audit ledger (adapter DTO→event feed), **18.5** AI findings/recommendations, **18.6** Global Search modal (debounced query). Non-goal yang ditunda eksplisit: persistensi mutasi lokal ke API dan pengayaan field proyek (owner/techLead/currentSprint/latestRelease) — kandidat CC berikutnya.
- **Rationale:** CC-4 berhasil mengeluarkan mock dari boot default (honest-empty state), tetapi 6 layar masih kosong di produksi. Agar prinsip "data nyata secara default" benar-benar tuntas, jalur baca ke API harus di_wire_ sekarang — datanya sudah ada, yang kurang hanya pipa client-nya (kecuali Git yang perlu 2 endpoint list kecil).
- **Impact:** epics.md (+Epic 18, total 52 story, delivery tracking 46/52 = 88%; status Epic 17 dikoreksi menjadi done 3/3); stories/ (+6 file ready-for-dev); sprint-status.yaml (+epic-18, parallel_set 18, sequential shared App.tsx).
- **In-progress stories affected:** none (semua story Epic 17 sudah done sebelum CC-5 dibuka).
- **Made by:** bmad-correct-course
- **Supersedes:** none (additive terhadap CC-4)

---

### 2026-09-19 — Epic 17 (CC-4) Tuntas: 17.1/17.2/17.3 selesai dieksekusi
- **Decision:** Seluruh 3 story Epic 17 dieksekusi, diuji, dan di-merge ke `main` via worktree loop (`bmad_worktree` prepare→finalize): **17.1** registry navigasi ber-role + 3 grup; **17.2** demo gating — boot default kini mengonsumsi API nyata (work items, tickets, incidents, server metrics, projects) via React Query, mock hanya aktif lewat `VITE_DEMO_MODE=1` + banner label SEC-05, empty state jujur di semua view; **17.3** Blueprint keluar dari produk (nav 15→14), konten diarsip verbatim di `docs/BLUEPRINT-ARCHIVE-2026-09.md` dengan disclaimer.
- **Rationale:** Menuntaskan Course Correction 4 — menghilangkan kepadatan semu data mock dan dokumen arsitektur internal yang menyesatkan dari pengalaman harian produksi.
- **Impact:** `src/mockData.ts` (seksi gating, tanpa kehilangan data); `src/App.tsx` (blok sumber data + honest empty states + banner demo); `src/config/navigation.ts` (ActiveTab 14 anggota); RetroDesktopShell/OverviewView (navigasi blueprint dihapus); BlueprintView.tsx & blueprintData.ts dihapus dari src/; test suite 39 file / 195 test hijau; lint tsc strict bersih; build produksi sukses. Temuan lanjutan tercatat di Dev Agent Record 17.2 (domain tanpa hook client: AI, Git, Deployments, KB, Audit, GlobalSearch modal — kandid course correction berikutnya).
- **In-progress stories affected:** none.
- **Made by:** bmad-epic-pipeline-worktree (dev loop) → review → gate → finalize
- **Supersedes:** none

---

### 2026-09-19 — Course Correction 4: Epic 17 UI Clarity & Role-Based Navigation + disiplin scope pasca-MVP
- **Decision:** Berdasarkan umpan balik owner ("tampilan padat & membingungkan — apakah over-engineering?") dan diagnosis meja diskusi (backend TIDAK over-engineered; masalahnya over-EXPOSURE: 15 menu rata tanpa filter role + data demo di semua layar), disepakati:
  - (A+B) **Navigasi berbasis role + pengelompokan 3 seksi** (Kerjaanku / Operations / Governance) memanfaatkan `PERM_*` dan `SERVER_ROLE_PERMISSIONS` yang sudah ada — story 17.1.
  - (C) **Strategi exit data demo**: `mockData.ts` digating di belakang flag mode demo; default boot memakai data API nyata — story 17.2.
  - (D) **Blueprint keluar dari permukaan produk**: menu/view dihapus, konten diarsipkan ke `docs/` dengan disclaimer arsitektur aktual (Express+Drizzle, bukan Laravel) — story 17.3.
  - (E) **Disiplin pasca-MVP**: Epic 8–16 dicatat sebagai eksekusi V1/V2 pra-jadwal (sudah done — tidak dibatalkan); status PRD naik ke APPROVED; fitur baru wajib lewat course correction.
- **Rationale:** Master PRD menetapkan Developer sebagai pengguna pertama, namun UI melayani 9 role sekaligus tanpa progressive disclosure. RBAC server-side sudah matang — memakainya untuk navigasi adalah perbaikan termurah dengan dampak terbesar. Alternatif yang ditolak: penghapusan fitur (fitur sudah teruji & berguna), redesign UX penuh (ditunda ke V1 UX planning bila perlu).
- **Impact:** Epic 17 DITAMBAHKAN di epics.md + sprint-status.yaml (story 17.1, 17.2, 17.3 — status ready-for-dev, wave 15–17 sequential karena shared scope `App.tsx`/`Sidebar.tsx`). Tidak ada story lama yang dibatalkan atau di-re-scope. Delivery Tracking epics.md dikoreksi dari 33/35 (stale) menjadi 43/43 done sebelum Epic 17. PRD status DRAFT → APPROVED.
- **In-progress stories affected:** none.
- **Made by:** bmad-correct-course (party-mode panel: John/Winston/Mary/Sally/Taylor; owner approve "gas")
- **Supersedes:** none — melengkapi konteks entri 18 Sep: A-01 (fitur AI) sudah RESOLVED DISetujUI via entri "Fase V2 Tuntas" di bawah.

---

### 2026-09-18 — Fase V2 Tuntas: Epic 14/15/16 selesai dieksekusi (Wave 12-14)
- **Decision:** Seluruh 8 story Fase V2 dieksekusi & diuji: **Wave 12** (Epic 14 — sprints/milestones + aturan satu-ACTIVE + sprint board explainable + SprintPanel), **Wave 13** (Epic 15 — KB versioning append-only + draft dari tiket resolved + global search 4 entitas), **Wave 14** (Epic 16 — snapshot scan persisten, finding lifecycle tervalidasi manusia, konversi rekomendasi→work item idempoten (E2E: WRK-6), terjemahan laporan graceful 503).
- **Rationale:** Eksekusi penuh Fase V2 sesuai Master PRD §11/§30; keputusan AI DISETUJUI dengan prinsip "AI as analyst, not authority".
- **Impact:** Total 43/43 story done (100%); test suite 144 → 178; migrasi 0011-0014.
- **In-progress stories affected:** none.
- **Made by:** bmad-prd → bmad-correct-course → bmad-epics-and-stories → dev execution loop
- **Supersedes:** none

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
