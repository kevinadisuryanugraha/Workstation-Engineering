# Product Requirements Document (PRD) — WORKSTATION MVP

**Project Name:** WORKSTATION — Engineering Intelligence & Project Operations Platform  
**Version:** 1.0-MVP (derived from Master PRD v1.0, 17 Sep 2026)  
**Date:** 18 September 2026  
**Author:** John (BMAD PM Facilitator)  
**Status:** DRAFT (Ready for Review)  
**Track:** BMad Method  

> **Source of truth for WHAT and WHY for the MVP phase.**  
> Master PRD: `docs/WORKSTATION_Super_Duper_PRD.pdf` (North Star).  
> Brownfield scan: `bmad-output/project-documentation.md`.  
> Triage report: `docs/DEEP-SCAN-REPORT-2026-09-18.md`.  
> Decisions: `bmad-output/decision-log.md`. Overflow & deferred items: `bmad-output/addendum.md`.

---

## Executive Summary

**Problem Statement:**  
Aktivitas software engineering di tim internal saat ini terfragmentasi di berbagai tempat (tiket, repo GitHub, log server, chat, dan laporan manual). Tidak ada satu sumber informasi yang dapat menghubungkan *tiket* → *work item* → *branch/commit/PR* → *release* → *deployment* → *bukti verifikasi (evidence)* secara dapat ditelusuri (*traceable*). Akibatnya, progres sering diklaim tanpa bukti, developer membuang waktu memperbarui banyak alat berbeda, dan tech lead kesulitan mengetahui status nyata rilis.

**Proposed Solution:**  
Membangun MVP platform **WORKSTATION** yang berfungsi sebagai *single source of truth* untuk tim engineering internal, dengan fokus melayani **Developer** terlebih dahulu melalui ruang kerja terpadu (*My Work* workspace, ticket triage cepat, sinkronisasi otomatis aktivitas GitHub, pelacakan rilis/deployment, dan fondasi data permanen dengan keamanan berbasis peran/RBAC yang nyata).

**Business Value:**  
1. Menghilangkan pelaporan manual dan estimasi progres fiktif dengan perhitungan berbasis *evidence* nyata (commit/PR/deployment).  
2. Mengurangi waktu pergantian konteks (*context switching*) developer hingga 40% dengan menyatukan tiket, tugas, dan link repo ke satu layar.  
3. Memberikan audit trail lengkap untuk setiap perubahan status, deployment, dan hak akses demi akuntabilitas tim.

**Target Outcome:**  
Tim internal mengadopsi WORKSTATION untuk operasional harian: 100% tiket aktif terhubung ke work item dan PR GitHub; tidak ada rilis tanpa catatan deployment yang jelas; seluruh data tersimpan permanen di basis data dengan pengamanan RBAC yang tidak bisa dibypass.

---

## Project Overview

### Background
WORKSTATION telah memiliki prototipe antarmuka yang sangat matang (16 tampilan, PWA lengkap, shell bergaya retro 90-an), namun hasil pemeriksaan menyeluruh (Deep Scan 18 Sep 2026) menunjukkan lapisan bawahnya belum siap produksi:
- Tidak memiliki basis data permanen (semua data hilang saat restart).
- Lapisan otentikasi dapat dilewati (request tanpa token dianggap Super Admin, token dapat dipalsukan, kredensial plaintext tertanam di kode).
- Belum berada di bawah kendali versi (*version control* / git).
- Belum ada pengujian otomatis (*zero tests*).

Sesuai keputusan pemilik produk (2026-09-18), project ini adalah **produk internal nyata**, bukan sekadar demo. Maka strategi MVP adalah **Foundation-first**: membereskan fondasi data, keamanan, dan alur kerja developer utama sebelum menambah fitur analitik/AI lanjutan.

### Current State → Desired State
- **Current State:** Prototipe frontend kaya fitur dengan data tiruan (*mock data*); backend Express satu file tanpa basis data; otentikasi rentan bypass; belum ada sinkronisasi nyata dengan GitHub; tidak ada riwayat git.
- **Desired State (MVP):** Aplikasi produksi internal yang stabil, terhubung ke basis data permanen (PostgreSQL/MySQL), otentikasi JWT + bcrypt yang aman, sinkronisasi webhook GitHub dua arah untuk commit/PR, ruang kerja developer yang cepat dan responsif, serta log audit yang tidak dapat dimanipulasi.

### Stakeholders
| Stakeholder | Role | Interest | Influence |
|-------------|------|----------|-----------|
| Developer Tim Internal | Primary User | Ruang kerja cepat, minim klik, tiket & PR sinkron otomatis, minim beban laporan manual | High |
| Tech Lead | Primary User / Approver | Visibilitas branch/PR/deployment, approval gate, kepatuhan arsitektur | High |
| Project Manager | Secondary User | Tracking sprint, status tiket, kepatuhan due date & SLA | Medium |
| Platform Admin / SecOps | Operator / Governance | Keamanan RBAC, kredensial terlindungi, audit log lengkap, uptime | High |
| Management / VP Eng | Sponsor | Akurasi progres berbasis bukti, kesiapan V1 reporting | High |

---

## Goals and Objectives

### Business Goals
1. **BG-1 (Adopsi Tim):** Menjadi ruang kerja utama harian minimal 1 tim engineering (100% tiket harian tercatat di WORKSTATION dalam 4 minggu pasca-rilis MVP).
2. **BG-2 (Traceability 100%):** Setiap rilis yang dilakukan tim memiliki tautan bukti konkret (*commit SHA* + *PR ID* + *deployment log*).
3. **BG-3 (Zero Security Compromise):** Menutup 100% temuan keamanan kritis Deep Scan (DS-01 s.d. DS-07) sebelum sistem dapat diakses jaringan bersama.

### User Goals (Fokus: Developer & Tech Lead)
1. **UG-1 (Developer):** Melihat seluruh tugas, tiket yang di-assign, PR yang perlu di-review, dan status build dalam 1 layar (*My Work*) tanpa membuka 4 tab browser berbeda.
2. **UG-2 (Developer):** Membuat commit/PR yang otomatis memperbarui status tiket/work item hanya dengan mencantumkan ID tiket (misal: `[TICK-102] Fix query timeout`).
3. **UG-3 (Tech Lead):** Melihat riwayat deployment per environment (Staging, Production) lengkap dengan siapa yang melakukan, versi commit mana, dan tombol catat rollback jika terjadi kendala.

---

## Functional Requirements

> Format: `FR-###: <PRIORITY> — <capability>`. Prioritas MoSCoW. Seluruh FR wajib memiliki Acceptance Criteria (AC) yang dapat diuji.

### Kategori 1: Fondasi Keamanan, Organisasi, dan Pengguna (Epic 1)

#### FR-001: MUST — Otentikasi Pengguna & Manajemen Sesi Aman
**Description:** Sistem harus menyediakan mekanisme login berbasis email & password dengan pengacakan kata sandi standar industri (bcrypt/argon2id), verifikasi tanda tangan token kriptografis tanpa celah bypass, dan perlindungan terhadap brute force.
**Acceptance Criteria:**
- Sistem menolak sembarang request ke API terproteksi yang tidak menyertakan Bearer token valid (mengembalikan HTTP 401 Unauthorized, bukan fallback ke admin).
- Password disimpan dalam bentuk hash dengan salt (menggunakan bcrypt cost factor minimal 12).
- Tidak ada pengecualian password hardcoded (seperti `"admin123"`) di lingkungan mana pun.
- Tidak ada daftar akun atau petunjuk kata sandi yang dikirimkan ke bundle JavaScript browser publik.
- Kunci penandatanganan token (`JWT_SECRET`) wajib diambil dari environment variable; aplikasi gagal start (*fail-fast*) jika kunci tersebut tidak diatur.
- Token kadaluwarsa ditolak secara otomatis dan request dibatalkan.
**Related Epic:** EPIC-001 (Security & Foundation)

#### FR-002: MUST — Kontrol Akses Berbasis Peran (RBAC) pada Server
**Description:** Server harus memvalidasi permission untuk setiap aksi sensitif berdasarkan matriks peran yang ketat, tanpa mempercayai data permission yang dikirim dari sisi klien.
**Acceptance Criteria:**
- Server memuat matriks hak akses dari satu sumber kebenaran (*single source of truth* di backend).
- Pengguna hanya dapat melakukan aksi yang diizinkan oleh perannya (contoh: Developer tidak dapat mengeksekusi rollback deployment; Viewer tidak dapat mengubah tiket).
- Usaha akses tanpa hak ditolak dengan HTTP 403 Forbidden dan dicatat dalam audit log.
- Pemalsuan klaim peran di dalam token klien ditolak karena kegagalan verifikasi HMAC signature.
**Related Epic:** EPIC-001 (Security & Foundation)

#### FR-003: MUST — Model Entitas Organisasi & Project
**Description:** Sistem harus mengelola hierarki data: Organisasi → Tim → Pengguna → Project, di mana setiap project memiliki metadata, status siklus hidup, dan daftar anggota dengan peran spesifik di project tersebut.
**Acceptance Criteria:**
- Admin dapat membuat project baru dengan metadata: nama, project key (kode 3-5 huruf unik, misal `WRK`), status (PLANNING, ACTIVE, ON_HOLD, AT_RISK, COMPLETED, ARCHIVED), target selesai, dan deskripsi.
- Pengguna hanya dapat melihat dan mengakses project di mana mereka menjadi anggota, kecuali peran Super Admin / Org Admin.
- Project key digunakan sebagai awalan otomatis untuk ID work item dan tiket (contoh: `WRK-101`).
**Related Epic:** EPIC-001 (Security & Foundation)

---

### Kategori 2: Work Management & Ruang Kerja Developer (Epic 2 & 3)

#### FR-004: MUST — Work Item Lifecycle & Manajemen Tugas
**Description:** Sistem harus menyediakan pengelolaan item pekerjaan dengan tipe (Epic, Feature, Task, Subtask, Bug, Tech Debt) beserta status siklus hidup yang jelas dan kriteria penerimaan (*Acceptance Criteria*).
**Acceptance Criteria:**
- Pengguna dapat membuat work item dengan field: Judul, Tipe, Deskripsi, Assignee, Priority (P0, P1, P2, P3), Status, Estimasi, dan Acceptance Criteria (checklist).
- Transisi status mendukung minimal: BACKLOG → READY → IN_PROGRESS → IN_REVIEW → READY_FOR_TEST → DONE / CANCELLED.
- Setiap work item dapat memiliki checklist kriteria penerimaan; item tidak dapat dipindahkan ke DONE jika ada acceptance criteria wajib yang belum tercentang, kecuali di-override oleh Tech Lead/PM dengan alasan tercatat.
- Seluruh riwayat perubahan status, assignee, dan kriteria dicatat dengan timestamp dan aktor.
**Related Epic:** EPIC-002 (Work & Task Management)

#### FR-005: MUST — Developer "My Work" Workspace
**Description:** Sistem harus menyediakan tampilan terfokus bagi developer yang merangkum seluruh tanggung jawab aktifnya dalam satu layar tanpa distraksi.
**Acceptance Criteria:**
- Halaman "My Work" menampilkan: (1) Work item yang di-assign ke pengguna dengan status aktif; (2) Tiket yang ditugaskan; (3) Daftar PR yang menunggu review dari pengguna; (4) Riwayat aktivitas terbaru pengguna.
- Tersedia aksi cepat untuk mengubah status tugas (misal: "Mulai Kerjakan", "Ajukan Review") langsung dari daftar tanpa membuka halaman detail penuh.
- Tampilan mendukung penyaringan berdasarkan project dan prioritas.
**Related Epic:** EPIC-003 (Developer Experience & Workspace)

#### FR-006: SHOULD — Dependency Tracking Antar Work Item
**Description:** Sistem harus mencatat ketergantungan antar work item (item A memblokir item B) dan memperingatkan pengguna jika terjadi circular dependency.
**Acceptance Criteria:**
- Pengguna dapat menghubungkan relasi "Blocked By" dan "Blocks" antar work item.
- Sistem menolak pembuatan relasi yang mengakibatkan perputaran ketergantungan (circular loop: A memblokir B, B memblokir A) dengan pesan kesalahan yang jelas.
- Work item yang memiliki blocker aktif ditandai secara visual di daftar tugas.
**Related Epic:** EPIC-002 (Work & Task Management)

---

### Kategori 3: Ticketing & ITSM (Epic 4)

#### FR-007: MUST — Tiket Masuk, Workflow, dan Triage
**Description:** Sistem harus menyediakan modul ticketing untuk mencatat insiden, bug, permintaan fitur, dan isu teknis dengan workflow status yang jelas dan pemisahan antara Severity dan Priority.
**Acceptance Criteria:**
- Pengguna dapat membuat tiket dengan tipe: BUG, FEATURE_REQUEST, TECHNICAL_ISSUE, MAINTENANCE, SECURITY, PERFORMANCE, INCIDENT.
- Severity (Critical, High, Medium, Low — dampak masalah) dan Priority (P0, P1, P2, P3 — urutan penanganan) disimpan terpisah dan dapat diatur independen.
- Alur status tiket: NEW → TRIAGED → ASSIGNED → IN_PROGRESS → IN_REVIEW → READY_FOR_TEST → RESOLVED → CLOSED.
- Tech Lead / PM / Support dapat melakukan triase cepat: menetapkan assignee, priority, dan mengaitkan tiket ke work item terkait.
**Related Epic:** EPIC-004 (Ticketing & Issue Resolution)

#### FR-008: MUST — Tautan Dua Arah Tiket ↔ Work Item ↔ Bukti
**Description:** Sistem harus mengizinkan satu atau beberapa tiket dihubungkan ke work item pengembangan, commit GitHub, atau catatan deployment sebagai bukti penyelesaian.
**Acceptance Criteria:**
- Dari halaman tiket, pengguna dapat membuat work item baru atau memilih work item yang sudah ada sebagai referensi penyelesaian.
- Ketika commit atau PR terkait dimerge, tiket menampilkan tautan langsung ke commit/PR tersebut.
- Tiket tidak dapat ditutup (*CLOSED*) sebelum ada referensi resolusi (penjelasan resolusi, tautan PR/commit, atau alasan penolakan).
**Related Epic:** EPIC-004 (Ticketing & Issue Resolution)

#### FR-009: SHOULD — Komentar, Lampiran, dan Timeline Tiket
**Description:** Setiap tiket harus memiliki riwayat percakapan (komentar) dan catatan perubahan status yang berurutan secara kronologis.
**Acceptance Criteria:**
- Anggota tim dapat menambahkan komentar berformat teks/markdown pada tiket.
- Sistem mencatat secara otomatis setiap perubahan field (status, assignee, severity) ke dalam timeline tiket.
- Timeline bersifat urut waktu (*append-only chronological log*).
**Related Epic:** EPIC-004 (Ticketing & Issue Resolution)

---

### Kategori 4: Git & GitHub Intelligence (Epic 5)

#### FR-010: MUST — Registrasi Repository & Webhook Receiver GitHub
**Description:** Sistem harus mampu mendaftarkan repository GitHub ke dalam project WORKSTATION dan menerima webhook resmi dari GitHub untuk menangkap event push, commit, branch, dan pull request secara real-time.
**Acceptance Criteria:**
- Admin/Tech Lead dapat mendaftarkan repo (URL, default branch) dan menghasilkan secret webhook unik untuk repo tersebut.
- Endpoint webhook `/api/webhooks/github` memverifikasi signature payload (`X-Hub-Signature-256`) menggunakan secret terdaftar; request dengan signature tidak cocok ditolak dengan HTTP 401.
- Ingestion webhook bersifat idempoten: pengiriman event berulang (dengan Delivery ID yang sama) tidak menghasilkan data ganda di basis data.
**Related Epic:** EPIC-005 (Git Intelligence & Webhook Engine)

#### FR-011: MUST — Pelacakan Commit, PR, dan Auto-Link ke Work Item / Tiket
**Description:** Sistem harus membedah pesan commit dan judul/deskripsi PR untuk menemukan kode tiket/work item (misal `WRK-101`), lalu mengaitkan artefak Git tersebut secara otomatis sebagai *evidence*.
**Acceptance Criteria:**
- Sistem mengekstrak pola regex `[A-Z]{2,6}-\d+` dari commit message dan branch name.
- Jika ditemukan ID work item atau tiket yang valid, record commit (SHA, pesan, author, timestamp, link) otomatis terhubung ke entitas tersebut.
- Pada halaman detail work item / tiket, muncul bagian "Git Evidence" yang menampilkan seluruh commit dan PR terkait secara dinamis.
- Pembaruan status PR (OPENED, REVIEWED, MERGED, CLOSED) tercatat dan mengupdate tampilan tanpa delay berlebih.
**Related Epic:** EPIC-005 (Git Intelligence & Webhook Engine)

---

### Kategori 5: Release & Deployment Tracking (Epic 6)

#### FR-012: MUST — Pencatatan Release & Deployment Manual/Webhook
**Description:** Sistem harus mencatat setiap rilis versi dan deployment ke environment tertentu (DEV, STAGING, PRODUCTION) lengkap dengan aktor, waktu, commit SHA, dan status keberhasilan.
**Acceptance Criteria:**
- Pengguna dengan izin `PERM_DEPLOYMENT_EXECUTE` dapat mencatat deployment baru (memilih versi release, environment target, server target, commit SHA, status: SUCCESS / FAILED).
- Tersedia endpoint API terproteksi agar skrip CI/CD (GitHub Actions / curl) dapat melaporkan deployment secara otomatis di akhir pipeline.
- Catatan deployment wajib menjawab: *apa yang dideploy*, *commit mana*, *oleh siapa/proses apa*, *kapan*, *ke mana*, dan *apa statusnya*.
**Related Epic:** EPIC-006 (Release & Deployment Operations)

#### FR-013: MUST — Riwayat Rollback & Tombol Otorisasi Rollback
**Description:** Sistem harus menyediakan pencatatan aksi rollback deployment dengan otorisasi ketat (`PERM_DEPLOYMENT_ROLLBACK`), mencatat alasan rollback, versi target kembali, dan mencatatnya ke audit trail.
**Acceptance Criteria:**
- Hanya Tech Lead, Org Admin, dan Super Admin yang dapat menekan tombol / memanggil API rollback.
- Saat rollback dicatat, pengguna wajib mengisi field "Alasan Rollback" (minimal 10 karakter) dan "Versi Target".
- Sistem membuat record deployment baru dengan tipe `ROLLBACK` dan mencatat cryptographic audit signature di server (sebagaimana telah dirancang pada prototipe).
**Related Epic:** EPIC-006 (Release & Deployment Operations)

---

### Kategori 6: Audit Log & Observabilitas Sistem (Epic 7)

#### FR-014: MUST — Audit Trail Append-Only
**Description:** Sistem harus mencatat seluruh aksi penting dan administratif ke dalam tabel audit log yang tidak dapat diubah maupun dihapus (*append-only*).
**Acceptance Criteria:**
- Event yang wajib dicatat: login pengguna, kegagalan login, perubahan peran/permission pengguna, eksekusi deployment, rollback, deklarasi insiden, penghapusan data apa pun.
- Record audit memuat: `id`, `actor_id`, `actor_name`, `action`, `target_entity`, `target_id`, `details` (JSON before/after), `ip_address`, `timestamp`.
- Antarmuka Audit Log View hanya dapat diakses oleh pengguna dengan hak `PERM_AUDIT_LOGS_VIEW`.
- Tidak ada endpoint API untuk mengedit atau menghapus record audit log.
**Related Epic:** EPIC-007 (Audit & System Governance)

#### FR-015: MUST — Basis Data Relasional Permanen sebagai Single Source of Truth
**Description:** Seluruh data organisasi, pengguna, tiket, work item, commit, deployment, dan audit log harus disimpan dalam basis data relasional permanen (PostgreSQL 15+ atau MySQL 8.0+) menggantikan state in-memory saat ini.
**Acceptance Criteria:**
- Skema basis data terkelola melalui migration script yang dapat di-reproduce secara otomatis.
- Data tidak hilang ketika aplikasi server atau container di-restart.
- Integritas relasional dijaga menggunakan foreign key constraints dan indexes pada kolom pencarian utama (`project_id`, `assignee_id`, `status`, `key`).
**Related Epic:** EPIC-001 & EPIC-007

#### FR-016: SHOULD — Dashboard Ringkasan Progres & Health Berbasis Evidence
**Description:** Dashboard project utama harus menampilkan ringkasan progres deliverable dan indikator health yang bersumber langsung dari fakta data (tiket selesai, commit terhubung, status deployment), bukan angka statis buatan manual.
**Acceptance Criteria:**
- Angka persentase progress project dihitung otomatis dari rasio penyelesaian work item dan acceptance criteria yang terpenuhi.
- Setiap angka pada kartu metrik (misal: "8 Tiket Terbuka", "94% Build Sukses") dapat diklik untuk melakukan *drill-down* ke daftar data mentah aslinya.
- Jika ada deployment gagal atau blocker terbuka, status Health menampilkan peringatan secara visual (misal: "At Risk: 2 Blocker Aktif").
**Related Epic:** EPIC-003 (Developer Experience & Workspace)

---

## Fase V2 Requirements (Added 2026-09-18 — bmad-prd UPDATE)

> Sumber: Master PRD §11 (AI Codebase Intelligence) & §30 (Fase V2) + penuntasan sisa V1 (§5 Sprint, §19 KB).
> Prinsip Master PRD: **"AI membantu menganalisis; manusia memvalidasi keputusan"** — AI as analyst, not authority.

### FR-017: MUST — Sprints & Milestones Management (penuntasan V1)
**Description:** Work item dapat dikelompokkan ke dalam sprint (goal, periode, status) dan milestone, dengan progres sprint yang dapat dijelaskan (planned vs completed vs carry-over).
**Acceptance Criteria:**
- CRUD sprint (goal, startDate, endDate, status PLANNED/ACTIVE/CLOSED) dan milestone (nama, targetDate, status) via API dengan RBAC.
- Work item dapat ditugaskan ke sprint/milestone; pindah sprint tercatat.
- Sprint board: planned / completed / carry-over terhitung dari data nyata.
- Sprint aktif bersifat eksklusif per project (satu sprint ACTIVE per project).
**Related Epic:** EPIC-014

### FR-018: MUST — Knowledge Base & Pencarian Global (penuntasan V1)
**Description:** Artikel KB dengan versioning (bersumber dari tiket resolved atau ditulis manual) dan pencarian global lintas entitas.
**Acceptance Criteria:**
- CRUD artikel KB (slug, judul, body markdown, tags) dengan versioning — setiap update membuat versi baru yang dapat dilihat.
- Tiket berstatus RESOLVED dapat dikonversi menjadi draft artikel (prefill terkontrol).
- Pencarian global `?q=` mencari di tiket, work item, KB, dan insiden; hasil menyertakan tipe entitas + project.
**Related Epic:** EPIC-015

### FR-019: MUST — AI Codebase Scan Nyata (Gemini) dengan Snapshot Persisten
**Description:** Scan AI berbasis LLM (Gemini) menghasilkan snapshot findings yang tersimpan; hasil tidak pernah menimpa source code atau status bisnis otomatis. Tanpa API key, sistem tetap berfungsi dengan label STATIC_DEMO_PREVIEW (SEC-05).
**Acceptance Criteria:**
- Setiap scan (live maupun demo) tersimpan sebagai snapshot (mode, findings, recommendations, scannedBy).
- Riwayat scan dapat dibaca per project, terurut terbaru.
- Mode selalu eksplisit: LIVE_ANALYSIS atau STATIC_DEMO_PREVIEW.
- Kegagalan panggilan Gemini menghasilkan pesan error bersih (bukan crash) dan snapshot demo tidak dianggap live.
**Related Epic:** EPIC-016

### FR-020: MUST — Finding Lifecycle & Konversi Recommendation → Work Item
**Description:** Finding memiliki status siklus hidup yang divalidasi manusia; recommendation dapat dikonversi menjadi work item setelah persetujuan.
**Acceptance Criteria:**
- Finding tersimpan sebagai baris individual dengan status: PENDING, CONFIRMED, REJECTED, FALSE_POSITIVE, IN_PROGRESS, RESOLVED, ACCEPTED_RISK.
- Perubahan status via API dengan RBAC (PERM_AI_SCAN_TRIGGER) dan tercatat di audit trail.
- Recommendation dapat dikonversi menjadi work item (PERM_WORK_ITEM_CREATE) dengan tautan evidence ke scan asal; konversi idempoten (tidak dobel).
**Related Epic:** EPIC-016

### FR-021: SHOULD — AI Report Translation (Dwibahasa)
**Description:** Laporan manajemen yang sudah terarsip dapat diterjemahkan EN↔ID oleh AI untuk pembaca internasional; terjemahan tersimpan sebagai bagian arsip.
**Acceptance Criteria:**
- Endpoint terjemahan memerlukan PERM_AI_TRANSLATE dan GEMINI_API_KEY aktif; tanpa key → 503 dengan pesan jelas.
- Terjemahan tersimpan pada arsip laporan dan dapat ditampilkan berdampingan.
- Laporan sumber tidak pernah tertimpa terjemahan.
**Related Epic:** EPIC-016

### NFR-006: AI Explainability & Cost Control — MUST
**Description:** Seluruh output AI wajib dapat dijelaskan dan terkendali biayanya.
**Acceptance / Threshold:**
- Setiap output AI menyertakan metadata: mode, scanId, model, timestamp.
- Tanpa GEMINI_API_KEY, tidak ada panggilan network ke provider (biaya nol).
- Label integritas demo wajib tampil di UI (SEC-05).

---

## Non-Functional Requirements (NFR)

### NFR-001: Kecepatan Respons API (Performance) — MUST
**Description:** Seluruh endpoint API transaksional harus merespons cepat agar tidak menghambat ritme kerja developer.  
**Acceptance / Threshold:**
- Waktu respons API untuk pembacaan data (GET `/api/work-items`, `/api/tickets`, `/api/auth/me`): 95% request (p95) < 150 ms pada beban 50 concurrent users.
- Ingestion webhook GitHub: respons HTTP 200/202 < 100 ms (pemrosesan payload berat didelegasikan atau dioptimasi query-nya).  
**Measurement Method:** Uji beban menggunakan autocannon / k6 pada lingkungan staging dengan minimal 10.000 record data terisi.

### NFR-002: Keamanan Akses & Perlindungan Kredensial (Security) — MUST
**Description:** Sistem harus memenuhi standar minimum keamanan aplikasi web internal enterprise.  
**Acceptance / Threshold:**
- Menutup 100% temuan keamanan DS-01 s.d. DS-07 dari Deep Scan.
- Tidak ada token rahasia, kunci JWT, atau password hint yang berada di repositori kode atau bundle klien.
- Password di-hash menggunakan bcrypt (work factor ≥ 12).
- Seluruh endpoint API terproteksi mewajibkan header Bearer token valid dengan signature HMAC-SHA256 yang diverifikasi server.
- Mengaktifkan security headers standar (Helmet: X-Content-Type-Options, X-Frame-Options, HSTS).  
**Measurement Method:** Audit keamanan ulang (Strix / manual pentest) dan pemindaian SAST otomatis sebelum deployment rilis.

### NFR-003: Ketahanan & Persistensi Data (Reliability) — MUST
**Description:** Data operasional engineering tidak boleh hilang akibat kegagalan server atau restart proses.  
**Acceptance / Threshold:**
- RPO (Recovery Point Objective): < 1 jam (dengan jadwal backup database harian terotomasi).
- RTO (Recovery Time Objective): < 15 menit untuk restart proses dan reconnection pool database.  
**Measurement Method:** Simulasi kill process pada container backend; verifikasi konsistensi data setelah proses naik kembali.

### NFR-004: Efisiensi & Kerapihan Sisi Klien (Usability) — MUST
**Description:** Antarmuka harus mempertahankan kenyamanan visual prototipe yang sudah ada, dengan navigasi cepat tanpa reload halaman (*Single Page App*).  
**Acceptance / Threshold:**
- Transisi antar tab modul < 50 ms.
- First Contentful Paint (FCP) halaman utama < 1.2 detik pada jaringan broadband standar.
- Dukungan penuh PWA (dapat diinstall di desktop Chrome/Edge dan mobile) dengan indikator luring (*offline indicator*) yang berfungsi saat koneksi terputus.  
**Measurement Method:** Lighthouse performance score ≥ 85; pengujian manual instalasi PWA di Chrome desktop.

### NFR-005: Kualitas & Keterpeliharaan Kode (Maintainability) — MUST
**Description:** Basis kode harus berada di bawah kendali versi (*git*), memiliki konfigurasi pemeriksaan tipe yang ketat, dan memiliki pengujian otomatis.  
**Acceptance / Threshold:**
- Seluruh source code dikelola di git repository dengan proteksi branch utama (`master`/`main`).
- TypeScript strict mode aktif (`"strict": true` di `tsconfig.json`) tanpa error kompilasi.
- Unit test coverage minimal 70% untuk modul kritis: verifikasi token, autorisasi RBAC, parsing webhook, dan kalkulasi progress.  
**Measurement Method:** Eksekusi `npm run test` (Vitest/Jest) dan `npm run lint` (`tsc --noEmit`) pada CI pipeline pre-commit.

---

## Epics and User Stories (Outline)

> Garis besar 7 Epic MVP yang disusun berdasarkan Master PRD Section 31 (Build Order). Setiap epic akan dipecah menjadi file story detail (`{epic}.{story}.{slug}.story.md`) pada fase sprint planning.

### EPIC-001: Core Platform Foundation, Security & Database
**Business Value:** Membangun fondasi sistem yang aman, persisten, dan sesuai standar sebelum data nyata dimasukkan. Menghapus 100% kerentanan fatal prototipe.  
**User Segments:** All Users, System Admin.  
**Related Requirements:** FR-001, FR-002, FR-003, FR-015, NFR-002, NFR-003, NFR-005.  
**User Stories (sketch):**
- **STORY-001 (Init Git & CI):** As a Developer, I want the codebase managed in a clean git repository with automated type-checking and tests, so that my work is never lost and regression is prevented.
- **STORY-002 (Database Migration Setup):** As a Tech Lead, I want a relational database migration engine (PostgreSQL/MySQL), so that the schema is versioned and changes are reproducible.
- **STORY-003 (Secure Auth Engine):** As a User, I want to login securely with my email and password (bcrypt-hashed), receiving a cryptographically signed token, so that unauthorized persons cannot access my company's workspace.
- **STORY-004 (Server-Side RBAC Enforcement):** As a System Admin, I want all sensitive actions protected by server-validated permission checks, so that users cannot elevate their privileges by tampering with client state.
- **STORY-005 (Org & Project Hierarchy):** As an Admin, I want to define Organizations and Projects with unique keys, so that engineering items are partitioned properly.

---

### EPIC-002: Work Items & Task Management
**Business Value:** Memberikan struktur pelacakan tugas engineering yang jelas, hierarkis, dan terhubung ke kriteria penerimaan nyata.  
**User Segments:** Developer, Tech Lead, Project Manager.  
**Related Requirements:** FR-004, FR-006.  
**User Stories (sketch):**
- **STORY-006 (Work Item CRUD):** As a Developer/PM, I want to create, view, edit, and filter work items with priority, estimate, and status, so that our team knows exactly what needs to be delivered.
- **STORY-007 (Acceptance Criteria Checklist):** As a Developer, I want each work item to have a clear checklist of acceptance criteria, so that "Done" has a concrete, verifiable definition.
- **STORY-008 (Dependency & Blocker Linking):** As a Tech Lead, I want to link dependencies between tasks and see blockers visually, so that bottlenecks are caught early.

---

### EPIC-003: Developer Experience & "My Work" Workspace
**Business Value:** Meningkatkan produktivitas developer dengan menghadirkan ruang kerja tunggal yang cepat, minim klik, dan bebas gangguan.  
**User Segments:** Developer (Primary).  
**Related Requirements:** FR-005, FR-016, NFR-004.  
**User Stories (sketch):**
- **STORY-009 (My Work Dashboard):** As a Developer, I want a dedicated "My Work" view showing my assigned tasks, open tickets, and pending review requests, so that I can start my day immediately without asking around.
- **STORY-010 (Quick Status Action):** As a Developer, I want 1-click actions to transition tasks from "Ready" to "In Progress" or "In Review", so that keeping status up to date takes zero mental friction.
- **STORY-011 (Explainable Progress Indicators):** As a Developer/PM, I want progress bars that can be clicked to show the underlying completed items, so that numbers are transparent and believable.

---

### EPIC-004: Ticketing & ITSM Workflow
**Business Value:** Menyediakan jalur penanganan bug dan permintaan teknis yang teratur, mencegah isu hilang di grup chat, dan menghubungkan isu ke kode.  
**User Segments:** Developer, Support, Tech Lead, QA.  
**Related Requirements:** FR-007, FR-008, FR-009.  
**User Stories (sketch):**
- **STORY-012 (Ticket Intake & Triage):** As a Team Member, I want to create a ticket with clear type, severity, and description, so that issues are formally registered.
- **STORY-013 (Ticket Lifecycle & Assignment):** As a Tech Lead, I want to triage incoming tickets, assign them to developers, and transition them through the lifecycle to resolution.
- **STORY-014 (Link Ticket to Work Item):** As a Developer, I want to link a bug ticket directly to a work item task, so that the fix is tracked as part of our sprint deliverable.

---

### EPIC-005: Git Intelligence & Webhook Engine
**Business Value:** Menghubungkan aktivitas kode nyata di GitHub secara otomatis ke tiket dan tugas tanpa perlu copy-paste link manual.  
**User Segments:** Developer, Tech Lead.  
**Related Requirements:** FR-010, FR-011, NFR-001.  
**User Stories (sketch):**
- **STORY-015 (GitHub Webhook Ingestion):** As a System, I want to receive signed webhooks from GitHub for push and pull request events idempotently, so that git activity is recorded in real time.
- **STORY-016 (Auto-Linking by Key):** As a Developer, I want commits and PRs mentioning a key like `WRK-101` to automatically appear on the task and ticket detail pages, so that evidence of my work is attached without manual entry.
- **STORY-017 (PR Review Status Visibility):** As a Tech Lead, I want to see PR review approvals and merge status directly inside WORKSTATION, so that I know which work items are truly ready for release.

---

### EPIC-006: Release & Deployment Operations
**Business Value:** Memberikan kepastian operasional: apa yang berjalan di server mana, commit mana yang dipakai, dan kemampuan rollback yang terkontrol saat terjadi insiden.  
**User Segments:** Tech Lead, Developer, DevOps.  
**Related Requirements:** FR-012, FR-013.  
**User Stories (sketch):**
- **STORY-018 (Deployment Record Creation):** As a Tech Lead/CI runner, I want to record a deployment event with target environment, server, commit SHA, and outcome, so that deployment history is fully auditable.
- **STORY-019 (Rollback Authorization & Audit):** As a Tech Lead, I want an authorized rollback action that requires an explanation and logs a tamper-evident audit record, so that emergency rollbacks are tracked safely.

---

### EPIC-007: Audit Trail & Governance
**Business Value:** Menjamin akuntabilitas dan integritas seluruh sistem untuk kepatuhan operasional enterprise internal.  
**User Segments:** Platform Admin, Tech Lead, Management.  
**Related Requirements:** FR-014, FR-015.  
**User Stories (sketch):**
- **STORY-020 (Append-Only Audit Logger):** As a Platform Admin, I want every login, permission change, deployment, and status override recorded in an immutable audit table, so that we have a complete forensic history.
- **STORY-021 (Audit Log Viewer):** As a Security Admin, I want a dedicated audit log interface with filtering by actor, action, and date, so that I can inspect sensitive activities easily.

---

## Prioritization Summary (MoSCoW)

| Priority | Requirements | Rationale |
|----------|--------------|-----------|
| **MUST** | FR-001, FR-002, FR-003, FR-004, FR-005, FR-007, FR-008, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, NFR-001, NFR-002, NFR-003, NFR-004, NFR-005 | Syarat mutlak MVP: fondasi keamanan, DB nyata, alur kerja developer utama, tiket, integrasi GitHub, deployment, dan audit trail. Tanpa ini, sistem tidak layak dipakai tim nyata. |
| **SHOULD** | FR-006 (Dependency loop check), FR-009 (Komentar & lampiran tiket kaya), FR-016 (Dashboard evidence drill-down interaktif) | Sangat penting untuk kenyamanan dan pencegahan masalah, dikerjakan segera setelah alur utama MUST selesai. |
| **COULD** | Notifikasi browser (PWA push notification), filter kustom tersimpan di tiket, tema warna gelap/terang toggle. | Berguna tapi tidak menghambat alur kerja inti jika belum ada di peluncuran pertama. |
| **WON'T (MVP)** | Fitur AI Codebase Scanner & Translation (ditunda per keputusan 2026-09-18), Workstation Linux Agent untuk Kontabo/lokal (V1), Dual-language Management Summary (V1), Knowledge Base auto-generation (V1), Multi-provider Git selain GitHub (GitLab/Bitbucket) (V2). | Sengaja dikeluarkan dari batas MVP agar tim fokus menuntaskan integritas data dan alur harian developer. Rincian tercatat di `addendum.md`. |

---

## Success Metrics

| Metric | Baseline | Target (4 Minggu Pasca MVP) | Measurement Method | Frequency |
|--------|----------|-----------------------------|--------------------|-----------|
| **Adopsi Developer Aktif** | 0% (semua mock data) | 100% anggota tim inti (min. 5 dev) aktif membuka My Work setiap hari kerja | Query login & aktivitas harian di audit log | Mingguan |
| **Traceability Tiket ↔ Git** | 0% (tidak ada link nyata) | ≥ 85% tiket yang ditutup memiliki minimal 1 commit SHA atau PR terkait | Query rasio tiket closed dengan evidence_links | Mingguan |
| **Insiden Keamanan / Bypass** | Rentan (7 temuan kritis) | 0 insiden bypass auth atau pemalsuan token di staging/internal | Log review & automated security scan | Harian |
| **Kecepatan Triage Tiket** | Manual (chat/spreadsheet) | Waktu dari tiket dibuat sampai di-assign < 4 jam pada jam kerja | Selisih timestamp `created_at` ke `assigned_at` | Mingguan |
| **Deployment Audit Coverage** | 0% tercatat resmi | 100% deployment ke Staging dan Production tercatat di sistem | Rekonsiliasi riwayat deployment WORKSTATION vs log server | Tiap rilis |

---

## Assumptions and Dependencies

### Assumptions
1. Tim pengembangan bersedia menyematkan format kode tiket/tugas (contoh: `WRK-101`) di awal pesan commit atau nama branch.
2. Repository proyek di-host di GitHub (cloud atau enterprise) yang dapat mengirim outbound webhook ke alamat server WORKSTATION.
3. Server WORKSTATION memiliki akses jaringan publik atau melalui webhook proxy/tunnel yang stabil untuk menerima event GitHub.
4. Pengguna internal mengakses WORKSTATION melalui browser modern (Chrome, Edge, Safari, Firefox) yang mendukung standar web dan PWA terkini.

### Dependencies
| Dependency | Type | Owner | Status | Risk | Mitigation |
|------------|------|-------|--------|------|------------|
| GitHub Organization Access & Webhook Admin | Akses Eksternal | Tech Lead / DevOps | Pending | Tidak bisa pasang webhook repo | Siapkan token Personal Access / GitHub App dengan permission webhook |
| Basis Data PostgreSQL / MySQL | Infrastruktur | DevOps / System Admin | Ready (Lokal/Kontabo) | Downtime basis data | Gunakan managed DB atau instance terisolasi dengan backup berkala |
| Domain / URL Publik Server (untuk Webhook) | Infrastruktur | DevOps | Pending | Webhook tidak sampai jika di intranet tertutup | Gunakan cloud proxy (Cloudflare Tunnel / reverse proxy) untuk endpoint webhook |

---

## Constraints

- **Technical Constraints:**
  - Tetap memanfaatkan basis kode antarmuka React 19 + Tailwind 4 + Vite yang sudah dibangun (hindari *re-write* frontend yang membuang waktu).
  - Backend harus dipisahkan menjadi struktur modular (tidak lagi menumpuk 800 baris dalam satu file `server.ts`).
  - Basis data wajib relasional SQL untuk menjamin integritas transaksi dan foreign key antar entitas.
- **Business Constraints:**
  - Sistem digunakan internal terlebih dahulu sebelum dipresentasikan ke level manajemen puncak sebagai produk siap rilis.
  - Biaya operasional minimum (menggunakan infrastruktur server kantor lokal / Kontabo yang sudah ada, tanpa layanan cloud berbayar mahal di awal).
- **Timeline Constraints:**
  - Target penyelesaian MVP: 3–4 sprint kerja terfokus (fase foundation → core flow → integration → hardening).

---

## Out of Scope (Won't for MVP)

| Excluded Feature | Reason | Revisit Phase |
|------------------|--------|---------------|
| **AI Codebase Scanner & AI Findings** | Ditunda per keputusan owner 2026-09-18; membutuhkan evaluasi model LLM, biaya token, dan arsitektur sandboxing agar tidak menghasilkan data palsu. | Evaluasi pasca-MVP (V2) |
| **Dual-Language Translation Engine** | Fokus MVP adalah Developer, bukan eksekutif. Fitur penerjemahan bahasa manajemen akan dibangun di V1 saat data evidence sudah melimpah. | V1 Reporting |
| **Workstation Linux Agent (Kontabo/Office)** | Kompleksitas pembuatan daemon agent server, enrollment cert, dan heartbeat buffer terlalu besar untuk MVP. Telemetry server di MVP dicatat via API sederhana. | V1 Infrastructure |
| **Integrasi Git Selain GitHub (GitLab, Bitbucket)** | Mayoritas repositori tim berada di GitHub; multi-adapter menambah beban pemeliharaan tanpa nilai tambah langsung di tahap awal. | V2 Integrations |
| **Knowledge Base Otomatis dari Tiket** | Membutuhkan kurasi konten dan modul editor dokumen yang terpisah. | V1 Knowledge |
| **Single Sign-On (SSO / SAML / OAuth Google)** | Cukup email/password terenkripsi yang aman untuk tim internal tahap 1. | Enterprise Phase |

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation Strategy | Owner |
|------|--------|-------------|---------------------|-------|
| **Developer lupa menyertakan kode tiket di commit** | High | Medium | Buat git commit-msg hook sederhana yang otomatis mengecek format pesan commit sebelum push; sediakan opsi tautkan manual dari UI jika terlewat. | Tech Lead |
| **Perubahan drastis arsitektur backend merusak tampilan frontend yang ada** | High | Medium | Pertahankan kontrak response JSON frontend yang sudah dirancang pada `src/types.ts` agar komponen UI tidak perlu dirombak besar-besaran. | System Architect |
| **Webhook GitHub gagal terkirim saat server maintenance** | Medium | Low | GitHub menyediakan fasilitas retry webhook otomatis; sediakan tombol manual reconciliation ("Sync Recent Commits") di menu repository. | Backend Dev |
| **Skema database mock tidak cocok dengan kebutuhan query relasional kompleks** | High | Low | Gunakan blueprint data (`src/blueprintData.ts`) yang sudah mendefinisikan ERD relational sebagai panduan desain tabel SQL sejak awal. | Backend Dev / Architect |

---

## Traceability Matrix

> Pemetaan dua arah: Setiap Functional Requirement terhubung ke Business Goal di atas dan Epic/Story di bawah.

| Requirement | Business Goal | Epic | Sketch User Story | Status |
|-------------|---------------|------|-------------------|--------|
| **FR-001** (Secure Auth) | BG-3 (Zero Security Compromise) | EPIC-001 | STORY-003 | READY_FOR_DEV |
| **FR-002** (Server RBAC) | BG-3 (Zero Security Compromise) | EPIC-001 | STORY-004 | READY_FOR_DEV |
| **FR-003** (Org & Project) | BG-1 (Adopsi Tim) | EPIC-001 | STORY-005 | READY_FOR_DEV |
| **FR-004** (Work Items) | BG-1 (Adopsi Tim) | EPIC-002 | STORY-006, STORY-007 | READY_FOR_DEV |
| **FR-005** (My Work) | BG-1, UG-1 (Dev Workspace) | EPIC-003 | STORY-009, STORY-010 | READY_FOR_DEV |
| **FR-006** (Dependencies) | BG-1 (Adopsi Tim) | EPIC-002 | STORY-008 | BACKLOG |
| **FR-007** (Ticketing Workflow) | BG-1 (Adopsi Tim) | EPIC-004 | STORY-012, STORY-013 | READY_FOR_DEV |
| **FR-008** (Ticket ↔ Work Link) | BG-2 (Traceability 100%), UG-2 | EPIC-004 | STORY-014 | READY_FOR_DEV |
| **FR-009** (Ticket Timeline) | BG-2 (Traceability 100%) | EPIC-004 | STORY-013 | BACKLOG |
| **FR-010** (GitHub Webhook) | BG-2 (Traceability 100%), UG-2 | EPIC-005 | STORY-015 | READY_FOR_DEV |
| **FR-011** (Auto-Link Commit/PR)| BG-2 (Traceability 100%), UG-2 | EPIC-005 | STORY-016, STORY-017 | READY_FOR_DEV |
| **FR-012** (Deployment Record) | BG-2 (Traceability 100%), UG-3 | EPIC-006 | STORY-018 | READY_FOR_DEV |
| **FR-013** (Rollback Auth) | BG-3, UG-3 (Tech Lead Control) | EPIC-006 | STORY-019 | READY_FOR_DEV |
| **FR-014** (Audit Trail) | BG-3 (Zero Security Compromise) | EPIC-007 | STORY-020, STORY-021 | READY_FOR_DEV |
| **FR-015** (Relational Database)| BG-2, BG-3, NFR-003 | EPIC-001 | STORY-002 | READY_FOR_DEV |
| **FR-016** (Evidence Dashboard) | BG-1, UG-1, UG-3 | EPIC-003 | STORY-011 | BACKLOG |
| **NFR-001..005** (Quality Gates)| BG-1, BG-2, BG-3 | Cross-Cutting | STORY-001 (CI/Lint/Test) | READY_FOR_DEV |

---

## Handoff

- **To Architecture (`bmad-architecture` / Winston):**
  - PRD ini menetapkan kebutuhan sistem relasional SQL terpisah (PostgreSQL/MySQL), modularisasi backend dari `server.ts` menjadi arsitektur layer (Routes → Controllers → Services → Repositories), dan implementasi webhook receiver yang aman.
  - Winston perlu menghasilkan ADR untuk: (1) Pemilihan database & ORM (misal: Prisma / Drizzle / Kysely / raw SQL); (2) Strategi struktur monorepo vs layered modular di backend; (3) Strategi migrasi data dari mock ke database.
- **To Sprint/Story Planning (`bmad-epics-and-stories` & `bmad-sprint-planning`):**
  - Gunakan 7 Epic di atas untuk men-shard backlog menjadi file cerita siap dev (`.story.md`) berukuran 1 dev-day per story, dimulai dari EPIC-001.
- **Open Questions & Deferred Notes:**
  - Lihat `bmad-output/addendum.md` untuk opsi evaluasi fitur AI (A-01) dan catatan teknis prototipe yang ditangguhkan.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0-MVP | 18 September 2026 | John (BMAD PM) | Shard awal fase MVP dari Master PRD v1.0, berfokus pada Developer experience, penyelesaian temuan Deep Scan DS-01..DS-07, dan penangguhan fitur AI ke addendum. |

---

_BMAD Planning & Orchestrator · PRD Facilitator (John the PM) · BMAD Method by BMAD Code Organization_
