# Sistem ekspor

## Status sekarang

`ExportService` menghasilkan ZIP web standalone, backup `.vtbackup.zip` (manifest `1.0.0`), dan ZIP panorama asli. ZIP standalone memakai `src/server/templates/standalone/` dengan `window.TOUR_DATA` di `tour-data.js`; tidak membutuhkan Next.js, MySQL, Supabase, CDN, atau kredensial saat dijalankan melalui server statis lokal. Backup import memeriksa Zip Slip sebelum ekstraksi.

Validasi pra-ekspor kini menolak ZIP standalone jika panorama, thumbnail yang direferensikan, atau denah tidak tersedia atau path keluar dari `public/`. Status pekerjaan menjadi `FAILED`, bukan `COMPLETED`.

Single HTML tersedia sebagai konverter lokal dari ZIP standalone yang sudah diekspor:

```powershell
npm run export:html -- public/exports/nama-paket-standalone.zip public/exports/virtual-tour.html
```

Perintah tidak menimpa output yang sudah ada. Konverter mengemas CSS, JavaScript Marzipano, `TOUR_DATA`, panorama, thumbnail, dan denah ke satu HTML dengan data URL. Batas total isi sumber 16 MiB; tur lebih besar tetap memakai ZIP. Halaman detail tur menyediakan tombol `Single HTML` untuk ZIP standalone yang selesai, dengan batas respons 2 MiB; unduh ZIP dan gunakan CLI untuk HTML yang lebih besar. Output diuji dengan membuka `file://` di browser terintegrasi: 10 scene tampil, hotspot Scene 1 ke Scene 2 berfungsi, dan daftar resource HTTP eksternal kosong. Pengujian terpisah pada Chrome dan Edge serta semua jenis hotspot belum dilakukan.

## Batasan yang belum diselesaikan

- ZIP saat ini ditulis ke `public/exports/` dan pekerjaan diproses melalui `setImmediate`. Untuk Vercel, output harus disimpan di object storage dan proses pekerjaan perlu eksekusi yang dapat diandalkan.
- Single HTML dibangun dari ZIP yang sudah selesai; batas unduhan langsung 2 MiB dan tur besar memerlukan CLI lokal. Paket Electron Windows belum ada.
- Belum ada pemeriksaan akhir yang membuka ZIP dan memverifikasi semua path manifest. Ini wajib sebelum klaim validasi offline menyeluruh.
- Jenis hotspot multimedia, skin tur, dan data terkait yang belum diimplementasikan belum bisa ikut dalam ekspor.

## Rencana QA

Untuk setiap format, periksa manifest, semua file yang direferensikan, dan larangan URL localhost/API/cloud. Ekstrak ZIP lalu jalankan melalui server statis tanpa jaringan. Single HTML harus diuji dengan membuka `file://` secara langsung di Chrome dan Edge. Paket Electron diuji sebagai aplikasi Windows portable yang benar-benar dibangun.
