# Architectural Decision Records (ADR)
## Virtual Tour 360°

### ADR 001: Marzipano as Core Panorama Engine
- **Decision**: Use Marzipano instead of heavy Three.js canvas setup.
- **Rationale**: Marzipano is specifically engineered for multi-resolution 360° panoramas and cubemaps, provides native inertia, spherical coordinates (yaw, pitch), hotspot rendering, and low memory footprint on mobile devices.

### ADR 002: Local Filesystem Storage with S3 Interface
- **Decision**: Store uploaded panoramas and generated tiles/thumbnails in public/uploads/ during development, while abstracting storage behind a unified IStorageProvider interface.
- **Rationale**: Works immediately in the local Laragon development setup without external cloud bills or network latency, while allowing seamless switch to S3/MinIO for cloud production.

### ADR 003: Custom JWT HttpOnly Session for Auth
- **Decision**: Implement high-security signed JWT cookies using jose and cryptjs with database role validation on every API request.
- **Rationale**: Avoids NextAuth / Auth.js peer dependency incompatibilities with React 19 / Next.js 16 canary/release while providing total control over granular RBAC and session invalidation.

### ADR 004: Immutable Snapshot Publishing
- **Decision**: When a tour is published, serialize a self-contained snapshot manifest into 	our_publications.
- **Rationale**: Ensures public visitors never see halfway-edited scenes or broken draft links while administrators are actively modifying hotspots in the studio.
