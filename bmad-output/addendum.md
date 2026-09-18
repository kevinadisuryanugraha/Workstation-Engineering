# PRD Addendum — WORKSTATION MVP

**Companion to:** `prd.md`  
**Version:** 1.0-MVP  
**Date:** 18 September 2026  
**Author:** John (BMAD PM Facilitator)  

> **Overflow, working notes, and deferred backlog.**  
> Dokumen ini memarkirkan detail, riset, dan fitur-fitur yang tidak masuk ke dalam scope MVP  
> agar PRD utama tetap ramping, fokus, dan testable.  
> Seluruh keputusan resmi tetap dicatat di `decision-log.md`.

---

## Open Questions (Membutuhkan Keputusan Tim / Arsitek)

| # | Pertanyaan | Owner | Needed By | Status |
|---|------------|-------|-----------|--------|
| **Q1** | **Pemilihan Basis Data & ORM:** Apakah memakai PostgreSQL + Drizzle/Prisma, atau MySQL/SQLite untuk development awal? Prototipe menyebut PostgreSQL/MySQL di `blueprintData.ts`. | System Architect (Winston) | Sebelum Sprint 1 (EPIC-001) | OPEN |
| **Q2** | **Strategi Ingestion Webhook GitHub di Lingkungan Lokal/Office:** Bagaimana webhook GitHub publik mencapai server dev lokal? Opsi: Cloudflare Tunnel, Ngrok, atau webhook relayer. | DevOps / Tech Lead | Sebelum EPIC-005 (Sprint 3) | OPEN |
| **Q3** | **Evaluasi Model & Biaya Fitur AI (Catatan A-01):** Jika fitur AI ingin diaktifkan, model apa yang dipakai (`gemini-2.5-flash` / `gemini-1.5-pro`) dan bagaimana kuota token serta privacy source code perusahaan dijamin? | Product Owner + Tech Lead | Pasca-MVP Review (Sprint 4) | OPEN |
| **Q4** | **Nasib Komponen Demo di UI Frontend:** Apakah tab-tab fitur masa depan (AI Intelligence, Infrastructure Telemetry, Reports) tetap ditampilkan di UI dengan label `[BETA/PREVIEW]` atau disembunyikan sementara agar tidak membingungkan pengguna nyata? | Product Owner / UI Lead | Sprint 2 UI refinement | OPEN |

---

## Catatan Khusus A-01: Posisi & Evaluasi Fitur AI (Codebase Scanner & Translation)

Pada diskusi 18 September 2026, status fitur AI disepakati **belum diputuskan / ditunda ("belum tahu")**. 
Agar tidak hilang, berikut analisis komparatif dan 3 opsi strategi yang disiapkan untuk Product Owner saat siap memutuskan:

### Latar Belakang Masalah
1. Prototipe saat ini memiliki endpoint `/api/ai/scan` dan `/api/ai/translate` menggunakan model `gemini-3.8-flash` (nama model non-standar di SDK).
2. Ketika API key tidak ada, endpoint mengembalikan data temuan keamanan palsu (*fake heuristic fallback*) yang berisiko merusak kepercayaan pengguna terhadap prinsip produk: *"Evidence over assumption"*.
3. Mengirim source code internal ke LLM pihak ketiga memerlukan verifikasi kebijakan privasi data perusahaan (*data governance*).

### 3 Opsi Strategis untuk PO
- **Opsi 1 (Disarankan untuk MVP): AI sebagai Preview / Won't.**  
  Biarkan AI di fase V2 sesuai urutan Master PRD. Fokuskan MVP 100% pada akurasi data GitHub, tiket, dan deployment. Tab AI di UI diberi badge "Coming Soon in V2".
- **Opsi 2: AI On-Demand Ringan (Translate Only).**  
  Hanya aktifkan fitur penerjemahan ringkasan teknis ke bahasa manajemen (Dual-Language Summary) karena risikonya rendah dan tidak memproses seluruh source code. Fitur Codebase Scanner tetap ditunda.
- **Opsi 3: AI Codebase Scanner Penuh dengan Sandboxing.**  
  Jika scanner ingin dijadikan *killer feature* awal, harus dibuat arsitektur runner yang membatasi konteks (diff-only via GitHub PR), menggunakan model resmi berlisensi enterprise, dan melarang fallback fiktif.

---

## Deferred Requirements (Diparkirkan untuk V1, V2, dan Enterprise)

> Fitur-fitur ini diambil dari Master PRD v1.0 (`docs/WORKSTATION_Super_Duper_PRD.pdf`) dan disimpan di sini agar dapat langsung diangkat ke PRD rilis berikutnya tanpa menulis ulang dari nol.

### Fase V1 — Operations & Reporting Expansion
- **DEF-001 (Workstation Linux Server Agent):** Daemon agent ringan untuk server lokal dan Kontabo VPS yang mengirimkan heartbeat terenkripsi, status service (Nginx, MySQL, Redis), dan metrik utilisasi CPU/RAM/Disk secara aman (Master PRD Section 9 & 10).
- **DEF-002 (Dual-Language Management Reporting Engine):** Generator laporan berkala (harian, mingguan, bulanan) otomatis yang mengekstrak aktivitas teknis menjadi ringkasan bahasa eksekutif dalam Bahasa Indonesia (Master PRD Section 17).
- **DEF-003 (SLA & Incident Room Management):** Pengelolaan target waktu tanggap tiket (SLA first-response & resolution), eskalasi otomatis, dan incident room terintegrasi dengan timeline insiden yang *immutable* (Master PRD Section 6.4).
- **DEF-004 (Knowledge Base Generator):** Konversi tiket yang telah terselesaikan (*RESOLVED*) menjadi draf artikel basis pengetahuan secara semi-otomatis untuk mempercepat penyelesaian insiden serupa (Master PRD Section 19).

### Fase V2 — AI Intelligence & Advanced Integrations
- **DEF-005 (AI Codebase Scanner & Finding Triage):** Pemindaian arsitektur, pola keamanan, dan kualitas kode berbasis AI yang menghasilkan finding berstatus PENDING, CONFIRMED, atau FALSE_POSITIVE dengan bukti baris kode konkret (Master PRD Section 11).
- **DEF-006 (Technical Debt Registry):** Pelacakan hutang teknis sistematis dengan estimasi dampak, usia hutang (*aging*), dan target milestone penyelesaian (Master PRD Section 11.4).
- **DEF-007 (Multi-Provider Git Adapters):** Penambahan adapter webhook dan sinkronisasi API untuk GitLab dan Bitbucket (Master PRD Section 7 & 21).
- **DEF-008 (CI/CD Deployment Gates):** Mekanisme pemblokiran rilis otomatis berdasarkan hasil unit test, linting, dan scanning keamanan sebelum tiket dapat dideploy ke Production (Master PRD Section 8).

### Fase Enterprise — Multi-Org Governance
- **DEF-009 (SSO / SCIM Integration):** Integrasi Single Sign-On enterprise via SAML 2.0 / OIDC (Google Workspace, Okta, Azure AD).
- **DEF-010 (High Availability & Disaster Recovery):** Replikasi multi-node basis data dengan failover otomatis dan pengarsipan data dingin (*cold data retention policy*).

---

## Detailed Technical Debt & Refactor Notes (Dari Prototipe ke MVP)

Berikut adalah catatan teknis internal untuk tim pengembang yang diidentifikasi dari Deep Scan:

1. **Refactor God Component `src/App.tsx` (885 Baris):**  
   `App.tsx` saat ini menampung 13 `useState` data mock dan seluruh logic navigasi. Pada Sprint 2, state ini harus dipecah menggunakan state manager modular (React Context atau Zustand) yang terhubung ke REST API backend.
2. **Konsolidasi Matriks RBAC:**  
   Matriks permission saat ini terduplikasi di `server.ts`, `src/lib/rbac.ts`, dan `src/types.ts`. Diperlukan satu generator skema TypeScript yang di-share antara backend dan frontend untuk mencegah *permission drift*.
3. **Pembersihan Library Animasi Duplikat:**  
   `package.json` menyertakan `motion` (^12) dan `animejs` (^4). Disarankan standardisasi ke `motion` untuk konsistensi dan pengurangan ukuran bundle.
4. **Pemisahan Layer Backend:**  
   File `server.ts` (801 baris) harus dipecah ke direktori:
   - `server/routes/`
   - `server/controllers/`
   - `server/services/`
   - `server/middlewares/`
   - `server/db/`

---

## Glossary

| Istilah | Definisi dalam Konteks WORKSTATION |
|---------|-----------------------------------|
| **Evidence** | Fakta konkret yang dapat diverifikasi sistem (Commit SHA, PR ID, log deployment, hasil test, telemetry agent) yang membuktikan suatu progres kerja telah selesai. |
| **Traceability** | Kemampuan menelusuri rantai perjalanan kerja secara utuh: dari Tiket masalah → Work Item perencanaan → Branch kode → Commit → PR review → Release tag → Deployment server. |
| **Work Item** | Unit kerja rekayasa yang dikerjakan developer (Epic, Feature, Task, Bug, Tech Debt). |
| **Ticket (ITSM)** | Laporan masuk atau permintaan layanan dari pengguna, QA, atau sistem pemantau yang perlu ditriase sebelum menjadi work item. |
| **Single Source of Truth** | Prinsip di mana hanya ada satu sistem terpusat yang menjadi rujukan kebenaran status operasional, bukan tersebar di spreadsheet atau ingatan individu. |
| **RBAC** | *Role-Based Access Control* — pembatasan hak akses sistem berdasarkan peran pengguna yang divalidasi ketat di sisi server. |

---

## Fase V2.1 Backlog (Ditunda dari V2 — 2026-09-18, bmad-prd)

Item Master PRD §30 V2 yang sengaja ditunda (COULD) agar gelombang V2 fokus:

| Item | Sumber | Alasan penundaan |
|---|---|---|
| Multi-provider Git adapter (GitLab/Bitbucket) | §21 | GitHub adapter sudah memenuhi kebutuhan saat ini; adapter tambahan butuh integrasi & webhook testing per provider |
| CI/CD adapters | §21 | Belum ada CI/CD eksternal yang dipakai organisasi |
| Advanced deployment gates | §30 | Deployment gate sederhana (DoD + rollback auth) sudah ada |
| Advanced analytics (DORA metrics) | §30 | Butuh data riwayat sprint yang baru tersedia setelah Epic 14 dipakai |
| Technical Debt register penuh | §11.4 | Menunggu finding lifecycle (Epic 16) aktif; aging butuh waktu berjalan |
