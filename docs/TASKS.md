# Project Tasks & Milestones

## Pengembangan profesional (permintaan 6 November 2026)

- [x] Izinkan hotspot tersimpan dipilih untuk dihapus tanpa membuka kunci posisi (7 November 2026).
- [x] Tambahkan notifikasi SweetAlert saat tombol tersimpan dan kunci interaksi hotspot tersimpan agar klik area kosong membuat tombol baru (7 November 2026).
- [x] Kunci posisi ikon hotspot setelah disimpan; sediakan `Edit Posisi` eksplisit untuk memindahkan dan menyimpan ulang (7 November 2026).
- [x] Selaraskan label tombol navigasi dengan scene tujuan, perjelas kesalahan simpan/hapus, dan bersihkan pratinjau tombol baru saat dibatalkan (7 November 2026).

- [x] Audit fitur saat ini dan tulis roadmap di [TOUR_BUILDER.md](./TOUR_BUILDER.md).
- [x] Tolak ekspor ZIP standalone bila panorama, thumbnail, atau denah wajib hilang.
- [ ] Verifikasi isi ZIP setelah finalize dan uji offline tanpa jaringan.
- [x] Implementasikan konverter Single HTML lokal dari ZIP dengan aset inline dan batas 16 MiB; verifikasi navigasi `file://` di browser terintegrasi.
- [x] Tambahkan tombol Single HTML untuk ZIP standalone selesai dengan batas respons server.
- [ ] Uji Chrome/Edge dan seluruh jenis aset, lalu paket Electron Windows lokal/CI.
- [ ] Lengkapi skin editor, hotspot multimedia, viewer, editor scene, dan QA interaktif.


## Migrasi Supabase PostgreSQL

- [x] Audit kompatibilitas proyek dan susun rencana sebelum perubahan database ([laporan](../MIGRATION_SUPABASE.md)).
- [ ] Backup aman skema, data MySQL, dan file media; inventaris jumlah baris serta key.
- [ ] Siapkan skema dan migration PostgreSQL, transfer data dengan ID/FK tetap, dan verifikasi integritas.
- [ ] Pindahkan media/ekspor ke penyimpanan persisten serta verifikasi fitur di Vercel.
- [ ] Jalankan validasi, tes integrasi, build, dan cutover terkontrol.
## Virtual Tour 360° — Roadmap

### Phase 0: Repository Audit & Planning
- [x] Audit workspace, Laragon environment, and verify Node/MySQL tools.
- [x] Create project in `D:\laragon\www\virtual-tour-360`.
- [x] Create core architectural and product documentation in `docs/`.
- [x] Create `AGENTS.md` for AI agent continuity.

### Phase 1: Project Foundation & Database Setup
- [x] Bootstrap Next.js with TypeScript and Tailwind CSS.
- [x] Install dependencies: `@prisma/client`, `prisma`, `zod`, `lucide-react`, `sharp`, `bcryptjs`, `jose`, `qrcode`, `marzipano`, `vitest`.
- [x] Configure complete Prisma schema for MySQL in `prisma/schema.prisma`.
- [x] Run initial Prisma migration / schema push to MySQL database `virtual_tour_360`.
- [x] Create seed script with default roles (`SUPER_ADMIN`, `ADMIN`, `EDITOR`, `VIEWER`), permissions, and initial admin accounts.
- [x] Seed MySQL database and verify data integrity.

### Phase 2: Authentication & RBAC System
- [x] Implement JWT session utilities in `src/server/auth/session.ts`.
- [x] Implement authentication route handlers (`/api/auth/login`, `/api/auth/logout`, `/api/auth/me`).
- [x] Implement server-side RBAC middleware and permission guard helper (`src/server/rbac/guards.ts`).
- [x] Build clean, modern Admin Login page (`/login`) with quick demo account buttons.
- [x] Build Admin Layout with responsive sidebar, header, and user profile switcher.

### Phase 3: Tour Management
- [x] Implement Tour repository and service (`src/server/services/tour.service.ts`).
- [x] Implement `/api/tours` and `/api/tours/[id]` CRUD endpoints with circular dependency handling.
- [x] Build Tours list dashboard with status filters (DRAFT, READY, PUBLISHED, ARCHIVED), search, and create modal.
- [x] Build Tour detail/edit settings page (`/admin/tours/[id]`).

### Phase 4: Multi-Panorama Media Upload & Sharp Processing
- [x] Implement Media upload service with MIME validation, 2:1 ratio check, and Sharp WebP thumbnail generation.
- [x] Build multi-file upload Route Handler (`/api/media/uploads`).
- [x] Build interactive drag-and-drop Upload Manager UI with progress, previews, and status badges (`UploadDropzone`).
- [x] Build Panorama Media Library page (`/admin/media`).

### Phase 5: Panorama Viewer Engine (Marzipano Integration)
- [x] Create Marzipano viewer wrapper component (`src/components/viewer/MarzipanoViewer.tsx`).
- [x] Implement camera controls (yaw, pitch, fov, zoom in/out, reset view, fullscreen).
- [x] Handle client-side WebGL canvas lifecycle and memory leak prevention.

### Phase 6: Scene Manager
- [x] Implement Scene service and Route Handlers (`/api/tours/[id]/scenes`, `/api/scenes/[id]`).
- [x] Categorize scenes (`OUTDOOR`, `INDOOR`, `TRANSITION`).
- [x] Build Scene Manager UI within tour dashboard with start-scene designation (`/admin/tours/[id]/scenes`).

### Phase 7: Visual Hotspot Studio & Editor
- [x] Build 3-panel Visual Hotspot Studio (`/admin/tours/[id]/editor`).
- [x] Implement Marzipano click-to-spherical-coordinate raycasting.
- [x] Hotspot property inspector: type, label, icon, target scene, target camera yaw/pitch.
- [x] Bidirectional return-hotspot generator (`createReturnHotspot`).
- [x] Hotspot CRUD Route Handlers (`/api/scenes/[id]/hotspots`, `/api/hotspots/[id]`).

### Phase 8: Navigation Graph & Reachability Engine
- [x] Implement BFS/DFS graph reachability engine (`src/server/services/graph.service.ts`).
- [x] Endpoint `/api/tours/[id]/validate` checking orphans, dead ends, unreachable scenes.
- [x] Visual graph validation status panel in editor and publishing dialog.

### Phase 9: Building, Floor, and Floor Plan Minimap
- [x] Implement Building and Floor models with CRUD APIs (`/api/buildings`, `/api/buildings/[id]/floors`).
- [x] Floor plan image upload with normalized (0..1) marker coordinate editor (`/api/floors/[id]/plan`, `/api/floor-plans/[id]/markers`).
- [x] Interactive overlay minimap synchronized with current active scene (`FloorPlanOverlay.tsx`).

### Phase 10: Tour Publishing, Public Viewer & Dynamic CMS
- [x] Immutable snapshot publisher (`/api/tours/[id]/publish`, `src/server/services/publishing.service.ts`).
- [x] Public Tour Viewer at `/tour/[slug]` (fullscreen, scene drawer, share, QR code modal).
- [x] Dynamic CMS settings for landing page (Hero, Featured Tours, Benefits, Footer).
- [x] Public Apple-inspired Landing Page (`/`).

### Phase 11: Analytics & Audit Logs
- [x] Visitor view tracker (`/api/public/tours/[slug]/view`).
- [x] Dashboard metrics overview (Total Tours, Views, Scenes, Panoramas) via `/api/admin/stats`.
- [x] Admin Audit Logs viewer (`/admin/audit`).
- [x] Users & RBAC viewer (`/admin/users`).

### Phase 12: Testing, Quality Assurance & Verification
- [x] Unit & integration tests with Vitest (6 tests passing in 333ms).
- [x] Verify production build (`next build` compiled with code 0).
- [x] Visual testing with browser agent (Landing page and login verified).

### Phase 13: Virtual Tour Merger & Exporter System (PRD Extension)
- [x] Multi-Panorama Merger: Batch scene creator service & route (`SceneMergerService`, `/api/tours/[id]/scenes/batch`).
- [x] Scene Linking: Bidirectional outdoor/indoor navigation relationships in MySQL (`Hotspot` targetYaw/targetPitch).
- [x] Standalone Marzipano Web Package: Zero-dependency runtime template (`index.html`, `app.js`, `style.css`, `vendor/marzipano.js`, `tour-data.js`).
- [x] Standalone ZIP Exporter: Asynchronous queue-based job exporter (`ExportService`, `/api/tours/[id]/export`).
- [x] Project Backup & Restore: Format-separated `.vtbackup.zip` with manifest versioning (`BackupService`, `/api/tours/import`).
- [x] Security Hardening: Zip Slip path traversal mitigation & zip bomb byte quotas.
- [x] ID & Slug Collision Handling: Autonomous UUID remapping and `-imported` slug resolution.
- [x] UI Dashboard Integration: Tour Hub with Validate Tour, Export Tour, Download ZIP, Export Backup, Import Backup, Download Panoramas.
- [x] Gyroscope & Mobile Sensor System: DeviceOrientation control method, iOS 13+ permission flow (`requestPermission()`), Euler rotation matrix transformation, wrap-around angle delta normalization, screen orientation listeners, and active sensor status indicators across both public viewer and standalone offline export packages.
- [x] Acceptance Testing: Comprehensive E2E test suite (10 panoramas, outdoor/indoor links, ZIP export, local static server without MySQL, backup restore, and gyroscope math/runtime verification — 15 Vitest tests passing).

- [x] Interactive Navigation Buttons & Position Settings: 4 button styles (Pill, Card, Chevron, Beacon), 6 theme colors, 6 icons, 3 sizes (sm, md, lg for touch targets), pulse ring animations, 3-tab inspector (Tujuan & Teks, Desain Tombol, Atur Letak), "Pasang di Titik Kamera Sekarang", Yaw & Pitch sliders, direction presets, and quick editor shortcut on tour viewer.
- [x] Direct On-Photo Button Tagging & Jitter-Free Anchoring: Separated root hotspot anchor from interactive container to eliminate jitter; added drag delta threshold; built direct photo tagging mode (`➕ Pasang Tombol di Foto`) in `/tour/[slug]`.
- [x] Flickering & Crossfade Elimination: Decoupled camera view state into stable refs in `MarzipanoViewer` and `HotspotStudio`, restricting scene transitions strictly to panorama changes.
- [x] Full Mobile Responsiveness, Active Hamburger Drawer Navigation & Comprehensive Dark Mode:
  - [x] Mobile drawer navigation in Admin layout (`AdminShell.tsx`, `useAdminNav()`, sliding sidebar with backdrop tap-to-dismiss, topbar hamburger button, fixed mobile flex position).
  - [x] Responsive 2x2 action button grid and mobile cards layout on Tour Detail Hub.
  - [x] Landing page active hamburger menu (`LandingNavbar.tsx`, animated mobile drawer, dark mode switch, quick action links).
  - [x] Responsive 3-Panel Hotspot Studio (`HotspotStudio.tsx`, segmented mobile view switcher `[Scene] [360° Studio] [Atur Tombol]`, full-screen mobile panorama canvas, responsive footer toolbar).
  - [x] Public Tour Viewer HUD responsiveness (compact headers, responsive action buttons, mobile-width scene drawer, orientation HUD clean separation).
  - [x] Comprehensive Dark Mode coverage verified across all views, cards, forms, inputs, and modals.
  - [x] All 15 acceptance & unit tests passing with zero errors.
- [x] User Profile Management & RBAC Users CRUD:
  - [x] Edit Profile page (`/admin/profile`) & API (`/api/auth/profile`) for updating name, email, and password with real-time session cookie refresh.
  - [x] Direct profile link integration on Topbar with floating dropdown popover (Edit Profile & Logout positioned underneath) and Sidebar "Profil Saya".
  - [x] Full Users & Roles CRUD (`/admin/users`, `/api/admin/users`, `/api/admin/users/[id]`) with live search, role and status filtering, 4 metric cards, Create Modal, Edit Modal, and Delete Modal with self-deletion and last Super Admin safeguards.
  - [x] Dedicated test suite `tests/users-crud-profile.test.ts` (21/21 tests passing).
- [x] Profile Photo / Avatar System, Mobile Layout Alignment & CSS Warnings:
  - [x] Avatar upload & delete backend engine (`POST` / `DELETE` `/api/auth/profile/avatar`) with Sharp square 400x400 crop, WebP compression, D: drive storage, and JWT session refresh.
  - [x] Edit Profile Photo UI (`/admin/profile`) with interactive 96x96 banner preview, camera shortcut button, format validation (JPG/PNG/WebP, max 10MB), and delete button.
  - [x] Display real avatar photo in Topbar profile button and dropdown header with initial letter fallback.
  - [x] Display real avatar photo in `/admin/users` management table.
  - [x] Fixed mobile view black void alignment bug by cleanly separating mobile drawer (`md:hidden fixed`) from desktop sidebar (`hidden md:flex md:sticky`).
  - [x] Resolved CSS warnings in `.vscode/settings.json` and `globals.css` (`background-clip`).
  - [x] All 22 Vitest tests passing (`npm test`), zero TypeScript errors (`tsc --noEmit`).
- [x] Audit Logs Retention & Monthly Purge System ("Refresh 1 Bulan 1 Kali / Hapus Admin"):
  - [x] Backend API (`/api/admin/audit` & `/api/admin/audit/[id]`) for querying with date filters and statistics, bulk purge by age (> 30 days, > 60 days, > 90 days, all), and single log deletion.
  - [x] Auto-purge / automatic monthly retention cycle (`autoPrune=true`) logging purge events for security auditability.
  - [x] Interactive Client UI ([`/admin/audit`](file:///d:/laragon/www/virtual-tour-360/src/app/(admin)/admin/audit/page.tsx)) with 4 metric cards, 1-click "Bersihkan Log > 30 Hari (1 Bulan)" shortcut, Retention Modal, search/filter bar, and single row delete buttons.
  - [x] Unit test suite `tests/audit-log-retention.test.ts` (26/26 tests passing).
- [x] Panorama & Media Asset Deletion System ("Cara Hapus Media Setelah Upload"):
  - [x] Backend API (`DELETE /api/media/[id]` and `DELETE /api/media`) removing database records and unlinking physical storage files.
  - [x] Active tour scene safeguard (prevents deleting panoramas currently used by live scenes).
  - [x] Red trash icon button on every media card in [`/admin/media`](file:///d:/laragon/www/virtual-tour-360/src/app/(admin)/admin/media/page.tsx) with confirmation dialog.
  - [x] 1-Click "Bersihkan Media Tak Terpakai" button for cleaning orphan/unlinked test uploads.
  - [x] Unit test suite `tests/media-delete.test.ts` (28/28 tests passing).
