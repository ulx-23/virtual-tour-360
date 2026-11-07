# Progres implementasi profesional

## Selesai

- Audit fitur awal dan roadmap: [TOUR_BUILDER.md](./TOUR_BUILDER.md).
- Backup MySQL lokal dan media sebelum perubahan skema: [MIGRATION_SUPABASE.md](../MIGRATION_SUPABASE.md).
- Pemeriksaan aset wajib sebelum ekspor ZIP standalone.
- Konverter Single HTML dari ZIP standalone, dengan batas 16 MiB dan aset inline. Tombol unduh tersedia untuk paket kecil; uji `file://` di browser terintegrasi berhasil untuk navigasi Scene 1 ke Scene 2 tanpa resource HTTP eksternal.

## Berikutnya

- Verifikasi unit/integrasi perubahan ekspor dan catat hasil pada [TESTING_REPORT.md](./TESTING_REPORT.md).
- Validasi isi ZIP setelah ditulis, uji Chrome/Edge untuk Single HTML, kemudian storage persisten, skin editor, jenis hotspot tambahan, dan paket Windows.
- Migrasi PostgreSQL setelah target Supabase tersedia dan data sumber telah diinventarisasi.
