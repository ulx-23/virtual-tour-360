========================================================================
VIRTUAL TOUR 360° — PAKET EKSPOR STANDALONE (OFFLINE / ZERO-DEPENDENCY)
========================================================================

Selamat! Paket virtual tour ini telah diekspor sebagai aplikasi web statis mandiri.
Paket ini 100% independen: tidak memerlukan Next.js, database MySQL, backend server, ataupun koneksi internet.

------------------------------------------------------------------------
CARA MENJALANKAN (OFFLINE / LOCAL SERVER):
------------------------------------------------------------------------

1. METODE 1: Local HTTP Server (Sangat Disarankan)
   Karena kebijakan keamanan browser modern terhadap CORS pada protokol file:// lokal,
   disarankan menjalankan melalui web server statis sederhana:

   - Windows: jalankan "Start tour.cmd", lalu buka http://127.0.0.1:4173.
     Launcher memerlukan Node.js yang sudah terpasang, tanpa mengunduh paket.
     Alternatif terminal: node serve.cjs

   - Dengan Python 3:
     python -m http.server 8080
     Lalu buka browser di http://localhost:8080

   - Dengan PHP (Laragon / XAMPP):
     php -S localhost:8080
     Lalu buka browser di http://localhost:8080

   - Dengan VS Code:
     Pasang ekstensi "Live Server", klik kanan pada index.html, pilih "Open with Live Server".

2. METODE 2: Hosting Web Statis Publik
   Anda dapat langsung mengunggah seluruh isi folder ini ke penyedia hosting statis mana pun:
   - GitHub Pages
   - Vercel / Cloudflare Pages / Netlify (cukup drop folder)
   - Apache / Nginx / CPanel (public_html)
   - AWS S3 / Google Cloud Storage static website hosting

------------------------------------------------------------------------
STRUKTUR FILE:
------------------------------------------------------------------------
├── index.html         -> Halaman utama virtual tour
├── app.js             -> Logika player Marzipano & interaksi hotspot
├── style.css          -> Tampilan responsif & estetika UI
├── tour-data.js       -> Manifest konfigurasi tur & relasi scene
├── vendor/
│   └── marzipano.js   -> Pustaka WebGL 360° Marzipano mandiri
└── panoramas/         -> Foto panorama 360° equirectangular
└── floor-plans/       -> Denah lokasi & penanda (jika ada)

Dihasilkan secara otomatis oleh Virtual Tour 360° Builder.

tour.json sama dengan konfigurasi TOUR_DATA. integrity.json memuat ukuran dan
checksum SHA-256 setiap file. Ekspor diverifikasi sebelum status selesai.
Tautan eksternal memerlukan internet ketika diklik dan meminta konfirmasi.
Single HTML tersedia untuk sumber maksimal 16 MiB melalui konverter aplikasi.
Paket Windows dibangun terpisah untuk komputer tanpa Node.js.

