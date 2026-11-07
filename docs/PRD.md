# Product Requirements Document (PRD)
## VIRTUAL TOUR 360° — INDOOR & OUTDOOR INTERACTIVE TOUR BUILDER

### 1. Product Overview
- **Name**: Virtual Tour 360°
- **Type**: Production-ready Full-stack Web Application
- **Mission**: Enable administrators to upload high-resolution 360° panoramic photos, connect indoor and outdoor scenes using interactive navigation hotspots, organize scenes across campus/building levels, and publish immersive interactive virtual tours comparable to Google Street View.
- **Target Use Cases**:
  - University/School Campuses
  - Faculty Buildings & Auditoriums
  - Classrooms & Laboratories
  - Libraries & Study Centers
  - Public Facilities & Museums
  - Real Estate & Commercial Architecture

### 2. Product Goals
1. Multi-panorama upload with progress, validation, duplicate check, and Sharp thumbnail generation.
2. Scene management categorized into OUTDOOR, INDOOR, and TRANSITION.
3. Multi-branching and bidirectional scene navigation graph.
4. Interactive visual hotspot editor using spherical Marzipano coordinates (yaw, pitch in radians).
5. High-performance Marzipano panorama viewer with inertia, touch support, zoom, and smooth transitions.
6. Building, floor, and interactive minimap (floor plan) management with normalized coordinates.
7. Dynamic Admin Dashboard with real-time statistics and empty states.
8. Single-click Tour Publishing with reachability graph validation and public snapshot manifests.
9. Granular Role-Based Access Control (RBAC) enforced on server route handlers.
10. Apple-inspired modern, elegant landing page with dynamic CMS configurations.

### 3. User Roles & RBAC Matrix
- **SUPER_ADMIN**: Full system control, role assignment, audit logs, CMS settings, all tours.
- **ADMIN**: Create, edit, manage, and publish tours, scenes, hotspots, buildings, and media.
- **EDITOR**: Edit assigned tour scenes, hotspots, and media.
- **VIEWER**: Public access to published tours without authentication.

### 4. Definition of Done
A feature is complete ONLY when frontend, backend route handler, database schema, validation (Zod), error handling, loading states, responsive layouts (mobile to 4K), and tests are implemented and verified without mock data.

---

### 5. Virtual Tour Merger & Export System (Module Extension)

#### 5.1 Multi-Panorama Merger
1. Upload and batch creation of multiple 360° equirectangular panoramas into distinct scenes within a single project.
2. Scene classification into `OUTDOOR`, `TRANSITION`, and `INDOOR`.
3. Inter-scene connectivity through the Visual Hotspot Studio (outdoor ↔ indoor ↔ room-to-room).
4. Persisted relationships in MySQL database with camera initial view (`initialYaw`, `initialPitch`, `initialFov`) and transition target parameters (`targetYaw`, `targetPitch`).
5. BFS Graph reachability validator ensuring no broken scene links, missing panoramas, or isolated scenes.
6. Panoramas are NEVER stitched into a flat giant picture; they remain separate 360° scenes linked in an interactive virtual tour.

#### 5.2 Standalone Virtual Tour Export to ZIP
1. Generates an independent, 100% offline-compatible web application.
2. Pre-validates start scene and graph integrity before packaging.
3. Packages runtime Marzipano (`vendor/marzipano.js`), `index.html`, `app.js`, `style.css`, `tour-data.js`, and relative-path panorama assets (`./panoramas/scene-{id}.webp`).
4. Zero runtime dependence on Next.js, MySQL, or backend APIs. Can be served via any static web server (Node `npx serve`, Python `http.server`, Apache, Nginx, GitHub Pages).

#### 5.3 Project Backup & Import System
1. Format separation:
   - **Public Export**: Static web assets optimized for visitors.
   - **Project Backup (`.vtbackup.zip`)**: Structured JSON manifest (`backup-manifest.json` v1.0.0) containing full project metadata, original full-resolution panoramas, floor plans, and hotspot graph for re-editing.
2. Zip Slip protection: Enforces path sanitization against directory traversal (`..`, absolute paths, leading slashes).
3. Max uncompressed size limits (zip bomb defense).
4. Collision resolution: Remaps old UUIDs to fresh IDs and resolves slug collisions by appending `-imported`.

#### 5.4 Export Architecture & Job Processing
1. Job-based asynchronous processing (`ExportJob` table) preventing HTTP request timeouts on large 360 projects.
2. Job lifecycle: `QUEUED` → `PROCESSING` (10% → 30% → 60% → 80%) → `COMPLETED` / `FAILED`.
3. Memory-efficient streaming with `archiver` ZipArchive directly to disk streams.
4. Temporary storage on D: drive (`public/exports/`) with 24-hour TTL and automated cleanup.
5. Strict credential isolation: no tokens, passwords, or admin session secrets in exported bundles.

#### 5.5 Gyroscope & Mobile Sensor System
1. **DeviceOrientation API Integration**: Enables interactive 360° viewpoint control mapped to the physical movement and orientation of smartphones and tablets.
2. **iOS 13+ Permission Flow**: Complies with Apple Safari's permission model via user-gesture `DeviceOrientationEvent.requestPermission()`.
3. **Mathematical Precision**: Euler-to-matrix rotation transformations eliminating gimbal lock singularities, plus angular delta wrap-around normalization preventing abrupt 360° spins.
4. **Orientation Responsiveness**: Tracks `orientationchange` and window resize, resetting motion offsets and dynamically updating Marzipano viewport dimensions.
5. **Multi-Viewer Parity**: Fully supported in both the Next.js viewer (`/tour/[slug]`) and the zero-dependency standalone exported web package.
