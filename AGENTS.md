# AI Agent Instructions & Continuity Guide
## Virtual Tour 360° — AGENTS.md

Welcome, AI Engineer. When continuing this project:
Migration and professional builder status as of 6 November 2026: read `MIGRATION_SUPABASE.md`, `docs/TOUR_BUILDER.md`, `docs/EXPORT_SYSTEM.md`, and `docs/TESTING_REPORT.md`. MySQL source and media have an ignored local backup; PostgreSQL cutover and Supabase Storage are not complete. Standalone ZIP asset preflight and Single HTML conversion from completed ZIPs are implemented; Electron export remains pending. Run destructive integration tests only against isolated test data and storage.
1. **Always read docs/PRD.md** for feature specifications.
2. **Read docs/PROGRESS.md** to know the latest status.
3. **Read docs/TASKS.md** to pick up the next unchecked milestone.
4. **Read docs/KNOWN_ISSUES.md** regarding environment specifics (e.g. C: drive space, D: drive paths).
5. **Never delete working features or overwrite databases destructively**.
6. **Always verify your code** with typecheck, lint, or tests before marking tasks completed.
7. **Keep all documentation up to date** at each stage.
8. **Export & Offline Viewer Continuity**:
   - Standalone exported web tours use `src/server/templates/standalone/` template with `window.TOUR_DATA` in `tour-data.js`.
   - Never rely on server endpoints or MySQL in exported packages.
   - All ZIP temporary files are written to D: drive (`public/exports/`).
   - Backup files (`.vtbackup.zip`) use manifest versioning (`1.0.0`) and must always validate against Zip Slip before extraction.


<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
