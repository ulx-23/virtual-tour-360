# Laporan pengujian

Status 6 November 2026: audit fitur dan penguatan pra-ekspor ZIP selesai untuk tahap ini.

| Perintah | Hasil |
| --- | --- |
| `npx tsc --noEmit` | Lolos |
| `npm test -- tests/single-html.test.ts tests/export-assets.test.ts tests/utils.test.ts tests/gyroscope.test.ts` | Lolos: 4 file, 12 tes; tes baru mencakup aset inline serta penolakan panorama hilang |
| `npm run build` | Lolos setelah refaktor preflight, dengan satu peringatan tracing filesystem dinamis pada penyimpanan lokal yang sudah ada |
| `npm run lint` | Gagal: 175 error dan 749 warning di keseluruhan proyek, termasuk file tipe Marzipano, tes, dan kode UI yang sudah ada. Perlu triase terpisah; belum boleh dinyatakan bersih. |

Rangkaian tes penuh belum dijalankan pada database sumber karena tes integrasi membuat dan menghapus record serta file. Siapkan database dan storage uji terpisah sebelum menjalankannya. Validasi pasca-ekspor ZIP yang memeriksa isi arsip juga belum ditambahkan.

Konverter dijalankan pada ZIP standalone tur 10 scene yang sudah ada dan menghasilkan HTML 636.604 byte. Berkas dibuka via `file://` di browser terintegrasi: judul serta daftar 10 scene tampil, klik hotspot Scene 1 memindahkan ke Scene 2, dan resource `http:`/`https:` teramati kosong. Ini belum mencakup Edge, semua hotspot, atau simulasi jaringan terputus pada level sistem.

Endpoint unduh Single HTML dan tombol pada halaman detail sudah lolos typecheck; uji HTTP terautentikasi belum dapat dilakukan karena database sumber saat ini mempunyai 0 tur dan tidak akan diisi dengan data demo yang berpotensi menghapus data.

Pengujian interaktif browser untuk upload, hotspot, denah, Single HTML, Electron, dan Vercel/Supabase belum dilakukan. Jangan menganggap fitur tersebut lolos hanya karena build berhasil.
