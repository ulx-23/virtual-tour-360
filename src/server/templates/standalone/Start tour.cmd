@echo off
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js diperlukan untuk launcher ZIP. Gunakan Single HTML atau aplikasi Windows jika tidak tersedia.
  pause
  exit /b 1
)
node "%~dp0serve.cjs"
pause
