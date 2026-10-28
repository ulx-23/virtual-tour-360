# Known Issues & Workarounds
## Virtual Tour 360°

1. **C: Drive Space Limitation**:
   - Issue: C: drive has 0 MB free disk space.
   - Workaround: Configured npm cache and temp files to D:\laragon\tmp\npm-cache via .npmrc and environment variables. All uploads and database storage reside on D: drive.
2. **Next.js 16 + React 19 Peer Resolution**:
   - Issue: Standard 
pm install prompts for peer dependency flags.
   - Workaround: .npmrc sets legacy-peer-deps=true.
