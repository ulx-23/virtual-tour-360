# System Architecture
## Virtual Tour 360° — Interactive Tour Builder

### 1. Technology Stack
- **Framework**: Next.js App Router (TypeScript strict)
- **Database**: MySQL 8.0 (Laragon environment)
- **ORM**: Prisma Client
- **Styling**: Tailwind CSS + shadcn-compatible utility classes (clsx, tailwind-merge)
- **Icons**: Lucide React
- **Panorama Engine**: Marzipano (WebGL equirectangular & tiled viewer)
- **Backend**: Next.js Route Handlers with Server-side authentication & RBAC
- **Authentication**: Secure Session cookies with JWT (jose) and password hashing (bcryptjs)
- **Validation**: Zod Schemas for API payloads and form inputs
- **Image Processing**: Sharp for metadata extraction, dimension checks, and responsive thumbnails
- **Testing**: Vitest for unit & integration tests

### 2. Architectural Layers
1. **Presentation Layer**:
   - Client components for WebGL/Marzipano panorama viewer and visual hotspot editor.
   - Server components for SEO landing page, public tour viewer wrapper, and SSR dashboard pages.
2. **Application / Service Layer**:
   - TourService: CRUD, validation, publishing snapshots.
   - SceneService: Scene management, building/floor associations.
   - HotspotService: Hotspot positioning, bidirectional link generator.
   - GraphEngine: BFS/DFS validation for scene reachability and orphan detection.
   - MediaService: Image validation (2:1 ratio, MIME check), Sharp thumbnail generation.
3. **Data Access Layer**:
   - Prisma ORM models with safe transactions, foreign key cascades, and unique constraints.
4. **Infrastructure Layer**:
   - Local filesystem storage adapter (/public/uploads/...) with S3 abstraction capability.

### 3. Coordinate System Standard
- Coordinates in Marzipano are represented in **radians**:
  - Yaw: Horizontal rotation around vertical axis [-PI, PI].
  - Pitch: Vertical elevation [-PI/2, PI/2].
  - FOV: Field of view in radians (default ~1.05 rad / 60 deg).
- Coordinates on floor plans are **normalized** from 0.0 to 1.0 (X, Y relative to image dimensions).
