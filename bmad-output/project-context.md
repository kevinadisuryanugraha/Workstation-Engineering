# Project Context — WORKSTATION

> The project **constitution**. Dokumen ini dimuat oleh setiap skill BMAD berikutnya  
> (architecture, ux, epics-and-stories, sprint-planning) agar selalu memegang satu sumber kebenaran.  
> Setiap perubahan keputusan besar wajib dicatat di `decision-log.md`.

- **Track:** bmad-method
- **Created:** 2026-09-18
- **Master PRD:** `docs/WORKSTATION_Super_Duper_PRD.pdf` (North Star)
- **Working PRD (MVP):** `bmad-output/prd.md`

---

## Project Goal
Menjadi *single source of truth* dan platform operasional internal yang menghubungkan seluruh siklus hidup rekayasa perangkat lunak: dari Tiket masalah → Work Item perencanaan → Branch kode → Commit → PR review → Release tag → Deployment server → Bukti verifikasi (evidence), menggantikan pelaporan manual dengan data nyata yang dapat ditelusuri.

## Primary Users
1. **Developer (Pengguna Utama MVP):** Membutuhkan satu ruang kerja harian (*My Work*) yang cepat, minim klik, dan otomatis menghubungkan commit/PR GitHub ke tiket dan tugas tanpa perlu salin-tempel tautan manual.
2. **Tech Lead / PM:** Membutuhkan visibilitas status rilis, deployment per environment, dan persetujuan rollback yang aman.
3. **Platform / Security Admin:** Menjamin keandalan hak akses (RBAC), integritas audit trail, dan perlindungan kredensial.

## Scope (MVP Phase — Track: BMad Method)
- **EPIC-001:** Core Platform Foundation, Security & Relational Database (Menutup kerentanan DS-01 s.d. DS-07)
- **EPIC-002:** Work Items & Task Management (Epic, Feature, Task, Bug, Checklist Kriteria Selesai)
- **EPIC-003:** Developer Experience & "My Work" Workspace
- **EPIC-004:** Ticketing & ITSM Issue Resolution Workflow
- **EPIC-005:** Git Intelligence & GitHub Inbound Webhook Receiver
- **EPIC-006:** Release & Deployment Operations (Manual/API + Rollback otorisasi)
- **EPIC-007:** Append-Only Audit Trail & System Governance

> **Catatan 2026-09-19 (Course Correction 4):** Epic 8–16 tereksekusi sebagai gelombang V1/V2 pra-jadwal (lihat decision-log). Epic 17 (UI Clarity & Role-Based Navigation) ditambahkan berdasarkan umpan balik owner soal kepadatan UI. Fitur baru wajib lewat course correction.
>
> **Catatan 2026-09-19 (Course Correction 6):** Epic 19–21 ditambahkan — Export PDF/Excel laporan, Scheduled Delivery (cron + email SMTP + WhatsApp gateway), dan aktivasi Gemini Real AI Scan (menutup keputusan PENDING A-01). Sebagian fitur ini sebelumnya *out of scope* (Epic 10/12) — kini resmi masuk backlog via keputusan owner.
>
> **Catatan 2026-09-21 (Course Correction 7):** Epic 22 (DEF-006) ditambahkan — Technical Debt Registry sesuai Master PRD §11.4: kolom terstruktur origin/evidence/impact pada work_items, endpoint registry dengan aging terkomputasi, dan tab "Technical Debt" AI Intelligence View kini berbasis data nyata. Prinsip tetap: AI tidak boleh menciptakan debt tanpa evidence & approval manusia (konversi 16.3).
>
> **Catatan 2026-09-22 (Course Correction 8):** Epic 23 (Multi-Provider Git — GitLab & Bitbucket) ditambahkan sebagai eksekusi sisa Fase V2 "multi-provider Git" (Master PRD §30; ditunda eksplisit sejak Epic-5): kolom `provider` pada repositories/webhook_deliveries (migration 0017), Repository Registry API idempoten, webhook adapter GitLab/Bitbucket dengan normalisasi payload kanonik (ADR-005 tetap konteks: cepat + idempoten), pemrosesan evidence links regex TIDAK berubah, dan UI badge + form registrasi di panel Git eksisting (nav tidak bertambah — kemenangan CC-4 dijaga).

## Core Constraints
1. **Kerapihan Frontend:** Tetap mempertahankan dan memanfaatkan komponen antarmuka React 19 + Tailwind 4 + Vite yang sudah dibangun di `src/` (tidak menulis ulang dari awal).
2. **Basis Data Wajib Relasional SQL:** Mengharuskan migrasi dari array in-memory ke PostgreSQL 15+ atau MySQL 8.0+ untuk integritas transaksi.
3. **Pemisahan Modular Backend:** Mengurai `server.ts` (801 baris) menjadi struktur modular berlayer (Routes, Controllers, Services, Repositories).
4. **Keamanan Tanpa Kompromi:** Kunci JWT wajib dari environment variable; password wajib bcrypt/argon2; verifikasi permission ketat di sisi server.
5. **Kendali Versi Git:** Seluruh basis kode wajib berada di bawah manajemen Git dengan proteksi branch.

## Non-Goals (Prinsip Master PRD Section 2.2)
- Menggantikan GitHub sebagai Git provider (kami adalah agregator/lapisan intelligence, bukan git host).
- Menganggap commit sebagai bukti otomatis durasi jam kerja karyawan.
- Membiarkan AI mengubah status bisnis atau menutup tiket tanpa validasi manusia.
- Menyimpan secret atau password server secara plaintext.
- Fitur AI Codebase Scanner dan Dual-Language Translation di fase MVP (ditunda ke V1/V2 per keputusan 2026-09-18).
- Daemon server agent Linux untuk Kontabo/lokal di fase MVP (ditunda ke V1).

## Key Stakeholders / Roles
- **Product Owner:** Pengarah prioritas produk & bisnis.
- **John (BMAD PM):** Penjaga konsistensi PRD dan kriteria penerimaan.
- **Winston (BMAD Architect):** Perancang arsitektur sistem, skema basis data, dan ADR.
- **Developer Tim Internal:** Pelaksana implementasi dan pengguna pertama sistem.

## Glossary
- **Evidence:** Fakta konkret yang dapat diverifikasi sistem (Commit SHA, PR ID, log deployment, hasil test, telemetry agent) yang membuktikan progres kerja.
- **Traceability:** Kemampuan menelusuri rantai perjalanan kerja secara utuh: dari Tiket masalah → Work Item → Branch → Commit → PR → Release → Deployment.
- **RBAC:** Kontrol akses berbasis peran (9 peran × 20 permission) yang divalidasi server secara ketat.

---

## Decision Thread
Entri keputusan aktif tersimpan di [`decision-log.md`](./decision-log.md):
1. **2026-09-18:** Posisi fitur AI ditunda keputusannya (Catatan A-01 di `addendum.md`).
2. **2026-09-18:** Pengguna pertama MVP difokuskan pada Developer (*My Work*).
3. **2026-09-18:** Master PRD PDF = North Star; PRD kerja = Shard fase MVP (Track: BMad Method).
4. **2026-09-18:** Target produk = internal produksi nyata (Foundation-first wajib).
