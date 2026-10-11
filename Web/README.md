# Resilio-Health: Hospital Information System (HIS)
> **Tugas 1 — Milestone 1: Pengembangan Antarmuka Produk Web Responsif dan Aksesibel**  
> **Mata Kuliah:** Pengembangan Aplikasi Web (PAW)  
> **Tag Rilis:** `v0.1`  
> **Pengembang:** Michael Alex  

---

## 1. Konsep Produk
**Resilio-Health** adalah antarmuka Sistem Informasi Rumah Sakit (HIS / EHR) modern yang dirancang untuk menjamin kerahasiaan, integritas, dan ketersediaan data medis pasien secara tangguh (*offline-first resilience*).

Aplikasi ini merupakan bagian integral dari proyek terpadu 3 mata kuliah:
1. **Pengembangan Aplikasi Web (PAW):** Antarmuka berbasis Next.js App Router, React 19, TypeScript, dan Tailwind CSS yang responsif, modular, serta memenuhi standar aksesibilitas web.
2. **Keamanan Komputasi dan Siber:** Penerapan arsitektur *Zero-Trust API Gateway*, hak akses berbasis *Need-to-Know*, serta perlindungan terhadap kerentanan BOLA (*Broken Object Level Authorization*).
3. **Kriptografi:** Enkripsi *end-to-end* rekam medis menggunakan **AES-256-GCM** dan pembuktian integritas menggunakan **HMAC-SHA256**.

### Sasaran Pengguna
- **Dokter (Tim Medis):** Memeriksa tanda vital, menginput diagnosis klinis, dan meresepkan obat untuk pasien yang di-assign.
- **Pasien:** Memantau rekam medis pribadi secara terenkripsi, mendekripsi secara mandiri, dan melihat otorisasi dokter yang merawat.
- **Administrator Rumah Sakit:** Mengelola penugasan dokter ke pasien rawat inap dan memantau log audit keamanan tanpa dapat membaca isi rekam medis (*Zero-Knowledge*).

---

## 2. Fitur Awal (Milestone 1)
- **Role-Based Authentication Hub:** Halaman login tunggal dengan gerbang akses terisolasi untuk Dokter, Pasien, dan Admin.
- **Formulir Pemeriksaan Klinis dengan Validasi Klien:** Input tanda vital lengkap (tensi, suhu, detak jantung) dengan validasi batas fisiologis dan pesan kesalahan *inline*.
- **Enkripsi & Hashing Sisi Klien:** Implementasi W3C Web Crypto API untuk AES-256-GCM dan HMAC-SHA256.
- **Visualisasi Fluktuasi Tanda Vital:** Grafik batang tren tekanan darah sistolik dan diastolik.
- **Desain Responsif 3 Layar:** Optimal pada Ponsel (navigasi bawah), Tablet (2 kolom), dan Desktop (3 kolom penuh).

---

## 3. Komponen Antarmuka Reusable
Aplikasi memanfaatkan lebih dari 5 komponen antarmuka mandiri bertipe:
1. `StatCard.tsx`: Kartu metrik klinis dan tanda vital bertipe.
2. `StatusBadge.tsx`: Lencana status otorisasi berbasis varian (`success`, `danger`, `warning`, `neutral`).
3. `InputField.tsx`: Komponen input formulir dengan penanganan error dan atribut aksesibilitas WAI-ARIA.
4. `LogoutModal.tsx`: Dialog konfirmasi keluar sistem kustom bertema formal.
5. `TopHeader.tsx`: Bilah navigasi atas responsif dengan kartu profil pengguna.

---

## 4. Struktur Direktori Proyek
```text
Web/
├── app/
│   ├── layout.tsx                # Root layout (lang="id", Montserrat font)
│   ├── page.tsx                  # Halaman Login & Demo Akses Cepat
│   └── beranda/
│       └── page.tsx              # Router Hub Berbasis Peran
├── components/
│   ├── dashboard/
│   │   ├── DokterView.tsx        # Workstation Input EHR & Grafik Tanda Vital
│   │   ├── PasienView.tsx        # Portal Pasien Mandiri & Dekripsi
│   │   └── AdminView.tsx         # Kendali Penugasan Dokter & Log Audit
│   └── ui/
│       ├── StatCard.tsx          # Komponen Reusable: Kartu Metrik
│       ├── StatusBadge.tsx       # Komponen Reusable: Lencana Status
│       ├── InputField.tsx        # Komponen Reusable: Formulir Input
│       ├── TopHeader.tsx         # Komponen Reusable: Header Topbar
│       └── LogoutModal.tsx       # Komponen Reusable: Modal Konfirmasi
├── lib/
│   ├── auth/auth.ts              # Manajemen Sesi & Mock Users
│   ├── crypto/aes.ts             # Enkripsi & Dekripsi AES-256-GCM
│   ├── crypto/hmac.ts            # Hashing & Verifikasi HMAC-SHA256
│   └── db/mockData.ts            # Mock Data Pasien & Dokter
└── tests/
    └── crypto.test.ts            # Pengujian Unit Kriptografi