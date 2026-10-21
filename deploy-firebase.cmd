@echo off
REM ===========================================================
REM  Aref portfolio - deploy to Firebase Hosting
REM  https://aref-alawadi.web.app
REM  Double-click this file. First run creates the site once.
REM ===========================================================
cd /d "%~dp0"
echo.
echo [1/2] Making sure the site "aref-alawadi" exists (safe to repeat)...
call firebase hosting:sites:create aref-alawadi --project wtc-net >nul 2>&1
echo [2/2] Deploying...
call firebase deploy --only hosting:portfolio --project wtc-net
echo.
echo Live at: https://aref-alawadi.web.app
pause
