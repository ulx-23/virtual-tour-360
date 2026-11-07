# Database Specification
## Virtual Tour 360° — MySQL & Prisma Schema

### 1. Database Overview
- Database Name: irtual_tour_360
- Charset: utf8mb4
- Collation: utf8mb4_unicode_ci
- Engine: InnoDB

### 2. Entity Relationship Model
- User 1:N UserRole N:1 Role 1:N RolePermission N:1 Permission
- User 1:N Tour (owner)
- Tour 1:N Scene (and Tour nullable 1:1 Scene as start_scene)
- Tour 1:N Building 1:N Floor 1:N FloorPlan 1:N FloorPlanMarker
- Scene 1:N Hotspot (source) and 1:N Hotspot (target)
- MediaAsset 1:1 PanoramaAsset and 1:N Scene
- Tour 1:N TourPublication (snapshots)
- Tour 1:N TourView (visitor analytics)
- Tour 1:N ExportJob (asynchronous export jobs & downloads)
- AuditLog for administrative audit trails
- SiteSetting and PageSection for Dynamic CMS

### 3. Circular Reference Handling
- tours.start_scene_id references scenes.id (nullable, onDelete: SetNull).
- scenes.tour_id references tours.id (onDelete: Cascade).
- This design prevents circular deadlock on deletion.

### 4. Export & Job System Schema (`export_jobs`)
- `id` (VARCHAR(36) UUID Primary Key)
- `tour_id` (VARCHAR(36) Foreign Key -> `tours.id` ON DELETE CASCADE)
- `type` (ENUM: `STANDALONE_ZIP`, `PROJECT_BACKUP`, `ORIGINAL_PANORAMAS`)
- `status` (ENUM: `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`)
- `progress` (INT DEFAULT 0, representing 0-100%)
- `error_message` (TEXT NULL)
- `download_url` (VARCHAR(255) NULL)
- `file_name` (VARCHAR(255) NULL)
- `file_size` (INT NULL)
- `expires_at` (DATETIME NULL, 24-hour retention window)
- `created_at`, `updated_at` (DATETIME)
