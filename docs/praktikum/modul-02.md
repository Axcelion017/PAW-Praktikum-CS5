# Dokumen Teknis Modul 2 — HTML Semantik, Tailwind CSS, dan Aksesibilitas
Nama/NIM : Michael Alexander Newton (105224017)
Repositori : https://github.com/Axcelion017/PAW-Praktikum-CS5/tree/main/week-2
## 1. Struktur Semantik
- Kerangka landmark dan hierarki judul halaman utama
header berperan sebagai banner.

nav aria-label="Navigasi utama" berperan sebagai navigation.

main id="konten" berperan sebagai main.

section aria-labelledby="..." berperan sebagai region (karena diberi nama menggunakan aria-labelledby).

aside aria-label="Informasi tambahan" berperan sebagai complementary.

footer berperan sebagai contentinfo.

h1: Kalimat nilai utama produk
    h2: Fitur Utama
        h3: Fitur pertama, Fitur kedua, Fitur ketiga
    h2: Hubungi Kami
    h2: Cara Kerja

- Tangkapan layar pohon aksesibilitas pada DevTools
![alt text](image-11.png)

## 2. Tata Letak Responsif
- Tangkapan layar pada lebar 360 px, 768 px, dan 1280 px
360 px:
![alt text](<localhost(iPhone SE).png>)
768 px:
![alt text](<localhost(iPad Mini).png>)
1280 px:
![alt text](<localhost(Nest Hub Max).png>)
- Kelas Flexbox, Grid, dan breakpoint yang digunakan beserta alasannya

Flexbox: Digunakan pada nav untuk menyusun logo dan menu navigasi. Menggunakan flex-col agar di layar HP (lebar < 640px) elemen disusun menumpuk ke bawah, dan flex-row agar tersusun mendatar di layar yang lebih besar.

Grid: Digunakan pada fitur (ul) dan tata letak utama (div pembungkus section & aside). Grid digunakan agar memudahkan pembagian space berbasis kolom.

Breakpoint: Menerapkan pendekatan mobile-first. Tampilan default dibuat satu kolom untuk HP. sm: (>= 640px) mengubah fitur menjadi 2 kolom, dan lg: (>= 1024px) mengubah fitur menjadi 3 kolom serta membagi layout konten vs aside menjadi rasio 2:1 (lg:grid-cols-[ 2fr_1fr ]).

## 3. Audit Aksesibilitas
- Tabel skor Lighthouse sebelum dan sesudah perbaikan
![alt text](image-8.png)
sebelum latihan audit
![alt text](image-9.png)
setelah latihan audit
![alt text](image-12.png)
sebelum perbaikan halaman utama
![alt text](image-10.png)
Setelah perbaikan halaman utama 
 (halaman latihan dan halaman utama)

 
- Daftar audit yang gagal, penyebab, dan perbaikannya
![alt text](image-13.png)

Penyebab: Pada bagian deskripsi fitur dan petunjuk surel, menggunakan kelas Tailwind text-gray-700 dan text-gray-600 di atas latar belakang halaman yang gelap. Tailwind standar tidak memiliki skala tersebut, sehingga warna teks menjadi pudar atau tidak terbaca oleh pengguna dengan gangguan penglihatan.

Perbaikannya: mengganti nama kelas tersebut menjadi text-white-700 dan text-white-600 agar teks menjadi warna putih dan kontrasnya memenuhi standar aksesibilitas minimum (rasio 4,5:1).
- Hasil pemeriksaan manual dengan papan ketik   
Lewati konten utama:
![alt text](image-14.png)
Nama produk:
![alt text](image-15.png)
Fitur:
![alt text](image-16.png)
Kontak:
![alt text](image-17.png)
Input nama:
![alt text](image-18.png)
Input surel:
![alt text](image-19.png)
Peran:
![alt text](image-20.png)
Tombol Kirim:
![alt text](image-21.png)
(urutan fokus dan garis fokus)
## 4. Kendala dan Penyelesaian

Tidak ada kendala

## 5. Catatan Pemanfaatan AI
Alat, perintah utama, bagian yang digunakan, dan cara memverifikasinya.
Tulis "Tidak menggunakan AI" apabila tidak menggunakan AI.

Alat: Gemini
Perintah: export default function LatihanAudit() {
 return (
 <div className="p-8">
 <div className="text-2xl font-bold">Katalog Alat Laboratorium</div>
 <img src="/next.svg" width={120} height={24} />
 <p className="text-gray-300">Stok diperbarui setiap hari.</p>
 <input type="search" className="border p-2" />
 <button className="ml-2 border p-2">
 <svg width="16" height="16" viewBox="0 0 16 16">
 <circle cx="7" cy="7" r="5" stroke="currentColor" fill="none" />
 </svg>
 </button>
 </div>
 );
}

Mungkin bisa perbaiki aksesibilitas yang terjadi akrena saya mendapatkan angka 82, tolong berikan panduan jangan kodenya langsung 

![alt text](image-22.png)
![alt text](image-23.png)