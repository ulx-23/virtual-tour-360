# Audit dan roadmap pembuat virtual tour

Audit 6 November 2026. Kode yang sudah ada menjadi dasar pengembangan; desain dan fitur lama dipertahankan.

## Status fitur

| Area | Sudah ada | Celah terhadap permintaan baru |
| --- | --- | --- |
| Editor | Panorama interaktif, daftar scene, inspector hotspot, klik untuk menempatkan hotspot, simpan, undo/redo lokal, tampilan mobile | Pencarian dan drag urutan scene, autosave metadata, properti scene lengkap, pengaturan transisi, dan uji persistensi undo/redo |
| Media | Upload multi-file JPG/PNG/WebP, validasi ukuran dan rasio 2:1, thumbnail Sharp, penyimpanan record media | Preview sebelum upload, retry per file, pemrosesan gambar besar bertahap, multiresolution tiles, storage permanen untuk Vercel |
| Hotspot | Navigasi, informasi, gambar, video, tautan eksternal, navigasi lantai dalam enum dan editor navigasi/informasi | Audio, dokumen, galeri, properti visual terstruktur, pengujian semua jenis aksi dan aset offline |
| Denah | Gedung/lantai, upload denah, marker, overlay pada viewer | Radar arah kamera dan verifikasi interaksi lintas lantai di desktop/mobile |
| Viewer | Marzipano, kontrol kamera/zoom, fullscreen, auto-rotate, giroskop, daftar scene, denah | Riwayat navigasi, keyboard navigation menyeluruh, fallback aset rusak dan pengukuran performa perangkat nyata |
| Skin | Tema terang/gelap aplikasi, pilihan gaya tombol hotspot | Editor skin per tur, tiga preset tersimpan, propagasi semua pengaturan ke ekspor |
| Ekspor | ZIP web mandiri dengan `window.TOUR_DATA`, panorama, thumbnail, denah, vendor Marzipano lokal; backup v1.0.0; Single HTML dari ZIP melalui tombol unduh kecil atau CLI lokal | Paket Windows portable, validasi akhir ZIP, storage permanen dan pekerjaan yang andal di Vercel |

## Urutan implementasi

1. Kuatkan ekspor ZIP: validasi semua aset dan manifest, uji tanpa akses jaringan, pastikan status sukses hanya setelah verifikasi arsip.
2. Pindahkan storage ke object storage dan pekerjaan ekspor ke alur yang cocok dengan Vercel; pertahankan kompatibilitas offline dan backup.
3. Uji batas ukuran Single HTML dan berbagai aset, lalu verifikasi nyata di Chrome dan Edge melalui `file://`.
4. Tambahkan editor skin per tur dan jenis hotspot/multimedia yang belum ada, lalu buat data tersebut ikut ke ekspor.
5. Lengkapi editor scene, viewer, denah, upload besar, dan QA responsif.
6. Siapkan packaging Electron Windows di build lokal/CI setelah viewer standalone stabil. Jangan menyatakan EXE tersedia sebelum paket dibangun dan diuji.

Migrasi PostgreSQL dan langkah cutover dijelaskan di [MIGRATION_SUPABASE.md](../MIGRATION_SUPABASE.md).
