# Rencana deployment

Target: Next.js di Vercel Hobby, PostgreSQL dan object storage di Supabase. Deployment belum dilakukan.

- Gunakan koneksi runtime Prisma yang kompatibel dengan pooler Supabase dan koneksi migration terpisah. Simpan URL database, `JWT_SECRET`, dan kredensial storage hanya di environment server Vercel.
- Siapkan migration PostgreSQL yang telah ditinjau dan transfer data terverifikasi sebelum mengalihkan trafik. Jangan jalankan reset atau seed demo pada database produksi.
- Migrasikan panorama, thumbnail, denah, avatar, dan file unduhan ke storage permanen. Filesystem fungsi Vercel tidak dapat menjadi penyimpanan hasil upload/ekspor yang persisten.
- Jalankan Prisma validate/generate, typecheck, lint, tests, build produksi, dan smoke test setelah deploy.

Urutan terperinci dan rollback: [MIGRATION_SUPABASE.md](../MIGRATION_SUPABASE.md).
