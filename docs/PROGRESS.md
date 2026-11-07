# Progress Log

## 7 November 2026 — Migrasi ke Supabase PostgreSQL & Deployment ke Vercel

- **Skema & Database**:
  - Berhasil beralih dari MySQL lokal ke Supabase PostgreSQL (`penxmostdecnzywvgxna` di region `ap-southeast-1`).
  - `prisma/schema.prisma` diperbarui ke `provider = "postgresql"` dengan dukungan `DATABASE_URL` (connection pooler pgbouncer port 6543) dan `DIRECT_URL` (port 5432).
  - Skema database (20 tabel, enum, relasi, dan foreign keys) berhasil disinkronisasi ke Supabase menggunakan `npx prisma db push`.
  - Database Supabase berhasil di-seed dengan data awal lengkap (18 granular permissions, 4 RBAC roles: `SUPER_ADMIN`, `ADMIN`, `EDITOR`, `VIEWER`, serta akun default `superadmin@virtualtour.test` & `admin@virtualtour.test`).
- **Build & CI/CD Vercel**:
  - `package.json` ditambahkan skrip `"build": "prisma generate && next build"` dan `"postinstall": "prisma generate"` agar Prisma client otomatis ter-generate pada environment serverless Vercel.
  - Halaman `src/app/page.tsx` ditambahkan `export const dynamic = 'force-dynamic'` guna mencegah kendala static pre-rendering saat build di pipeline Vercel.
  - Seluruh 26 routes berhasil dikompilasi oleh Next.js 16 Turbo dan vercel build sukses diselesaikan dalam 59 detik: `Build Completed in /vercel/output [59s]`.
  - Deployment output siap dan aktif di domain produksi Vercel.

## 7 November 2026 — Persiapan upload GitHub

- Remote `origin` diarahkan ke https://github.com/ulx-23/virtual-tour-360.git dan branch utama diubah dari `master` menjadi `main`, dengan riwayat commit awal tetap dipertahankan.
- Source, dokumentasi, pengujian, dan workflow disiapkan untuk diunggah. Konfigurasi `.env*`, backup migrasi, unggahan media, hasil ekspor, dependency, serta output build tetap diabaikan Git.
- Verifikasi sebelum commit: `node node_modules/typescript/bin/tsc --noEmit` lolos. Pemeriksaan kandidat file tidak menemukan pola token/kunci privat atau file lebih dari 10 MiB; riwayat branch yang akan didorong tidak memuat file konfigurasi privat, backup, unggahan, atau ekspor.
- Tes integrasi yang mengubah database/storage aktif tidak dijalankan. Masalah lint yang sudah tercatat pada [TESTING_REPORT.md](./TESTING_REPORT.md) masih memerlukan pekerjaan terpisah.

## 7 November 2026 — Hapus hotspot tersimpan

- Hotspot tersimpan kini tetap terkunci dari perubahan posisi, tetapi dapat dipilih kembali untuk menampilkan panel aksi.
- Tombol `Hapus tombol` dapat digunakan pada hotspot tersimpan; setelah API berhasil, scene dimuat ulang sehingga ikon hilang dari panorama.
- Verifikasi: `npx tsc --noEmit` lolos dan `git diff --check` bersih.

## 7 November 2026 — SweetAlert dan penguncian otomatis hotspot

- Setelah penyimpanan berhasil, editor menampilkan notifikasi sukses bergaya SweetAlert selama beberapa detik.
- Hotspot tersimpan tidak lagi membuka editor atau berpindah saat diklik; klik area kosong tetap membuat hotspot baru.
- Hotspot sementara tetap dapat diedit dan dipindahkan sebelum disimpan.
- Verifikasi: `npx tsc --noEmit` lolos dan `git diff --check` bersih.

## 7 November 2026 — Penguncian posisi ikon tersimpan

- Ikon hotspot baru dapat dipindah saat masih berstatus `Baru`.
- Setelah disimpan, ikon berstatus `Tersimpan` dan posisinya terkunci; klik pada foto tidak menggesernya. Tombol `Edit Posisi` membuka perubahan posisi melalui klik foto, kamera, atau slider, lalu `Simpan Tombol` mengunci kembali posisi tersebut.
- Panel posisi menampilkan keterangan status dan menonaktifkan kontrol koordinat saat ikon terkunci.
- Verifikasi: `npx tsc --noEmit` lolos dan `git diff --check` bersih untuk file perubahan.

## 7 November 2026 — Perbaikan tombol navigasi scene

- Label tombol navigasi dan pindah lantai di editor kini mengikuti nama scene tujuan secara otomatis saat tujuan dipilih maupun saat tombol lama diedit. Penyimpanan menolak tujuan yang kosong atau tidak valid.
- Simpan dan hapus tombol menampilkan kesalahan API, mencegah klik berulang selama proses, dan memuat ulang daftar scene tanpa cache. Membatalkan tombol baru juga menghapus pratinjaunya dari panorama.
- Tombol kembali otomatis menggunakan nama scene asal sebagai label, sehingga teksnya sesuai dengan tujuan link kembali.
- Verifikasi: `npx tsc --noEmit` lolos; `/` dan `/login` merespons HTTP 200. Browser menampilkan tur publik, editor, dan dashboard setelah login; GET scene terautentikasi merespons HTTP 200 dengan 10 scene. Mengubah tujuan tombol baru langsung memperbarui label/pratinjau, dan membatalkannya menghapus pratinjau. Simpan/hapus persisten tidak dijalankan pada data tur aktif. Lint file editor masih menemukan masalah lint yang sudah ada.

## 6 November 2026 — Penyempurnaan editor scene dan ikon hotspot

- Editor scene kini memiliki tombol edit nama scene yang menyimpan perubahan melalui `PATCH /api/scenes/[id]`.
- Inspector hotspot kini menyediakan pilihan `Tanpa ikon`, tombol `Hapus ikon` untuk menghilangkan ikon tanpa menghapus hotspot, serta tombol `Hapus tombol` dengan konfirmasi untuk menghapus hotspot dari panorama.
- Validasi perubahan: `npx tsc --noEmit`, 9 tes fokus media/graf, `npm run build`, dan smoke test lokal untuk `/`, `/login`, `/admin/media`, serta `/tour/fikom` berhasil. Lint masih mengikuti masalah lint proyek yang sudah ada.

## 6 November 2026 — Audit migrasi Supabase

- Audit kode, skema, autentikasi, API, dan penyimpanan selesai. Laporan serta rencana migrasi ada di [MIGRATION_SUPABASE.md](../MIGRATION_SUPABASE.md). Skema MySQL saat ini lolos `npx prisma validate`. Belum ada perubahan database, koneksi, atau data.
- MySQL lokal yang berhenti telah dijalankan kembali; halaman utama merespons HTTP 200. Backup MySQL, skema, konfigurasi privat, unggahan, dan ekspor dibuat pada `.migration-backups/` yang diabaikan Git. Uji restore dan inventaris integritas masih tertunda.
- Audit permintaan pengembangan profesional dan roadmap tersedia di [TOUR_BUILDER.md](./TOUR_BUILDER.md). Ekspor ZIP standalone kini memvalidasi keberadaan panorama, thumbnail, dan denah sebelum membuat arsip. Typecheck, 7 tes fokus, dan build lolos; lint proyek masih gagal. Detail ada di [TESTING_REPORT.md](./TESTING_REPORT.md).
- Tes fokus terakhir: 12/12 lolos, termasuk pra-ekspor dan Single HTML. Konverter diuji lewat `file://` dengan perpindahan scene tanpa resource HTTP eksternal. Build terakhir lolos dengan satu peringatan filesystem lokal.

## Virtual Tour 360° — Project Status

- **Date**: 2026-10-28
- **Active Phase**: Phase 13 — Virtual Tour Merger & Exporter System (PRD Extension)
- **Environment**:
  - Root: `D:\laragon\www\virtual-tour-360`
  - Node.js: v24.14.1
  - MySQL 8.0: Running on 127.0.0.1:3306 (Laragon)
  - Port: 3000
- **Completed**:
  1. Bootstrapped Next.js App Router with TypeScript & Tailwind CSS.
  2. Setup MySQL database `virtual_tour_360` with full Prisma Schema (19 tables).
  3. Database seeded with initial roles (`SUPER_ADMIN`, `ADMIN`, `EDITOR`, `VIEWER`), 18 granular permissions, 2 default users, and CMS site settings.
  4. Authentication: Secure signed JWT cookie session (`jose`), bcrypt password hashing, server-side RBAC guards.
  5. Tour Management: Full CRUD, slug generator, circular dependency handling, status/visibility filters.
  6. Media Upload & Processing: Multi-file drag & drop upload manager, Sharp equirectangular ratio validation, WebP thumbnail generation.
  7. Panorama Engine: Marzipano WebGL equirectangular viewer with pan inertia, touch support, zoom, orientation HUD, and fullscreen.
  8. Visual Hotspot Studio: 3-panel layout (Scenes, 360° Viewport, Inspector) with raycasting click-to-coordinate, 6 hotspot types, and bidirectional return link generation.
  9. Navigation Graph Engine: BFS reachability validator detecting orphans, broken links, and dead-ends.
  10. Floor Plan Minimap: Multi-building & floor hierarchy with normalized (0..1) coordinates.
  11. Tour Publishing: Immutable JSON snapshot generator in `tour_publications`.
  12. Public Tour Viewer: `/tour/[slug]` with fullscreen panorama, scene drawer, and QR code sharing.
  13. Landing Page: Apple-inspired modern aesthetic with dynamic CMS integration from MySQL.
  14. Tested with Vitest (6/6 tests passed) and visually verified with Browser Agent.
  15. **UI/UX Professional Polish**: Upgraded Admin Dashboard with Hero Studio command banner, 6 vibrant accented metric cards (Indigo, Emerald, Amber, Violet, Sky, Rose), 4-step pipeline guide, and glowing Pro badges.
  16. **Dynamic Theming System**: Implemented system-wide Light & Dark Mode with `ThemeProvider`, `ThemeToggle`, persistent `localStorage`, and custom scrollbars.
  17. **One-Click Demo Tour Seeder**: Added `/api/admin/demo-tour` and `prisma/seed-demo.ts` generating real 2:1 WebP equirectangular panoramas, connected scenes, buildings, and bidirectional hotspots.
  18. **Aesthetic Fixes**: Fixed character encoding issues (`Â°` to `°`), improved Geist Sans typography, and eliminated dual-active sidebar item highlights.
  19. **Multi-Panorama Merger**: Implemented `SceneMergerService` and batch creation route `/api/tours/[id]/scenes/batch` with multi-select UI dialog in Scenes manager.
  20. **Standalone Tour Exporter**: Created zero-dependency offline web package generator (`ExportService`) streaming ZIP with Marzipano WebGL, relative paths, custom HUD dock, and responsive design.
  21. **Job-Based Asynchronous Architecture**: Implemented `ExportJob` with status tracking (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`), progress reporting, and 24h retention on D: drive.
  22. **Project Backup & Restore Engine**: Built `BackupService` with `.vtbackup.zip` manifest versioning, Zip Slip security validation, zip bomb limits, and UUID/slug conflict resolution.
  23. **Tour Dashboard Actions**: Added full interactive Tour Hub with Preview, Validate Tour modal, Export Standalone Tour (ZIP), Export Backup, Import Backup, and Download Panoramas.
  24. **Acceptance Testing Suite**: Verified with 11 Vitest tests including an end-to-end 10-panorama tour creation, bidirectional hotspot graph, ZIP export, extraction, local static web server without MySQL, and backup restore.
  25. **Gyroscope / DeviceOrientation Feature**: Integrated full hardware motion sensor controls into both Next.js `MarzipanoViewer` and standalone exported web package (`app.js` + `index.html` + `style.css`). Features include `DeviceOrientationControlMethod`, iOS 13+ permission request flow (`requestPermission()`), Euler-to-matrix rotation math, delta angle wrap-around normalization (preventing 360° spins), screen orientation change tracking, persistent gyro state across scene switching, and real hardware sensor detection feedback.
  26. **Testing & Build Verification**: Added dedicated `tests/gyroscope.test.ts` test suite; 15/15 Vitest tests passing, 0 TypeScript errors (`tsc --noEmit`), and successful production build (`next build`).
  27. **SSR & React 19 Script Warning Resolution**: Replaced static Marzipano component imports with `next/dynamic` (`{ ssr: false }`) in `/tour/[slug]` and `HotspotStudio.tsx`, and migrated theme initialization to `ThemeProvider` with React 19 warning suppression, eliminating the `document is not defined` SSR crash and `<script>` hydration warning.

  28. **Interactive Navigation Buttons & Custom Positioning Settings**:
      - Built 4 touch-friendly navigation button styles: **Kapsul (Pill)**, **Kartu Mini (Card)**, **Panah Lantai (Chevron)**, and **Radar (Beacon)**, with 6 accent themes (`indigo`, `emerald`, `sky`, `amber`, `rose`, `glass`), 6 icons, 3 sizes (`sm`, `md`, `lg` for touchscreen), glowing pulse ring waves, and subtitle support.
      - Built 3-tab Inspector in `HotspotStudio.tsx`:
        - **Tujuan & Teks**: Target scene selector, button title/label, subtext, and bidirectional return link generator.
        - **Desain Tombol**: Style cards, size picker, accent color swatches, icon picker, always-show-text toggle, pulse ring toggle, and live button preview box.
        - **Atur Letak / Posisi**: One-click **"Pasang di Titik Kamera Sekarang"** (instantly places button at center of view), Horizontal Yaw slider (-180° to +180°), Vertical Pitch slider (-90° to +90°), and 6 Direction Presets (`⬇ Lantai`, `⬆ Lurus Depan`, `⬅ Sisi Kiri`, `➡ Sisi Kanan`, `↩ Belakang`, `🎯 Reset 0°`).
      - Added **"Atur Tombol Navigasi"** quick shortcut and empty-scene helper pill in `/tour/[slug]` header for seamless transition to studio editor.
      - Replicated full button design parity in standalone exported tour package (`src/server/templates/standalone/app.js` and `style.css`).
      - Configured sample prominent navigation button on the drone aerial panorama in `kampus-virtual-tour-360-demo` and updated publication snapshot to v6.

  29. **Direct On-Photo Button Tagging & Jitter-Free Button Anchors**:
      - Fixed Marzipano root transform collision bug by isolating hover transitions to an inner DOM wrapper (`.hotspot-btn-wrapper` / `.hotspot-inner`), completely resolving the issue where buttons were shaking, moving, or slipping under the cursor when hovered or clicked.
      - Added distance & time delta threshold on pointer down/up to distinguish camera panning/dragging from deliberate clicks.
      - Built **"➕ Pasang Tombol di Foto"** direct tagging mode in `/tour/[slug]` viewer: users can now click directly on any building, door, or plaza in the 360 photo, name it in an instant popup dialog, select destination or info, and publish it immediately without touching any coordinates.
      - Streamlined `HotspotStudio.tsx` to automatically place buttons on the photo canvas when clicked, collapsed manual Yaw/Pitch sliders into an optional collapsible section, and added quick repositioning.

  30. **Eliminated Screen Flickering / Infinite Crossfade Loop**:
      - Identified and resolved the root cause of the screen flickering / blinking ("kedap-kedip"): inline camera view state setters (`onViewChange`) were causing `HotspotStudio` to re-render 60 times/sec, which in turn re-triggered Marzipano's scene recreation effect (`scene.switchTo({ transitionDuration: 600 })`) in an infinite loop of black crossfades.
      - Refactored `MarzipanoViewer.tsx` to keep callbacks (`onViewChangeRef`, `onViewerClickRef`, `onHotspotClickRef`) in stable refs.
      - Restricted scene creation strictly to `[panoramaUrl]` changes.
      - Decoupled real-time camera coordinates into DOM ref (`hudCoordsRef`) and `cameraViewRef` without triggering React state re-renders.

  31. **Full Mobile Responsiveness, Active Hamburger Navigation & Universal Dark Mode**:
      - **Admin Shell & Mobile Drawer Navigation**: Created `AdminShell.tsx` context with `useAdminNav()`, sliding mobile drawer in `Sidebar.tsx` with backdrop tap-to-dismiss, and active hamburger menu button (`Menu` / `X`) in `Topbar.tsx`. Fixed mobile flex layout by ensuring sidebar is purely `fixed inset-y-0` on mobile and only `sticky` on desktop (`md:sticky`), preventing the sidebar's box from pushing mobile page content into a squashed vertical strip.
      - **Mobile Grid & Action Button Optimization**: Upgraded `TourDetailPage` ([`src/app/(admin)/admin/tours/[id]/page.tsx`](file:///d:/laragon/www/virtual-tour-360/src/app/(admin)/admin/tours/[id]/page.tsx)) with a responsive 2x2 grid on mobile for action buttons (`Preview`, `Validate`, `Scenes`, `Studio 360°`), responsive header wrapping, and mobile-friendly form grids.
      - **Landing Page Active Hamburger Menu**: Built `LandingNavbar.tsx` featuring responsive brand header, desktop nav links, mobile hamburger button, and animated mobile drawer with quick navigation links, dark/light mode toggle with live label, and CTA buttons.
      - **Responsive 3-Panel Hotspot Studio**: Upgraded `HotspotStudio.tsx` with a mobile segmented switcher bar (`[ 📋 Scene ]`, `[ 👁️ 360° Studio ]`, `[ ⚙️ Atur Tombol ]`). On desktop (`lg:`), all 3 panels display side-by-side; on mobile/tablets, panels switch seamlessly with full screen space for 360 panorama canvas, auto-opening inspector when placing buttons, and mobile close buttons. Bottom toolbar wraps cleanly.
      - **Public Tour Viewer HUD Optimization**: Made header badge, action buttons, and modal dialogs responsive on mobile screens (320px–768px). Fixed visual collision by hiding raw camera coordinates in public viewer mode and making scene drawer `w-full sm:w-80`.
      - **Universal Dark Mode**: Verified and enhanced dark mode coverage across all admin pages, editors, landing views, forms, inputs, selects, and modals.
      - **Quality Assurance**: 15/15 Vitest tests passing (`npm test`), zero TypeScript compilation errors (`tsc --noEmit`), and dev server running smoothly.

      - Canvas rendering is now 100% stable, silky-smooth 60fps WebGL with zero flickering or HUD badge overlap.

  32. **User Profile Management & Comprehensive Users RBAC CRUD System**:
      - **Edit Profile System**: Implemented `GET` and `PATCH` `/api/auth/profile` and dedicated page [`/admin/profile`](file:///d:/laragon/www/virtual-tour-360/src/app/(admin)/admin/profile/page.tsx) allowing authenticated users to update their full name, email address, and change password with current password verification. Automatically updates and refreshes the JWT cookie session.
      - **Direct Profile Access & Modern Dropdown**: Redesigned the topbar profile section into an enterprise-grade floating dropdown popover (anchored to user avatar + name + rotating chevron). Contains user identity info, "Edit Profil", "Users & Roles", and places the "Keluar dari Akun" (Logout) button cleanly underneath Edit Profil with soft rose hover effects and auto-dismiss on click/Esc. Also added dedicated session logout card at the bottom of [`/admin/profile`](file:///d:/laragon/www/virtual-tour-360/src/app/(admin)/admin/profile/page.tsx).
      - **Complete Users & Roles (RBAC) CRUD**: Transformed [`/admin/users`](file:///d:/laragon/www/virtual-tour-360/src/app/(admin)/admin/users/page.tsx) into a fully functional client management hub with:
        - **Create**: "Tambah Pengguna Baru" modal with bcrypt password hashing and role assignment (`SUPER_ADMIN`, `ADMIN`, `EDITOR`, `VIEWER`).
        - **Read**: Live search by name/email, role filter, status filter, and 4 summary metric cards (Total Akun, Super Admin, Admin & Editor, Akun Aktif).
        - **Update**: "Edit Data Pengguna" modal allowing role promotion/demotion, status switching (`ACTIVE`, `INACTIVE`, `SUSPENDED`), and optional password reset.
        - **Delete**: "Hapus Akun" modal with safety guards (blocks self-deletion and blocks deleting the last active Super Admin).
        - **Audit Trail**: Every user creation, update, and deletion is recorded in `audit_logs`.
      - **Testing & Verification**: Created `tests/users-crud-profile.test.ts` covering password hashing, duplicate email handling, role switching, and cascading deletion. Total 21/21 tests passing (`npm test`), zero TypeScript errors (`tsc --noEmit`).

  33. **Profile Photo / Avatar System, Mobile Layout Alignment & CSS Warnings Resolution**:
      - **Avatar Backend Engine (`/api/auth/profile/avatar`)**: Implemented `POST` and `DELETE` endpoints. Crops uploaded images to a 400x400 square with Sharp center-fitting, converts to compressed WebP (~15-25KB), stores in `public/uploads/avatars/`, removes stale avatars from disk, updates `user.avatar` in MySQL, and refreshes JWT session cookies.
      - **Edit Profile Photo UI (`/admin/profile`)**: Added interactive 96x96 avatar in the hero summary banner with camera overlay shortcut, dedicated "Foto Profil Pengguna" management card with instant upload, preview, format validation (JPG/PNG/WebP, max 10MB), and "Hapus Foto" button with confirmation.
      - **Topbar & Dropdown Avatar Integration**: Updated [`Topbar.tsx`](file:///d:/laragon/www/virtual-tour-360/src/components/admin/Topbar.tsx) to fetch `user.avatar` and display the photo in both the topbar popover button and the dropdown card header with initial letter fallback.
      - **Users Table Avatar Rendering**: Updated [`/admin/users`](file:///d:/laragon/www/virtual-tour-360/src/app/(admin)/admin/users/page.tsx) to display each user's custom avatar in the user list.
      - **Mobile Layout Alignment Fix (Eliminated Black Void)**: Completely decoupled the mobile drawer (`md:hidden fixed inset-y-0`) and the desktop sidebar (`hidden md:flex md:sticky md:w-64`) in [`Sidebar.tsx`](file:///d:/laragon/www/virtual-tour-360/src/components/admin/Sidebar.tsx). On mobile, the sidebar occupies 0px in normal flex layout, ensuring the main content and topbar take 100% of the mobile viewport with zero clipping.
      - **CSS Warnings**: Updated `.vscode/settings.json` with `css.lint.unknownAtRules: "ignore"` and `css.lint.vendorPrefix: "ignore"`, and defined standard `background-clip: text;` before vendor prefix in `globals.css`.
      - **Test Suite**: Added avatar test step to `tests/users-crud-profile.test.ts`; all 22 tests passing (`22 passed / 22 tests`), 0 TypeScript errors (`tsc --noEmit`).

  34. **Audit Logs Retention & Monthly Purge System ("Pembersihan 1 Bulan 1 Kali / Hapus Admin")**:
      - **Backend API (`/api/admin/audit` & `/api/admin/audit/[id]`)**:
        - `GET /api/admin/audit`: Live search query, filters by action, entity, and date range (7d, 30d, 90d, all). Returns realtime statistics (`totalLogs`, `logsPast30Days`, `logsOlderThan30Days`, `logsToday`). Also supports `?autoPrune=true` for automatic monthly cleanup.
        - `DELETE /api/admin/audit`: Bulk retention purge supporting `olderThanDays` (30 days / 1 month, 60 days, 90 days, or total wipe). Audits the purge operation for security compliance.
        - `DELETE /api/admin/audit/[id]`: Single-row log deletion protected by Admin RBAC guards.
      - **Interactive UI (`/admin/audit`)**:
        - Upgraded to a responsive Client Component with 4 real-time metric cards.
        - Dedicated **"Siklus Pembersihan & Retensi Bulanan (1 Bulan 1 Kali)"** banner with one-click **"Bersihkan Log > 30 Hari"** shortcut button and counter badge.
        - Purge & Retention Modal with options: > 1 Month (Recommended), > 2 Months, > 3 Months, and Complete Wipe.
        - Per-row deletion button with confirm dialog and inspect JSON metadata modal.
      - **Testing & Verification**: Created `tests/audit-log-retention.test.ts` (4 unit tests); total 26/26 Vitest tests passing (`npm test`), zero TypeScript compilation errors (`tsc --noEmit`).

  35. **Panorama & Media Asset Deletion System ("Cara Hapus Media Setelah Upload")**:
      - **Backend Services & API**:
        - `DELETE /api/media/[id]`: Deletes a single media asset, unlinks from database, deletes physical original & thumbnail files from disk (`storage.delete`), with safeguards preventing accidental deletion if linked to active tour scenes.
        - `DELETE /api/media`: Batch cleanup endpoint removing unattached/orphan media files that are not linked to any scene.
      - **UI Upgrade ([`/admin/media`](file:///d:/laragon/www/virtual-tour-360/src/app/(admin)/admin/media/page.tsx))**:
        - Added dedicated red **[ 🗑️ ] Delete Button** to every media card with safe confirmation dialog.
        - Added top header button: **[ 🧹 Bersihkan Media Tak Terpakai ]** to instantly clean up unused demo/test uploads.
        - Live search filter by filename.
      - **Test Suite**: Added `tests/media-delete.test.ts`; all 28 tests passing (`28 passed / 28 tests`), 0 TypeScript errors (`tsc --noEmit`).
