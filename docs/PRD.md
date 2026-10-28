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
