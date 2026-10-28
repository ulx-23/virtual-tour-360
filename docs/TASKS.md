# Project Tasks & Milestones
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