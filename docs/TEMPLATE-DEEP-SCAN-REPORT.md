<!--
═══════════════════════════════════════════════════════════════════
 CARA PAKAI TEMPLATE INI
═══════════════════════════════════════════════════════════════════
 1. Salin file ini ke project tujuan, ganti nama menjadi:
    DEEP-SCAN-REPORT-[TAHUN-BULAN-TANGGAL].md  (contoh: DEEP-SCAN-REPORT-2026-10-01.md)

 2. Ganti SEMUA teks dalam [kurung siku] dengan data project yang diperiksa.

 3. Hapus blok komentar ini sebelum laporan dibagikan (opsional — komentar
    tidak ikut tampil saat file .md di-render).

 4. PEDOMAN BAHASA (untuk audiens manajer):
    • Badan laporan = bahasa sehari-hari yang profesional, hindari istilah teknis.
    • Detail teknis HANYA di Lampiran (bagian 10).
    • Contoh konversi istilah:
      ✗ "bcrypt hash password admin bocor ke repo"
      ✓ "kata sandi sistem terenkripsi ikut tersimpan di penyimpanan kode"
      ✗ "endpoint OTP belum ada rate limiting"
      ✓ "kode verifikasi belum dibatasi jumlah permintaan dan percobaannya"
      ✗ "prisma db push --accept-data-loss di deploy script"
      ✓ "prosedur pembaruan database dapat menimpa data tanpa peringatan"

 5. SKALA PRIORITAS:
      🔴 Prioritas Tinggi  → selesaikan ≤ 1 minggu (data/keamanan/uang)
      🟠 Perlu Perhatian   → selesaikan ≤ 2 minggu
      🟡 Rutin             → selesaikan ≤ 1 bulan
      🟢 Minor             → housekeeping, sambil jalan
      ℹ️ Info / Baik       → catatan atau kondisi positif, tanpa tindakan

 6. SKALA STATUS:
      🔴 Belum dikerjakan (sebutkan %)  ·  🟡 Sedang berjalan (sebutkan %)
      🟢 Selesai  ·  ⚪ Ditunda (sebutkan alasan & target)

 7. ATURAN EMAS: laporan ke atasan harus SEIMBANG — selalu isi bagian 3
    (Hal yang Berjalan Baik) dengan 5–8 poin nyata sebelum menyampaikan temuan.
═══════════════════════════════════════════════════════════════════
-->

# LAPORAN PROGRES KERJA — PEMERIKSAAN MENYELURUH PROJECT [NAMA PROJECT]

**[Deep Scan & Penilaian Kondisi Aplikasi / Dokumentasi / Infrastruktur — sesuaikan]**

---

| | |
|---|---|
| **Tanggal Laporan** | [DD Bulan Tahun] |
| **Disusun oleh** | [Nama / Tim — dan metode, mis. "pemeriksaan otomatis BMAD Code Review"] |
| **Ditujukan kepada** | [Nama / Jabatan Atasan] |
| **Objek Pemeriksaan** | [Ruang lingkup: kode program, keamanan, dokumentasi, penyimpanan kode, server, dst.] |
| **Basis Pemeriksaan** | [Versi/commit/tanggal kondisi yang diperiksa + status rilis terakhir] |
| **Jumlah Temuan** | **[XX temuan]** — [X] Prioritas Tinggi · [X] Perlu Perhatian · [X] Rutin · [X] Minor · [X] dalam kondisi baik |
| **Status Laporan** | 🆕 Laporan Awal / 🔄 Pembaruan ke-[n] — [menunggu arahan / dalam penyelesaian] |

---

## ISI LAPORAN

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Kondisi Umum Project](#2-kondisi-umum-project)
3. [Hal yang Sudah Berjalan Baik](#3-hal-yang-sudah-berjalan-baik)
4. [Temuan Prioritas Tinggi — Perlu Selesaikan Minggu Ini](#4-temuan-prioritas-tinggi)
5. [Temuan Perlu Perhatian](#5-temuan-perlu-perhatian)
6. [Temuan Rutin & Minor](#6-temuan-rutin--minor)
7. [Rekapitulasi Seluruh Temuan](#7-rekapitulasi-seluruh-temuan)
8. [Rencana Kerja Penyelesaian](#8-rencana-kerja-penyelesaian)
9. [Koordinasi yang Dibutuhkan](#9-koordinasi-yang-dibutuhkan)
10. [Lampiran: Keterangan Teknis Singkat](#10-lampiran-keterangan-teknis-singkat)

---

## 1. RINGKASAN EKSEKUTIF

<!--
Pola 4 paragraf pendek (maks. 1 halaman):
  P1: Kondisi umum — sehat/butuh perhatian + bukti 1 kalimat (rilis berhasil, pemeriksaan lolos, dsb.)
  P2: Angka temuan + penegasan dampak ke pengguna (ada/tidak)
  P3: Daftar 3–5 poin paling penting, satu kalimat per poin, bahasa awam
  P4: Estimasi total usaha penyelesaian poin penting + arahkan ke bagian 8 & 9
-->

[P1 — Kondisi umum project: sehat/perlu perhatian. Sertakan 1 bukti konkret, mis. rilis terakhir berhasil / pemeriksaan kualitas lolos.]

Pemeriksaan menyeluruh pada [tanggal] menemukan **[XX] poin** tindak lanjutan. **[Tegaskan: tidak ada/m ada temuan yang mengganggu layanan pengguna saat ini; semua bersifat pencegahan/perbaikan].**

**[X] poin penting** yang disarankan selesai [timeframe]:

1. **[Temuan penting #1 dalam bahasa awam]** — [dampaknya apa].
2. **[Temuan penting #2]** — [dampaknya].
3. **[Temuan penting #3]** — [dampaknya].
4. **[Temuan penting #4]** — [dampaknya].

**Keseluruhan poin penting di atas dapat diselesaikan dalam [± X hari kerja efektif]**, dengan pembagian tugas yang jelas (bagian 8 dan 9).

---

## 2. KONDISI UMUM PROJECT

### 2.1 Kartu Penilaian per Area

<!--
Gunakan nilai huruf A+ s.d. D dengan bintang ⭐ (maks 5). Nilai panduan:
  A/B = tidak ada hambatan operasional  ·  C = ada pekerjaan rumah  ·  D = butuh prioritas
Pilih 5–6 area yang relevan dengan project (boleh ganti nama areanya).
-->

| Area Penilaian | Nilai | Keterangan Singkat |
|---|:---:|---|
| [🏗️ Struktur / Arsitektur] | **[B+]** | [1 kalimat] |
| [🔐 Keamanan & Perlindungan Data] | **[C+]** | [1 kalimat] |
| [🧪 Uji Coba Otomatis / Kualitas] | **[D+]** | [1 kalimat] |
| [🚀 Proses Rilis & Server] | **[B]** | [1 kalimat] |
| [📦 Ketertiban Penyimpanan Kode] | **[C+]** | [1 kalimat] |
| [📚 Dokumentasi] | **[C+]** | [1 kalimat] |

### 2.2 Fakta Angka Singkat

| Indikator | Angka |
|---|---|
| Skala [aplikasi/sistem] | [X titik layanan · X halaman/modul · X tabel data · ± X baris kode] |
| Aktivitas [30 hari terakhir] | [X commit / X penyelesaian tugas] |
| Hasil pemeriksaan kualitas otomatis | [lolos tanpa error / X temuan] |
| Uji coba otomatis | [X dari X berhasil + catatan singkat jika ada] |

---

## 3. HAL YANG SUDAH BERJALAN BAIK

<!--
Isi 5–8 poin NYATA (jangan mengarang). Format: pencapaian + penjelasan singkat awam.
Ini penting: laporan ke atasan yang hanya berisi masalah terkesan tidak adil dan tidak proporsional.
-->

| # | Pencapaian | Penjelasan Singkat |
|:---:|---|---|
| 1 | **[Pencapaian terbesar, mis. rilis berhasil]** | [1–2 kalimat] |
| 2 | **[Pencapaian keamanan]** | [1–2 kalimat] |
| 3 | **[Pencapaian proses/disiplin kerja]** | [1–2 kalimat] |
| 4 | **[Pencapaian dokumentasi]** | [1–2 kalimat] |
| 5 | **[Pencapaian infrastruktur/alat]** | [1–2 kalimat] |
| 6 | **[Pencapaian lain]** | [1–2 kalimat] |

---

## 4. TEMUAN PRIORITAS TINGGI

> **Perlu selesaikan minggu ini.** [1 kalimat konteks: mengapa kategori ini penting]. Estimasi total: **[± X hari kerja efektif]**.

<!--
Kriteria masuk kategori ini: menyangkut data pengguna, keamanan akses, uang, atau potensi kerugian nyata.
Idealnya maksimal 5 baris — kalau lebih, berarti pembagian prioritasnya perlu ditinjau ulang.
-->

| No | Temuan | Di Mana | Artinya bagi Kita | Status & Progres | Langkah Penyelesaian |
|:---:|---|---|---|---|---|
| **[ID]** | **[Judul temuan bahasa awam]** — [1 kalimat penjelasan] | [Area/fitur, bukan nama file] | [Dampak bisnis: risiko apa, siapa kena] | [emoji status] — [X%] | [Langkah konkret] + (± [estimasi jam]) |

---

## 5. TEMUAN PERLU PERHATIAN

> **Rencanakan penyelesaian 1–2 minggu ke depan.** [1 kalimat konteks].

| No | Temuan | Di Mana | Artinya bagi Kita | Status & Progres | Langkah Penyelesaian |
|:---:|---|---|---|---|---|
| **[ID]** | **[Judul temuan]** — [1 kalimat] | [Area/fitur] | [Dampak] | [status] — [X%] | [Langkah] (± [estimasi]) |
| **[ID]** | **[Judul temuan]** — [1 kalimat] | [Area/fitur] | [Dampak] | [status] — [X%] | [Langkah] (± [estimasi]) |

---

## 6. TEMUAN RUTIN & MINOR

> **Dikerjakan sambil jalan (housekeeping).** Tidak berdampak langsung ke pengguna.

| No | Temuan | Di Mana | Langkah Penyelesaian | Prioritas | Status |
|:---:|---|---|---|:---:|:---:|
| [ID] | [Temuan singkat] | [Area] | [Langkah] | 🟡 Rutin / 🟢 Minor | [status] |

---

## 7. REKAPITULASI SELURUH TEMUAN

| Kategori | Jumlah | Rincian Status |
|---|:---:|---|
| 🔴 Prioritas Tinggi (minggu ini) | **[X]** | [ID-ID + status singkat] |
| 🟠 Perlu Perhatian (1–2 minggu) | **[X]** | [ID-ID] |
| 🟡 Rutin (bulan ini) | **[X]** | [ID-ID] |
| 🟢 Minor (sambil jalan) | **[X]** | [ID-ID] |
| ℹ️ Catatan / Kondisi Baik | **[X]** | [ID-ID] |

**Total: [XX] temuan.** [1 kalimat penegasan dampak ke pengguna].

---

## 8. RENCANA KERJA PENYELESAIAN

### 🚨 Tahap 1 — [Minggu Ini] ([± X hari kerja efektif])

| Urut | ID | Pekerjaan | PIC | Estimasi |
|:---:|:---:|---|---|:---:|
| 1 | [ID] | [Pekerjaan] | [Nama/Peran] | [X jam] |

### 📅 Tahap 2 — [Minggu/Minggu Depan]

| Urut | ID | Pekerjaan | Catatan |
|:---:|:---:|---|---|
| [n] | [ID] | [Pekerjaan] | [Prasyarat/ketergantungan] |

### 🗓️ Tahap 3 — [Bulan Ini]

| Urut | ID | Pekerjaan |
|:---:|:---:|---|
| [n] | [ID] | [Pekerjaan] |

---

## 9. KOORDINASI YANG DIBUTUHKAN

<!--
Isi ini yang paling sering dilupakan padahal paling ditunggu atasan:
apa yang berada DI LUAR kendali tim teknis? Keputusan? Akses? Persetujuan? Anggaran?
-->

| # | Kebutuhan | Ditujukan kepada | Terkait Temuan |
|:---:|---|---|:---:|
| 1 | [Keputusan/persetujuan/akses yang dibutuhkan] | [Nama/Peran] | [ID] |
| 2 | [Keputusan/persetujuan/akses yang dibutuhkan] | [Nama/Peran] | [ID] |

> ⚠️ **Sesuai protokol kerja tim:** [sebutkan alur kerja/izin yang berlaku di project ini, mis. cabang kerja → review → penyaluran ke server].

---

## 10. LAMPIRAN: KETERANGAN TEKNIS SINGKAT

<!--
Bagian untuk tim teknis — manajemen tidak perlu membaca.
Petakan setiap ID temuan ke lokasi/file/kode error/bukti verifikasi.
Boleh menggunakan istilah teknis penuh di sini.
-->

| ID | Detail Teknis |
|:---:|---|
| [ID] | [File/lokasi · perintah verifikasi · bukti · tautan issue] |

---

*Laporan ini disusun berdasarkan pemeriksaan menyeluruh [tanggal] menggunakan [metode/kerangka kerja]. Setiap temuan telah diverifikasi langsung pada kondisi terkini — bukan dugaan. Mohon perbarui kolom **Status & Progres** setiap kali ada temuan yang diselesaikan agar dokumen ini tetap menjadi sumber kebenaran progres kerja.*

**Disusun oleh:** [Nama / Tim] · **Diperiksa oleh:** _______________ · **Disetujui oleh:** _______________
