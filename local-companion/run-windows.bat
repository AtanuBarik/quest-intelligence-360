@echo off
setlocal
cd /d "%~dp0\.."
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 local-companion\server.py --cache-frontend %*
) else (
  python local-companion\server.py --cache-frontend %*
)
pause
