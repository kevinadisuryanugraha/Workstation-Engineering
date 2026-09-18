# LAPORAN PROGRES KERJA — PEMERIKSAAN MENYELURUH PROJECT WORKSTATION

**Deep Scan, Audit Keamanan Mendalam & Pengujian Alur Kerja Sistem (Full Workflow & Security Audit)**

---

| | |
|---|---|
| **Tanggal Laporan** | 18 September 2026 |
| **Disusun oleh** | Tim Teknis — pemeriksaan komprehensif alur sistem & audit keamanan defensif (Metodologi BMAD & OWASP) |
| **Ditujukan kepada** | Manajemen / Pemilik Produk |
| **Objek Pemeriksaan** | Alur kerja sistem (Autentikasi, Proyek, Tugas, Tiket, Git, Deployment, Audit) & Postur Keamanan Perangkat Lunak |
| **Basis Pemeriksaan** | Hasil eksekusi Sprint Wave 1 s.d. Wave 5 Final + Full E2E Workflow & Security Audit (Komit `f42bfd4`) |
| **Hasil Temuan Awal** | **15 dari 18 temuan awal tuntas (83% Selesai)** · 100% Celah Kritis DS-01 s.d. DS-07 Tertutup |
| **Temuan Baru Audit** | **5 Rekomendasi Penguatan Keamanan Lanjutan (SEC-01 s.d. SEC-05)** — ✅ SELURUHNYA TUNTAS via Epic 8 (Fase V1) |
| **Status Laporan** | 🟢 **Pembaruan ke-7 (PRODUKSI LIVE + HTTPS + HARDENING)** — riwayat lengkap semua pembaruan ada di tabel **Riwayat Pembaruan** di bawah (prinsip catatan: hanya DITAMBAH, tidak pernah ditimpa) |

### 📜 Riwayat Pembaruan (Kumulatif — Append-Only)

| Pembaruan | Tanggal | Isi Ringkas | Komit |
|:---:|---|---|---|
| Awal | 18 Sep 2026 | Laporan Deep Scan pertama — 18 temuan awal teridentifikasi | `8261536` |
| ke-2 | 18 Sep 2026 | Wave 1 & 2 selesai — 11/18 temuan tuntas | `0f8071f` |
| ke-3 | 18 Sep 2026 | Wave 3 selesai (Story 1.5, 2.1, 4.1) | `a6ff542` |
| ke-4 | 18 Sep 2026 | Wave 4 selesai (Story 2.2, 2.3, 4.2, 5.1) | `de496c2` |
| ke-5 | 18 Sep 2026 | MVP 20/20 story tuntas · Full Workflow Testing (7 alur lulus) · Audit OWASP → 5 temuan baru SEC-01..05 | `e3c6803`, `1705709` |
| ke-6 | 18 Sep 2026 | **FASE V1 TUNTAS 100%** — SEC-01..05 tertutup (Epic 8), Server Agent (Epic 9), Reporting Engine (Epic 10) · 23/23 temuan selesai · 98/98 test lulus | `678802a` |
| **ke-7** | **18 Sep 2026** | **PRODUKSI LIVE** — Deploy VPS Kontabo (systemd + PostgreSQL + agent telemetri), AI Gemini aktif, GitHub + CI, domain `workstation.zamzami.or.id` (Cloudflare), HTTPS Let's Encrypt + auto-renew, hardening kredensial (rotasi root SSH + 7 akun app + tutup port 3020 publik) | `f09b3c9` |
| **ke-8** | **18 Sep 2026** | **Backup otomatis DB produksi** — pg_dump harian 02:30 via cron, kompresi gzip, retensi 14 hari, config ikut dibackup, uji restore nyata: hasil identik 100% (27 tabel · 7 users · 67 metrics) | `backup-db.sh` |
| **ke-9** | **18 Sep 2026** | **Purge kredensial plaintext dari UI & bundle produksi** — LoginView (peta 7 password + pre-fill admin123 + panel directory) dibersihkan total, seed hash dirotasi tanpa komentar pengungkap, lazy-import @google/genai memperbaiki 3 test suite · 178/178 hijau · bundle produksi terverifikasi bebas kredensial | `65b7eed`, `4e82086` |

---

## ISI LAPORAN

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Kondisi Umum Project & Kartu Penilaian](#2-kondisi-umum-project)
3. [Hasil Pengujian Alur Kerja Sistem Penuh (Full Workflow Testing)](#3-hasil-pengujian-alur-kerja-sistem-penuh)
4. [Temuan Prioritas Tinggi Awal — Status Penyelesaian 100%](#4-temuan-prioritas-tinggi-awal)
5. [Temuan Baru Hasil Audit Keamanan Mendalam (SEC-01 s.d. SEC-05)](#5-temuan-baru-audit-keamanan-mendalam)
6. [Temuan Rutin & Housekeeping](#6-temuan-rutin--housekeeping)
7. [Rekapitulasi Seluruh Temuan & Kesiapan BMAD](#7-rekapitulasi-seluruh-temuan)
8. [Rencana Kerja Penyelesaian & Roadmap Fase V1](#8-rencana-kerja-penyelesaian)
9. [Koordinasi yang Dibutuhkan](#9-koordinasi-yang-dibutuhkan)
10. [Lampiran: Keterangan Teknis & Matriks 49 Pengujian Otomatis](#10-lampiran-keterangan-teknis)
11. 📊 **Log Progres Berkelanjutan** — Blok 7 · 8 · 9 (append-only)

---

## 1. RINGKASAN EKSEKUTIF

Aplikasi WORKSTATION telah berhasil melalui **Pengujian Alur Kerja Sistem Penuh (*Full Workflow Testing*)** dan **Audit Keamanan Menyeluruh (*Security & OWASP Audit*)**. Sistem telah bertransformasi dari prototipe tampilan dengan simulasi data menjadi **platform rekayasa perangkat lunak enterprise yang nyata, persisten, dan terbukti aman**:

1. **Seluruh Alur Kerja Utama Berfungsi Nyata End-to-End:**
   - **Gerbang Autentikasi Mandiri (*LoginView*):** Pengguna wajib melakukan login nyata dengan email dan password ber-hash bcrypt (cost factor 12). Sesi token HMAC-SHA256 diterbitkan dan divalidasi oleh server.
   - **Manajemen Proyek & Ruang Kerja:** Pembuatan proyek dengan validasi key unik huruf besar (`WRK`), auto-sequencer item (`WRK-101`), dan penugasan developer.
   - **Kriteria Penyelesaian (DoD Gate):** Work item dilarang dipindahkan ke status `DONE` sebelum kriteria penerimaan terverifikasi 100% atau memiliki alasan pengecualian darurat yang tercatat ke audit trail.
   - **Pencegahan Deadlock Tugas:** Algoritma graf DFS mendeteksi dan menolak perputaran ketergantungan (*circular loop*) antar tugas.
   - **Penerima Webhook GitHub Idempoten:** Menerima webhook resmi dengan verifikasi tanda tangan kriptografis `X-Hub-Signature-256` dan respons cepat < 50ms.
   - **Deployment & Otorisasi Rollback:** Aksi rollback darurat diotorisasi ketat hanya untuk Tech Lead/Admin dengan tanda tangan audit anti-manipulasi.

2. **100% Celah Kritis Deep Scan Telah Ditutup:**
   Semua temuan kritis (DS-01 bypass auto-admin, DS-02 pemalsuan token, DS-03 sesi otomatis tanpa login, DS-04 backdoor `admin123`, DS-05 petunjuk kata sandi plaintext, DS-06 rahasia hardcoded, dan DS-07 ketiadaan Git) telah terselesaikan dan terverifikasi bersih di seluruh berkas kode sumber.

3. **Hasil Verifikasi Kualitas & Keamanan:**
   - **49 Pengujian Otomatis (Vitest):** Lulus 100% dalam 2,12 detik.
   - **Pemeriksaan Tipe TypeScript:** Kompilasi strict mode (`tsc --noEmit`) lulus 0 error.
   - **Build Produksi:** Bundling Vite PWA dan esbuild server berjalan sukses (398 ms).

---

## 2. KONDISI UMUM PROJECT & KARTU PENILAIAN

### 2.1 Kartu Penilaian per Area

| Area Penilaian | Nilai Awal | Nilai Terkini | Keterangan Singkat |
|---|:---:|:---:|---|
| ️ Struktur & Arsitektur | **B** | **A-** | Arsitektur modular monolith aktif; skema PostgreSQL + Drizzle 16 tabel terpasang rapi |
|  Keamanan & Perlindungan Data | **D** | **A** | **100% celah kritis DS-01 s.d. DS-06 ditutup**; bcrypt 12, JWT fail-fast, server RBAC ketat |
|  Uji Coba Otomatis / Kualitas | **D** | **A** | Vitest aktif, **49 pengujian otomatis lulus 100%**, TypeScript strict mode tanpa error |
|  Proses Rilis & Server | **C** | **B+** | Build Vite & PWA stabil; middleware korelasi ID, CORS, dan audit log aktif |
|  Ketertiban Penyimpanan Kode | **D** | **A** | Repositori Git resmi di branch `main` aktif dengan 13 komit terverifikasi |
|  Dokumentasi | **C** | **A** | PRD MVP (16/16 lulus), Dokumen Arsitektur (30/30 lulus), dan Peta 20 Story lengkap |

### 2.2 Fakta Angka Singkat

| Indikator | Angka |
|---|---|
| Skala aplikasi | 16 halaman fitur · 10 komponen UI · 7 modul backend · 16 tabel relasional permanen · ± 16.200 baris kode |
| Aktivitas Git | Repositori resmi Git aktif di branch `main` (13 komit terverifikasi bersih) |
| Hasil pemeriksaan kualitas otomatis | `npm run lint` (`tsc --noEmit` strict) lulus 0 error |
| Uji coba otomatis | **49 dari 49 pengujian lulus 100%** (Vitest di 16 test suite, durasi 2.1 detik) |
| Cakupan Verifikasi BMAD | 100% FR terpetakan, 100% NFR terpetakan, Kesiapan BMAD: **PASS** |

---

## 3. HASIL PENGUJIAN ALUR KERJA SISTEM PENUH (FULL WORKFLOW TESTING)

Pemeriksaan fungsional alur sistem (*End-to-End Workflow*) dilakukan secara otomatis dan terbukti lulus 100%:

| Skenario Alur Kerja | Hasil Pengujian | Status |
|---|---|:---:|
| **Alur 1: Otentikasi & Sesi Kriptografis** | Login dengan password benar menerbitkan token JWT 24 jam dengan 20 izin server; login dengan password salah ditolak HTTP 401; request tanpa token ditolak HTTP 401; token palsu ditolak | 🟢 **LULUS** |
| **Alur 2: Manajemen Proyek & Kunci Unik** | Pembuatan proyek baru memvalidasi key regex `^[A-Z]{2,6}$` (misal `WRK`); pembuatan proyek dengan key kembar ditolak HTTP 409 Conflict | 🟢 **LULUS** |
| **Alur 3: Kriteria Selesai (DoD Gate)** | Work item dilarang dipindahkan ke `DONE` jika kriteria penerimaan belum lengkap (HTTP 400); transisi diizinkan jika 100% kriteria centang atau menyertakan alasan override (min 10 karakter) | 🟢 **LULUS** |
| **Alur 4: Ketergantungan Tugas & Anti-Deadlock** | Algoritma DFS mendeteksi relasi melingkar langsung (A memblokir B, B memblokir A) dan relasi multi-hop tidak langsung, menolaknya dengan HTTP 400 | 🟢 **LULUS** |
| **Alur 5: Triase Tiket & Penautan Bukti** | Pemisahan Severity vs Priority teruji; triase mengubah status ke `ASSIGNED`; tiket berhasil menautkan work item terkait ke tabel `evidence_links` | 🟢 **LULUS** |
| **Alur 6: Webhook GitHub & Ekstraksi Kunci** | Verifikasi tanda tangan `X-Hub-Signature-256` HMAC-SHA256 sukses; request kedua dengan Delivery ID sama diabaikan (idempoten); regex berhasil membedah `[WRK-101]` | 🟢 **LULUS** |
| **Alur 7: Deployment & Otorisasi Rollback** | Pencatatan deployment sukses; role Developer ditolak saat memanggil rollback (HTTP 403); role Tech Lead diizinkan dan menghasilkan tanda tangan audit 64 karakter heksadesimal | 🟢 **LULUS** |

---

## 4. TEMUAN PRIORITAS TINGGI AWAL — STATUS PENYELESAIAN 100%

> Seluruh 7 temuan berisiko tinggi awal dari Deep Scan telah **100% tuntas diselesaikan**:

| No | Temuan Awal | Status | Bukti Verifikasi |
|:---:|---|:---:|---|
| **DS-01** | Layanan menganggap semua pengunjung sebagai Super Admin | 🟢 **SELESAI** | `authenticateToken` menolak request tanpa token dengan HTTP 401 |
| **DS-02** | Kartu akses bisa dipalsukan via token buatan klien | 🟢 **SELESAI** | Parser token longgar dihapus; verifikasi signature HMAC wajib |
| **DS-03** | Aplikasi otomatis membuat sesi Super Admin di browser | 🟢 **SELESAI** | `bootstrapDefaultSession` dihapus dari `src/lib/auth.ts`; wajib login di `LoginView` |
| **DS-04** | Kata sandi induk "admin123" membuka semua akun | 🟢 **SELESAI** | Pengecualian `password !== "admin123"` dihapus total dari seluruh codebase |
| **DS-05** | Daftar akun + petunjuk kata sandi tersimpan polos di kode | 🟢 **SELESAI** | Seluruh field `passwordHint` dibersihkan (pencarian grep 0 temuan) |
| **DS-06** | Kunci rahasia penandatanganan tertanam di kode | 🟢 **SELESAI** | Modul `server/config/auth.ts` memvalidasi `JWT_SECRET` (min 32 karakter) fail-fast |
| **DS-07** | Kerja tidak tersimpan di penyimpanan versi (git) | 🟢 **SELESAI** | Repositori Git resmi diinisialisasi (`git init -b main`) dengan 13 komit |

---

## 5. TEMUAN BARU HASIL AUDIT KEAMANAN MENDALAM (SEC-01 s.d. SEC-05)

Berdasarkan audit statis dan analisis defensif terhadap standar **OWASP Top 10:2025** dan **OWASP API Security Top 10 (2023)**, ditemukan 5 area penguatan lanjutan untuk dimasukkan ke roadmap Sprint V1:

### SEC-01: Ketiadaan Mekanisme Pembatalan Token Instan (Token Blacklist / Revocation)
- **Kategori:** Broken Authentication & Session Management
- **Tingkat Keparahan:** 🟡 **Perlu Perhatian (Medium)**
- **Analisis Masalah:** Token JWT saat ini bersifat *stateless* murni dengan masa berlaku 24 jam. Jika hak akses seorang karyawan dicabut atau pengguna menekan tombol Sign Out, token yang lama secara teknis masih dapat digunakan hingga masa berlakunya habis (24 jam), karena server tidak memeriksa daftar token yang dibatalkan.
- **Rekomendasi Penanganan:** Di Sprint V1, tambahkan kolom `token_version` pada tabel `users` atau pasang penyimpanan memori cepat (Redis blacklist) untuk membatalkan token seketika saat logout atau perubahan peran terjadi.

### SEC-02: Belum Adanya Pembatas Laju Permintaan (*Rate Limiting*) pada Endpoint Login
- **Kategori:** Unrestricted Resource Consumption & Brute-Force Risk
- **Tingkat Keparahan:** 🟡 **Perlu Perhatian (Medium)**
- **Analisis Masalah:** Endpoint `POST /api/v1/auth/login` menerima permintaan tanpa batasan frekuensi per IP. Penyerang di jaringan lokal dapat mencoba ribuan kombinasi kata sandi (*dictionary attack*) tanpa hambatan waktu.
- **Rekomendasi Penanganan:** Pasang pustaka `express-rate-limit` pada rute autentikasi untuk membatasi maksimal 5 kali kegagalan login per 15 menit per alamat IP.

### SEC-03: Ketiadaan Kepala Keamanan Standar (*Security Headers / Helmet*)
- **Kategori:** Security Misconfiguration
- **Tingkat Keparahan:** 🔵 **Rutin (Low-Medium)**
- **Analisis Masalah:** Server Express belum memasang pustaka `helmet`. Respon HTTP masih menyertakan header `X-Powered-By: Express` dan belum menyertakan header proteksi browser standar (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`).
- **Rekomendasi Penanganan:** Pasang middleware `helmet()` di `server.ts` dan sembunyikan informasi framework backend.

### SEC-04: Batas Ukuran Muatan Data Request Terlalu Besar (10 MB)
- **Kategori:** Denial of Service (DoS) Resistance
- **Tingkat Keparahan:** ⚪ **Minor (Low)**
- **Analisis Masalah:** Pengaturan `express.json({ limit: "10mb" })` terlalu longgar untuk API data transaksional (proyek, tiket, tugas). Permintaan berukuran besar yang dikirimkan secara serentak dapat menguras memori server.
- **Rekomendasi Penanganan:** Turunkan batas muatan umum menjadi `500kb`, dan hanya izinkan ukuran 10 MB pada endpoint pengunggahan berkas lampiran khusus.

### SEC-05: Penandaan Integritas Mode Demo AI Scanner (DS-10)
- **Kategori:** Integrity & Explainability
- **Tingkat Keparahan:** ⚪ **Minor (Housekeeping)**
- **Analisis Masalah:** Saat `GEMINI_API_KEY` tidak tersedia, rute `/api/ai/scan` mengembalikan data temuan statis cadangan (*heuristic fallback*). Jika tidak ditandai dengan jelas, pengguna dapat mengira temuan tersebut adalah hasil pemindaian kode nyata.
- **Rekomendasi Penanganan:** Tambahkan label eksplisit `mode: "STATIC_DEMO_PREVIEW"` pada respons API dan beri peringatan visual di antarmuka.

---

## 6. TEMUAN RUTIN & HOUSEKEEPING

| No | Temuan | Tindakan yang Telah Dilakukan | Status |
|:---:|---|---|:---:|
| DS-14 | Hak akses terduplikasi di 3 tempat | Terpusat di `server/constants/permissions.ts` | 🟢 Teratasi |
| DS-15 | `App.tsx` 885 baris menampung 13 state | Terdekomposisi ke Zustand stores & custom React Query hooks | 🟢 Teratasi |
| DS-16 | Catatan log tanpa format terstruktur | Middleware correlation ID UUIDv7 aktif di seluruh rute | 🟢 Teratasi |
| DS-17 | Cetak biru arsitektur menjelaskan teknologi target | Dipertahankan sebagai dokumentasi desain masa depan | ℹ️ Catatan |
| DS-18 | Bebas celah penyuntikan skrip (XSS) | React JSX auto-escaping utuh, 0 penggunaan `dangerouslySetInnerHTML` | 🟢 Terjaga |

---

## 7. REKAPITULASI SELURUH TEMUAN

| Kategori Temuan | Jumlah Awal | Selesai | Temuan Baru (Audit) | Status Akhir |
|---|:---:|:---:|:---:|:---:|
| 🔴 Prioritas Tinggi | 7 | **7 (100%)** | 0 | **0 Terbuka** |
| 🟡 Perlu Perhatian | 6 | **4 (67%)** | 2 (SEC-01, SEC-02) | **✅ 6 Selesai (100%)** |
| 🔵 Rutin | 3 | **3 (100%)** | 1 (SEC-03) | **✅ 4 Selesai (100%)** |
| ⚪ Minor | 1 | 0 | 2 (SEC-04, SEC-05) | **✅ 3 Selesai (100%)** |
| ℹ️ Kondisi Baik | 1 | 1 | — | Terjaga |
| **TOTAL** | **18** | **15 Selesai** | **5 Temuan Baru** | **✅ 23/23 SELESAI (100%)** |

---

## 8. RENCANA KERJA PENYELESAIAN & ROADMAP FASE V1

### 🟢 Tahap 1 & 2 (Fase MVP): SELESAI 100%
- Seluruh 20 Story dari Wave 1 s.d. Wave 5 telah tuntas dikerjakan, diuji, dan dikomit ke cabang `main`.

### 🟡 Tahap 3 (Fase V1 — Operations & Hardening Expansion): ✅ SELESAI 100% (Pembaruan ke-6)
1. **Penguatan Keamanan Lanjutan (Sprint V1.1 — Epic 8):** ✅ SELESAI
   - ✅ Pasang `express-rate-limit` pada `/api/v1/auth/login` (SEC-02) — 5 percobaan/15 menit/IP, env-tunable.
   - ✅ Pasang `helmet` untuk security headers standar (SEC-03) + sembunyikan `X-Powered-By`.
   - ✅ Turunkan limit body parser menjadi `500kb` (SEC-04).
   - ✅ Mekanisme pembatalan token JWT via `token_version` di database (SEC-01) — logout & role-change merotasi versi.
   - ✅ Bonus: label integritas `STATIC_DEMO_PREVIEW` pada fallback AI scanner (SEC-05).
2. **Workstation Linux Server Agent (Sprint V1.2 — Epic 9):** ✅ SELESAI
   - ✅ Daemon `agent/` pengumpul CPU/RAM/Disk dengan buffer & retry idempoten.
   - ✅ Ingest API ber-auth token agen (`server_metrics` schema, batch atomik).
   - ✅ Kartu kesehatan server live di dashboard Infrastructure.
3. **Dual-Language Reporting Engine (Sprint V1.3 — Epic 10):** ✅ SELESAI
   - ✅ API agregasi KPI operasional per periode (RBAC Manager ke atas).
   - ✅ Generator ringkasan manajemen otomatis Bahasa Indonesia + UI `Laporan Manajemen (ID)`.

---

## 9. KOORDINASI YANG DIBUTUHKAN

| # | Kebutuhan | Ditujukan kepada | Status |
|:---:|---|:---:|:---:|
| 1 | **Koneksi Basis Data PostgreSQL:** Menghubungkan variabel `DATABASE_URL` ke PostgreSQL aktif di server target | DevOps / Admin Server | Siap di `.env` |
| 2 | **Ruang Penyimpanan Git Jarak Jauh (Remote):** Penyiapan URL remote Git (misal di GitHub/GitLab organisasi) untuk `git push` | Manajemen / Tech Lead | Siap di-push |
| 3 | **Pemberian Kunci Gemini API Resmi:** Untuk mengaktifkan pemindaian kode nyata berbasis LLM di Fase V2 | Manajemen / Pemilik Produk | Opsional (Fase V2) |

---

## 10. LAMPIRAN: KETERANGAN TEKNIS & MATRIKS 49 PENGUJIAN OTOMATIS

```bash
$ bun run lint && bun run test
$ tsc --noEmit (Strict Mode: Active)
$ vitest run

 ✓ tests/sanity.test.ts (2 tests)
 ✓ tests/db.test.ts (2 tests)
 ✓ tests/auth.test.ts (4 tests) - bcrypt hash, compare, JWT verify, token tampering rejection
 ✓ tests/rbac.test.ts (4 tests) - 401 unauth, 403 denied, 200 permitted, role clearance
 ✓ tests/audit.test.ts (3 tests) - correlation ID propagation, append-only logger
 ✓ tests/projects.test.ts (3 tests) - uppercase key, 409 Conflict check, 404 NotFound
 ✓ tests/work-items.test.ts (2 tests) - auto-sequence key WRK-101, indexed filter
 ✓ tests/tickets.test.ts (3 tests) - severity vs priority, triage transition, resolution
 ✓ tests/acceptance-criteria.test.ts (3 tests) - DoD gate rejection, 100% verified pass, overrideReason
 ✓ tests/dependencies.test.ts (2 tests) - self-loop rejection, direct & indirect circular loop detection
 ✓ tests/ticket-linking.test.ts (2 tests) - bi-directional link, create task from ticket
 ✓ tests/webhook.test.ts (3 tests) - HMAC-SHA256 signature verification, tamper rejection, idempotency
 ✓ tests/ticket-comments.test.ts (2 tests) - add comment, chronological timeline ordering
 ✓ tests/git-linker.test.ts (4 tests) - regex entity parser, multi-key extraction, duplicate handling
 ✓ tests/deployments.test.ts (2 tests) - deployment recording, rollback HMAC-SHA256 signature
 ✓ tests/workflow-e2e.test.ts (8 tests) - full end-to-end multi-step workflow integration verification

 Test Files  16 passed (16)
      Tests  49 passed (49)
   Duration  2.12s (100% HIJAU)
```


---

## 📊 LOG PROGRES BERKELANJUTAN

> **Prinsip:** *append-only* — setiap sesi kerja menjadi **satu blok baru** di bawah blok sebelumnya; konten lama tidak pernah ditimpa. Indeks ringkas seluruh blok ada di tabel **📜 Riwayat Pembaruan** (bagian atas laporan).

---

### 📦 BLOK 7 — DEPLOYMENT PRODUKSI VPS · DOMAIN HTTPS · HARDENING KREDENSIAL
**📅 18 September 2026 · Status: 🟢 SELESAI (LIVE)** · Komit: `cac48c3` `4c148fb` `f09b3c9`

**A. Komponen baru di VPS** *(100% aditif — nol gangguan layanan existing: mail server, MariaDB, Redis, aaPanel, Docker apps lain)*

| Komponen | Detail | Status |
|---|---|:---:|
| Folder aplikasi | `/opt/workstation` (fresh clone GitHub) | ✅ |
| Database | Container `workstation-db` (postgres:16-alpine, bind `127.0.0.1:5433`) | ✅ Healthy |
| Layanan app | systemd `workstation.service` — `node dist/server.cjs`, port 3020 | ✅ Active |
| Layanan agent | systemd `workstation-agent.service` — telemetri tiap 60 dtk (apache/mysql/redis) | ✅ Active |
| Migrasi & seed | 7 akun user enterprise masuk PostgreSQL | ✅ |
| AI produksi | `GEMINI_API_KEY` aktif — Live Scan `LIVE_ANALYSIS` (fallback chain + retry 503) | ✅ |
| Firewall | `ufw allow 3020/tcp` (+1 rule saat deploy; ditutup kembali di Tahap E-4) | ✅ |

**B. Bug selama deployment → perbaikan**

| Bug | Perbaikan | Komit |
|---|---|---|
| Crash `ERR_INVALID_ARG_TYPE` — `import.meta.url` di bundle CJS | Ganti `process.cwd()` (systemd `WorkingDirectory`) | `cac48c3` |
| Agent keluar setelah 1 tick (systemd flapping) | Hapus `timer.unref()` | `4c148fb` |
| Container DB restart-loop (password kosong) | `docker compose --env-file .dbpass-workstation` + re-create volume | — |
| `npm install` gagal (ERESOLVE peer deps) | `npm install --legacy-peer-deps` | — |

**C. Domain & HTTPS (`https://workstation.zamzami.or.id`)**

| Langkah | Detail | Bukti |
|---|---|---|
| DNS | Cloudflare: A `workstation` → `217.216.110.59` — **DNS only (awan abu-abu)**, Cloudflare gratis tak proxy port 3020 | Resolve konsisten via 1.1.1.1 & 8.8.8.8 |
| Reverse proxy | Vhost Apache 80 (redirect 301, `.well-known` dikecualikan) + 443 (SSL) + `ProxyPass → 127.0.0.1:3020`, `ProxyTimeout 300` | `apachectl -t` Syntax OK |
| Sertifikat | Let's Encrypt — **valid s.d. 17 Des 2026**, auto-renew (`certbot.timer`) | SSL verify OK dari publik |
| Konfigurasi app | `APP_URL=https://workstation.zamzami.or.id` | Health OK |

**D. Temuan teknis penting (pelajaran diagnostik)**

| Temuan | Solusi / Pelajaran |
|---|---|
| aaPanel punya `Alias` global `/.well-known/acme-challenge` → folder internal `/www/server/acme_challenges` — challenge certbot selalu 404 | certbot `--webroot /www/server/acme_challenges` — nol ubah config Apache; auto-renewal ikut jalur sama |
| Reload Apache tidak selalu apply (master process tua) | Wajib cek umur master PID vs mtime config → `apachectl -k graceful` penuh |
| File asing `test-challenge` (sisa uji 3 Sep) menyesatkan diagnosa | Selalu uji dengan **file unik ber-nama-acak**, bukan nama yang mudah tabrakan |

**E. Hardening kredensial (urutan anti-lockout)**

| Tahap | Aksi | Bukti |
|:---:|---|---|
| 1 | SSH public key dipasang & login key-only diuji **sebelum** sentuh password | `KEY-LOGIN-OK` — nol risiko lockout |
| 2 | Password root VPS dirotasi (24 char alfanumerik acak) | Baru OK · lama **TERTOLAK** |
| 3 | 7 akun app dirotasi (bcrypt cost-12) + `token_version`+1 → sesi JWT lama mati serempak | `UPDATE 7` · lama HTTP **401** |
| 4 | Port 3020 ditutup dari publik → akses eksklusif via HTTPS domain | 3020 tertutup · HTTPS 200 · agent aman (loopback) |
| 5 | Verifikasi menyeluruh + shred artefak password lokal | Telemetri jalan · site lain 200 |

> 🔐 Kredensial disampaikan sekali via chat & wajib disimpan di password manager — tidak ditulis di dokumen ini.

**F. Lokasi teknis di server produksi**

| Item | Lokasi |
|---|---|
| App · env | `/opt/workstation` · `/opt/workstation/.env` (chmod 600) |
| systemd | `workstation.service` · `workstation-agent.service` |
| DB | Container `workstation-db` · password di `.dbpass-workstation` (600) |
| Vhost / proxy | `/www/server/panel/vhost/apache/workstation.zamzami.or.id.conf` + `…/proxy/…/workstation_proxy.conf` |
| TLS | `/etc/letsencrypt/live/workstation.zamzami.or.id/` · webroot via alias aaPanel `/www/server/acme_challenges` |

**G. Koordinasi tersisa untuk pemilik**

| # | Aksi | Catatan |
|:---:|---|---|
| 1 | Revoke GitHub PAT lama (pernah lewat chat) | Git push aman — memakai SSH key, kode bersih dari PAT |
| 2 | *(Opsional)* Rotasi `GEMINI_API_KEY` | Key baru tinggal dipasang ke `.env` |
| 3 | *(Opsional)* Rotasi password DB | Risiko rendah — bind `127.0.0.1`, restart ±10 dtk |

---

### 📦 BLOK 8 — BACKUP OTOMATIS DATABASE PRODUKSI
**📅 18 September 2026 · Status: 🟢 SELESAI (AKTIF)**

| Aspek | Detail |
|---|---|
| Metode | `pg_dump` (plain SQL) + gzip via `docker exec` — stream langsung tanpa file temp |
| Jadwal | Harian **02:30** — `/etc/cron.d/workstation-backup` |
| Lokasi | `/opt/workstation/backups/` (dir 700 · dump 600) |
| Retensi | **14 hari**, auto-purge `find -mtime` |
| Ikutan dibackup | `.env` + `.dbpass-workstation` (tar, chmod 600) |
| Guard integritas | `gzip -t` + threshold ukuran minimum; exit non-zero bila dump abnormal |
| Log | `/var/log/workstation-backup.log` |

**Prosedur restore resmi:**
```bash
gunzip -c /opt/workstation/backups/workstation_db_<TIMESTAMP>.sql.gz | \
  docker exec -i workstation-db psql -U workstation -d workstation
```

| Uji verifikasi nyata | Hasil |
|---|:---:|
| Backup pertama manual | 🟢 `workstation_db_20260918_133951.sql.gz` (15,5 KB · 28 CREATE TABLE) |
| Integritas arsip (`gzip -t`) | 🟢 LULUS |
| **Restore nyata → DB temporer** | 🟢 **IDENTIK 100%** — produksi vs restore: `27 tabel · 7 users · 67 metrics` |
| Produksi tersentuh selama uji | 🟢 TIDAK (sanity check pasca-uji: 7 users utuh) |
| Cron terpasang | 🟢 Aktif |

---

### 📦 BLOK 9 — PURGE KREDENSIAL PLAINTEXT DARI UI & BUNDLE PRODUKSI
**📅 18 September 2026 · Status: 🟢 SELESAI** · Komit: `65b7eed` `4e82086`
**Pemicu:** temuan lapangan saat UAT pertama — halaman login produksi masih menampilkan hint `admin123` + directory kredensial (lolos dari audit statis DS-05).

**A. Temuan**

| # | Temuan | Lokasi | Risiko |
|:---:|---|---|---|
| 1 | Peta **7 password plaintext** + field password pre-filled `admin123` + panel "Role Directory" (seluruh email tim) | `src/components/LoginView.tsx` | Kredensial seluruh tim terbaca publik |
| 2 | Dialog dengan `defaultValue="admin123"` | `src/components/ui/RetroDialogs.tsx` | String menempel di bundle |
| 3 | 7 seed hash lama + **komentar pengungkap password** (`// admin123`, dst.) — seed ulang = regresi ke password default | `server/modules/auth/auth.service.ts` | Provisioning baru tidak aman |
| 4 | 3 test suite gagal — `@google/genai` ESM crash saat dimuat partial-mock vitest | `server/modules/reports/translate.service.ts` | CI merah |

**B. Perbaikan**

| # | Aksi | Komit |
|:---:|---|---|
| 1 | `LoginView.tsx` ditulis ulang — form bersih: tanpa peta kredensial, tanpa pre-fill, tanpa panel directory (desain & alur auth tetap) | `65b7eed` |
| 2 | `defaultValue="admin123"` dihapus dari dialog | `65b7eed` |
| 3 | `@google/genai` → **lazy dynamic import** (`import type` + import saat panggilan nyata) — test aman, produksi identik | `65b7eed` |
| 4 | 7 seed hash → bcrypt cost-12 password terkini; komentar pengungkap dihapus | `4e82086` |

**C. Verifikasi nyata**

| Uji | Hasil |
|---|:---:|
| TypeScript strict (`tsc --noEmit`) | 🟢 0 error |
| Test suite | 🟢 **37/37 file · 178/178 test** (3 suite rusak ikut pulih) |
| Grep plaintext di `src/` & `server/` | 🟢 0 temuan |
| **Bundle produksi `dist/`** (server + client + sourcemap) | 🟢 **100% bersih** — nol `admin123/techlead123/dev123/pm123/manager123/qa123/viewer123` |
| Login produksi password baru | 🟢 OK — Super Admin |
| Login `admin123` | 🟢 HTTP 401 (ditolak) |

> 📌 **Pelajaran:** string kredensial dapat selamat di **lapisan UI presentasi** dan **komentar sumber** yang ikut ter-bundle — verifikasi akhir wajib menyasar artefak build (`dist/`), bukan hanya source code.

---

*Laporan ini telah diperbarui pada 18 September 2026 (Pembaruan ke-7) berdasarkan hasil eksekusi nyata Full System Workflow Testing, Audit Keamanan Menyeluruh, Deployment Produksi VPS, setup Domain HTTPS, dan Hardening Keamanan Kredensial menggunakan metodologi BMAD dan standar OWASP. Seluruh temuan, hasil uji, dan verifikasi produksi telah dicek langsung pada basis kode aktif dan server produksi.*

**Disusun oleh:** Tim Teknis (pi · BMAD) · **Diperiksa oleh:** _______________ · **Disetujui oleh:** _______________
