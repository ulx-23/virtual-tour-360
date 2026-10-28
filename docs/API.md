# REST API Specification
## Virtual Tour 360° — Route Handlers

### 1. Conventions
- Base Path: /api
- Content-Type: pplication/json
- Standard Response: { success: boolean, data?: any, error?: string, details?: any }

### 2. Endpoints
- **Authentication**:
  - POST /api/auth/login: Email/password verification -> JWT httpOnly cookie.
  - POST /api/auth/logout: Clears session cookie.
  - GET /api/auth/me: Current session & permissions.
- **Tours**:
  - GET /api/tours: List tours (filtering by status, search).
  - POST /api/tours: Create a new tour project.
  - GET /api/tours/[id]: Retrieve full tour details with scenes and buildings.
  - PATCH /api/tours/[id]: Update tour metadata/status.
  - DELETE /api/tours/[id]: Safe delete.
- **Media & Panorama Upload**:
  - POST /api/media/uploads: Multi-file multipart upload, Sharp validation & thumbnail extraction.
  - GET /api/media: List uploaded panorama and asset media.
  - DELETE /api/media/[id]: Delete asset and associated files.
- **Scenes**:
  - GET /api/tours/[id]/scenes: List scenes for a specific tour.
  - POST /api/tours/[id]/scenes: Create scene from uploaded panorama asset.
  - PATCH /api/scenes/[id]: Update scene properties (name, type, initial camera angles).
  - DELETE /api/scenes/[id]: Delete scene.
- **Hotspots**:
  - GET /api/scenes/[id]/hotspots: List hotspots for a scene.
  - POST /api/scenes/[id]/hotspots: Create hotspot (with optional return hotspot).
  - PATCH /api/hotspots/[id]: Update hotspot coordinates or content.
  - DELETE /api/hotspots/[id]: Delete hotspot.
- **Buildings & Floor Plans**:
  - GET /api/tours/[id]/buildings: List buildings with floors and floor plans.
  - POST /api/tours/[id]/buildings: Create building.
  - POST /api/buildings/[id]/floors: Create floor.
  - POST /api/floors/[id]/plan: Upload and link floor plan image.
  - POST /api/floor-plans/[id]/markers: Add or update scene marker on floor plan.
- **Graph Validation & Publishing**:
  - POST /api/tours/[id]/validate: Run BFS reachability check, orphan check, link check.
  - POST /api/tours/[id]/publish: Generate published snapshot manifest and mark tour PUBLISHED.
- **Public & Analytics**:
  - GET /api/public/tours/[slug]: Get published tour snapshot manifest (no draft data exposed).
  - POST /api/public/tours/[slug]/view: Log anonymous visitor view.
- **CMS**:
  - GET /api/admin/settings: Retrieve site settings and sections.
  - PATCH /api/admin/settings: Update CMS configuration.
