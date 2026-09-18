# Decision Log — WORKSTATION (Engineering Intelligence & Operations)

Log keputusan append-only. Skill BMAD berikutnya (architecture, stories, sprint)
membaca log ini agar keputusan tetap konsisten. Entri terbaru di atas.

---

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
